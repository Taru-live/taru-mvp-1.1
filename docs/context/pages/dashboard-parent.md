# Parent Dashboard Page Context

**Path:** `/dashboard/parent`  
**File:** `app/dashboard/parent/page.tsx`

## Purpose
Dashboard for parents to monitor their child's learning progress, view reports, and communicate with teachers.

## Key Features
- **Child Progress**: View child's learning progress and achievements
- **Learning Paths**: View child's personalized learning paths
- **Reports**: Detailed progress reports and analytics
- **Messages**: Communication with teachers and platform
- **Notifications**: Real-time notifications about child's activities
- **Settings**: Profile and notification preferences

## User Access
- **Authenticated Parents**: Requires parent role authentication
- **Child Association**: Parents are linked to their children's accounts

## Navigation Tabs
1. **Overview**: Dashboard overview and quick stats
2. **Child Progress**: Detailed progress tracking
3. **Learning Paths**: Child's learning paths
4. **Reports**: Comprehensive reports and analytics
5. **Messages**: Communication center
6. **Settings**: Profile and preferences

## State Management
- Child profile data
- Dashboard statistics
- Active tab selection
- Language preference
- Sidebar state
- Notifications
- Loading states

## Dependencies
- API endpoints:
  - `/api/dashboard/parent/overview` - Dashboard data
  - `/api/parent/child-details` - Child information
  - `/api/notifications` - Notifications

## Related Pages
- `/parent-onboarding` - Parent onboarding flow
- `/invite/parent` - Parent invitation

## Notes
- Uses client-side rendering (`'use client'`)
- Parents can view but not modify child's learning data
- Focus on monitoring and communication features
