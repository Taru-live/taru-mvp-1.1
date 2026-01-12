# Platform Super Admin Dashboard Page Context

**Path:** `/dashboard/platform-super-admin`  
**File:** `app/dashboard/platform-super-admin/page.tsx`

## Purpose
Highest-level administrative dashboard for platform super admins. Manages platform-wide settings, organization approvals, and system-level configurations.

## Key Features
- **Organization Approvals**: Approve or reject organization registration requests
- **Platform Statistics**: Platform-wide analytics and metrics
- **Audit Logs**: System-wide activity logs
- **Organization Management**: View and manage all organizations
- **System Configuration**: Platform-level settings

## User Access
- **Authenticated Super Admins**: Requires platform super admin role authentication
- **Highest Privilege Level**: Full platform access

## Navigation Tabs
1. **Overview**: Platform statistics and pending approvals
2. **Organizations**: All organizations management
3. **Audit Logs**: System activity logs
4. **Settings**: Platform-wide settings

## State Management
- Dashboard statistics
- Pending organization approvals
- Active tab selection
- Language preference
- Sidebar state
- Notifications
- Loading states

## Dependencies
- API endpoints:
  - `/api/platform-super-admin/dashboard-stats` - Platform statistics
  - `/api/platform-super-admin/organizations` - Organization management
  - `/api/platform-super-admin/organizations/[id]/approve` - Approve organization
  - `/api/platform-super-admin/organizations/[id]/reject` - Reject organization
  - `/api/platform-super-admin/audit-logs` - Audit logs

## Related Pages
- `/super-admin-login` - Super admin login page
- `/dashboard/admin` - Regular admin dashboard

## Notes
- Uses client-side rendering (`'use client'`)
- Highest privilege level in the platform
- Manages organization onboarding approvals
- Platform-wide system management
