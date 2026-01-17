import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import Student from '@/models/Student';

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

    // Get user information
    const user = await User.findById(decoded.userId);
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if user is a student
    if (user.role !== 'student') {
      return NextResponse.json(
        { error: 'Only students can access this endpoint' },
        { status: 403 }
      );
    }

    // Get student profile from Student collection
    const student = await Student.findOne({ userId: decoded.userId });
    if (!student) {
      return NextResponse.json(
        { error: 'Student profile not found' },
        { status: 404 }
      );
    }

    // Return student profile with unique ID
    return NextResponse.json({
      success: true,
      uniqueId: student.uniqueId,
      fullName: student.fullName,
      nickname: student.nickname,
      classGrade: student.classGrade,
      schoolName: student.schoolName,
      languagePreference: student.languagePreference,
      learningModePreference: student.learningModePreference,
      interestsOutsideClass: student.interestsOutsideClass,
      preferredCareerDomains: student.preferredCareerDomains,
      onboardingCompleted: student.onboardingCompleted,
      interestAssessmentCompleted: student.interestAssessmentCompleted,
      organizationId: student.organizationId,
      isOrganizationStudent: !!student.organizationId,
      teacherId: student.teacherId,
      createdBy: student.createdBy || null,
      managedBy: student.managedBy || null,
      dateOfBirth: student.dateOfBirth,
      gender: student.gender,
      guardian: student.guardian,
      location: student.location
    });

  } catch (error) {
    console.error('Get student profile error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 