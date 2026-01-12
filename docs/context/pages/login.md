# Login Page Context

**Path:** `/login`  
**File:** `app/login/page.tsx`

## Purpose
Authentication page where users can log in to access their accounts. Supports multiple user roles (Student, Teacher, Parent, Admin, etc.).

## Key Features
- **Role Selection**: Dropdown to select user role before login
- **Login Form**: Email and password authentication
- **Language Selection**: Multi-language support with dropdown
- **Interactive UI**: Mouse tracking for interactive effects
- **Loading States**: Minimum 3-second loading display for better UX
- **Error Handling**: Displays authentication errors
- **Animations**: Text animations, magnetic buttons, tilt cards, scroll effects

## User Access
- **Public**: Accessible to all visitors (no authentication required)
- **Post-Login**: Redirects to role-specific dashboard

## Authentication Flow
1. User selects role from dropdown
2. User enters email and password
3. Form validates input
4. Submits to `/api/auth/login`
5. On success: Redirects to appropriate dashboard
6. On error: Displays error message

## Supported Roles
- Student
- Teacher
- Parent
- Admin
- Organization Admin
- Platform Super Admin

## State Management
- Email and password fields
- Selected role
- Loading state
- Error messages
- Language preference (stored in localStorage)
- Mouse position for interactive effects

## Dependencies
- Next.js router for navigation
- ConsistentLoadingPage component
- TextAnimations, InteractiveElements, ScrollAnimations components
- useMinimumDisplayTime hook
- Authentication API endpoint: `/api/auth/login`

## Related Pages
- `/register` - User registration
- `/dashboard/student` - Student dashboard
- `/dashboard/teacher` - Teacher dashboard
- `/dashboard/parent` - Parent dashboard
- `/dashboard/admin` - Admin dashboard

## Notes
- Uses client-side rendering (`'use client'`)
- Language preference persisted in localStorage
- Minimum display time for loading page: 3 seconds
- Supports multiple interactive UI effects
