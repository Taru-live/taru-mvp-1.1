/**
 * Script to check all payments for a user
 * Usage: node scripts/check-user-payments.js <uniqueId>
 */

const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });

const paymentSchema = new mongoose.Schema({
  studentId: String,
  uniqueId: String,
  razorpayOrderId: String,
  razorpayPaymentId: String,
  amount: Number,
  planType: String,
  planAmount: Number,
  status: String,
  paymentFor: String,
  learningPathId: String,
  createdAt: Date,
  completedAt: Date
}, { collection: 'payments' });

const Payment = mongoose.models.Payment || mongoose.model('Payment', paymentSchema);

async function checkUserPayments(uniqueId) {
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      console.error('❌ MONGODB_URI not found in environment variables');
      process.exit(1);
    }

    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    if (!uniqueId) {
      console.error('❌ Please provide uniqueId as argument');
      console.log('Usage: node scripts/check-user-payments.js <uniqueId>');
      process.exit(1);
    }

    // Find all payments for this user
    const payments = await Payment.find({ uniqueId: uniqueId }).sort({ createdAt: -1 });
    console.log(`\n📊 Found ${payments.length} payment(s) for user: ${uniqueId}\n`);

    if (payments.length === 0) {
      console.log('❌ No payments found for this user');
      await mongoose.disconnect();
      process.exit(0);
    }

    payments.forEach((payment, index) => {
      console.log(`\n--- Payment ${index + 1} ---`);
      console.log(`ID: ${payment._id}`);
      console.log(`Amount Paid: ₹${payment.amount}`);
      console.log(`Plan Amount: ₹${payment.planAmount}`);
      console.log(`Plan Type: ${payment.planType}`);
      console.log(`Status: ${payment.status}`);
      console.log(`Payment For: ${payment.paymentFor}`);
      console.log(`Learning Path ID: ${payment.learningPathId || 'null'}`);
      console.log(`Razorpay Order ID: ${payment.razorpayOrderId}`);
      console.log(`Razorpay Payment ID: ${payment.razorpayPaymentId || 'N/A'}`);
      console.log(`Created At: ${payment.createdAt}`);
      console.log(`Completed At: ${payment.completedAt || 'N/A'}`);
      
      // Check if amount matches planAmount
      if (payment.amount !== payment.planAmount) {
        console.log(`⚠️ MISMATCH: amount (₹${payment.amount}) ≠ planAmount (₹${payment.planAmount})`);
      }
      
      // Check if planType matches amount
      const expectedPlanType = payment.amount === 199 ? 'premium' : 'basic';
      if (payment.planType !== expectedPlanType) {
        console.log(`⚠️ MISMATCH: planType (${payment.planType}) should be ${expectedPlanType} for ₹${payment.amount}`);
      }
    });

    // Find ₹199 payments
    const premiumPayments = payments.filter(p => p.amount === 199 || p.planAmount === 199);
    console.log(`\n💰 ₹199 payments: ${premiumPayments.length}`);
    if (premiumPayments.length > 0) {
      premiumPayments.forEach(p => {
        console.log(`  - Payment ${p._id}: ₹${p.amount}, Status: ${p.status}, PlanType: ${p.planType}`);
      });
    }

    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

const uniqueId = process.argv[2];
checkUserPayments(uniqueId);
