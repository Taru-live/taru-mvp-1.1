import connectDB from './mongodb';
import Notification from '@/models/Notification';
import User from '@/models/User';
import Student from '@/models/Student';
import Teacher from '@/models/Teacher';
import Parent from '@/models/Parent';
import { UserRole } from '@/models/User';
import { NotificationType, NotificationPriority } from '@/models/Notification';

interface SendNotificationOptions {
  senderId: string;
  senderRole: UserRole;
  type: NotificationType;
  priority?: NotificationPriority;
  title: string;
  message: string;
  targetAudience: {
    role?: UserRole;
    organizationId?: string;
    teacherId?: string;
    studentIds?: string[];
    parentIds?: string[];
  };
  metadata?: Record<string, any>;
}

/**
 * Send notifications to multiple recipients based on target audience
 * 
 * ROLE-BASED NOTIFICATION RULES:
 * - Teachers and organizations can notify students
 * - Organizations can notify teachers
 * - Teachers and organizations can notify parents
 * 
 * SECURITY: Notifications are scoped by organizationId to ensure
 * cross-organization data leakage is prevented. All recipients must
 * belong to the sender's organization (if sender has an organization).
 * 
 * @param options - Notification options including sender, target audience, and message
 * @returns Promise<number> - Number of notifications sent
 */
export async function sendNotification(options: SendNotificationOptions): Promise<number> {
  await connectDB();

  const {
    senderId,
    senderRole,
    type,
    priority = 'normal',
    title,
    message,
    targetAudience,
    metadata = {}
  } = options;

  // Get sender info
  const sender = await User.findById(senderId);
  if (!sender) {
    throw new Error('Sender not found');
  }

  const senderName = sender.name;
  const senderOrganizationId = sender.organizationId;

  // Determine recipients based on targetAudience
  const recipients: Array<{ userId: string; role: UserRole }> = [];

  if (targetAudience.role === 'student') {
    const studentQuery: any = {};

    if (targetAudience.organizationId) {
      studentQuery.organizationId = targetAudience.organizationId;
    } else if (senderOrganizationId) {
      studentQuery.organizationId = senderOrganizationId;
    }

    if (targetAudience.teacherId) {
      studentQuery.teacherId = targetAudience.teacherId;
    } else if (senderRole === 'teacher') {
      const teacher = await Teacher.findOne({ userId: senderId });
      if (teacher) {
        studentQuery.teacherId = teacher._id.toString();
      }
    }

    if (targetAudience.studentIds && targetAudience.studentIds.length > 0) {
      const students = await Student.find({
        ...studentQuery,
        userId: { $in: targetAudience.studentIds }
      }).select('userId');
      recipients.push(...students.map(s => ({ userId: s.userId, role: 'student' as UserRole })));
    } else {
      const students = await Student.find(studentQuery).select('userId');
      recipients.push(...students.map(s => ({ userId: s.userId, role: 'student' as UserRole })));
    }
  } else if (targetAudience.role === 'teacher') {
    const teacherQuery: any = {};

    if (targetAudience.organizationId) {
      teacherQuery.organizationId = targetAudience.organizationId;
    } else if (senderOrganizationId) {
      teacherQuery.organizationId = senderOrganizationId;
    }

    const teachers = await Teacher.find(teacherQuery).select('userId');
    recipients.push(...teachers.map(t => ({ userId: t.userId, role: 'teacher' as UserRole })));
  } else if (targetAudience.role === 'parent') {
    if (targetAudience.organizationId) {
      const students = await Student.find({ organizationId: targetAudience.organizationId }).select('userId');
      const studentIds = students.map(s => s.userId);
      const parents = await Parent.find({ linkedStudentId: { $in: studentIds } }).select('userId');
      recipients.push(...parents.map(p => ({ userId: p.userId, role: 'parent' as UserRole })));
    } else if (targetAudience.studentIds && targetAudience.studentIds.length > 0) {
      const students = await Student.find({ userId: { $in: targetAudience.studentIds } }).select('userId');
      const studentIds = students.map(s => s.userId);
      const parents = await Parent.find({ linkedStudentId: { $in: studentIds } }).select('userId');
      recipients.push(...parents.map(p => ({ userId: p.userId, role: 'parent' as UserRole })));
    } else if (targetAudience.parentIds && targetAudience.parentIds.length > 0) {
      const parents = await Parent.find({ userId: { $in: targetAudience.parentIds } }).select('userId');
      recipients.push(...parents.map(p => ({ userId: p.userId, role: 'parent' as UserRole })));
    }
  }

  if (recipients.length === 0) {
    return 0;
  }

  // Create notifications for all recipients
  const notifications = recipients.map(recipient => ({
    recipientId: recipient.userId,
    recipientRole: recipient.role,
    senderId,
    senderRole,
    senderName,
    type,
    priority,
    title,
    message,
    read: false,
    metadata: {
      ...metadata,
      organizationId: senderOrganizationId
    },
    targetAudience
  }));

  const createdNotifications = await Notification.insertMany(notifications);
  return createdNotifications.length;
}

