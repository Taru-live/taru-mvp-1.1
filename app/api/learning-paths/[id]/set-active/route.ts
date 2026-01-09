import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import LearningPath from '@/models/LearningPath';
import LearningPathResponse from '@/models/LearningPathResponse';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

interface DecodedToken {
  userId: string;
  [key: string]: unknown;
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Await params to get the id
    const { id } = await params;
    
    // Get token from HTTP-only cookie
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json(
        { error: 'Authorization token required' },
        { status: 401 }
      );
    }

    // Verify token
    let decoded: DecodedToken;
    try {
      decoded = jwt.verify(token, JWT_SECRET) as DecodedToken;
    } catch {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    // Connect to database
    await connectDB();

    // Get user
    const user = await User.findById(decoded.userId);
    if (!user || user.role !== 'student') {
      return NextResponse.json(
        { error: 'Only students can set active learning paths' },
        { status: 403 }
      );
    }

    // Get request body
    const body = await request.json();
    const { studentId } = body;

    // Find the learning path response
    const learningPathResponse = await LearningPathResponse.findById(id);
    
    if (!learningPathResponse) {
      return NextResponse.json(
        { error: 'Learning path not found' },
        { status: 404 }
      );
    }

    // Get student profile to get uniqueId
    const Student = (await import('@/models/Student')).default;
    const student = await Student.findOne({ 
      userId: decoded.userId,
      uniqueId: studentId || user.uniqueId 
    });

    if (!student) {
      return NextResponse.json(
        { error: 'Student profile not found' },
        { status: 404 }
      );
    }

    // Check if the learning path belongs to the current user
    if (learningPathResponse.uniqueid !== student.uniqueId) {
      return NextResponse.json(
        { error: 'You can only set your own learning paths as active' },
        { status: 403 }
      );
    }

    // Set all other learning paths for this student to inactive
    await LearningPathResponse.updateMany(
      { 
        uniqueid: student.uniqueId,
        _id: { $ne: learningPathResponse._id }
      },
      { isActive: false }
    );

    // Mark this learning path as active
    learningPathResponse.isActive = true;
    learningPathResponse.updatedAt = new Date();
    await learningPathResponse.save();

    return NextResponse.json({
      message: 'Learning path set as active successfully',
      learningPath: {
        _id: learningPathResponse._id,
        studentId: learningPathResponse.uniqueid,
        careerPath: learningPathResponse.output.greeting?.replace(/^Hi\s+[^!]+!\s*/, '') || 'Career Path',
        description: learningPathResponse.output.overview?.join(' ') || 'Learning path description',
        learningModules: learningPathResponse.output.learningPath || [],
        timeRequired: learningPathResponse.output.timeRequired || 'Not specified',
        focusAreas: learningPathResponse.output.focusAreas || [],
        createdAt: learningPathResponse.createdAt,
        updatedAt: learningPathResponse.updatedAt
      }
    });

  } catch (error) {
    console.error('Set active learning path error:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}
