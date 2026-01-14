import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema({
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
  razorpayOrderId: {
    type: String,
    required: [true, 'Razorpay order ID is required'],
    unique: true,
    index: true,
    validate: {
      validator: function(v: string) {
        return v != null && v.trim().length > 0;
      },
      message: 'Razorpay order ID cannot be empty'
    }
  },
  razorpayPaymentId: {
    type: String,
    unique: true,
    sparse: true
  },
  razorpaySignature: {
    type: String
  },
  amount: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    default: 'INR'
  },
  planType: {
    type: String,
    enum: ['basic', 'premium'],
    required: true
  },
  planAmount: {
    type: Number,
    required: true // ₹99 for basic, ₹199 for premium
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded'],
    default: 'pending',
    index: true
  },
  paymentFor: {
    type: String,
    enum: ['career_access', 'learning_path_save'],
    required: true
  },
  learningPathId: {
    type: String, // Only set when paymentFor is 'learning_path_save'
    default: null
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  completedAt: {
    type: Date
  }
});

// Index for efficient queries
paymentSchema.index({ studentId: 1, status: 1 });
paymentSchema.index({ uniqueId: 1, status: 1 });
paymentSchema.index({ createdAt: -1 });

export default (mongoose.models && mongoose.models.Payment) || mongoose.model('Payment', paymentSchema);
