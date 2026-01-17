import mongoose from 'mongoose';
import { UserRole } from './User';

export type NotificationType = 
  | 'test_assigned' 
  | 'test_reminder'
  | 'announcement'
  | 'reminder'
  | 'meeting'
  | 'performance_update'
  | 'incomplete_module'
  | 'low_activity'
  | 'test_result'
  | 'general';

export type NotificationPriority = 'low' | 'normal' | 'high' | 'urgent';

export interface INotification extends mongoose.Document {
  recipientId: string; // User ID of the recipient
  recipientRole: UserRole; // Role of the recipient
  senderId: string; // User ID of the sender
  senderRole: UserRole; // Role of the sender
  senderName: string; // Name of the sender for display
  type: NotificationType;
  priority: NotificationPriority;
  title: string;
  message: string;
  read: boolean;
  readAt?: Date;
  metadata?: {
    testId?: string;
    studentId?: string;
    organizationId?: string;
    teacherId?: string;
    moduleId?: string;
    meetingDate?: Date;
    meetingLink?: string;
    [key: string]: any; // Allow additional metadata
  };
  targetAudience?: {
    role?: UserRole;
    organizationId?: string;
    teacherId?: string;
    studentIds?: string[];
    parentIds?: string[];
  };
  createdAt: Date;
  updatedAt: Date;
}

const notificationSchema = new mongoose.Schema<INotification>({
  recipientId: {
    type: String,
    required: true,
    index: true
  },
  recipientRole: {
    type: String,
    enum: ['student', 'teacher', 'parent', 'organization', 'admin', 'platform_super_admin'],
    required: true,
    index: true
  },
  senderId: {
    type: String,
    required: true,
    index: true
  },
  senderRole: {
    type: String,
    enum: ['student', 'teacher', 'parent', 'organization', 'admin', 'platform_super_admin'],
    required: true
  },
  senderName: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: [
      'test_assigned',
      'test_reminder',
      'announcement',
      'reminder',
      'meeting',
      'performance_update',
      'incomplete_module',
      'low_activity',
      'test_result',
      'general'
    ],
    required: true,
    index: true
  },
  priority: {
    type: String,
    enum: ['low', 'normal', 'high', 'urgent'],
    default: 'normal',
    index: true
  },
  title: {
    type: String,
    required: true,
    maxlength: 200
  },
  message: {
    type: String,
    required: true,
    maxlength: 1000
  },
  read: {
    type: Boolean,
    default: false,
    index: true
  },
  readAt: {
    type: Date
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  targetAudience: {
    role: {
      type: String,
      enum: ['student', 'teacher', 'parent', 'organization', 'admin', 'platform_super_admin']
    },
    organizationId: String,
    teacherId: String,
    studentIds: [String],
    parentIds: [String]
  }
}, {
  timestamps: true
});

// Compound indexes for efficient queries
notificationSchema.index({ recipientId: 1, read: 1 });
notificationSchema.index({ recipientId: 1, createdAt: -1 });
notificationSchema.index({ recipientRole: 1, read: 1 });
notificationSchema.index({ type: 1, createdAt: -1 });
notificationSchema.index({ 'targetAudience.organizationId': 1, recipientRole: 1 });

export default (mongoose.models && mongoose.models.Notification) || mongoose.model<INotification>('Notification', notificationSchema);
