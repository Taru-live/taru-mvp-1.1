# Auth Reset Password API Route Context

**Path:** `/api/auth/reset-password`  
**Method:** `POST`  
**File:** `app/api/auth/reset-password/route.ts`

## Purpose
Completes password reset process. Verifies reset token and updates user password.

## Request Body
```json
{
  "token": "reset_token",
  "newPassword": "string"
}
```

## Response
**Success (200):**
```json
{
  "success": true,
  "message": "Password reset successfully"
}
```

**Error (400/401/500):**
```json
{
  "error": "Invalid or expired token" | "Password requirements not met"
}
```

## Flow
1. Validates reset token format
2. Finds user with matching reset token
3. Verifies token hasn't expired
4. Validates new password meets requirements
5. Hashes new password
6. Updates user password
7. Invalidates/removes reset token
8. Returns success response

## Token Verification
- Token must exist in user record
- Token must not be expired
- Token is one-time use (invalidated after use)

## Password Requirements
- Minimum length (typically 8 characters)
- May include complexity requirements
- Validated before update

## Security
- No authentication required (uses token)
- Token verification required
- Token expiry enforced
- One-time use tokens
- Password hashing (bcrypt)

## Related Routes
- `/api/auth/forgot-password` - Request password reset
- `/api/auth/verify-reset-token` - Verify token before showing reset form
- `/api/auth/change-password` - Change password when logged in

## Notes
- Token is invalidated after successful reset
- Password is hashed before storage
- Works for all user roles
- Token must be used before expiry
