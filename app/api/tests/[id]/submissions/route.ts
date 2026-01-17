import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import Teacher from '@/models/Teacher';
import Organization from '@/models/Organization';
import Test from '@/models/Test';
import TestSubmission from '@/models/TestSubmission';
import Student from '@/models/Student';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

interface DecodedToken {
  userId: string;
  role: string;
  [key: string]: unknown;
}

// GET - Get all submissions for a test
export async function GET(
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
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const test = await Test.findById(id);
    if (!test) {
      return NextResponse.json({ error: 'Test not found' }, { status: 404 });
    }

    // Check permissions
    if (user.role === 'student') {
      // Students can only see their own submissions
      const student = await Student.findOne({ userId: user._id.toString() });
      if (!student) {
        return NextResponse.json({ error: 'Student profile not found' }, { status: 404 });
      }

      const submissions = await TestSubmission.find({
        testId: test._id,
        studentId: student.uniqueId || student.userId
      }).sort({ submittedAt: -1 }).lean();

      return NextResponse.json({
        success: true,
        submissions
      });
    } else if (user.role === 'teacher' || user.role === 'organization') {
      // Teachers and organizations can see all submissions for their tests
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

      const { searchParams } = new URL(request.url);
      const status = searchParams.get('status');
      const studentId = searchParams.get('studentId');

      const query: any = { testId: test._id };
      if (status) query.status = status;
      if (studentId) query.studentId = studentId;

      const submissions = await TestSubmission.find(query)
        .sort({ submittedAt: -1 })
        .lean();

      // Populate student information
      const submissionsWithStudentInfo = await Promise.all(
        submissions.map(async (submission) => {
          const student = await Student.findOne({
            $or: [
              { uniqueId: submission.studentId },
              { userId: submission.studentId }
            ]
          });
          
          const studentUser = await User.findById(submission.studentUserId);
          
          return {
            ...submission,
            student: student ? {
              id: student._id.toString(),
              name: student.fullName,
              classGrade: student.classGrade,
              email: studentUser?.email
            } : null
          };
        })
      );

      return NextResponse.json({
        success: true,
        submissions: submissionsWithStudentInfo,
        total: submissionsWithStudentInfo.length
      });
    } else {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

  } catch (error) {
    console.error('Error fetching submissions:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