/**
 * Send test assignment notification to students
 */
export async function notifyTestAssigned(
  senderId: string,
  senderRole: UserRole,
  testId: string,
  testTitle: string,
  studentIds: string[]
): Promise<number> {
  return sendNotification({
    senderId,
    senderRole,
    type: 'test_assigned',
    priority: 'high',
    title: 'New Test Assigned',
    message: `You have been assigned a new test: ${testTitle}`,
    targetAudience: {
      role: 'student',
      studentIds
    },
    metadata: {
      testId,
      testTitle
    }
  });
}

/**
 * Send test reminder to students
 */
export async function notifyTestReminder(
  senderId: string,
  senderRole: UserRole,
  testId: string,
  testTitle: string,
  studentIds: string[]
): Promise<number> {
  return sendNotification({
    senderId,
    senderRole,
    type: 'test_reminder',
    priority: 'normal',
    title: 'Test Reminder',
    message: `Reminder: You have a pending test: ${testTitle}`,
    targetAudience: {
      role: 'student',
      studentIds
    },
    metadata: {
      testId,
      testTitle
    }
  });
}

/**
 * Send announcement to students
 */
export async function notifyAnnouncementToStudents(
  senderId: string,
  senderRole: UserRole,
  title: string,
  message: string,
  organizationId?: string,
  teacherId?: string,
  studentIds?: string[]
): Promise<number> {
  return sendNotification({
    senderId,
    senderRole,
    type: 'announcement',
    priority: 'normal',
    title,
    message,
    targetAudience: {
      role: 'student',
      organizationId,
      teacherId,
      studentIds
    }
  });
}

/**
 * Send meeting notification to teachers
 */
export async function notifyMeetingToTeachers(
  senderId: string,
  senderRole: UserRole,
  meetingTitle: string,
  meetingDate: Date,
  meetingLink?: string,
  organizationId?: string
): Promise<number> {
  return sendNotification({
    senderId,
    senderRole,
    type: 'meeting',
    priority: 'high',
    title: 'Meeting Scheduled',
    message: `You have a meeting scheduled: ${meetingTitle} on ${meetingDate.toLocaleDateString()}`,
    targetAudience: {
      role: 'teacher',
      organizationId
    },
    metadata: {
      meetingDate,
      meetingLink,
      meetingTitle
    }
  });
}

/**
 * Send performance update to teachers
 */
export async function notifyPerformanceUpdateToTeachers(
  senderId: string,
  senderRole: UserRole,
  title: string,
  message: string,
  organizationId?: string
): Promise<number> {
  return sendNotification({
    senderId,
    senderRole,
    type: 'performance_update',
    priority: 'normal',
    title,
    message,
    targetAudience: {
      role: 'teacher',
      organizationId
    }
  });
}

/**
 * Notify parents about incomplete modules
 */
export async function notifyIncompleteModuleToParents(
  senderId: string,
  senderRole: UserRole,
  studentId: string,
  moduleName: string,
  organizationId?: string
): Promise<number> {
  return sendNotification({
    senderId,
    senderRole,
    type: 'incomplete_module',
    priority: 'normal',
    title: 'Incomplete Module Alert',
    message: `Your child has an incomplete module: ${moduleName}`,
    targetAudience: {
      role: 'parent',
      studentIds: [studentId],
      organizationId
    },
    metadata: {
      studentId,
      moduleName
    }
  });
}

/**
 * Notify parents about low activity
 */
export async function notifyLowActivityToParents(
  senderId: string,
  senderRole: UserRole,
  studentId: string,
  daysInactive: number,
  organizationId?: string
): Promise<number> {
  return sendNotification({
    senderId,
    senderRole,
    type: 'low_activity',
    priority: 'normal',
    title: 'Low Activity Alert',
    message: `Your child has been inactive for ${daysInactive} days. Please encourage them to continue learning.`,
    targetAudience: {
      role: 'parent',
      studentIds: [studentId],
      organizationId
    },
    metadata: {
      studentId,
      daysInactive
    }
  });
}

/**
 * Notify parents about meetings
 */
export async function notifyMeetingToParents(
  senderId: string,
  senderRole: UserRole,
  meetingTitle: string,
  meetingDate: Date,
  studentIds: string[],
  meetingLink?: string,
  organizationId?: string
): Promise<number> {
  return sendNotification({
    senderId,
    senderRole,
    type: 'meeting',
    priority: 'high',
    title: 'Parent-Teacher Meeting',
    message: `You have a parent-teacher meeting scheduled: ${meetingTitle} on ${meetingDate.toLocaleDateString()}`,
    targetAudience: {
      role: 'parent',
      studentIds,
      organizationId
    },
    metadata: {
      meetingDate,
      meetingLink,
      meetingTitle
    }
  });
}
