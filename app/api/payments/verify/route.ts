import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import connectDB from '@/lib/mongodb';
import Student from '@/models/Student';
import Payment from '@/models/Payment';
import Subscription from '@/models/Subscription';
import UsageTracking from '@/models/UsageTracking';
import { getPlanFromAmount } from '@/lib/utils/paymentUtils';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;

interface DecodedToken {
  userId: string;
  [key: string]: unknown;
}

export async function POST(request: NextRequest) {
  try {
    // Get token from HTTP-only cookie
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json(
        { error: 'Authorization token required' },
        { status: 401 }
      );
    }

    // Verify token
    let decoded: DecodedToken;
    try {
      decoded = jwt.verify(token, JWT_SECRET) as DecodedToken;
    } catch {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    // Connect to database
    await connectDB();

    // Get student profile
    const student = await Student.findOne({ 
      userId: decoded.userId,
      onboardingCompleted: true 
    });

    if (!student) {
      return NextResponse.json(
        { error: 'Student not found or onboarding not completed' },
        { status: 404 }
      );
    }

    // Parse request body
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, paymentId } = await request.json();

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json(
        { error: 'Missing payment verification parameters' },
        { status: 400 }
      );
    }

    // Find payment record
    const payment = await Payment.findOne({
      _id: paymentId || { $exists: true },
      razorpayOrderId: razorpay_order_id,
      studentId: student.userId
    });

    if (!payment) {
      return NextResponse.json(
        { error: 'Payment record not found' },
        { status: 404 }
      );
    }

    if (payment.status === 'completed') {
      return NextResponse.json({
        success: true,
        message: 'Payment already verified',
        payment: payment
      });
    }

    // Verify signature
    const generatedSignature = crypto
      .createHmac('sha256', RAZORPAY_KEY_SECRET || '')
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (generatedSignature !== razorpay_signature) {
      console.error('❌ Payment signature verification failed');
      payment.status = 'failed';
      await payment.save();
      
      return NextResponse.json(
        { error: 'Payment signature verification failed' },
        { status: 400 }
      );
    }

    // Update payment record
    payment.razorpayPaymentId = razorpay_payment_id;
    payment.razorpaySignature = razorpay_signature;
    payment.status = 'completed';
    payment.completedAt = new Date();
    await payment.save();

    // Handle subscription creation/update based on paymentFor
    if (payment.paymentFor === 'career_access') {
      // Determine learningPathId from payment metadata or learningPathId field
      // NOTE: learningPathId can be null for initial career_access payments (from career exploration page)
      // In that case, subscription will be created without learningPathId and linked later when learning path is saved
      // Normalize to string to ensure consistent comparison
      const learningPathId = payment.learningPathId?.toString() || payment.metadata?.learningPathId?.toString() || null;
      
      // IMPORTANT: Use payment.amount as the SINGLE SOURCE OF TRUTH for plan determination
      // payment.amount is the actual amount paid and verified by Razorpay
      // ₹99 = Basic plan, ₹199 = Premium plan
      const actualAmountPaid = payment.amount || 0;
      
      // Use helper function to get plan details from amount
      const planInfo = getPlanFromAmount(actualAmountPaid);
      
      console.log(`💰 Payment verification:`, {
        paymentId: payment._id,
        amount: payment.amount,
        planAmount: payment.planAmount,
        planType: payment.planType,
        actualAmountPaid: actualAmountPaid,
        determinedPlanType: planInfo.planType,
        determinedPlanAmount: planInfo.planAmount,
        dailyChatLimit: planInfo.dailyChatLimit,
        monthlyMcqLimit: planInfo.monthlyMcqLimit,
        learningPathId: learningPathId || 'null (initial access - will be linked later)'
      });
      
      // Always correct payment record to match actual amount paid
      if (payment.planType !== planInfo.planType || payment.planAmount !== planInfo.planAmount) {
        console.log(`🔧 Correcting payment record:`, {
          oldPlanType: payment.planType,
          oldPlanAmount: payment.planAmount,
          newPlanType: planInfo.planType,
          newPlanAmount: planInfo.planAmount
        });
        payment.planType = planInfo.planType;
        payment.planAmount = planInfo.planAmount;
        await payment.save();
      }

      // CRITICAL: Subscriptions are scoped to individual learning paths
      // However, for initial career_access payments (from career exploration), learningPathId may be null
      // In that case, we create a temporary subscription that will be linked to the learning path when it's created
      
      // If learningPathId is null, this is an initial access payment - create subscription without learningPathId
      // The subscription will be updated with learningPathId when the learning path is saved
      if (!learningPathId) {
        console.log(`📋 Initial career access payment (no learningPathId yet) - creating temporary subscription`);
      }

      const now = new Date();
      const expiryDate = new Date(now);
      expiryDate.setMonth(expiryDate.getMonth() + 1); // 1 month subscription

      // CRITICAL: Subscription lookup strategy:
      // 1. If learningPathId is provided: Look for subscription for that specific learning path
      // 2. If learningPathId is null: Look for temporary subscription (learningPathId: null) for initial access
      //    This temporary subscription will be linked to the learning path when it's created
      let subscription = null;
      
      // CRITICAL: Only look for subscription for THIS specific learning path
      // Never update subscriptions for other learning paths
      if (learningPathId) {
        // Look for subscription for THIS specific learning path ONLY
        subscription = await Subscription.findOne({
          uniqueId: student.uniqueId,
          learningPathId: learningPathId // Must match exactly - never update subscriptions for other paths
        });
        console.log(`🔍 Looking for subscription for learningPathId="${learningPathId}":`, subscription ? 'Found' : 'Not found');
        
        if (subscription) {
          // Verify this subscription is actually for this learning path
          if (subscription.learningPathId !== learningPathId) {
            console.error(`❌ Subscription learningPathId mismatch - found subscription for different path!`, {
              subscriptionLearningPathId: subscription.learningPathId,
              requestedLearningPathId: learningPathId
            });
            subscription = null; // Don't use this subscription - it's for a different learning path
          }
        }
      } else {
        // Look for temporary subscription (initial access - no learning path created yet)
        // Only use temporary subscription if payment also has no learningPathId
        subscription = await Subscription.findOne({
          uniqueId: student.uniqueId,
          learningPathId: null,
          isActive: true
        }).sort({ createdAt: -1 }); // Get most recent temporary subscription
        console.log(`🔍 Looking for temporary subscription (initial access):`, subscription ? 'Found' : 'Not found');
      }
      
      if (subscription) {
        console.log(`📋 Found existing subscription:`, {
          subscriptionId: subscription._id,
          currentPlanType: subscription.planType,
          currentPlanAmount: subscription.planAmount,
          currentLearningPathId: subscription.learningPathId || 'null (temporary)',
          isActive: subscription.isActive
        });
      }

      // CRITICAL: Determine if we should update existing subscription or create new one
      // NEVER update a subscription that belongs to a different learning path
      let shouldUpdateSubscription = false;
      
      if (subscription) {
        const subscriptionLearningPathId = subscription.learningPathId?.toString() || null;
        const paymentLearningPathId = learningPathId?.toString() || null;
        
        // Check if subscription is for the SAME learning path
        if (subscriptionLearningPathId === paymentLearningPathId) {
          // Same learning path - update it
          shouldUpdateSubscription = true;
          console.log(`🔄 Updating subscription for learning path "${paymentLearningPathId}":`, {
            subscriptionId: subscription._id,
            currentPlanType: subscription.planType,
            currentPlanAmount: subscription.planAmount,
            newPlanType: planInfo.planType,
            newPlanAmount: planInfo.planAmount,
            wasActive: subscription.isActive,
            isUpgrade: subscription.planType === 'basic' && planInfo.planType === 'premium',
            isDowngrade: subscription.planType === 'premium' && planInfo.planType === 'basic'
          });
        } else if (!subscriptionLearningPathId && paymentLearningPathId) {
          // Temporary subscription (learningPathId: null) - link it to this learning path
          // This only happens for initial access payments that haven't been linked yet
          shouldUpdateSubscription = true;
          console.log(`🔗 Linking temporary subscription to learning path "${paymentLearningPathId}"`);
          subscription.learningPathId = paymentLearningPathId;
          
          // Also update the payment record to link it to this learning path
          if (payment.learningPathId !== paymentLearningPathId) {
            payment.learningPathId = paymentLearningPathId;
            if (payment.metadata) {
              payment.metadata.learningPathId = paymentLearningPathId;
            }
            await payment.save();
            console.log(`✅ Linked payment ${payment._id} to learning path ${paymentLearningPathId}`);
          }
        } else if (subscriptionLearningPathId && paymentLearningPathId && subscriptionLearningPathId !== paymentLearningPathId) {
          // Subscription exists for a DIFFERENT learning path - DO NOT UPDATE IT
          // Create a NEW subscription for THIS learning path instead
          console.log(`⚠️ Subscription exists for DIFFERENT learning path - creating separate subscription:`, {
            existingSubscriptionId: subscription._id,
            existingSubscriptionLearningPathId: subscriptionLearningPathId,
            existingPlanType: subscription.planType,
            paymentLearningPathId: paymentLearningPathId,
            newPlanType: planInfo.planType,
            action: 'Creating NEW subscription for this learning path (not updating existing one)'
          });
          
          // Don't update the existing subscription - create a new one for this learning path
          subscription = null; // Reset to create new subscription below
          shouldUpdateSubscription = false;
        } else {
          // Both are null - temporary subscription for initial access
          shouldUpdateSubscription = true;
        }
      }
      
      if (subscription && shouldUpdateSubscription) {
        // Update subscription with new payment details (scoped to this learning path)
        subscription.planType = planInfo.planType;
        subscription.planAmount = planInfo.planAmount;
        subscription.startDate = now;
        subscription.expiryDate = expiryDate;
        subscription.paymentId = payment._id;
        subscription.dailyChatLimit = planInfo.dailyChatLimit;
        subscription.monthlyMcqLimit = planInfo.monthlyMcqLimit;
        subscription.isActive = true;
        subscription.learningPathsSaved = 0;
        
        // CRITICAL: Ensure limits are set (fix any subscriptions that might have been created without limits)
        if (!subscription.dailyChatLimit || subscription.dailyChatLimit === 0) {
          subscription.dailyChatLimit = planInfo.dailyChatLimit;
          console.log(`🔧 Fixed missing dailyChatLimit: ${planInfo.dailyChatLimit}`);
        }
        if (!subscription.monthlyMcqLimit || subscription.monthlyMcqLimit === 0) {
          subscription.monthlyMcqLimit = planInfo.monthlyMcqLimit;
          console.log(`🔧 Fixed missing monthlyMcqLimit: ${planInfo.monthlyMcqLimit}`);
        }
        
        try {
          await subscription.save();
          console.log(`✅ Subscription updated successfully for learning path "${learningPathId || 'temporary'}"`);
        } catch (saveError: any) {
          // Handle duplicate key error - might be due to unique index constraint
          if (saveError.code === 11000) {
            console.error(`⚠️ Duplicate key error when updating subscription:`, saveError.keyValue);
            
            // Try to find and delete conflicting subscription if it exists
            const conflictingSub = await Subscription.findOne({
              uniqueId: student.uniqueId,
              learningPathId: learningPathId,
              _id: { $ne: subscription._id }
            });
            
            if (conflictingSub) {
              console.log(`🗑️ Deleting conflicting subscription:`, conflictingSub._id);
              await Subscription.deleteOne({ _id: conflictingSub._id });
              
              // Retry saving
              await subscription.save();
              console.log(`✅ Subscription updated after resolving conflict`);
            } else {
              throw saveError; // Re-throw if we can't resolve it
            }
          } else {
            throw saveError; // Re-throw other errors
          }
        }
      } else {
        // Create new subscription
        // If learningPathId is null, create temporary subscription (will be linked when learning path is created)
        // If learningPathId is provided, create subscription scoped to that learning path
        console.log(`➕ Creating new subscription:`, {
          uniqueId: student.uniqueId,
          learningPathId: learningPathId || 'null (temporary - will be linked later)',
          planType: planInfo.planType,
          planAmount: planInfo.planAmount,
          dailyChatLimit: planInfo.dailyChatLimit,
          monthlyMcqLimit: planInfo.monthlyMcqLimit
        });
        
        subscription = new Subscription({
          studentId: student.userId,
          uniqueId: student.uniqueId,
          learningPathId: learningPathId || null, // Can be null for initial access payments
          planType: planInfo.planType,
          planAmount: planInfo.planAmount,
          startDate: now,
          expiryDate,
          isActive: true,
          paymentId: payment._id,
          dailyChatLimit: planInfo.dailyChatLimit,
          monthlyMcqLimit: planInfo.monthlyMcqLimit,
          learningPathsSaved: 0,
          maxLearningPathsPerPayment: 1
        });
        
        try {
          await subscription.save();
          console.log(`✅ New subscription created successfully`);
        } catch (saveError: any) {
          // Handle duplicate key error - subscription might have been created concurrently
          if (saveError.code === 11000) {
            console.error(`⚠️ Duplicate key error when creating subscription:`, {
              keyValue: saveError.keyValue,
              keyPattern: saveError.keyPattern,
              index: saveError.index
            });
            
            // Try multiple strategies to find existing subscription
            let existingSub = null;
            
            // Strategy 1: Find by uniqueId and learningPathId (composite unique index)
            existingSub = await Subscription.findOne({
              uniqueId: student.uniqueId,
              learningPathId: learningPathId || null
            });
            
            // Strategy 2: If not found and error is on studentId, try finding by studentId and learningPathId
            if (!existingSub && saveError.keyPattern?.studentId) {
              console.log(`🔍 Trying to find subscription by studentId and learningPathId`);
              existingSub = await Subscription.findOne({
                studentId: student.userId,
                learningPathId: learningPathId || null
              });
            }
            
            // Strategy 3: If still not found, try finding by studentId only (in case of old unique index)
            if (!existingSub && saveError.keyPattern?.studentId) {
              console.log(`🔍 Trying to find subscription by studentId only`);
              const allSubsForStudent = await Subscription.find({
                studentId: student.userId
              }).sort({ createdAt: -1 });
              
              // Find the one matching this learning path, or the most recent one
              if (learningPathId) {
                existingSub = allSubsForStudent.find(s => 
                  s.learningPathId?.toString() === learningPathId.toString()
                ) || null;
              } else {
                // For temporary subscriptions, find one with null learningPathId
                existingSub = allSubsForStudent.find(s => !s.learningPathId) || null;
              }
              
              // If still not found, use the most recent one (last resort)
              if (!existingSub && allSubsForStudent.length > 0) {
                console.log(`⚠️ Using most recent subscription as fallback`);
                existingSub = allSubsForStudent[0];
              }
            }
            
            if (existingSub) {
              console.log(`✅ Found existing subscription, updating it instead:`, {
                subscriptionId: existingSub._id,
                existingLearningPathId: existingSub.learningPathId || 'null',
                requestedLearningPathId: learningPathId || 'null',
                existingPlanType: existingSub.planType,
                newPlanType: planInfo.planType
              });
              
              // CRITICAL: Verify this subscription is for the correct learning path
              const existingLearningPathId = existingSub.learningPathId?.toString() || null;
              const requestedLearningPathId = learningPathId?.toString() || null;
              
              if (existingLearningPathId && requestedLearningPathId && existingLearningPathId !== requestedLearningPathId) {
                // Subscription exists for different learning path - this shouldn't happen with proper scoping
                // But if it does, we need to create a new subscription for this learning path
                console.error(`❌ Found subscription for DIFFERENT learning path - cannot update:`, {
                  existingLearningPathId: existingLearningPathId,
                  requestedLearningPathId: requestedLearningPathId
                });
                throw new Error(`Subscription exists for different learning path. Cannot update subscription for learning path ${requestedLearningPathId} when subscription exists for ${existingLearningPathId}`);
              }
              
              subscription = existingSub;
              
              // Update the existing subscription with new payment details
              subscription.planType = planInfo.planType;
              subscription.planAmount = planInfo.planAmount;
              subscription.startDate = now;
              subscription.expiryDate = expiryDate;
              subscription.paymentId = payment._id;
              subscription.dailyChatLimit = planInfo.dailyChatLimit;
              subscription.monthlyMcqLimit = planInfo.monthlyMcqLimit;
              subscription.isActive = true;
              subscription.learningPathsSaved = 0;
              
              // Ensure learningPathId is set correctly
              if (!subscription.learningPathId && learningPathId) {
                subscription.learningPathId = learningPathId;
              }
              
              try {
                await subscription.save();
                console.log(`✅ Existing subscription updated successfully`);
              } catch (updateError: any) {
                console.error(`❌ Failed to update existing subscription:`, updateError);
                throw updateError;
              }
            } else {
              console.error(`❌ Could not find existing subscription to update. Error details:`, {
                keyValue: saveError.keyValue,
                keyPattern: saveError.keyPattern,
                studentId: student.userId,
                uniqueId: student.uniqueId,
                learningPathId: learningPathId || 'null'
              });
              throw saveError; // Re-throw if we can't resolve it
            }
          } else {
            throw saveError; // Re-throw other errors
          }
        }
      }

      console.log('✅ Payment verified and subscription created/updated:', {
        paymentId: payment._id,
        subscriptionId: subscription._id,
        planType: planInfo.planType,
        planAmount: planInfo.planAmount,
        amountPaid: actualAmountPaid,
        learningPathId: learningPathId
      });

      // Create or update usage tracking
      let usageTracking = await UsageTracking.findOne({
        uniqueId: student.uniqueId,
        subscriptionId: subscription._id
      });

      const currentDate = new Date();
      if (!usageTracking) {
        // CRITICAL: monthlyMcqUsage is a Map, not a plain object
        // Initialize as empty Map - entries will be added per chapter when MCQs are generated
        usageTracking = new UsageTracking({
          studentId: student.userId,
          uniqueId: student.uniqueId,
          subscriptionId: subscription._id,
          dailyChatUsage: {},
          monthlyMcqUsage: {}, // Empty Map - will be populated per chapter
          learningPathsSaved: 0
        });
      } else {
        // Update subscriptionId if it changed
        usageTracking.subscriptionId = subscription._id;
        // Note: monthlyMcqUsage is a Map keyed by chapterId, so we don't reset it here
        // Each chapter has its own monthly usage tracking
      }
      await usageTracking.save();

      console.log('✅ Payment verified and subscription created/updated:', {
        paymentId: payment._id,
        subscriptionId: subscription._id,
        planType: planInfo.planType,
        planAmount: planInfo.planAmount,
        amountPaid: actualAmountPaid
      });
    } else if (payment.paymentFor === 'learning_path_save') {
      // For learning path save payments, increment the saved count
      const subscription = await Subscription.findOne({
        uniqueId: student.uniqueId,
        isActive: true
      });

      if (subscription) {
        subscription.learningPathsSaved = (subscription.learningPathsSaved || 0) + 1;
        await subscription.save();

        // Update usage tracking
        const usageTracking = await UsageTracking.findOne({
          uniqueId: student.uniqueId
        });

        if (usageTracking) {
          usageTracking.learningPathsSaved = (usageTracking.learningPathsSaved || 0) + 1;
          await usageTracking.save();
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Payment verified successfully',
      payment: {
        id: payment._id,
        orderId: payment.razorpayOrderId,
        paymentId: payment.razorpayPaymentId,
        amount: payment.amount,
        planType: payment.planType,
        status: payment.status
      }
    });

  } catch (error) {
    console.error('❌ Error verifying payment:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to verify payment',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
