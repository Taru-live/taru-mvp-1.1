import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import connectDB from '@/lib/mongodb';
import Notification from '@/models/Notification';
import User from '@/models/User';
import Student from '@/models/Student';
import Teacher from '@/models/Teacher';
import Parent from '@/models/Parent';
import Organization from '@/models/Organization';
import { UserRole } from '@/models/User';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

interface DecodedToken {
  userId: string;
  email: string;
  role: UserRole;
}

// GET /api/notifications - Get notifications for current user
export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json(
        { error: 'Authorization token required' },
        { status: 401 }
      );
    }

    let decoded: DecodedToken;
    try {
      decoded = jwt.verify(token, JWT_SECRET) as DecodedToken;
    } catch {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    await connectDB();

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const read = searchParams.get('read'); // 'true', 'false', or null for all
    const limit = parseInt(searchParams.get('limit') || '50');
    const skip = parseInt(searchParams.get('skip') || '0');
    const type = searchParams.get('type');

    // Build query
    const query: any = { recipientId: decoded.userId };

    if (read === 'true') {
      query.read = true;
    } else if (read === 'false') {
      query.read = false;
    }

    if (type) {
      query.type = type;
    }

    // Get notifications
    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip)
      .lean();

    // Get unread count
    const unreadCount = await Notification.countDocuments({
      recipientId: decoded.userId,
      read: false
    });

    return NextResponse.json({
      notifications,
      unreadCount,
      total: notifications.length
    }, { status: 200 });

  } catch (error: any) {
    console.error('Get notifications error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/notifications - Create/send notifications
export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json(
        { error: 'Authorization token required' },
        { status: 401 }
      );
    }

    let decoded: DecodedToken;
    try {
      decoded = jwt.verify(token, JWT_SECRET) as DecodedToken;
    } catch {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    await connectDB();

    // Check if user can send notifications
    const senderRole = decoded.role;
    if (!['teacher', 'organization'].includes(senderRole)) {
      return NextResponse.json(
        { error: 'Only teachers and organizations can send notifications' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      type,
      priority = 'normal',
      title,
      message,
      targetAudience,
      metadata = {}
    } = body;

    if (!type || !title || !message || !targetAudience) {
      return NextResponse.json(
        { error: 'Missing required fields: type, title, message, targetAudience' },
        { status: 400 }
      );
    }

    // Get sender info
    const sender = await User.findById(decoded.userId);
    if (!sender) {
      return NextResponse.json(
        { error: 'Sender not found' },
        { status: 404 }
      );
    }

    const senderName = sender.name;
    const senderOrganizationId = sender.organizationId;

    // Determine recipients based on targetAudience
    const recipients: Array<{ userId: string; role: UserRole }> = [];

    if (targetAudience.role === 'student') {
      // Get students based on filters
      const studentQuery: any = {};

      if (targetAudience.organizationId) {
        studentQuery.organizationId = targetAudience.organizationId;
      } else if (senderOrganizationId) {
        studentQuery.organizationId = senderOrganizationId;
      }

      if (targetAudience.teacherId) {
        studentQuery.teacherId = targetAudience.teacherId;
      } else if (senderRole === 'teacher') {
        const teacher = await Teacher.findOne({ userId: decoded.userId });
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
      // Get teachers based on filters
      const teacherQuery: any = {};

      if (targetAudience.organizationId) {
        teacherQuery.organizationId = targetAudience.organizationId;
      } else if (senderOrganizationId) {
        teacherQuery.organizationId = senderOrganizationId;
      }

      const teachers = await Teacher.find(teacherQuery).select('userId');
      recipients.push(...teachers.map(t => ({ userId: t.userId, role: 'teacher' as UserRole })));
    } else if (targetAudience.role === 'parent') {
      // Get parents based on filters
      const parentQuery: any = {};

      if (targetAudience.organizationId) {
        // Get students in organization, then their parents
        const students = await Student.find({ organizationId: targetAudience.organizationId }).select('userId');
        const studentIds = students.map(s => s.userId);
        const parents = await Parent.find({ linkedStudentId: { $in: studentIds } }).select('userId');
        recipients.push(...parents.map(p => ({ userId: p.userId, role: 'parent' as UserRole })));
      } else if (targetAudience.studentIds && targetAudience.studentIds.length > 0) {
        // Get parents of specific students
        const students = await Student.find({ userId: { $in: targetAudience.studentIds } }).select('userId');
        const studentIds = students.map(s => s.userId);
        const parents = await Parent.find({ linkedStudentId: { $in: studentIds } }).select('userId');
        recipients.push(...parents.map(p => ({ userId: p.userId, role: 'parent' as UserRole })));
      } else if (targetAudience.parentIds && targetAudience.parentIds.length > 0) {
        // Direct parent IDs
        const parents = await Parent.find({ userId: { $in: targetAudience.parentIds } }).select('userId');
        recipients.push(...parents.map(p => ({ userId: p.userId, role: 'parent' as UserRole })));
      }
    }

    if (recipients.length === 0) {
      return NextResponse.json(
        { error: 'No recipients found for the specified target audience' },
        { status: 400 }
      );
    }

    // Create notifications for all recipients
    const notifications = recipients.map(recipient => ({
      recipientId: recipient.userId,
      recipientRole: recipient.role,
      senderId: decoded.userId,
      senderRole: senderRole as UserRole,
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

    return NextResponse.json({
      message: `Notifications sent to ${createdNotifications.length} recipients`,
      count: createdNotifications.length,
      notifications: createdNotifications
    }, { status: 201 });

  } catch (error: any) {
    console.error('Create notifications error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
