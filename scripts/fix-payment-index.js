const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI not found in environment variables');
  process.exit(1);
}

async function fixPaymentIndex() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const db = mongoose.connection.db;
    const collection = db.collection('payments');

    // List all indexes
    const indexes = await collection.indexes();
    console.log('📋 Current indexes:', indexes);

    // Check for old 'orderId' index
    const orderIdIndex = indexes.find(idx => 
      idx.name === 'orderId_1' || 
      (idx.key && idx.key.orderId)
    );

    if (orderIdIndex) {
      console.log('⚠️ Found old orderId index:', orderIdIndex);
      console.log('🗑️ Dropping old orderId index...');
      try {
        await collection.dropIndex('orderId_1');
        console.log('✅ Dropped orderId_1 index');
      } catch (err) {
        if (err.codeName === 'IndexNotFound') {
          console.log('ℹ️ Index orderId_1 not found (may have been dropped already)');
        } else {
          console.error('❌ Error dropping index:', err);
        }
      }
    } else {
      console.log('✅ No old orderId index found');
    }

    // Check for old 'paymentId' index (should be razorpayPaymentId)
    const paymentIdIndex = indexes.find(idx => 
      idx.name === 'paymentId_1' || 
      (idx.key && idx.key.paymentId && !idx.key.razorpayPaymentId)
    );

    if (paymentIdIndex) {
      console.log('⚠️ Found old paymentId index:', paymentIdIndex);
      console.log('🗑️ Dropping old paymentId index...');
      try {
        await collection.dropIndex('paymentId_1');
        console.log('✅ Dropped paymentId_1 index');
      } catch (err) {
        if (err.codeName === 'IndexNotFound') {
          console.log('ℹ️ Index paymentId_1 not found (may have been dropped already)');
        } else {
          console.error('❌ Error dropping index:', err);
        }
      }
    } else {
      console.log('✅ No old paymentId index found');
    }

    // Check for orphaned payments with null orderId or paymentId
    const orphanedCount = await collection.countDocuments({
      $or: [
        { orderId: null },
        { orderId: { $exists: true, $eq: null } },
        { razorpayOrderId: null },
        { razorpayOrderId: { $exists: false } },
        { paymentId: null },
        { paymentId: { $exists: true, $eq: null } }
      ],
      status: 'pending'
    });

    if (orphanedCount > 0) {
      console.log(`⚠️ Found ${orphanedCount} orphaned payment(s) with null orderId`);
      console.log('🗑️ Cleaning up orphaned payments...');
      
      const result = await collection.deleteMany({
        $or: [
          { orderId: null },
          { orderId: { $exists: true, $eq: null } },
          { razorpayOrderId: null },
          { razorpayOrderId: { $exists: false } },
          { paymentId: null },
          { paymentId: { $exists: true, $eq: null } }
        ],
        status: 'pending',
        createdAt: { $lt: new Date(Date.now() - 60 * 60 * 1000) } // Older than 1 hour
      });
      
      console.log(`✅ Cleaned up ${result.deletedCount} orphaned payment(s)`);
    } else {
      console.log('✅ No orphaned payments found');
    }

    // Verify razorpayOrderId index exists
    const razorpayOrderIdIndex = indexes.find(idx => 
      idx.name === 'razorpayOrderId_1' || 
      (idx.key && idx.key.razorpayOrderId)
    );

    if (!razorpayOrderIdIndex) {
      console.log('⚠️ razorpayOrderId index not found. Creating it...');
      await collection.createIndex({ razorpayOrderId: 1 }, { unique: true });
      console.log('✅ Created razorpayOrderId index');
    } else {
      console.log('✅ razorpayOrderId index exists');
    }

    // List indexes again to confirm
    const finalIndexes = await collection.indexes();
    console.log('📋 Final indexes:', finalIndexes.map(idx => ({
      name: idx.name,
      key: idx.key
    })));

    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

fixPaymentIndex();
