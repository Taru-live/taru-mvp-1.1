import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import connectDB from '@/lib/mongodb';
import Student from '@/models/Student';
import User from '@/models/User';
import { canAccessStudent } from '@/lib/auth-utils';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

interface DecodedToken {
  userId: string;
  role: string;
  [key: string]: unknown;
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    console.log('DELETE /api/teacher/students/[id] called');
    
    try {
      await connectDB();
      console.log('Database connected successfully');
    } catch (dbError) {
      console.error('Database connection failed:', dbError);
      return NextResponse.json(
        { error: 'Database connection failed', details: dbError instanceof Error ? dbError.message : 'Unknown database error' },
        { status: 500 }
      );
    }

    // Get JWT token from cookies
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Verify JWT token
    let decoded: DecodedToken;
    try {
      decoded = jwt.verify(token, JWT_SECRET) as DecodedToken;
    } catch (jwtError) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
    }

    // Check if user is a teacher
    const user = await User.findById(decoded.userId);
    if (!user || user.role !== 'teacher') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const { id: studentId } = await params;
    console.log('Attempting to delete student with ID:', studentId);
    
    if (!studentId) {
      return NextResponse.json(
        { error: 'Student ID is required' },
        { status: 400 }
      );
    }

    // Check authorization: teacher can only delete students assigned to them
    const hasAccess = await canAccessStudent(decoded.userId, user.role, studentId);
    if (!hasAccess) {
      return NextResponse.json(
        { error: 'You can only delete students assigned to you' },
        { status: 403 }
      );
    }

    // Find the student first
    const student = await Student.findById(studentId);
    if (!student) {
      console.log('Student not found with ID:', studentId);
      return NextResponse.json(
        { error: 'Student not found' },
        { status: 404 }
      );
    }

    console.log('Found student:', student.fullName);

    // Delete the student record
    await Student.findByIdAndDelete(studentId);
    console.log('Student record deleted successfully');

    // Also delete the associated user record
    if (student.userId) {
      await User.findByIdAndDelete(student.userId);
      console.log('Associated user record deleted successfully');
    }

    return NextResponse.json({
      message: 'Student deleted successfully',
      deletedStudentId: studentId
    });

  } catch (error) {
    console.error('Error deleting student:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    console.error('Error type:', typeof error);
    
    // Ensure we always return JSON, never HTML
    try {
      return NextResponse.json(
        { 
          error: 'Failed to delete student', 
          details: error instanceof Error ? error.message : 'Unknown error',
          type: typeof error
        },
        { status: 500 }
      );
    } catch (responseError) {
      console.error('Failed to create JSON response:', responseError);
      // Fallback response
      return new Response(
        JSON.stringify({ 
          error: 'Internal server error',
          details: 'Failed to process request'
        }),
        { 
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    console.log('GET /api/teacher/students/[id] called');
    
    try {
      await connectDB();
      console.log('Database connected successfully');
    } catch (dbError) {
      console.error('Database connection failed:', dbError);
      return NextResponse.json(
        { error: 'Database connection failed', details: dbError instanceof Error ? dbError.message : 'Unknown database error' },
        { status: 500 }
      );
    }

    // Get JWT token from cookies
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Verify JWT token
    let decoded: DecodedToken;
    try {
      decoded = jwt.verify(token, JWT_SECRET) as DecodedToken;
    } catch (jwtError) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
    }

    // Check if user is a teacher
    const user = await User.findById(decoded.userId);
    if (!user || user.role !== 'teacher') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const { id: studentId } = await params;
    console.log('Fetching student with ID:', studentId);
    
    if (!studentId) {
      return NextResponse.json(
        { error: 'Student ID is required' },
        { status: 400 }
      );
    }

    // Check authorization: teacher can only access students assigned to them
    const hasAccess = await canAccessStudent(decoded.userId, user.role, studentId);
    if (!hasAccess) {
      return NextResponse.json(
        { error: 'You can only view students assigned to you' },
        { status: 403 }
      );
    }

    // Find the student
    const student = await Student.findById(studentId);
    if (!student) {
      console.log('Student not found with ID:', studentId);
      return NextResponse.json(
        { error: 'Student not found' },
        { status: 404 }
      );
    }

    // Get user information
    const studentUser = await User.findById(student.userId);
    
    const studentData = {
      id: student._id.toString(),
      userId: student.userId.toString(),
      fullName: student.fullName,
      email: studentUser?.email || 'N/A',
      classGrade: student.classGrade || 'Not specified',
      schoolName: student.schoolName || 'Not specified',
      uniqueId: student.uniqueId,
      onboardingCompleted: student.onboardingCompleted,
      joinedAt: student.createdAt.toISOString(),
      totalModulesCompleted: student.totalModulesCompleted || 0,
      totalXpEarned: student.totalXpEarned || 0,
      learningStreak: student.learningStreak || 0,
      badgesEarned: student.badgesEarned || 0,
      assessmentCompleted: student.assessmentCompleted || false,
      diagnosticCompleted: student.diagnosticCompleted || false,
      diagnosticScore: student.diagnosticScore || 0
    };

    return NextResponse.json({ student: studentData });

  } catch (error) {
    console.error('Error fetching student:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    console.error('Error type:', typeof error);
    
    // Ensure we always return JSON, never HTML
    try {
      return NextResponse.json(
        { 
          error: 'Failed to fetch student', 
          details: error instanceof Error ? error.message : 'Unknown error',
          type: typeof error
        },
        { status: 500 }
      );
    } catch (responseError) {
      console.error('Failed to create JSON response:', responseError);
      // Fallback response
      return new Response(
        JSON.stringify({ 
          error: 'Internal server error',
          details: 'Failed to process request'
        }),
        { 
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
  }
}
