import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import Student from '@/models/Student';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

interface DecodedToken {
  userId: string;
  email: string;
  fullName: string;
  role: string;
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

    // Get user data
    const user = await User.findById(decoded.userId).select('-password');
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    let profileData: any = {
      id: user._id,
      email: user.email,
      fullName: user.name,
      role: user.role,
      avatar: user.avatar || null,
      createdAt: user.createdAt
    };

    // If user is a student, get additional student profile data
    if (user.role === 'student') {
      const studentProfile = await Student.findOne({ userId: user._id });
      if (studentProfile) {
        profileData = {
          ...profileData,
          uniqueId: studentProfile.uniqueId,
          age: studentProfile.age,
          classGrade: studentProfile.classGrade,
          languagePreference: studentProfile.languagePreference,
          schoolName: studentProfile.schoolName,
          onboardingCompleted: studentProfile.onboardingCompleted,
          preferredSubject: studentProfile.preferredSubject,
          dateOfBirth: studentProfile.dateOfBirth,
          gender: studentProfile.gender,
          guardian: studentProfile.guardian,
          location: studentProfile.location
        };
      }
    }

    return NextResponse.json({
      success: true,
      user: profileData
    });

  } catch (error) {
    console.error('Get user profile error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
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

    // Get user data
    const user = await User.findById(decoded.userId);
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { name, grade, school, language, dateOfBirth, gender, guardianName, location } = body;

    // Update user name if provided
    if (name) {
      user.name = name;
      await user.save();
    }

    // If user is a student, update student profile
    if (user.role === 'student') {
      const studentProfile = await Student.findOne({ userId: user._id });
      if (studentProfile) {
        // Update student profile fields
        if (grade) studentProfile.classGrade = grade;
        if (school) studentProfile.schoolName = school;
        if (language) studentProfile.languagePreference = language;
        if (dateOfBirth) studentProfile.dateOfBirth = new Date(dateOfBirth);
        if (gender) studentProfile.gender = gender;
        if (location) studentProfile.location = location;
        if (guardianName) {
          if (!studentProfile.guardian) {
            studentProfile.guardian = { name: guardianName, contactNumber: '', email: '' };
          } else {
            studentProfile.guardian.name = guardianName;
          }
        }

        await studentProfile.save();

        // Return updated profile
        return NextResponse.json({
          success: true,
          profile: {
            name: user.name,
            email: user.email,
            grade: studentProfile.classGrade,
            school: studentProfile.schoolName,
            language: studentProfile.languagePreference,
            dateOfBirth: studentProfile.dateOfBirth,
            gender: studentProfile.gender,
            guardianName: studentProfile.guardian?.name,
            location: studentProfile.location
          }
        });
      } else {
        return NextResponse.json(
          { error: 'Student profile not found' },
          { status: 404 }
        );
      }
    }

    // For non-student users, return basic profile
    return NextResponse.json({
      success: true,
      profile: {
        name: user.name,
        email: user.email
      }
    });

  } catch (error) {
    console.error('Update user profile error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}