import mongoose from 'mongoose';

export interface IInvitation extends mongoose.Document {
  _id: string;
  organizationId: string;
  branchId?: string;
  invitedBy: string;
  inviteType: 'teacher' | 'parent';
  email: string;
  name: string;
  token: string;
  status: 'pending' | 'accepted' | 'expired' | 'cancelled';
  expiresAt: Date;
  acceptedAt?: Date;
  acceptedBy?: string;
  metadata: {
    subjectSpecialization?: string;
    experienceYears?: number;
    gradeLevels?: string[];
    subjects?: string[];
    studentId?: string;
    studentName?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const invitationSchema = new mongoose.Schema<IInvitation>({
  organizationId: {
    type: String,
    required: [true, 'Organization ID is required'],
    ref: 'Organization'
  },
  branchId: {
    type: String,
    ref: 'Branch'
  },
  invitedBy: {
    type: String,
    required: [true, 'Invited by user ID is required'],
    ref: 'User'
  },
  inviteType: {
    type: String,
    required: [true, 'Invite type is required'],
    enum: ['teacher', 'parent'],
    default: 'teacher'
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true
  },
  token: {
    type: String,
    required: [true, 'Token is required'],
    unique: true
    // Note: unique: true automatically creates an index, so no need for separate index
  },
  status: {
    type: String,
    required: [true, 'Status is required'],
    enum: ['pending', 'accepted', 'expired', 'cancelled'],
    default: 'pending'
  },
  expiresAt: {
    type: Date,
    required: [true, 'Expiration date is required'],
    default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days from now
  },
  acceptedAt: {
    type: Date
  },
  acceptedBy: {
    type: String,
    ref: 'User'
  },
  metadata: {
    subjectSpecialization: { type: String },
    experienceYears: { type: Number },
    gradeLevels: [{ type: String }],
    subjects: [{ type: String }],
    studentId: { type: String },
    studentName: { type: String }
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
invitationSchema.index({ email: 1 });
// Note: token already has an index from unique: true
invitationSchema.index({ organizationId: 1 });
invitationSchema.index({ status: 1 });
// Auto-expire invitations (this also creates the index for expiresAt)
invitationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default (mongoose.models && mongoose.models.Invitation) || mongoose.model<IInvitation>('Invitation', invitationSchema);
