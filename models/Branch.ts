import mongoose from 'mongoose';

export interface IBranch extends mongoose.Document {
  _id: string;
  organizationId: string;
  branchName: string;
  branchCode: string;
  address: string;
  city: string;
  state: string;
  country: string;
  phoneNumber: string;
  email: string;
  principalName: string;
  principalEmail: string;
  principalPhone: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const branchSchema = new mongoose.Schema<IBranch>({
  organizationId: {
    type: String,
    required: [true, 'Organization ID is required'],
    ref: 'Organization'
  },
  branchName: {
    type: String,
    required: [true, 'Branch name is required'],
    trim: true,
    maxlength: [100, 'Branch name cannot be more than 100 characters']
  },
  branchCode: {
    type: String,
    required: [true, 'Branch code is required'],
    unique: true,
    trim: true,
    uppercase: true,
    maxlength: [10, 'Branch code cannot be more than 10 characters']
  },
  address: {
    type: String,
    required: [true, 'Address is required'],
    trim: true
  },
  city: {
    type: String,
    required: [true, 'City is required'],
    trim: true
  },
  state: {
    type: String,
    required: [true, 'State is required'],
    trim: true
  },
  country: {
    type: String,
    required: [true, 'Country is required'],
    trim: true,
    default: 'India'
  },
  phoneNumber: {
    type: String,
    required: [true, 'Phone number is required'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  principalName: {
    type: String,
    required: [true, 'Principal name is required'],
    trim: true
  },
  principalEmail: {
    type: String,
    required: [true, 'Principal email is required'],
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  principalPhone: {
    type: String,
    required: [true, 'Principal phone is required'],
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
branchSchema.index({ organizationId: 1 });
// Note: branchCode already has an index from unique: true
branchSchema.index({ isActive: 1 });

export default (mongoose.models && mongoose.models.Branch) || mongoose.model<IBranch>('Branch', branchSchema);
