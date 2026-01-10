import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import Student from '@/models/Student';
import StudentProgress from '@/models/StudentProgress';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

interface DecodedToken {
  userId: string;
  [key: string]: unknown;
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
    } catch (error) {
      console.error('Token verification failed:', error);
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    // Connect to database
    try {
      await connectDB();
    } catch (dbError) {
      console.error('Database connection error:', dbError);
      return NextResponse.json(
        { error: 'Database connection failed. Please check your MongoDB configuration.' },
        { status: 500 }
      );
    }

    // Parse request data (handle both JSON and FormData)
    const contentType = request.headers.get('content-type') || '';
    let data: any = {};
    
    if (contentType.includes('application/json')) {
      data = await request.json();
    } else {
      const formData = await request.formData();
      // Convert FormData to object
      for (const [key, value] of formData.entries()) {
        if (key === 'learningModePreference' || key === 'interestsOutsideClass' || key === 'preferredCareerDomains') {
          try {
            data[key] = JSON.parse(value as string);
          } catch {
            data[key] = [value];
          }
        } else {
          data[key] = value;
        }
      }
    }
    
    // Extract form fields with better error handling
    try {
      const fullName = data.fullName as string;
      const nickname = data.nickname as string;
      const dateOfBirth = data.dateOfBirth as string;
      const age = parseInt(data.age as string) || 0;
      const gender = data.gender as string;
      const classGrade = data.classGrade as string;
      const schoolName = data.schoolName as string;
      const schoolId = data.schoolId as string;
      const languagePreference = data.languagePreference as string;
      const learningModePreference = Array.isArray(data.learningModePreference) ? data.learningModePreference : [data.learningModePreference];
      const interestsOutsideClass = Array.isArray(data.interestsOutsideClass) ? data.interestsOutsideClass : [data.interestsOutsideClass];
      const preferredCareerDomains = Array.isArray(data.preferredCareerDomains) ? data.preferredCareerDomains : [data.preferredCareerDomains];
      const guardianName = data.guardianName as string;
      const guardianContactNumber = data.guardianPhone || data.guardianContactNumber as string;
      const guardianEmail = data.guardianEmail as string;
      const location = data.location as string;
      const deviceId = data.deviceId as string;
      const consentForDataUsage = data.consentForDataUsage === 'true' || data.consentForDataUsage === true || data.privacyConsent === true;
      const termsAndConditionsAccepted = data.termsAndConditionsAccepted === 'true' || data.termsAndConditionsAccepted === true || data.dataProcessingConsent === true;
      // Accept uniqueId from form data if provided
      const uniqueId = data.uniqueId as string | null;

      // Validate required fields
      if (!fullName || !dateOfBirth || !gender || !classGrade || !schoolId || 
          !languagePreference || !guardianName || !guardianContactNumber) {
        return NextResponse.json({ 
          error: 'Missing required fields' 
        }, { status: 400 });
      }

      // Validate email format if provided
      if (guardianEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(guardianEmail)) {
        return NextResponse.json({ 
          error: 'Invalid guardian email format' 
        }, { status: 400 });
      }

      // Handle profile picture - no default, will be blank if not provided
      const profilePictureUrl = null;

      // Create student profile data
      const studentProfile = {
        fullName,
        nickname: nickname || null,
        dateOfBirth: new Date(dateOfBirth),
        age,
        gender: gender.charAt(0).toUpperCase() + gender.slice(1).toLowerCase(), // Capitalize first letter
        classGrade,
        schoolName,
        schoolId,
        profilePictureUrl,
        languagePreference,
        learningModePreference,
        interestsOutsideClass,
        preferredCareerDomains,
        guardian: {
          name: guardianName,
          contactNumber: guardianContactNumber,
          email: guardianEmail || null
        },
        location,
        deviceId,
        consentForDataUsage,
        termsAndConditionsAccepted,
        onboardingCompleted: true,
        onboardingCompletedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        ...(uniqueId ? { uniqueId } : {})
      };

      // Update user profile in database with basic information
      const result = await User.findByIdAndUpdate(
        decoded.userId,
        { 
          $set: {
            profile: {
              grade: classGrade,
              role: 'student'
            },
            updatedAt: new Date()
          }
        }
      );

      if (!result) {
        return NextResponse.json({ 
          error: 'User not found' 
        }, { status: 404 });
      }

      // Check if student record already exists (created by teacher)
      let student = await Student.findOne({ userId: decoded.userId });
      
      if (student) {
        // Update existing student record with onboarding data
        student = await Student.findByIdAndUpdate(
          student._id,
          {
            ...studentProfile,
            onboardingCompleted: true,
            onboardingCompletedAt: new Date(),
            updatedAt: new Date()
          },
          { new: true }
        );
      } else {
        // Create new student record in students collection
        student = await Student.create({
          userId: decoded.userId,
          teacherId: null, // Self-registered students don't have a teacher initially
          ...studentProfile
        });
      }

      // Initialize student progress record (if it doesn't exist)
      // Use student._id as studentId since StudentProgress schema uses studentId (not userId)
      const studentIdString = student._id.toString();
      const existingProgress = await StudentProgress.findOne({ studentId: studentIdString });
      
      if (!existingProgress) {
        try {
          await StudentProgress.create({
            studentId: studentIdString,
            moduleProgress: [],
            totalPoints: 0,
            totalModulesCompleted: 0,
            totalWatchTime: 0,
            totalInteractiveTime: 0,
            totalProjectTime: 0,
            totalPeerLearningTime: 0,
            learningStreak: 0,
            badgesEarned: [],
            skillLevels: {},
            learningPreferences: {
              preferredContentTypes: [],
              preferredDifficulty: 'beginner',
              preferredGroupSize: 4,
              preferredTimeOfDay: 'morning'
            },
            aiInsights: {
              learningStyle: 'visual',
              strengths: [],
              weaknesses: [],
              recommendations: [],
              lastUpdated: new Date()
            }
          });
        } catch (progressError: any) {
          // Handle duplicate key error (race condition) - progress might have been created between check and create
          if (progressError.code === 11000 || progressError.message?.includes('duplicate')) {
            console.log('Student progress already exists, continuing...');
            // Progress already exists, which is fine - continue with onboarding
          } else {
            // Re-throw other errors
            throw progressError;
          }
        }
      }

      // Generate new token with assessment requirement (since onboarding is now complete)
      const newToken = jwt.sign(
        {
          userId: decoded.userId,
          email: result.email,
          fullName: result.name,
          role: result.role,
          firstTimeLogin: false,
          requiresOnboarding: false,
          requiresAssessment: true
        },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      const responseData = { 
        success: true, 
        message: 'Student onboarding completed successfully',
        uniqueId: student.uniqueId
      };
      
      const response = NextResponse.json(responseData);

      // Update the auth token cookie
      response.cookies.set('auth-token', newToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60, // 7 days
        path: '/'
      });

      return response;

    } catch (parseError) {
      console.error('Form data parsing error:', parseError);
      return NextResponse.json({ 
        error: `Invalid form data format: ${parseError instanceof Error ? parseError.message : 'Unknown error'}` 
      }, { status: 400 });
    }

  } catch (error) {
    console.error('Student onboarding error:', error);
    
    // Ensure we always return a proper error response
    let errorMessage = 'Internal server error. Please try again later.';
    let statusCode = 500;
    
    // Provide more specific error messages
    if (error instanceof Error) {
      if (error.message.includes('MongoDB') || error.message.includes('connection')) {
        errorMessage = 'Database connection failed. Please check your MongoDB configuration.';
        statusCode = 500;
      } else if (error.message.includes('validation')) {
        errorMessage = 'Data validation failed: ' + error.message;
        statusCode = 400;
      } else if (error.message.includes('duplicate') || error.message.includes('E11000')) {
        errorMessage = 'Student profile already exists. Please contact support if you need to update your information.';
        statusCode = 409;
      } else {
        errorMessage = `Server error: ${error.message}`;
      }
    }
    
    // Always return a proper error response with error field
    return NextResponse.json({ 
      success: false,
      error: errorMessage,
      timestamp: new Date().toISOString()
    }, { status: statusCode });
  }
} 