# Auth Logout API Route Context

**Path:** `/api/auth/logout`  
**Method:** `POST`  
**File:** `app/api/auth/logout/route.ts`

## Purpose
Handles user logout by clearing authentication cookies and invalidating sessions.

## Request
No body required. Uses cookies for authentication.

## Response
**Success (200):**
```json
{
  "message": "Logout successful"
}
```

## Logout Flow
1. Clears authentication cookie
2. Optionally invalidates session in database
3. Returns success response

## Security
- Clears HTTP-only cookie
- Sets cookie expiration to past date
- SameSite and secure flags maintained

## Related Routes
- `/api/auth/login` - User login
- `/api/auth/me` - Get current user

## Notes
- Cookie clearing is the primary logout mechanism
- No database session invalidation required (stateless JWT)
