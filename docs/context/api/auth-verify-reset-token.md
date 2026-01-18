# Auth Verify Reset Token API Route Context

**Path:** `/api/auth/verify-reset-token`  
**Method:** `POST`  
**File:** `app/api/auth/verify-reset-token/route.ts`

## Purpose
Verifies if a password reset token is valid and not expired. Used before showing password reset form to user.

## Request Body
```json
{
  "token": "reset_token"
}
```

## Response
**Success (200):**
```json
{
  "valid": true,
  "message": "Token is valid"
}
```

**Invalid Token (200):**
```json
{
  "valid": false,
  "message": "Invalid or expired token"
}
```

**Error (400/500):**
```json
{
  "error": "string"
}
```

## Flow
1. Validates token format
2. Finds user with matching reset token
3. Checks if token has expired
4. Returns validity status

## Token Validation
- Token must exist in user record
- Token must not be expired
- Checks expiry timestamp

## Security
- No authentication required (public endpoint)
- Doesn't reveal if email exists
- Generic invalid message
- Token expiry checked

## Related Routes
- `/api/auth/forgot-password` - Request password reset
- `/api/auth/reset-password` - Complete password reset with token

## Notes
- Used to verify token before showing reset form
- Returns boolean validity status
- Doesn't consume token (only verifies)
- Token is consumed in reset-password endpoint
