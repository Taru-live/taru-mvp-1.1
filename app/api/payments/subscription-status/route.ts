import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import connectDB from '@/lib/mongodb';
import Student from '@/models/Student';
import Subscription from '@/models/Subscription';
import UsageTracking from '@/models/UsageTracking';
import Payment from '@/models/Payment';
import { 
  getPlanFromAmount, 
  getMostRecentCompletedPayment, 
  correctSubscriptionFromPayment,
  isStudentLinked
} from '@/lib/utils/paymentUtils';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

interface DecodedToken {
  userId: string;
  [key: string]: unknown;
}

export async function GET(request: NextRequest) {
  try {
    console.log('📡 Subscription status API called');
    
    // Get token from HTTP-only cookie
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      console.log('❌ No auth token found');
      return NextResponse.json(
        { error: 'Authorization token required' },
        { status: 401 }
      );
    }

    // Verify token
    let decoded: DecodedToken;
    try {
      decoded = jwt.verify(token, JWT_SECRET) as DecodedToken;
      console.log('✅ Token verified, userId:', decoded.userId);
    } catch (tokenError) {
      console.error('❌ Token verification failed:', tokenError);
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    // Get learningPathId from query parameters (optional)
    const { searchParams } = new URL(request.url);
    const learningPathId = searchParams.get('learningPathId') || null;
    console.log('📋 Learning path ID:', learningPathId || 'null');

    // Connect to database
    try {
      await connectDB();
      console.log('✅ Database connected');
    } catch (dbError) {
      console.error('❌ Database connection failed:', dbError);
      throw new Error(`Database connection failed: ${dbError instanceof Error ? dbError.message : 'Unknown error'}`);
    }

    // Get student profile
    let student;
    try {
      student = await Student.findOne({ 
        userId: decoded.userId,
        onboardingCompleted: true 
      });
      console.log('✅ Student lookup:', student ? `Found (uniqueId: ${student.uniqueId})` : 'Not found');
    } catch (studentError) {
      console.error('❌ Error finding student:', studentError);
      throw new Error(`Failed to find student: ${studentError instanceof Error ? studentError.message : 'Unknown error'}`);
    }

    if (!student) {
      console.log('❌ Student not found or onboarding not completed');
      return NextResponse.json(
        { error: 'Student not found or onboarding not completed' },
        { status: 404 }
      );
    }

    // CRITICAL: Linked students get free access - bypass subscription requirements
    const isLinked = await isStudentLinked(student.uniqueId);
    if (isLinked) {
      console.log(`✅ Student ${student.uniqueId} is linked to teacher/organization - granting free access`);
      
      // Return free access response with unlimited limits
      return NextResponse.json({
        success: true,
        hasSubscription: true,
        isLinkedStudent: true,
        subscription: {
          planType: 'free',
          planAmount: 0,
          learningPathId: learningPathId || null,
          startDate: new Date(),
          expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
          isActive: true,
          dailyChatLimit: 999, // Unlimited
          monthlyMcqLimit: 999, // Unlimited
          learningPathsSaved: 0,
          maxLearningPathsPerPayment: 999, // Unlimited
          planBenefits: {
            name: 'Free Access (Linked Student)',
            description: 'Full platform access as a linked student',
            features: [
              'Unlimited AI Buddy chats per day per chapter',
              'Unlimited MCQ generations per month per chapter',
              'Unlimited learning path access',
              'Full platform features',
              'No payment required'
            ],
            icon: 'gift'
          }
        },
        usage: {
          dailyChatsUsed: 0,
          dailyChatsRemaining: 999,
          monthlyMcqsUsed: 0,
          monthlyMcqsRemaining: 999,
          canSaveLearningPath: true,
          learningPathsSaved: 0
        }
      });
    }

    // CRITICAL: Subscriptions are scoped to individual learning paths
    // However, for initial access (before learning path is created), we check for temporary subscription
    // Strategy:
    // 1. If learningPathId is provided: Check subscription for that specific learning path
    // 2. If learningPathId is null: Check for temporary subscription (learningPathId: null) for initial access
    
    const now = new Date();
    
    // CRITICAL: Subscription lookup strategy:
    // 1. If learningPathId is provided: 
    //    - First look for subscription for that specific learning path
    //    - If not found, check for temporary subscription (learningPathId: null) that can be linked
    // 2. If learningPathId is null: Look for temporary subscription (initial access)
    let subscription = null;
    
    if (learningPathId) {
      // First, look for subscription for THIS specific learning path
      subscription = await Subscription.findOne({
        uniqueId: student.uniqueId,
        learningPathId: learningPathId // Must match exactly
      });
      console.log(`🔍 Looking for subscription with learningPathId="${learningPathId}":`, subscription ? 'Found' : 'Not found');
      
      // CRITICAL: Do NOT auto-link temporary subscriptions here
      // Auto-linking should only happen when learning path is saved (in learning-paths/save route)
      // This prevents one learning path's subscription from being incorrectly linked to another learning path
      // If no subscription found for this learning path, return no subscription
      // Temporary subscriptions will be linked when the learning path is actually saved
    } else {
      // Look for temporary subscription (initial access - no learning path created yet)
      subscription = await Subscription.findOne({
        uniqueId: student.uniqueId,
        learningPathId: null,
        isActive: true
      }).sort({ createdAt: -1 }); // Get most recent temporary subscription
      console.log(`🔍 Looking for temporary subscription (initial access):`, subscription ? 'Found' : 'Not found');
    }
    
    // Check if found subscription is expired
    if (subscription && subscription.expiryDate < now) {
      console.log(`⚠️ Subscription found but expired, marking as inactive`);
      subscription.isActive = false;
      await subscription.save();
      subscription = null;
    }
    
    // Final check: Ensure subscription is active
    if (subscription && !subscription.isActive) {
      console.log(`⚠️ Subscription found but marked as inactive`);
      subscription = null;
    }

    if (!subscription) {
      console.log(`❌ No subscription found for user ${student.uniqueId}, learningPathId: ${learningPathId || 'null'}`);
      
      // CRITICAL: Check if there's a completed payment for THIS learning path that should have created a subscription
      // This handles edge cases where payment was completed but subscription creation failed or wasn't properly linked
      try {
        console.log('🔍 Checking for completed payment for learning path:', learningPathId || 'null');
        // Only look for payment for THIS specific learning path
        const paymentForPath = await getMostRecentCompletedPayment(
          student.uniqueId,
          learningPathId || null
        );
        console.log('💰 Payment lookup result:', paymentForPath ? `Found (ID: ${paymentForPath._id})` : 'Not found');
        
        if (paymentForPath && paymentForPath.status === 'completed') {
          // Verify payment is for the correct learning path
          const paymentLearningPathId = paymentForPath.learningPathId?.toString() || null;
          const requestedLearningPathId = learningPathId?.toString() || null;
          
          // CRITICAL: Only create subscription if payment matches the requested learning path
          // This ensures subscriptions remain scoped to individual learning paths
          const paymentMatches = paymentLearningPathId === requestedLearningPathId || 
                                 (!requestedLearningPathId && !paymentLearningPathId);
          
          if (paymentMatches) {
            console.log(`💰 Found completed payment for this learning path - creating subscription:`, {
              paymentId: paymentForPath._id,
              amount: paymentForPath.amount,
              planType: paymentForPath.planType,
              learningPathId: paymentLearningPathId || 'null (temporary)',
              completedAt: paymentForPath.completedAt
            });
            
            // Create subscription from payment
            const planInfo = getPlanFromAmount(paymentForPath.amount || 0);
            const now = new Date();
            const expiryDate = new Date(now);
            expiryDate.setMonth(expiryDate.getMonth() + 1); // 1 month subscription
            
            // CRITICAL: Use the payment's learningPathId, not the requested one
            // This ensures the subscription is linked to the correct learning path
            const subscriptionLearningPathId = paymentLearningPathId || requestedLearningPathId || null;
            
            subscription = new Subscription({
              studentId: student.userId,
              uniqueId: student.uniqueId,
              learningPathId: subscriptionLearningPathId,
              planType: planInfo.planType,
              planAmount: planInfo.planAmount,
              startDate: paymentForPath.completedAt || now,
              expiryDate: expiryDate,
              isActive: true,
              paymentId: paymentForPath._id,
              dailyChatLimit: planInfo.dailyChatLimit,
              monthlyMcqLimit: planInfo.monthlyMcqLimit,
              learningPathsSaved: 0,
              maxLearningPathsPerPayment: 1
            });
            
            try {
              await subscription.save();
              console.log(`✅ Created subscription from payment for learning path "${subscriptionLearningPathId || 'temporary'}"`);
            } catch (createError: any) {
              // Handle duplicate key error - subscription might have been created concurrently
              if (createError.code === 11000) {
                console.log(`⚠️ Duplicate key error - subscription may have been created concurrently:`, {
                  keyValue: createError.keyValue,
                  keyPattern: createError.keyPattern
                });
                
                let existingSub = null;
                
                // Strategy 1: Find by paymentId (if error is on paymentId)
                if (createError.keyPattern?.paymentId) {
                  console.log(`🔍 Looking for subscription by paymentId:`, paymentForPath._id);
                  existingSub = await Subscription.findOne({
                    paymentId: paymentForPath._id
                  });
                }
                
                // Strategy 2: Find by uniqueId and learningPathId
                if (!existingSub) {
                  existingSub = await Subscription.findOne({
                    uniqueId: student.uniqueId,
                    learningPathId: subscriptionLearningPathId
                  });
                }
                
                // Strategy 3: Find temporary subscription (learningPathId: null) that might need to be linked
                // This handles the case where payment verification created a temporary subscription
                // and now we need to link it to the specific learning path
                if (!existingSub && subscriptionLearningPathId) {
                  console.log(`🔍 Looking for temporary subscription to link:`, subscriptionLearningPathId);
                  existingSub = await Subscription.findOne({
                    uniqueId: student.uniqueId,
                    learningPathId: null,
                    paymentId: paymentForPath._id
                  });
                  
                  if (existingSub) {
                    console.log(`🔗 Found temporary subscription - linking to learning path "${subscriptionLearningPathId}":`, {
                      subscriptionId: existingSub._id,
                      currentLearningPathId: existingSub.learningPathId || 'null',
                      newLearningPathId: subscriptionLearningPathId,
                      planType: existingSub.planType
                    });
                    
                    // Link the temporary subscription to this learning path
                    existingSub.learningPathId = subscriptionLearningPathId;
                    
                    // Also update the payment record to link it to this learning path
                    if (paymentForPath.learningPathId !== subscriptionLearningPathId) {
                      const Payment = (await import('@/models/Payment')).default;
                      const paymentRecord = await Payment.findById(paymentForPath._id);
                      if (paymentRecord) {
                        paymentRecord.learningPathId = subscriptionLearningPathId;
                        if (paymentRecord.metadata) {
                          paymentRecord.metadata.learningPathId = subscriptionLearningPathId;
                        }
                        await paymentRecord.save();
                        console.log(`✅ Linked payment ${paymentRecord._id} to learning path ${subscriptionLearningPathId}`);
                      }
                    }
                    
                    await existingSub.save();
                    console.log(`✅ Temporary subscription linked successfully to learning path "${subscriptionLearningPathId}"`);
                  }
                }
                
                if (existingSub) {
                  console.log(`✅ Found existing subscription:`, {
                    subscriptionId: existingSub._id,
                    learningPathId: existingSub.learningPathId || 'null',
                    planType: existingSub.planType
                  });
                  subscription = existingSub;
                } else {
                  console.error(`❌ Failed to create subscription and couldn't find existing one:`, {
                    error: createError.message,
                    keyValue: createError.keyValue,
                    keyPattern: createError.keyPattern,
                    paymentId: paymentForPath._id,
                    learningPathId: subscriptionLearningPathId
                  });
                  subscription = null;
                }
              } else {
                console.error(`❌ Failed to create subscription from payment:`, createError);
                subscription = null;
              }
            }
          } else {
            console.log(`⚠️ Payment is for DIFFERENT learning path - cannot create subscription:`, {
              requestedLearningPathId: requestedLearningPathId || 'null',
              paymentLearningPathId: paymentLearningPathId || 'null',
              action: 'Payment belongs to different learning path - subscriptions must remain scoped'
            });
          }
        } else {
          console.log(`⚠️ No completed payment found for learning path "${learningPathId || 'temporary'}"`);
        }
      } catch (error) {
        console.error('Error checking for payments when no subscription found:', error);
      }
      
      // If still no subscription after trying to create from payment, check for ANY active subscription
      if (!subscription) {
        // Debug: Check all subscriptions for this user
        const allSubscriptions = await Subscription.find({ uniqueId: student.uniqueId });
        console.log(`📊 All subscriptions for user:`, allSubscriptions.map(s => ({
          id: s._id,
          planType: s.planType,
          planAmount: s.planAmount,
          learningPathId: s.learningPathId,
          isActive: s.isActive,
          expiryDate: s.expiryDate
        })));
        
        // FALLBACK: If no subscription found for specific learning path, check for ANY active subscription
        // This ensures users see their subscription details even if it's for a different learning path
        console.log(`🔍 Fallback: Looking for ANY active subscription for user ${student.uniqueId}`);
        const anyActiveSubscription = await Subscription.findOne({
          uniqueId: student.uniqueId,
          isActive: true,
          expiryDate: { $gt: now }
        }).sort({ createdAt: -1 }); // Get most recent active subscription
        
        if (anyActiveSubscription) {
          console.log(`✅ Found fallback active subscription:`, {
            subscriptionId: anyActiveSubscription._id,
            planType: anyActiveSubscription.planType,
            planAmount: anyActiveSubscription.planAmount,
            learningPathId: anyActiveSubscription.learningPathId,
            isActive: anyActiveSubscription.isActive,
            expiryDate: anyActiveSubscription.expiryDate
          });
          subscription = anyActiveSubscription;
        } else {
          console.log(`❌ No active subscription found (including fallback check)`);
          return NextResponse.json({
            success: true,
            hasSubscription: false,
            message: 'No active subscription found'
          });
        }
      }
    }
    
    console.log(`✅ Found subscription:`, {
      subscriptionId: subscription._id,
      planType: subscription.planType,
      planAmount: subscription.planAmount,
      learningPathId: subscription.learningPathId,
      isActive: subscription.isActive,
      expiryDate: subscription.expiryDate
    });

    // CRITICAL: Auto-fix subscription based on most recent completed payment FOR THIS LEARNING PATH ONLY
    // Strategy:
    // - If learningPathId is provided: Fetch payment for that SPECIFIC learning path only
    // - If learningPathId is null: Fetch payment without learningPathId (initial access payment)
    // NEVER use payments from other learning paths to correct this subscription
    let paymentToCheck = null;
    
    try {
      console.log('🔍 Auto-fixing subscription - checking payment for learning path:', learningPathId || subscription?.learningPathId || 'null');
      // CRITICAL: Only fetch payment for THIS specific learning path
      // This ensures subscriptions remain scoped to individual learning paths
      paymentToCheck = await getMostRecentCompletedPayment(
        student.uniqueId, 
        learningPathId || subscription?.learningPathId || null
      );
      console.log('💰 Payment for auto-fix:', paymentToCheck ? `Found (ID: ${paymentToCheck._id})` : 'Not found');
      
      if (paymentToCheck) {
        console.log(`💰 Found payment:`, {
          paymentId: paymentToCheck._id,
          amount: paymentToCheck.amount,
          planAmount: paymentToCheck.planAmount,
          planType: paymentToCheck.planType,
          paymentLearningPathId: paymentToCheck.learningPathId || 'null (initial access)',
          subscriptionLearningPathId: subscription?.learningPathId || 'null',
          requestedLearningPathId: learningPathId || 'null',
          completedAt: paymentToCheck.completedAt
        });
        
        // CRITICAL: Verify payment is for the SAME learning path as subscription
        const paymentLearningPathId = paymentToCheck.learningPathId?.toString() || null;
        const subscriptionLearningPathId = subscription?.learningPathId?.toString() || null;
        const requestedLearningPathId = learningPathId?.toString() || null;
        
        // Check if payment matches the requested learning path
        if (requestedLearningPathId && paymentLearningPathId && paymentLearningPathId !== requestedLearningPathId) {
          console.error(`❌ Payment is for DIFFERENT learning path - ignoring it:`, {
            requestedLearningPathId: requestedLearningPathId,
            paymentLearningPathId: paymentLearningPathId
          });
          paymentToCheck = null; // Don't use this payment - it's for a different learning path
        } else if (subscriptionLearningPathId && paymentLearningPathId && paymentLearningPathId !== subscriptionLearningPathId) {
          console.error(`❌ Payment and subscription are for DIFFERENT learning paths - ignoring payment:`, {
            subscriptionLearningPathId: subscriptionLearningPathId,
            paymentLearningPathId: paymentLearningPathId
          });
          paymentToCheck = null; // Don't use this payment - it's for a different learning path
        } else if (!requestedLearningPathId && paymentLearningPathId) {
          // If we're looking for temporary subscription but payment has learningPathId, skip it
          console.log(`⚠️ Payment has learningPathId but we're checking for temporary subscription, skipping`);
          paymentToCheck = null;
        }
      } else {
        console.log(`⚠️ No completed payment found for learning path "${learningPathId || 'temporary'}"`);
      }
    } catch (error) {
      console.error('Error fetching most recent completed payment:', error);
    }
    
    // If we have a matching payment for THIS learning path, use it to auto-correct the subscription
    if (paymentToCheck && paymentToCheck.status === 'completed') {
      // Double-check payment matches subscription's learning path
      const paymentLearningPathId = paymentToCheck.learningPathId?.toString() || null;
      const subscriptionLearningPathId = subscription?.learningPathId?.toString() || null;
      
      if (subscriptionLearningPathId && paymentLearningPathId && paymentLearningPathId !== subscriptionLearningPathId) {
        console.error(`❌ Payment and subscription learning path mismatch - cannot auto-correct:`, {
          subscriptionLearningPathId: subscriptionLearningPathId,
          paymentLearningPathId: paymentLearningPathId
        });
      } else {
        // Use helper function to auto-correct subscription based on payment amount
        const wasCorrected = await correctSubscriptionFromPayment(subscription, paymentToCheck);
        
        if (!wasCorrected) {
          console.log(`✅ Subscription already matches payment: ${subscription.planType} (₹${subscription.planAmount})`);
        }
        
        // Refresh subscription from database to get updated values
        subscription = await Subscription.findById(subscription._id);
      }
    } else {
      console.log(`⚠️ No matching completed payment found for this learning path - subscription may be stale or invalid`);
    }

    // Check if subscription is expired (using 'now' declared earlier)
    const isExpired = subscription.expiryDate < now;
    
    if (isExpired) {
      subscription.isActive = false;
      await subscription.save();
      
      return NextResponse.json({
        success: true,
        hasSubscription: false,
        message: 'Subscription has expired',
        expired: true
      });
    }

    // Get usage tracking
    const usageTracking = await UsageTracking.findOne({
      uniqueId: student.uniqueId,
      subscriptionId: subscription._id
    });

    // Calculate remaining usage
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1;
    const currentDateStr = currentDate.toISOString().split('T')[0];

    // Calculate daily chat usage for today
    let todayChatUsage = 0;
    if (usageTracking && usageTracking.dailyChatUsage) {
      const dailyUsage = usageTracking.dailyChatUsage as Map<string, any>;
      for (const [key, value] of dailyUsage.entries()) {
        const usageDate = value.date ? new Date(value.date).toISOString().split('T')[0] : null;
        if (usageDate === currentDateStr) {
          todayChatUsage += value.count || 0;
        }
      }
    }

    // Calculate monthly MCQ usage
    // CRITICAL: monthlyMcqUsage is a Map keyed by chapterId, not a plain object
    // We need to sum up all chapter usages for the current month
    let monthlyMcqUsage = 0;
    if (usageTracking && usageTracking.monthlyMcqUsage) {
      const monthlyUsage = usageTracking.monthlyMcqUsage as Map<string, any>;
      for (const [chapterId, chapterUsage] of monthlyUsage.entries()) {
        if (chapterUsage && 
            chapterUsage.year === currentYear &&
            chapterUsage.month === currentMonth) {
          monthlyMcqUsage += chapterUsage.count || 0;
        }
      }
    }

    const remainingChats = Math.max(0, subscription.dailyChatLimit - todayChatUsage);
    const remainingMcqs = Math.max(0, subscription.monthlyMcqLimit - monthlyMcqUsage);
    
    // Check learning path save availability
    const canSaveLearningPath = (subscription.learningPathsSaved || 0) < subscription.maxLearningPathsPerPayment;

    // Determine plan benefits based on plan type
    const planBenefits = subscription.planType === 'premium' 
      ? {
          name: 'Premium Plan',
          description: 'Maximum benefits unlocked',
          features: [
            '5 AI Buddy chats per day per chapter',
            '5 MCQ generations per month per chapter',
            'Unlimited learning path access',
            'Priority support',
            'Advanced AI features'
          ],
          icon: 'sparkles'
        }
      : {
          name: 'Basic Plan',
          description: 'Essential features included',
          features: [
            '3 AI Buddy chats per day per chapter',
            '3 MCQ generations per month per chapter',
            'Learning path access',
            'Standard support',
            'Core AI features'
          ],
          icon: 'star'
        };

    return NextResponse.json({
      success: true,
      hasSubscription: true,
      subscription: {
        planType: subscription.planType,
        planAmount: subscription.planAmount,
        learningPathId: subscription.learningPathId || null,
        startDate: subscription.startDate,
        expiryDate: subscription.expiryDate,
        isActive: subscription.isActive,
        dailyChatLimit: subscription.dailyChatLimit,
        monthlyMcqLimit: subscription.monthlyMcqLimit,
        learningPathsSaved: subscription.learningPathsSaved || 0,
        maxLearningPathsPerPayment: subscription.maxLearningPathsPerPayment,
        planBenefits: planBenefits
      },
      usage: {
        dailyChatsUsed: todayChatUsage,
        dailyChatsRemaining: remainingChats,
        monthlyMcqsUsed: monthlyMcqUsage,
        monthlyMcqsRemaining: remainingMcqs,
        canSaveLearningPath,
        learningPathsSaved: usageTracking?.learningPathsSaved || 0
      }
    });

  } catch (error) {
    console.error('❌ Error fetching subscription status:', error);
    
    // Safely extract error details
    let errorMessage = 'Unknown error';
    let errorStack = undefined;
    
    if (error instanceof Error) {
      errorMessage = error.message;
      errorStack = error.stack;
    } else if (typeof error === 'string') {
      errorMessage = error;
    } else if (error && typeof error === 'object') {
      try {
        errorMessage = JSON.stringify(error);
      } catch {
        errorMessage = String(error);
      }
    }
    
    console.error('❌ Error details:', {
      message: errorMessage,
      stack: errorStack,
      type: error?.constructor?.name || typeof error
    });
    
    try {
      return NextResponse.json(
        { 
          success: false,
          error: 'Failed to fetch subscription status',
          message: errorMessage
        },
        { status: 500 }
      );
    } catch (responseError) {
      // If even JSON serialization fails, return minimal response
      console.error('❌ Failed to create error response:', responseError);
      return new NextResponse(
        JSON.stringify({ 
          success: false,
          error: 'Failed to fetch subscription status',
          message: 'Internal server error'
        }),
        { 
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
  }
}
