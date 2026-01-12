# Organization Admin Dashboard Page Context

**Path:** `/dashboard/organization-admin`  
**File:** `app/dashboard/organization-admin/page.tsx`

## Purpose
Dashboard for organization administrators to manage their organization, teachers, students, branches, and organization-specific settings.

## Key Features
- **Organization Management**: Manage organization profile and settings
- **Teacher Management**: Invite, manage, and remove teachers
- **Student Management**: Manage students within the organization
- **Branch Management**: Manage multiple branches/locations
- **Reports**: Organization-wide reports and analytics
- **Student Credentials**: Generate and manage student login credentials
- **Teacher Credentials**: Generate and manage teacher credentials
- **Audit Logs**: View organization activity logs

## User Access
- **Authenticated Organization Admins**: Requires organization admin role authentication
- **Organization Scope**: Access limited to their organization

## Navigation Tabs
1. **Overview**: Dashboard statistics and quick actions
2. **Teachers**: Teacher management
3. **Students**: Student management
4. **Branches**: Branch/location management
5. **Reports**: Organization reports and analytics
6. **Settings**: Organization settings

## State Management
- Organization data
- Dashboard statistics
- Teacher and student lists
- Active tab selection
- Language preference
- Sidebar state
- Notifications
- Loading states

## Dependencies
- API endpoints:
  - `/api/organization/dashboard-stats` - Dashboard statistics
  - `/api/organization/teachers` - Teacher management
  - `/api/organization/students` - Student management
  - `/api/organization/branches` - Branch management
  - `/api/organization/reports` - Reports
  - `/api/organization/settings` - Organization settings
  - `/api/organization/invite-teacher` - Invite teachers
  - `/api/organization/invite-parent` - Invite parents
  - `/api/organization/student-credentials` - Student credentials
  - `/api/organization/teacher-credentials` - Teacher credentials

## Related Pages
- `/organization-onboarding` - Organization onboarding flow
- `/dashboard/teacher` - Teacher dashboard
- `/dashboard/admin` - Platform admin dashboard

## Notes
- Uses client-side rendering (`'use client'`)
- Organization-scoped access (cannot access other organizations)
- Manages teachers and students within the organization
