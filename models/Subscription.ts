import mongoose from 'mongoose';

const subscriptionSchema = new mongoose.Schema({
  studentId: {
    type: String,
    required: true,
    index: true
  },
  uniqueId: {
    type: String,
    required: true,
    index: true
  },
  learningPathId: {
    type: String,
    default: null, // null for global subscription, specific ID for per-learning-path subscription
    index: true
  },
  planType: {
    type: String,
    enum: ['basic', 'premium'],
    required: true
  },
  planAmount: {
    type: Number,
    required: true
  },
  startDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  expiryDate: {
    type: Date,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  paymentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Payment',
    required: true
  },
  // Usage limits based on plan
  // Basic: 3 chats/day/chapter, 3 MCQs/month
  // Premium: 5 chats/day/chapter, 5 MCQs/month
  dailyChatLimit: {
    type: Number,
    required: true
  },
  monthlyMcqLimit: {
    type: Number,
    required: true
  },
  // Learning path save limit (1 per payment)
  learningPathsSaved: {
    type: Number,
    default: 0
  },
  maxLearningPathsPerPayment: {
    type: Number,
    default: 1
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update updatedAt before saving
subscriptionSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Index for efficient queries
subscriptionSchema.index({ expiryDate: 1, isActive: 1 });
subscriptionSchema.index({ createdAt: -1 });
subscriptionSchema.index({ uniqueId: 1, learningPathId: 1 });
// Composite unique index: one subscription per user per learning path
// Note: MongoDB treats null as a value, so this allows one global subscription (null) and one per learning path
subscriptionSchema.index({ uniqueId: 1, learningPathId: 1 }, { 
  unique: true,
  partialFilterExpression: { isActive: true }
});

export default (mongoose.models && mongoose.models.Subscription) || mongoose.model('Subscription', subscriptionSchema);
