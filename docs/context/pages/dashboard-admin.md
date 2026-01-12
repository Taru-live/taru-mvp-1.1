# Admin Dashboard Page Context

**Path:** `/dashboard/admin`  
**File:** `app/dashboard/admin/page.tsx`

## Purpose
Dashboard for platform administrators to manage users, content, organizations, and system settings.

## Key Features
- **User Management**: Create, edit, and manage all user accounts
- **Content Management**: Manage learning modules and content
- **Organization Management**: Manage organizations and their settings
- **System Settings**: Platform-wide configuration
- **Dashboard Statistics**: Platform-wide analytics and metrics
- **Cache Management**: Clear and manage system cache
- **Audit Logs**: View system activity logs

## User Access
- **Authenticated Admins**: Requires admin role authentication
- **Platform-wide Access**: Full access to all platform features

## Navigation Tabs
1. **Overview**: Dashboard statistics and quick actions
2. **Users**: User management (all roles)
3. **Content**: Content and module management
4. **Organizations**: Organization management
5. **System**: System settings and configuration

## State Management
- User profile data
- Dashboard statistics
- Active tab selection
- Language preference
- Sidebar state
- Notifications
- Loading states

## Dependencies
- API endpoints:
  - `/api/admin/dashboard-stats` - Dashboard statistics
  - `/api/admin/users` - User management
  - `/api/admin/modules` - Content management
  - `/api/admin/organizations` - Organization management
  - `/api/admin/clear-cache` - Cache management
  - `/api/admin/cache-stats` - Cache statistics

## Related Pages
- `/super-admin-login` - Super admin login
- `/dashboard/platform-super-admin` - Platform super admin dashboard

## Notes
- Uses client-side rendering (`'use client'`)
- Highest level of administrative access
- Manages platform-wide settings and configurations
