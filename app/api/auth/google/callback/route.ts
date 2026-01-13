import { NextRequest, NextResponse } from 'next/server';
import { OAuth2Client } from 'google-auth-library';
import jwt from 'jsonwebtoken';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import Student from '@/models/Student';
import Parent from '@/models/Parent';
import Organization from '@/models/Organization';
import AssessmentResponse from '@/models/AssessmentResponse';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXTAUTH_URL || 'http://localhost:3000';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    // Handle OAuth errors
    if (error) {
      console.error('Google OAuth error:', error);
      return NextResponse.redirect(new URL('/login?error=oauth_failed', BASE_URL));
    }

    // Verify state parameter
    const storedState = request.cookies.get('google-oauth-state')?.value;
    if (!state || !storedState || state !== storedState) {
      return NextResponse.redirect(new URL('/login?error=invalid_state', BASE_URL));
    }

    if (!code) {
      return NextResponse.redirect(new URL('/login?error=no_code', BASE_URL));
    }

    if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
      return NextResponse.redirect(new URL('/login?error=config_error', BASE_URL));
    }

    // Exchange authorization code for tokens
    const oauth2Client = new OAuth2Client(
      GOOGLE_CLIENT_ID,
      GOOGLE_CLIENT_SECRET,
      `${BASE_URL}/api/auth/google/callback`
    );

    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    // Get user info from Google
    const ticket = await oauth2Client.verifyIdToken({
      idToken: tokens.id_token!,
      audience: GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload) {
      return NextResponse.redirect(new URL('/login?error=invalid_token', BASE_URL));
    }

    const googleId = payload.sub;
    const email = payload.email?.toLowerCase();
    const name = payload.name || payload.email?.split('@')[0] || 'User';
    const picture = payload.picture;

    if (!email) {
      return NextResponse.redirect(new URL('/login?error=no_email', BASE_URL));
    }

    // Connect to database
    await connectDB();

    // Find existing user
    const existingUser = await User.findOne({ 
      $or: [
        { googleId },
        { email }
      ]
    });

    let isNewUser = false;
    const user = existingUser;
    
    if (user) {
      // Update existing user with Google ID if they don't have it
      if (!user.googleId) {
        user.googleId = googleId;
        user.authProvider = 'google';
        if (picture) user.avatar = picture;
        await user.save();
      }
    } else {
      // First-time OAuth user - redirect to registration for role selection
      isNewUser = true;
      
      // Store OAuth data temporarily in encrypted cookie for registration
      const oauthData = {
        googleId,
        email,
        name,
        picture: picture || null,
        timestamp: Date.now()
      };
      
      // Encrypt and store OAuth data (expires in 10 minutes)
      const oauthDataString = JSON.stringify(oauthData);
      const response = NextResponse.redirect(new URL('/register?oauth=google', BASE_URL));
      
      // Clear OAuth state cookie
      response.cookies.delete('google-oauth-state');
      
      // Store OAuth data temporarily (encrypted, expires in 10 minutes)
      response.cookies.set('google-oauth-data', oauthDataString, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 10 * 60, // 10 minutes
        path: '/'
      });
      
      return response;
    }

    // Check if user needs onboarding or assessment (same logic as regular login)
    // New users always need onboarding
    let requiresOnboarding = isNewUser;
    let requiresAssessment = false;
    
    // Only check onboarding status for existing users (not new ones)
    if (!isNewUser) {
      if (user.role === 'student') {
        const studentProfile = await Student.findOne({ userId: user._id.toString() });
        requiresOnboarding = !studentProfile?.onboardingCompleted;
        
        if (studentProfile?.onboardingCompleted) {
          const interestAssessmentCompleted = studentProfile.interestAssessmentCompleted;
          
          if (interestAssessmentCompleted) {
            const assessmentResponse = await AssessmentResponse.findOne({
              uniqueId: studentProfile.uniqueId,
              assessmentType: 'diagnostic',
              isCompleted: true
            });
            requiresAssessment = !assessmentResponse;
          } else {
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
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user._id,
        email: user.email,
        fullName: user.name,
        role: user.role,
        firstTimeLogin: user.firstTimeLogin,
        requiresOnboarding,
        requiresAssessment
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Determine redirect URL based on user status
    let redirectUrl = '/dashboard/student'; // Default
    
    if (requiresOnboarding) {
      if (user.role === 'student') {
        redirectUrl = '/student-onboarding';
      } else if (user.role === 'parent') {
        redirectUrl = '/parent-onboarding';
      } else if (user.role === 'organization') {
        redirectUrl = '/organization-onboarding';
      }
    } else if (requiresAssessment && user.role === 'student') {
      // Check which assessment needs to be completed
      const studentProfile = await Student.findOne({ userId: user._id.toString() });
      if (studentProfile && !studentProfile.interestAssessmentCompleted) {
        redirectUrl = '/interest-assessment';
      } else {
        redirectUrl = '/diagnostic-assessment';
      }
    } else {
      // Redirect based on role
      if (user.role === 'student') {
        redirectUrl = '/dashboard/student';
      } else if (user.role === 'parent') {
        redirectUrl = '/dashboard/parent';
      } else if (user.role === 'teacher') {
        redirectUrl = '/dashboard/teacher';
      } else if (user.role === 'organization') {
        redirectUrl = '/dashboard/organization-admin';
      } else if (user.role === 'admin') {
        redirectUrl = '/dashboard/admin';
      } else if (user.role === 'platform_super_admin') {
        redirectUrl = '/dashboard/platform-super-admin';
      }
    }

    // Clear OAuth state cookie
    const response = NextResponse.redirect(new URL(redirectUrl, BASE_URL));
    response.cookies.delete('google-oauth-state');

    // Set auth token cookie
    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: '/'
    });

    return response;

  } catch (error: unknown) {
    console.error('Google OAuth callback error:', error);
    return NextResponse.redirect(new URL('/login?error=oauth_callback_failed', BASE_URL));
  }
}
