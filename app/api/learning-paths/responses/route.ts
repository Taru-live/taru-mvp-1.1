import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import connectDB from '@/lib/mongodb';
import Student from '@/models/Student';
import LearningPath from '@/models/LearningPath';
import { createLearningPathResponse, getLearningPathResponses, saveLearningPathResponse, normalizeCareerDetailsData, validateCareerDetailsData } from '@/lib/utils/learningPathUtils';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

interface DecodedToken {
  userId: string;
  [key: string]: unknown;
}

export async function GET(request: NextRequest) {
  try {
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

    // Get student profile
    const student = await Student.findOne({ 
      userId: decoded.userId,
      onboardingCompleted: true 
    });

    if (!student) {
      return NextResponse.json(
        { error: 'Student not found' },
        { status: 404 }
      );
    }

    // Get learning path responses in the exact format
    const learningPathResponses = await getLearningPathResponses(student.uniqueId);

    console.log('📋 Retrieved learning path responses for student:', student.uniqueId);
    console.log('📋 Number of learning paths:', learningPathResponses.length);

    return NextResponse.json({
      success: true,
      message: 'Learning path responses retrieved successfully',
      learningPathResponses: learningPathResponses
    });

  } catch (error) {
    console.error('Learning path responses error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
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

    // Get student profile
    const student = await Student.findOne({ 
      userId: decoded.userId,
      onboardingCompleted: true 
    });

    if (!student) {
      return NextResponse.json(
        { error: 'Student not found' },
        { status: 404 }
      );
    }

    // Get request body
    const { careerDetails, careerPath } = await request.json();

    if (!careerDetails || !careerPath) {
      return NextResponse.json(
        { error: 'Career details and career path are required' },
        { status: 400 }
      );
    }

    // Normalize the career details data structure
    const normalizedCareerDetails = normalizeCareerDetailsData(careerDetails, student.uniqueId);
    
    if (!normalizedCareerDetails) {
      return NextResponse.json(
        { error: 'Failed to normalize career details data' },
        { status: 400 }
      );
    }

    // Validate the structure
    const validationResult = validateCareerDetailsData(normalizedCareerDetails);
    if (!validationResult.isValid) {
      console.error('❌ Career details validation failed:', validationResult.errors);
      return NextResponse.json(
        { 
          error: 'Invalid career details data structure',
          validationErrors: validationResult.errors
        },
        { status: 400 }
      );
    }

    // Create learning path response in the exact reference format
    const learningPathResponse = createLearningPathResponse(
      normalizedCareerDetails.output,
      student.uniqueId
    );

    // Save the response in the exact format
    const saveResult = await saveLearningPathResponse(learningPathResponse);

    if (saveResult.success) {
      console.log('📋 Created and saved learning path response for career:', careerPath, 'student:', student.uniqueId);

      return NextResponse.json({
        success: true,
        message: 'Learning path response created and saved successfully',
        responseId: saveResult.id,
        learningPathResponse: learningPathResponse
      });
    } else {
      return NextResponse.json(
        { 
          success: false,
          error: 'Failed to save learning path response',
          details: saveResult.error 
        },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Learning path response creation error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
