# Teacher Dashboard Page Context

**Path:** `/dashboard/teacher`  
**File:** `app/dashboard/teacher/page.tsx`

## Purpose
Dashboard for teachers to manage students, view analytics, assign tests, and monitor student progress.

## Key Features
- **Student Management**: View and manage assigned students
- **Analytics**: Student performance analytics and reports
- **Test Assignment**: Assign diagnostic and skill assessments
- **Modules Management**: View and manage learning modules
- **Bulk Import**: Import multiple students at once
- **Student Credentials**: Generate and manage student login credentials
- **Notifications**: Real-time notifications system
- **Responsive Design**: Mobile-friendly interface

## User Access
- **Authenticated Teachers**: Requires teacher role authentication
- **Organization Context**: Teachers belong to organizations

## Navigation Tabs
1. **Overview**: Dashboard statistics and quick actions
2. **Students**: Student management and list
3. **Analytics**: Performance analytics and reports
4. **Assignments**: Test and module assignments
5. **Modules**: Learning module management
6. **Settings**: Profile and settings

## State Management
- User profile data
- Dashboard statistics
- Student list and data
- Active tab selection
- Language preference
- Sidebar state
- Notifications
- Loading states

## Dependencies
- API endpoints:
  - `/api/teacher/dashboard-stats` - Dashboard statistics
  - `/api/teacher/students` - Student management
  - `/api/teacher/analytics` - Analytics data
  - `/api/teacher/assign-test` - Test assignment
  - `/api/teacher/modules` - Module management

## Related Pages
- `/invite/teacher` - Teacher invitation
- `/dashboard/admin` - Admin dashboard (for organization admins)

## Notes
- Uses client-side rendering (`'use client'`)
- Teachers can manage students within their organization
- Supports bulk operations for student management
