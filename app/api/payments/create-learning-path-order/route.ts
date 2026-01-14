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
  // Declare variables at function scope so they're accessible in catch block
  let student: any = null;
  let orderId: string | undefined;
  let planAmount: number | undefined;
  let selectedPlanType: string | undefined;
  let learningPathId: string | null | undefined;
  let orderOptions: any = null;
  
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
    student = await Student.findOne({ 
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
    const body = await request.json();
    learningPathId = body.learningPathId;
    const planType = body.planType;

    // Validate plan type
    if (planType && !['basic', 'premium'].includes(planType)) {
      return NextResponse.json(
        { error: 'Invalid plan type. Must be "basic" or "premium"' },
        { status: 400 }
      );
    }

    // Default to basic plan if not specified
    selectedPlanType = planType || 'basic';
    planAmount = selectedPlanType === 'basic' ? 99 : 199;
    
    console.log('📋 Creating learning path payment order:', {
      studentId: student.uniqueId,
      planType: selectedPlanType,
      amount: planAmount,
      learningPathId: learningPathId || null
    });

    // Initialize Razorpay
    const razorpay = getRazorpayInstance();

    // Create order
    orderOptions = {
      amount: planAmount * 100, // Convert to paise
      currency: 'INR',
      receipt: `receipt_lp_${student.uniqueId}_${Date.now()}`,
      notes: {
        studentId: student.userId,
        uniqueId: student.uniqueId,
        planType: selectedPlanType,
        paymentFor: 'learning_path_save',
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
    orderId = razorpayOrder.id;
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
    const payment = new Payment({
      studentId: student.userId,
      uniqueId: student.uniqueId,
      razorpayOrderId: orderId, // Guaranteed to be a valid string at this point
      amount: planAmount,
      currency: 'INR',
      planType: selectedPlanType,
      planAmount,
      status: 'pending',
      paymentFor: 'learning_path_save',
      learningPathId: learningPathId || null,
      metadata: {
        receipt: orderOptions.receipt,
        createdAt: new Date()
      }
    });

    try {
      await payment.save();
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

    console.log('✅ Razorpay order created for learning path save:', {
      orderId: razorpayOrder.id,
      studentId: student.uniqueId,
      planType: selectedPlanType,
      amount: planAmount
    });

    return NextResponse.json({
      success: true,
      orderId: razorpayOrder.id,
      amount: planAmount,
      currency: 'INR',
      keyId: RAZORPAY_KEY_ID,
      paymentId: payment._id.toString()
    });

  } catch (error) {
    console.error('❌ Error creating Razorpay order for learning path:', error);
    console.error('Error details:', JSON.stringify(error, null, 2));
    
    // Check if it's a MongoDB duplicate key error
    const isMongoError = error && typeof error === 'object' && 'code' in error;
    const isDuplicateKeyError = isMongoError && (error as any).code === 11000;
    
    if (isDuplicateKeyError) {
      console.error('Duplicate key error detected. Attempting to find existing payment...');
      console.error('Error keyValue:', (error as any).keyValue);
      
      // Try to find the existing payment with the duplicate orderId
      // The error might reference 'orderId' (old index) or 'razorpayOrderId' (current field)
      const duplicateKeyValue = (error as any).keyValue;
      const duplicateOrderId = duplicateKeyValue?.razorpayOrderId || duplicateKeyValue?.orderId;
      
      // If the error is about null orderId/paymentId, it's likely an old index issue
      const isNullOrderId = duplicateKeyValue && (duplicateKeyValue.orderId === null || duplicateKeyValue.razorpayOrderId === null);
      const isNullPaymentId = duplicateKeyValue && duplicateKeyValue.paymentId === null;
      
      if (isNullOrderId || isNullPaymentId) {
        console.log('⚠️ Duplicate key error with null orderId/paymentId. This indicates an old index issue.');
        console.log('⚠️ Error keyValue:', duplicateKeyValue);
        console.log('💡 Recommendation: Run the fix-payment-index.js script to clean up old indexes.');
        
        // Try to clean up orphaned payments with null orderId/paymentId
        // Only proceed if student is defined
        if (student) {
          try {
            const cleanupResult = await Payment.deleteMany({
              $or: [
                { razorpayOrderId: null },
                { razorpayOrderId: { $exists: false } },
                { orderId: null },
                { orderId: { $exists: true, $eq: null } },
                { paymentId: null },
                { paymentId: { $exists: true, $eq: null } }
              ],
              status: 'pending',
              uniqueId: student.uniqueId,
              createdAt: { $lt: new Date(Date.now() - 60 * 60 * 1000) } // Older than 1 hour
            });
            console.log(`✅ Cleaned up ${cleanupResult.deletedCount} orphaned payment(s) for this student`);
            
            // Now try to save again (only if we have all required variables)
            if (orderId && planAmount !== undefined && selectedPlanType && orderOptions) {
              try {
                const retryPayment = new Payment({
                  studentId: student.userId,
                  uniqueId: student.uniqueId,
                  razorpayOrderId: orderId,
                  amount: planAmount,
                  currency: 'INR',
                  planType: selectedPlanType,
                  planAmount,
                  status: 'pending',
                  paymentFor: 'learning_path_save',
                  learningPathId: learningPathId || null,
                  metadata: {
                    receipt: orderOptions.receipt,
                    createdAt: new Date()
                  }
                });
                await retryPayment.save();
                console.log('✅ Payment saved successfully after cleanup');
                
                return NextResponse.json({
                  success: true,
                  orderId: orderId,
                  amount: planAmount,
                  currency: 'INR',
                  keyId: RAZORPAY_KEY_ID,
                  paymentId: retryPayment._id.toString()
                });
              } catch (retryError: any) {
                console.error('❌ Retry save failed:', retryError);
                // Continue to return error
              }
            }
          } catch (cleanupError) {
            console.error('Error cleaning up orphaned payments:', cleanupError);
          }
        }
      }
      
      // Try to find existing payment by orderId
      if (duplicateOrderId && duplicateOrderId !== null) {
        const existingPayment = await Payment.findOne({ 
          razorpayOrderId: duplicateOrderId 
        });
        
        if (existingPayment) {
          console.log('✅ Found existing payment, returning it:', existingPayment._id);
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
          createdAt: { $lt: new Date(Date.now() - 60 * 60 * 1000) } // Older than 1 hour
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
          error: 'Payment order creation failed',
          details: 'A payment record with this order ID already exists. Please try again in a moment.',
          retryable: true
        },
        { status: 500 }
      );
    }
    
    // Handle Razorpay API errors
    if (error instanceof Error) {
      const errorMessage = error.message;
      
      // Check for specific Razorpay errors
      if (errorMessage.includes('Razorpay') || errorMessage.includes('razorpay')) {
        return NextResponse.json(
          { 
            error: 'Payment gateway error',
            details: errorMessage.includes('credentials') 
              ? 'Payment gateway is not configured. Please contact support.'
              : errorMessage
          },
          { status: 500 }
        );
      }
      
      return NextResponse.json(
        { 
          error: 'Failed to create payment order',
          details: errorMessage
        },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: 'An unexpected error occurred. Please try again.'
      },
      { status: 500 }
    );
  }
}
