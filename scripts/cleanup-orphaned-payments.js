/**
 * Cleanup script to remove orphaned payment records with null or invalid orderIds
 * Run this script to clean up any payment records that were created without valid Razorpay order IDs
 * 
 * Usage: node scripts/cleanup-orphaned-payments.js
 */

require('dotenv').config({ path: '.env.local' });
const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGODB_DIRECT_URI || process.env.MONGODB_SIMPLE_URI;

const paymentSchema = new mongoose.Schema({
  studentId: String,
  uniqueId: String,
  razorpayOrderId: String,
  razorpayPaymentId: String,
  amount: Number,
  currency: String,
  planType: String,
  planAmount: Number,
  status: String,
  paymentFor: String,
  learningPathId: String,
  metadata: mongoose.Schema.Types.Mixed,
  createdAt: Date,
  completedAt: Date
}, { collection: 'payments' });

const Payment = mongoose.model('Payment', paymentSchema);

async function cleanupOrphanedPayments() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find all payment records with null, undefined, or empty orderId
    const orphanedPayments = await Payment.find({
      $or: [
        { razorpayOrderId: null },
        { razorpayOrderId: { $exists: false } },
        { razorpayOrderId: '' },
        { razorpayOrderId: { $type: 'null' } }
      ],
      status: 'pending'
    });

    console.log(`📊 Found ${orphanedPayments.length} orphaned payment records`);

    if (orphanedPayments.length > 0) {
      console.log('\n📋 Orphaned payment records:');
      orphanedPayments.forEach((payment, index) => {
        console.log(`${index + 1}. Payment ID: ${payment._id}, Student: ${payment.uniqueId}, Created: ${payment.createdAt}`);
      });

      // Delete orphaned payments older than 1 hour
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      const deleteResult = await Payment.deleteMany({
        $or: [
          { razorpayOrderId: null },
          { razorpayOrderId: { $exists: false } },
          { razorpayOrderId: '' }
        ],
        status: 'pending',
        createdAt: { $lt: oneHourAgo }
      });

      console.log(`\n✅ Deleted ${deleteResult.deletedCount} orphaned payment records older than 1 hour`);

      // For recent orphaned payments (less than 1 hour old), try to update them if possible
      const recentOrphaned = orphanedPayments.filter(p => p.createdAt > oneHourAgo);
      if (recentOrphaned.length > 0) {
        console.log(`\n⚠️  Found ${recentOrphaned.length} recent orphaned payments (less than 1 hour old)`);
        console.log('   These will be cleaned up automatically after 1 hour');
      }
    } else {
      console.log('✅ No orphaned payment records found');
    }

    // Also check for duplicate orderIds
    const duplicates = await Payment.aggregate([
      {
        $match: {
          razorpayOrderId: { $ne: null, $exists: true }
        }
      },
      {
        $group: {
          _id: '$razorpayOrderId',
          count: { $sum: 1 },
          ids: { $push: '$_id' }
        }
      },
      {
        $match: {
          count: { $gt: 1 }
        }
      }
    ]);

    if (duplicates.length > 0) {
      console.log(`\n⚠️  Found ${duplicates.length} duplicate orderIds:`);
      duplicates.forEach(dup => {
        console.log(`   OrderId: ${dup._id}, Count: ${dup.count}`);
      });
    } else {
      console.log('\n✅ No duplicate orderIds found');
    }

    console.log('\n✅ Cleanup completed');
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run cleanup
cleanupOrphanedPayments();
