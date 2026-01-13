# Google OAuth Setup Guide

This document explains how to set up Google OAuth authentication for the Taru application.

## Environment Variables

Add the following environment variables to your `.env.local` file:

```env
# Google OAuth Credentials
GOOGLE_CLIENT_ID=92407431350-7oki0i50g2dplb8uumb1hv5fjg8b3b2g.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=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

# Base URL (for OAuth redirects)
# For local development:
NEXT_PUBLIC_BASE_URL=http://localhost:3000
# For production, replace with your actual domain:
# NEXT_PUBLIC_BASE_URL=https://yourdomain.com
```

## Google Cloud Console Configuration

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project (or create a new one)
3. Navigate to **APIs & Services** > **Credentials**
4. Find your OAuth 2.0 Client ID (or create one if needed)
5. Add authorized redirect URIs:
   - For development: `http://localhost:3000/api/auth/google/callback`
   - For production: `https://yourdomain.com/api/auth/google/callback`

## How It Works

1. **User clicks "Continue with Google"** on the login page
2. **Redirects to Google** for authentication
3. **Google redirects back** to `/api/auth/google/callback` with an authorization code
4. **Server exchanges code** for user information
5. **User is created or logged in** and redirected to their dashboard

## Features

- ✅ Automatic user creation for new Google users
- ✅ Links existing accounts by email if Google ID doesn't exist
- ✅ Supports all user roles (student, teacher, parent, organization, admin)
- ✅ Handles onboarding and assessment flows
- ✅ Secure token-based authentication
- ✅ CSRF protection via state parameter

## Testing

1. Make sure all environment variables are set
2. Start your development server: `npm run dev`
3. Navigate to `/login`
4. Click "Continue with Google"
5. Complete Google authentication
6. You should be redirected to your dashboard or onboarding flow

## Troubleshooting

### "Google OAuth credentials not configured"
- Make sure `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are set in `.env.local`
- Restart your development server after adding environment variables

### "Invalid redirect URI"
- Check that the redirect URI in Google Cloud Console matches exactly:
  - Development: `http://localhost:3000/api/auth/google/callback`
  - Production: `https://yourdomain.com/api/auth/google/callback`

### "Security verification failed"
- This usually means the state parameter expired (10 minutes)
- Try logging in again

### "No email address found"
- Make sure your Google account has an email address
- Check that the OAuth scope includes `email`

## Security Notes

- Never commit `.env.local` to version control
- Keep your `GOOGLE_CLIENT_SECRET` secure
- Use HTTPS in production
- The OAuth state parameter provides CSRF protection
- Tokens are stored in HTTP-only cookies
