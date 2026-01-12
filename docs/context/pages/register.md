# Register Page Context

**Path:** `/register`  
**File:** `app/register/page.tsx`

## Purpose
User registration page where new users can create accounts. Supports multiple user roles with role-specific registration flows.

## Key Features
- **Role Selection**: Choose between Student, Teacher, Parent, Organization Admin
- **Dynamic Form Fields**: Form fields change based on selected role
- **Form Validation**: Client-side validation for all fields
- **Password Confirmation**: Ensures password match
- **Language Selection**: Multi-language support
- **Registration Data Manager**: Uses RegistrationDataManager utility for data handling
- **Loading States**: Loading indicator during registration
- **Error Handling**: Displays validation and registration errors

## User Access
- **Public**: Accessible to all visitors (no authentication required)

## Registration Flow
1. User selects role
2. Form fields update based on role
3. User fills in required information
4. Form validates input
5. Submits to `/api/auth/register`
6. On success: Redirects to appropriate onboarding or dashboard
7. On error: Displays error message

## Form Fields (Student)
- Full Name
- Guardian Name
- Class/Grade
- Language
- Location
- Email
- Password
- Confirm Password

## Supported Roles
- Student
- Teacher
- Parent
- Organization Admin

## State Management
- Selected role
- Form data object
- Loading state
- Error messages
- Language preference (localStorage)
- Mouse position for interactive effects

## Dependencies
- RegistrationDataManager from `@/lib/utils`
- ConsistentLoadingPage component
- Next.js router for navigation
- Authentication API endpoint: `/api/auth/register`

## Related Pages
- `/login` - User login
- `/student-onboarding` - Student onboarding flow
- `/parent-onboarding` - Parent onboarding flow
- `/organization-onboarding` - Organization onboarding flow
- `/teacher-onboarding` - Teacher onboarding flow

## Notes
- Uses client-side rendering (`'use client'`)
- Form fields dynamically change based on selected role
- Registration data managed through RegistrationDataManager utility
- Language preference persisted in localStorage
