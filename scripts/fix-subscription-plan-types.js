/**
 * Migration script to fix subscription plan types based on planAmount
 * Run this to correct any subscriptions that have incorrect planType
 * 
 * Usage: node scripts/fix-subscription-plan-types.js
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

const Subscription = mongoose.models.Subscription || mongoose.model('Subscription', subscriptionSchema);

async function fixSubscriptionPlanTypes() {
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      console.error('❌ MONGODB_URI not found in environment variables');
      process.exit(1);
    }

    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    // Find all active subscriptions
    const subscriptions = await Subscription.find({ isActive: true });
    console.log(`📊 Found ${subscriptions.length} active subscriptions`);

    let fixedCount = 0;
    let checkedCount = 0;

    for (const subscription of subscriptions) {
      checkedCount++;
      const correctPlanType = subscription.planAmount === 199 ? 'premium' : 'basic';
      
      if (subscription.planType !== correctPlanType) {
        console.log(`🔧 Fixing subscription ${subscription._id}:`);
        console.log(`   Current: planType=${subscription.planType}, planAmount=${subscription.planAmount}`);
        console.log(`   Correct: planType=${correctPlanType}`);
        
        subscription.planType = correctPlanType;
        subscription.dailyChatLimit = correctPlanType === 'basic' ? 3 : 5;
        subscription.monthlyMcqLimit = correctPlanType === 'basic' ? 3 : 5;
        await subscription.save();
        
        fixedCount++;
        console.log(`   ✅ Fixed!`);
      }
    }

    console.log(`\n✅ Migration complete:`);
    console.log(`   Checked: ${checkedCount} subscriptions`);
    console.log(`   Fixed: ${fixedCount} subscriptions`);

    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

fixSubscriptionPlanTypes();
