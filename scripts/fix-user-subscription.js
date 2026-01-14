/**
 * Script to fix a specific user's subscription based on their payment
 * Usage: node scripts/fix-user-subscription.js <uniqueId> [subscriptionId]
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

async function fixUserSubscription(uniqueId, subscriptionId) {
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
      console.log('Usage: node scripts/fix-user-subscription.js <uniqueId> [subscriptionId]');
      process.exit(1);
    }

    // Find the subscription
    let subscription;
    if (subscriptionId) {
      subscription = await Subscription.findById(subscriptionId);
    } else {
      // Find most recent active subscription
      subscription = await Subscription.findOne({
        uniqueId: uniqueId,
        isActive: true
      }).sort({ createdAt: -1 });
    }

    if (!subscription) {
      console.error('❌ Subscription not found');
      await mongoose.disconnect();
      process.exit(1);
    }

    console.log('\n📊 Current Subscription:');
    console.log(`  ID: ${subscription._id}`);
    console.log(`  Plan Type: ${subscription.planType}`);
    console.log(`  Plan Amount: ₹${subscription.planAmount}`);
    console.log(`  Learning Path ID: ${subscription.learningPathId || 'null (global)'}`);
    console.log(`  Daily Chat Limit: ${subscription.dailyChatLimit}`);
    console.log(`  Monthly MCQ Limit: ${subscription.monthlyMcqLimit}`);

    // Find the payment associated with this subscription
    const payment = await Payment.findById(subscription.paymentId);
    
    if (payment) {
      console.log('\n💳 Associated Payment:');
      console.log(`  Amount Paid: ₹${payment.amount}`);
      console.log(`  Plan Amount: ₹${payment.planAmount}`);
      console.log(`  Plan Type: ${payment.planType}`);
      console.log(`  Status: ${payment.status}`);
      
      // Determine correct planType from actual amount paid (use amount field as source of truth)
      const actualAmountPaid = payment.amount || payment.planAmount;
      const correctPlanType = actualAmountPaid === 199 ? 'premium' : 'basic';
      const correctPlanAmount = actualAmountPaid;
      
      if (subscription.planType !== correctPlanType || subscription.planAmount !== correctPlanAmount) {
        console.log(`\n🔧 Fixing subscription:`);
        console.log(`  Current: ${subscription.planType} (₹${subscription.planAmount})`);
        console.log(`  Correct: ${correctPlanType} (₹${correctPlanAmount})`);
        
        subscription.planType = correctPlanType;
        subscription.planAmount = correctPlanAmount;
        subscription.dailyChatLimit = correctPlanType === 'basic' ? 3 : 5;
        subscription.monthlyMcqLimit = correctPlanType === 'basic' ? 3 : 5;
        
        await subscription.save();
        
        console.log(`\n✅ Subscription fixed!`);
        console.log(`  New Plan Type: ${subscription.planType}`);
        console.log(`  New Plan Amount: ₹${subscription.planAmount}`);
        console.log(`  Daily Chat Limit: ${subscription.dailyChatLimit}`);
        console.log(`  Monthly MCQ Limit: ${subscription.monthlyMcqLimit}`);
      } else {
        console.log('\n✅ Subscription is already correct');
      }
    } else {
      // Check all payments for this user to find the ₹199 payment
      const allPayments = await Payment.find({
        uniqueId: uniqueId,
        status: 'completed'
      }).sort({ completedAt: -1 });
      
      console.log(`\n💳 Found ${allPayments.length} completed payment(s)`);
      
      // Find ₹199 payment (check both amount and planAmount fields)
      const premiumPayment = allPayments.find(p => {
        const actualAmount = p.amount || p.planAmount;
        return actualAmount === 199;
      });
      
      if (premiumPayment) {
        console.log(`\n💰 Found ₹199 payment:`);
        console.log(`  Payment ID: ${premiumPayment._id}`);
        console.log(`  Amount: ₹${premiumPayment.amount}`);
        console.log(`  Plan Amount: ₹${premiumPayment.planAmount}`);
        console.log(`  Plan Type: ${premiumPayment.planType}`);
        console.log(`  Completed At: ${premiumPayment.completedAt}`);
        
        // Fix subscription based on payment
        if (subscription.planType !== 'premium' || subscription.planAmount !== 199) {
          console.log(`\n🔧 Fixing subscription based on ₹199 payment:`);
          
          subscription.planType = 'premium';
          subscription.planAmount = 199;
          subscription.dailyChatLimit = 5;
          subscription.monthlyMcqLimit = 5;
          subscription.paymentId = premiumPayment._id;
          
          await subscription.save();
          
          console.log(`\n✅ Subscription fixed!`);
          console.log(`  New Plan Type: ${subscription.planType}`);
          console.log(`  New Plan Amount: ₹${subscription.planAmount}`);
          console.log(`  Daily Chat Limit: ${subscription.dailyChatLimit}`);
          console.log(`  Monthly MCQ Limit: ${subscription.monthlyMcqLimit}`);
        } else {
          console.log('\n✅ Subscription already has premium plan');
        }
      } else {
        console.log('\n⚠️ No ₹199 payment found. Cannot auto-fix subscription.');
        console.log('Please verify the payment amount manually.');
      }
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
const subscriptionId = process.argv[3];
fixUserSubscription(uniqueId, subscriptionId);
