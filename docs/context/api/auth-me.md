# Auth Me API Route Context

**Path:** `/api/auth/me`  
**Method:** `GET`  
**File:** `app/api/auth/me/route.ts`

## Purpose
Returns the currently authenticated user's information based on the JWT token in cookies.

## Request
No body required. Uses cookies for authentication.

## Response
**Success (200):**
```json
{
  "user": {
    "_id": "string",
    "email": "string",
    "name": "string",
    "role": "string",
    "profile": {}
  }
}
```

**Error (401/500):**
```json
{
  "error": "string"
}
```

## Authentication Flow
1. Extracts JWT token from cookies
2. Verifies token signature
3. Finds user in database
4. Returns user data (without password)

## Dependencies
- MongoDB connection (`connectDB`)
- User model
- JWT secret from environment variables

## Related Routes
- `/api/auth/login` - User login
- `/api/auth/logout` - User logout

## Notes
- Used for checking authentication status
- Returns user profile data based on role
- Token verification ensures valid session
