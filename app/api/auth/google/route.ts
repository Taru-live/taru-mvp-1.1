import { NextRequest, NextResponse } from 'next/server';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXTAUTH_URL || 'http://localhost:3000';

export async function GET(request: NextRequest) {
  try {
    if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
      return NextResponse.json(
        { error: 'Google OAuth credentials not configured' },
        { status: 500 }
      );
    }

    // Get the redirect URL from query params or use default
    const redirectUri = `${BASE_URL}/api/auth/google/callback`;
    
    // Generate state parameter for CSRF protection
    const state = Buffer.from(JSON.stringify({ 
      timestamp: Date.now(),
      random: Math.random().toString(36).substring(7)
    })).toString('base64url');

    // Google OAuth 2.0 authorization URL
    const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    authUrl.searchParams.set('client_id', GOOGLE_CLIENT_ID);
    authUrl.searchParams.set('redirect_uri', redirectUri);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('scope', 'openid email profile');
    authUrl.searchParams.set('access_type', 'offline');
    authUrl.searchParams.set('prompt', 'consent');
    authUrl.searchParams.set('state', state);

    // Store state in cookie for verification
    const response = NextResponse.redirect(authUrl.toString());
    response.cookies.set('google-oauth-state', state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 600, // 10 minutes
      path: '/'
    });

    return response;
  } catch (error: unknown) {
    console.error('Google OAuth initiation error:', error);
    return NextResponse.json(
      { error: 'Failed to initiate Google OAuth' },
      { status: 500 }
    );
  }
}
