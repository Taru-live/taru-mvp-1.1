import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import Razorpay from 'razorpay';
import connectDB from '@/lib/mongodb';
import Student from '@/models/Student';
import Payment from '@/models/Payment';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID;
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;

interface DecodedToken {
  userId: string;
  [key: string]: unknown;
}

// Initialize Razorpay instance
let razorpayInstance: Razorpay | null = null;

function getRazorpayInstance(): Razorpay {
  if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
    throw new Error('Razorpay credentials not configured');
  }
  
  if (!razorpayInstance) {
    razorpayInstance = new Razorpay({
      key_id: RAZORPAY_KEY_ID,
      key_secret: RAZORPAY_KEY_SECRET,
    });
  }
  
  return razorpayInstance;
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
    const { planType, paymentFor, learningPathId } = await request.json();

    // Validate plan type
    if (!planType || !['basic', 'premium'].includes(planType)) {
      return NextResponse.json(
        { error: 'Invalid plan type. Must be "basic" or "premium"' },
        { status: 400 }
      );
    }

    // Validate paymentFor
    if (!paymentFor || !['career_access', 'learning_path_save'].includes(paymentFor)) {
      return NextResponse.json(
        { error: 'Invalid payment purpose. Must be "career_access" or "learning_path_save"' },
        { status: 400 }
      );
    }

    // NOTE: For career_access payments:
    // - If learningPathId is provided: This is an upgrade/renewal for an existing learning path
    // - If learningPathId is NOT provided: This is initial access, subscription will be linked when learning path is created
    // We allow both cases to support the flow: career exploration -> payment -> generate learning path -> link subscription

    // Set plan amount - ₹99 for basic, ₹199 for premium
    const planAmount = planType === 'basic' ? 99 : 199;
    
    // Ensure planType matches amount (safety check)
    const validatedPlanType = planAmount === 199 ? 'premium' : 'basic';
    if (planType !== validatedPlanType) {
      console.log(`⚠️ Plan type mismatch corrected: requested=${planType}, amount=${planAmount}, using=${validatedPlanType}`);
    }
    const finalPlanType = validatedPlanType;

    // Initialize Razorpay
    const razorpay = getRazorpayInstance();

    // Create order
    const orderOptions = {
      amount: planAmount * 100, // Convert to paise
      currency: 'INR',
      receipt: `receipt_${student.uniqueId}_${Date.now()}`,
      notes: {
        studentId: student.userId,
        uniqueId: student.uniqueId,
        planType: finalPlanType,
        paymentFor,
        learningPathId: learningPathId || null
      }
    };

    let razorpayOrder;
    try {
      razorpayOrder = await razorpay.orders.create(orderOptions);
      
      // Validate that order was created successfully with a valid ID
      if (!razorpayOrder || !razorpayOrder.id || typeof razorpayOrder.id !== 'string' || razorpayOrder.id.trim() === '') {
        console.error('❌ Invalid Razorpay order response:', razorpayOrder);
        throw new Error('Failed to create Razorpay order: Invalid order ID received');
      }
      
      console.log('✅ Razorpay order created successfully:', razorpayOrder.id);
    } catch (razorpayError) {
      console.error('❌ Razorpay order creation failed:', razorpayError);
      // Don't save payment record if order creation failed
      throw new Error(`Failed to create Razorpay order: ${razorpayError instanceof Error ? razorpayError.message : 'Unknown error'}`);
    }

    // Only save payment record after successful order creation with valid order ID
    const orderId = razorpayOrder.id;
    if (!orderId || typeof orderId !== 'string' || orderId.trim() === '') {
      throw new Error('Cannot save payment: Invalid order ID');
    }

    // Check if a payment with this orderId already exists
    const existingPayment = await Payment.findOne({ razorpayOrderId: orderId });
    if (existingPayment) {
      console.log('⚠️ Payment record with this orderId already exists:', existingPayment._id);
      // Return the existing payment instead of creating a new one
      return NextResponse.json({
        success: true,
        orderId: orderId,
        amount: planAmount,
        currency: 'INR',
        keyId: RAZORPAY_KEY_ID,
        paymentId: existingPayment._id.toString()
      });
    }

    // Save payment record
    // For career_access: learningPathId can be null initially (will be linked when learning path is created)
    // For learning_path_save: learningPathId should be provided
    const payment = new Payment({
      studentId: student.userId,
      uniqueId: student.uniqueId,
      razorpayOrderId: orderId, // Guaranteed to be a valid string at this point
      amount: planAmount,
      currency: 'INR',
      planType: finalPlanType, // Use validated plan type
      planAmount,
      status: 'pending',
      paymentFor,
      learningPathId: learningPathId || null, // Can be null for initial career_access payments
      metadata: {
        receipt: orderOptions.receipt,
        createdAt: new Date(),
        learningPathId: learningPathId || null,
        careerPath: paymentFor === 'career_access' && !learningPathId ? 'pending' : null // Track that this is initial access
      }
    });
    
    console.log('💳 Creating payment record:', {
      paymentFor,
      learningPathId: payment.learningPathId || 'null (will be linked later)',
      planType: finalPlanType,
      planAmount
    });

    try {
      await payment.save();

      console.log('✅ Razorpay order created:', {
        orderId: razorpayOrder.id,
        studentId: student.uniqueId,
        planType: finalPlanType,
        planAmount: planAmount,
        learningPathId: learningPathId || null
      });

      return NextResponse.json({
        success: true,
        orderId: razorpayOrder.id,
        amount: planAmount,
        currency: 'INR',
        keyId: RAZORPAY_KEY_ID,
        paymentId: payment._id.toString()
      });
    } catch (saveError: any) {
      // If it's a duplicate key error, check if the orderId already exists
      if (saveError.code === 11000) {
        console.error('Duplicate key error while saving payment:', saveError);
        console.error('Error keyValue:', saveError.keyValue);
        
        // The error might reference 'orderId' (old index) or 'razorpayOrderId' (current field)
        const duplicateOrderId = saveError.keyValue?.razorpayOrderId || saveError.keyValue?.orderId || orderId;
        
        // Try to find existing payment by the orderId we just created
        const duplicatePayment = await Payment.findOne({ razorpayOrderId: duplicateOrderId });
        if (duplicatePayment) {
          console.log('✅ Found existing payment with same orderId, using it instead:', duplicatePayment._id);
          return NextResponse.json({
            success: true,
            orderId: duplicatePayment.razorpayOrderId,
            amount: duplicatePayment.amount,
            currency: duplicatePayment.currency || 'INR',
            keyId: RAZORPAY_KEY_ID,
            paymentId: duplicatePayment._id.toString()
          });
        }
        
        // If not found by razorpayOrderId, check if there are any payments with null orderId/paymentId that need cleanup
        const isNullOrderId = saveError.keyValue?.orderId === null || saveError.keyValue?.razorpayOrderId === null;
        const isNullPaymentId = saveError.keyValue?.paymentId === null;
        
        if (isNullOrderId || isNullPaymentId) {
          console.log('⚠️ Duplicate key error with null orderId/paymentId detected. This may indicate an old index issue.');
          console.log('⚠️ Error keyValue:', saveError.keyValue);
          console.log('💡 Recommendation: Run the fix-payment-index.js script to clean up old indexes.');
          
          // Try to find any pending payments for this student that might have null orderId/paymentId
          const orphanedPayments = await Payment.find({
            uniqueId: student.uniqueId,
            status: 'pending',
            $or: [
              { razorpayOrderId: null },
              { razorpayOrderId: { $exists: false } },
              { orderId: null },
              { orderId: { $exists: true, $eq: null } },
              { paymentId: null },
              { paymentId: { $exists: true, $eq: null } }
            ]
          });
          
          if (orphanedPayments.length > 0) {
            console.log(`⚠️ Found ${orphanedPayments.length} orphaned payment(s) with null orderId. Cleaning up...`);
            await Payment.deleteMany({
              _id: { $in: orphanedPayments.map(p => p._id) }
            });
            console.log('✅ Cleaned up orphaned payments. Retrying save...');
            
            // Retry saving with the same orderId
            try {
              await payment.save();
              console.log('✅ Payment saved successfully after cleanup');
              
              return NextResponse.json({
                success: true,
                orderId: orderId,
                amount: planAmount,
                currency: 'INR',
                keyId: RAZORPAY_KEY_ID,
                paymentId: payment._id.toString()
              });
            } catch (retryError: any) {
              console.error('❌ Retry save failed:', retryError);
              throw retryError;
            }
          } else {
            throw saveError; // Re-throw if we can't resolve it
          }
        } else {
          throw saveError; // Re-throw if it's not a null orderId issue
        }
      } else {
        throw saveError; // Re-throw if it's not a duplicate key error
      }
    }

  } catch (error) {
    console.error('❌ Error creating Razorpay order:', error);
    
    // Handle validation errors first
    if (error instanceof Error && error.message.includes('Learning path ID')) {
      return NextResponse.json(
        { 
          error: error.message,
          details: 'Please ensure a learning path is selected before making a payment.'
        },
        { status: 400 }
      );
    }
    
    // Check if it's a MongoDB duplicate key error
    if (error && typeof error === 'object' && 'code' in error && error.code === 11000) {
      console.error('Duplicate key error detected. Attempting to find existing payment...');
      
      // Try to find the existing payment with the duplicate orderId
      const duplicateKeyValue = (error as any).keyValue;
      if (duplicateKeyValue && duplicateKeyValue.razorpayOrderId) {
        const existingPayment = await Payment.findOne({ 
          razorpayOrderId: duplicateKeyValue.razorpayOrderId 
        });
        
        if (existingPayment) {
          console.log('✅ Found existing payment, returning it:', existingPayment._id);
          // Return the existing payment details so frontend can use it
          return NextResponse.json({
            success: true,
            orderId: existingPayment.razorpayOrderId,
            amount: existingPayment.amount,
            currency: existingPayment.currency || 'INR',
            keyId: RAZORPAY_KEY_ID,
            paymentId: existingPayment._id.toString()
          });
        }
      }
      
      // Try to clean up any orphaned payment records
      try {
        const cleanupResult = await Payment.deleteMany({ 
          $or: [
            { razorpayOrderId: null },
            { razorpayOrderId: { $exists: false } },
            { razorpayOrderId: '' }
          ],
          status: 'pending',
          createdAt: { $lt: new Date(Date.now() - 24 * 60 * 60 * 1000) } // Older than 24 hours
        });
        console.log(`✅ Cleaned up ${cleanupResult.deletedCount} orphaned payment records`);
        
        // Also check for duplicate orderIds and keep only the most recent
        if (duplicateKeyValue && duplicateKeyValue.razorpayOrderId) {
          const duplicates = await Payment.find({ 
            razorpayOrderId: duplicateKeyValue.razorpayOrderId 
          }).sort({ createdAt: -1 });
          
          if (duplicates.length > 1) {
            // Keep the most recent one, delete others
            const idsToDelete = duplicates.slice(1).map(p => p._id);
            await Payment.deleteMany({ _id: { $in: idsToDelete } });
            console.log(`✅ Cleaned up ${idsToDelete.length} duplicate payment records`);
            
            // Return the most recent payment
            return NextResponse.json({
              success: true,
              orderId: duplicates[0].razorpayOrderId,
              amount: duplicates[0].amount,
              currency: duplicates[0].currency || 'INR',
              keyId: RAZORPAY_KEY_ID,
              paymentId: duplicates[0]._id.toString()
            });
          }
        }
      } catch (cleanupError) {
        console.error('Error cleaning up orphaned records:', cleanupError);
      }
      
      return NextResponse.json(
        { 
          error: 'Payment order creation failed. Please try again.',
          details: 'A payment record already exists. Please wait a moment and try again.',
          retryable: true
        },
        { status: 500 }
      );
    }
    
    // Handle different error types
    if (error instanceof Error) {
      const errorMessage = error.message || 'Failed to create payment order';
      console.error('❌ Error details:', {
        message: errorMessage,
        name: error.name,
        stack: error.stack
      });
      
      return NextResponse.json(
        { 
          error: 'Failed to create payment order',
          details: errorMessage
        },
        { status: 500 }
      );
    }
    
    // Handle unknown error types
    console.error('❌ Unknown error type:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: 'An unexpected error occurred. Please try again.'
      },
      { status: 500 }
    );
  }
}
