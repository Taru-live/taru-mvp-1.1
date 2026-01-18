# Auth Change Password API Route Context

**Path:** `/api/auth/change-password`  
**Method:** `POST`  
**File:** `app/api/auth/change-password/route.ts`

## Purpose
Allows authenticated users to change their password. Requires current password verification for security.

## Request Body
```json
{
  "currentPassword": "string",
  "newPassword": "string"
}
```

## Response
**Success (200):**
```json
{
  "success": true,
  "message": "Password changed successfully"
}
```

**Error (400/401/500):**
```json
{
  "error": "string"
}
```

## Flow
1. Validates JWT token from HTTP-only cookie
2. Verifies user exists
3. Validates current password matches stored hash
4. Validates new password meets requirements
5. Hashes new password
6. Updates user password in database
7. Returns success response

## Password Requirements
- Minimum length (typically 8 characters)
- May include complexity requirements
- Must be different from current password

## Security
- JWT authentication required
- Current password verification required
- Password hashing (bcrypt)
- Prevents password reuse
- Secure password update

## Related Routes
- `/api/auth/forgot-password` - Request password reset
- `/api/auth/reset-password` - Reset password with token
- `/api/auth/login` - User login

## Notes
- Requires current password for security
- Password is hashed before storage
- Works for all user roles
- Invalidates old password immediately
