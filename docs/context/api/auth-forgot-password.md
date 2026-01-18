# Auth Forgot Password API Route Context

**Path:** `/api/auth/forgot-password`  
**Method:** `POST`  
**File:** `app/api/auth/forgot-password/route.ts`

## Purpose
Initiates password reset process. Sends password reset email with reset token to user's email address.

## Request Body
```json
{
  "email": "user@example.com"
}
```

## Response
**Success (200):**
```json
{
  "success": true,
  "message": "Password reset email sent if email exists"
}
```

**Error (400/500):**
```json
{
  "error": "string"
}
```

## Flow
1. Validates email format
2. Finds user by email
3. Generates secure reset token
4. Stores reset token with expiry (typically 1 hour)
5. Sends password reset email with reset link
6. Returns success (doesn't reveal if email exists for security)

## Security Features
- Generic success message (doesn't reveal if email exists)
- Secure token generation
- Token expiry (time-limited)
- One-time use tokens (typically)
- Email verification required

## Reset Token
- Cryptographically secure random token
- Stored with expiry timestamp
- Typically expires in 1 hour
- One-time use (invalidated after use)

## Email Content
- Reset link with token
- Expiry information
- Security instructions

## Dependencies
- MongoDB connection (`connectDB`)
- User model
- Email service (SMTP/Nodemailer/SendGrid)
- Environment variables for email configuration

## Security
- No authentication required (public endpoint)
- Generic response (doesn't reveal email existence)
- Token expiry prevents abuse
- Rate limiting recommended

## Related Routes
- `/api/auth/verify-reset-token` - Verify reset token validity
- `/api/auth/reset-password` - Complete password reset
- `/api/auth/change-password` - Change password when logged in

## Notes
- Returns same success message regardless of email existence (security)
- Reset token expires after set time
- Email must be configured in environment variables
- Token is typically invalidated after use
