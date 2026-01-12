# Auth Login API Route Context

**Path:** `/api/auth/login`  
**Method:** `POST`  
**File:** `app/api/auth/login/route.ts`

## Purpose
Handles user authentication by validating credentials and issuing JWT tokens. Determines if user needs onboarding or assessments.

## Request Body
```json
{
  "email": "string",
  "password": "string"
}
```

## Response
**Success (200):**
```json
{
  "message": "Login successful",
  "user": {
    "_id": "string",
    "email": "string",
    "name": "string",
    "role": "string"
  },
  "requiresOnboarding": boolean,
  "requiresAssessment": boolean
}
```

**Error (400/401/500):**
```json
{
  "error": "string"
}
```

## Authentication Flow
1. Validates email and password
2. Finds user in database
3. Compares password hash
4. Checks onboarding status (for students, parents, organizations)
5. Checks assessment completion (for students)
6. Generates JWT token
7. Sets HTTP-only cookie with token
8. Returns user data and flags

## User Roles Supported
- Student
- Teacher
- Parent
- Organization Admin
- Admin
- Platform Super Admin

## Onboarding & Assessment Checks
- **Students**: Checks `onboardingCompleted` and assessment completion
- **Parents**: Checks `onboardingCompleted`
- **Organizations**: Checks `onboardingCompleted`

## Dependencies
- MongoDB connection (`connectDB`)
- User model
- Student model (for student checks)
- Parent model (for parent checks)
- Organization model (for organization checks)
- AssessmentResponse model (for assessment checks)
- JWT secret from environment variables

## Security
- HTTP-only cookies for token storage
- Secure flag in production
- SameSite strict policy
- Password hashing verification
- Token expiration: 7 days

## Related Routes
- `/api/auth/register` - User registration
- `/api/auth/logout` - User logout
- `/api/auth/me` - Get current user

## Notes
- Returns generic error message for security (doesn't reveal if email exists)
- Token includes userId, email, role, and flags
- Cookie path set to `/` for site-wide access
