# Auth Register API Route Context

**Path:** `/api/auth/register`  
**Method:** `POST`  
**File:** `app/api/auth/register/route.ts`

## Purpose
Handles new user registration with role-specific validation and profile creation.

## Request Body
```json
{
  "name": "string",
  "email": "string",
  "password": "string",
  "role": "student | teacher | parent | organization | admin",
  "profile": {
    // Role-specific fields
  }
}
```

## Response
**Success (201):**
```json
{
  "message": "User registered successfully",
  "user": {
    "_id": "string",
    "email": "string",
    "name": "string",
    "role": "string"
  }
}
```

**Error (400/409/500):**
```json
{
  "error": "string"
}
```

## Validation Rules
- **All Roles**: Name, email, password, role required
- **Password**: Minimum 6 characters
- **Email**: Must be unique (case-insensitive)
- **Parent Role**: Requires `linkedStudentUniqueId` in profile
  - Must start with "STU"
  - Must be at least 8 characters long

## Role-Specific Profile Mapping
- **Student**: grade, language, location
- **Teacher**: school, subject, experience
- **Parent**: linkedStudentUniqueId (required)
- **Organization**: organizationName, organizationType
- **Admin**: adminLevel, permissions

## User Creation Flow
1. Validates input data
2. Checks for existing user with email
3. Validates role
4. Role-specific validation (e.g., parent student linking)
5. Creates User document
6. Creates role-specific profile document (Student, Parent, etc.)
7. Returns created user data

## Dependencies
- MongoDB connection (`connectDB`)
- User model
- Student model (for student profiles)
- StudentKeyGenerator (for student unique IDs)

## Related Routes
- `/api/auth/login` - User login
- `/api/student/onboarding` - Student onboarding completion

## Notes
- Email stored in lowercase for consistency
- Password is hashed before storage
- Student unique ID generated automatically
- Parent registration requires valid student ID
