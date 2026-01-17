import mongoose from 'mongoose';

const usageTrackingSchema = new mongoose.Schema({
  studentId: {
    type: String,
    required: true
    // Indexed via composite index below
  },
  uniqueId: {
    type: String,
    required: true
    // Indexed via composite indexes below
  },
  subscriptionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subscription',
    required: true
    // Indexed via composite index below
  },
  // Daily chat usage tracking
  dailyChatUsage: {
    type: Map,
    of: {
      chapterId: String,
      count: {
        type: Number,
        default: 0
      },
      date: {
        type: Date,
        default: Date.now
      }
    },
    default: {}
  },
  // Monthly MCQ usage tracking per chapter
  monthlyMcqUsage: {
    type: Map,
    of: {
      chapterId: String,
      year: {
        type: Number,
        required: true
      },
      month: {
        type: Number,
        required: true
      },
      count: {
        type: Number,
        default: 0
      },
      lastReset: {
        type: Date,
        default: Date.now
      }
    },
    default: {}
  },
  // Learning paths saved count
  learningPathsSaved: {
    type: Number,
    default: 0
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
});

// Compound index for efficient queries
usageTrackingSchema.index({ uniqueId: 1, subscriptionId: 1 });
usageTrackingSchema.index({ studentId: 1, uniqueId: 1 });

export default (mongoose.models && mongoose.models.UsageTracking) || mongoose.model('UsageTracking', usageTrackingSchema);
