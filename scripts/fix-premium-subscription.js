/**
 * Script to fix subscription for user who paid ₹199
 * This will find the ₹199 payment and update the subscription to premium
 * Usage: node scripts/fix-premium-subscription.js <uniqueId>
 */

const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });

const subscriptionSchema = new mongoose.Schema({
  studentId: String,
  uniqueId: String,
  learningPathId: String,
  planType: String,
  planAmount: Number,
  startDate: Date,
  expiryDate: Date,
  isActive: Boolean,
  paymentId: mongoose.Schema.Types.ObjectId,
  dailyChatLimit: Number,
  monthlyMcqLimit: Number,
  learningPathsSaved: Number,
  maxLearningPathsPerPayment: Number,
  createdAt: Date,
  updatedAt: Date
}, { collection: 'subscriptions' });

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

const Subscription = mongoose.models.Subscription || mongoose.model('Subscription', subscriptionSchema);
const Payment = mongoose.models.Payment || mongoose.model('Payment', paymentSchema);

async function fixPremiumSubscription(uniqueId) {
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      console.error('❌ MONGODB_URI not found');
      process.exit(1);
    }

    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB\n');

    if (!uniqueId) {
      console.error('❌ Please provide uniqueId');
      process.exit(1);
    }

    // Find all completed payments for ₹199
    const payments = await Payment.find({
      uniqueId: uniqueId,
      status: 'completed',
      $or: [
        { amount: 199 },
        { planAmount: 199 }
      ]
    }).sort({ completedAt: -1 });

    console.log(`💰 Found ${payments.length} ₹199 payment(s)\n`);

    if (payments.length === 0) {
      console.log('❌ No ₹199 payments found. Checking all payments...\n');
      const allPayments = await Payment.find({ uniqueId: uniqueId, status: 'completed' }).sort({ completedAt: -1 });
      allPayments.forEach(p => {
        console.log(`  Payment: ₹${p.amount || p.planAmount}, Type: ${p.planType}, Status: ${p.status}`);
      });
      await mongoose.disconnect();
      process.exit(0);
    }

    // Use the most recent ₹199 payment
    const premiumPayment = payments[0];
    console.log(`📋 Using payment:`, {
      id: premiumPayment._id,
      amount: premiumPayment.amount,
      planAmount: premiumPayment.planAmount,
      planType: premiumPayment.planType,
      status: premiumPayment.status,
      completedAt: premiumPayment.completedAt
    });

    // Find subscription linked to this payment or most recent active subscription
    let subscription = await Subscription.findOne({
      uniqueId: uniqueId,
      paymentId: premiumPayment._id
    });

    if (!subscription) {
      // Find most recent active subscription
      subscription = await Subscription.findOne({
        uniqueId: uniqueId,
        isActive: true
      }).sort({ createdAt: -1 });
    }

    if (!subscription) {
      console.log('\n❌ No subscription found to update');
      await mongoose.disconnect();
      process.exit(1);
    }

    console.log(`\n📊 Current subscription:`, {
      id: subscription._id,
      planType: subscription.planType,
      planAmount: subscription.planAmount,
      dailyChatLimit: subscription.dailyChatLimit,
      monthlyMcqLimit: subscription.monthlyMcqLimit
    });

    // Update subscription to premium
    if (subscription.planType !== 'premium' || subscription.planAmount !== 199) {
      console.log(`\n🔧 Updating subscription to premium...`);
      
      subscription.planType = 'premium';
      subscription.planAmount = 199;
      subscription.dailyChatLimit = 5;
      subscription.monthlyMcqLimit = 5;
      subscription.paymentId = premiumPayment._id;
      
      await subscription.save();
      
      console.log(`\n✅ Subscription updated!`, {
        planType: subscription.planType,
        planAmount: subscription.planAmount,
        dailyChatLimit: subscription.dailyChatLimit,
        monthlyMcqLimit: subscription.monthlyMcqLimit
      });
    } else {
      console.log(`\n✅ Subscription is already premium`);
    }

    // Also fix the payment record if needed
    if (premiumPayment.planType !== 'premium' || premiumPayment.planAmount !== 199) {
      console.log(`\n🔧 Fixing payment record...`);
      premiumPayment.planType = 'premium';
      premiumPayment.planAmount = 199;
      await premiumPayment.save();
      console.log(`✅ Payment record fixed`);
    }

    await mongoose.disconnect();
    console.log('\n✅ Done!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

const uniqueId = process.argv[2];
if (!uniqueId) {
  console.error('Usage: node scripts/fix-premium-subscription.js <uniqueId>');
  process.exit(1);
}
fixPremiumSubscription(uniqueId);
