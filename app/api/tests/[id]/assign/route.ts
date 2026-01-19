import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import Teacher from '@/models/Teacher';
import Organization from '@/models/Organization';
import Test from '@/models/Test';
import Student from '@/models/Student';
import Notification from '@/models/Notification';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

interface DecodedToken {
  userId: string;
  role: string;
  [key: string]: unknown;
}

// POST - Assign test to students or classes
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await connectDB();

    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as DecodedToken;
    const user = await User.findById(decoded.userId);
    
    if (!user || (user.role !== 'teacher' && user.role !== 'organization')) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const test = await Test.findById(id);
    if (!test) {
      return NextResponse.json({ error: 'Test not found' }, { status: 404 });
    }

    // Check ownership
    if (user.role === 'teacher') {
      if (test.createdBy.id !== user._id.toString() || test.createdBy.type !== 'teacher') {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 });
      }
    } else if (user.role === 'organization') {
      const organization = await Organization.findOne({ userId: user._id.toString() });
      if (organization && test.organizationId !== organization._id.toString()) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 });
      }
    }

    const body = await request.json();
    const { studentIds, classGrades, assignmentType } = body;

    // Validate assignment type
    if (assignmentType === 'individual' && (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0)) {
      return NextResponse.json({ 
        error: 'Student IDs are required for individual assignment' 
      }, { status: 400 });
    }

    if (assignmentType === 'class' && (!classGrades || !Array.isArray(classGrades) || classGrades.length === 0)) {
      return NextResponse.json({ 
        error: 'Class grades are required for class assignment' 
      }, { status: 400 });
    }

    // Get organization ID for validation
    let organizationId: string | undefined;
    if (user.role === 'organization') {
      const organization = await Organization.findOne({ userId: user._id.toString() });
      if (organization) {
        organizationId = organization._id.toString();
      }
    } else if (user.role === 'teacher') {
      const teacher = await Teacher.findOne({ userId: user._id.toString() });
      if (teacher?.organizationId) {
        organizationId = teacher.organizationId;
      }
    }

    // Validate students belong to the organization/teacher
    if (studentIds && studentIds.length > 0) {
      const students = await Student.find({
        $or: [
          { uniqueId: { $in: studentIds } },
          { userId: { $in: studentIds } }
        ]
      });

      if (user.role === 'teacher') {
        const invalidStudents = students.filter(s => s.teacherId !== user._id.toString());
        if (invalidStudents.length > 0) {
          return NextResponse.json({ 
            error: 'Some students are not assigned to you' 
          }, { status: 403 });
        }
      } else if (user.role === 'organization' && organizationId) {
        const invalidStudents = students.filter(s => s.organizationId !== organizationId);
        if (invalidStudents.length > 0) {
          return NextResponse.json({ 
            error: 'Some students do not belong to your organization' 
          }, { status: 403 });
        }
      }
    }

    // Update test assignment
    test.assignmentType = assignmentType || test.assignmentType;
    if (assignmentType === 'individual') {
      test.assignedTo = {
        studentIds: studentIds || [],
        classGrades: []
      };
    } else if (assignmentType === 'class') {
      test.assignedTo = {
        studentIds: [],
        classGrades: classGrades || []
      };
    } else if (assignmentType === 'all_students') {
      // Get all students in organization
      if (organizationId) {
        const allStudents = await Student.find({ organizationId });
        test.assignedTo = {
          studentIds: allStudents.map(s => s.uniqueId || s.userId),
          classGrades: []
        };
      }
    }

    await test.save();

    // Send notifications to assigned students
    try {
      let studentIdsToNotify: string[] = [];
      
      if (assignmentType === 'individual' && studentIds) {
        studentIdsToNotify = studentIds;
      } else if (assignmentType === 'class' && classGrades) {
        const studentsInClasses = await Student.find({
          classGrade: { $in: classGrades }
        });
        studentIdsToNotify = studentsInClasses.map(s => s.uniqueId || s.userId);
      } else if (assignmentType === 'all_students' && organizationId) {
        const allStudents = await Student.find({ organizationId });
        studentIdsToNotify = allStudents.map(s => s.uniqueId || s.userId);
      }

      // Get student user IDs for notifications
      const students = await Student.find({
        $or: [
          { uniqueId: { $in: studentIdsToNotify } },
          { userId: { $in: studentIdsToNotify } }
        ]
      });

      const notifications = [];
      for (const student of students) {
        const studentUser = await User.findById(student.userId);
        if (studentUser) {
          const notification = new Notification({
            recipientId: student.userId,
            recipientRole: 'student',
            senderId: user._id.toString(),
            senderRole: user.role as 'teacher' | 'organization',
            senderName: user.name,
            type: 'test_assigned',
            priority: 'normal',
            title: 'New Test Assigned',
            message: `A new test "${test.title}" has been assigned to you.${test.endDate ? ` Due date: ${new Date(test.endDate).toLocaleDateString()}` : ''}`,
            read: false,
            metadata: {
              testId: test._id.toString(),
              endDate: test.endDate?.toISOString(),
              subject: test.subject
            }
          });
          notifications.push(notification);
        }
      }

      if (notifications.length > 0) {
        await Notification.insertMany(notifications);
      }
    } catch (notifError) {
      console.error('Error sending notifications to students:', notifError);
      // Don't fail the assignment if notification fails
    }

    return NextResponse.json({
      success: true,
      message: 'Test assigned successfully',
      test: {
        id: test._id.toString(),
        assignmentType: test.assignmentType,
        assignedTo: test.assignedTo
      }
    });

  } catch (error) {
    console.error('Error assigning test:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
