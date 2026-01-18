import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import Student from '@/models/Student';
import Parent from '@/models/Parent';
import Organization from '@/models/Organization';
import AssessmentResponse from '@/models/AssessmentResponse';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export async function POST(request: NextRequest) {
  try {
    // Connect to MongoDB
    try {
      await connectDB();
    } catch (dbError: unknown) {
      console.error('Database connection error:', dbError);
      return NextResponse.json(
        { error: 'Database connection failed. Please check your MongoDB Atlas connection.' },
        { status: 500 }
      );
    }

    const { email, password } = await request.json();

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Check if user is active
    if (user.isActive === false) {
      return NextResponse.json(
        { error: 'Your account has been disabled. Please contact your administrator.' },
        { status: 403 }
      );
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Check if user needs onboarding or assessment
    let requiresOnboarding = false;
    let requiresAssessment = false;
    
    if (user.role === 'student') {
      const studentProfile = await Student.findOne({ userId: user._id.toString() });
      requiresOnboarding = !studentProfile?.onboardingCompleted;
      
      // If onboarding is completed, check if assessments are completed
      if (studentProfile?.onboardingCompleted) {
        // Check if interest assessment is completed first
        const interestAssessmentCompleted = studentProfile.interestAssessmentCompleted;
        
        // If interest assessment is completed, check if diagnostic assessment is completed
        if (interestAssessmentCompleted) {
          const assessmentResponse = await AssessmentResponse.findOne({
            uniqueId: studentProfile.uniqueId,
            assessmentType: 'diagnostic',
            isCompleted: true
          });
          requiresAssessment = !assessmentResponse;
        } else {
          // Interest assessment is not completed, so assessment is required
          requiresAssessment = true;
        }
      }
    } else if (user.role === 'parent') {
      const parentProfile = await Parent.findOne({ userId: user._id.toString() });
      requiresOnboarding = !parentProfile?.onboardingCompleted;
    } else if (user.role === 'organization') {
      const organizationProfile = await Organization.findOne({ userId: user._id.toString() });
      requiresOnboarding = !organizationProfile?.onboardingCompleted;
    }

    // Check if user must change password
    const mustChangePassword = user.mustChangePassword === true;

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user._id,
        email: user.email,
        fullName: user.name,
        role: user.role,
        firstTimeLogin: user.firstTimeLogin,
        mustChangePassword: mustChangePassword,
        requiresOnboarding,
        requiresAssessment
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Create response with user data (without password)
    const userResponse = user.toJSON();

    // Set HTTP-only cookie with JWT token
    const response = NextResponse.json(
      { 
        message: 'Login successful',
        user: userResponse,
        mustChangePassword: mustChangePassword,
        requiresOnboarding,
        requiresAssessment
      },
      { status: 200 }
    );

    // Set secure cookie
    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: '/'
    });

    return response;

  } catch (error: unknown) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 