/**
 * Script to check all subscriptions for a user
 * Usage: node scripts/check-user-subscriptions.js <uniqueId>
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

async function checkUserSubscriptions(uniqueId) {
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
      console.log('Usage: node scripts/check-user-subscriptions.js <uniqueId>');
      process.exit(1);
    }

    // Find all subscriptions for this user
    const subscriptions = await Subscription.find({ uniqueId: uniqueId });
    console.log(`\n📊 Found ${subscriptions.length} subscription(s) for user: ${uniqueId}\n`);

    if (subscriptions.length === 0) {
      console.log('❌ No subscriptions found for this user');
      await mongoose.disconnect();
      process.exit(0);
    }

    subscriptions.forEach((sub, index) => {
      console.log(`\n--- Subscription ${index + 1} ---`);
      console.log(`ID: ${sub._id}`);
      console.log(`Plan Type: ${sub.planType}`);
      console.log(`Plan Amount: ₹${sub.planAmount}`);
      console.log(`Learning Path ID: ${sub.learningPathId || 'null (global)'}`);
      console.log(`Is Active: ${sub.isActive}`);
      console.log(`Start Date: ${sub.startDate}`);
      console.log(`Expiry Date: ${sub.expiryDate}`);
      console.log(`Expired: ${new Date() > sub.expiryDate ? 'YES' : 'NO'}`);
      console.log(`Daily Chat Limit: ${sub.dailyChatLimit}`);
      console.log(`Monthly MCQ Limit: ${sub.monthlyMcqLimit}`);
      console.log(`Created At: ${sub.createdAt}`);
    });

    // Check for active subscriptions
    const activeSubscriptions = subscriptions.filter(s => {
      const now = new Date();
      return s.isActive && s.expiryDate > now;
    });

    console.log(`\n✅ Active subscriptions: ${activeSubscriptions.length}`);
    if (activeSubscriptions.length > 0) {
      activeSubscriptions.forEach(sub => {
        console.log(`  - ${sub.planType} plan (₹${sub.planAmount}) for learning path: ${sub.learningPathId || 'global'}`);
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
checkUserSubscriptions(uniqueId);
