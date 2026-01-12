# Student Dashboard Page Context

**Path:** `/dashboard/student`  
**File:** `app/dashboard/student/page.tsx`

## Purpose
Main dashboard for students after login. Provides overview of learning progress, modules, rewards, and access to various learning features.

## Key Features
- **Tabbed Interface**: Multiple tabs for different functionalities
  - Overview: Dashboard statistics and quick access
  - Learning Path: Personalized learning paths
  - Modules: Available learning modules
  - Enhanced Learning: AI-powered learning features
  - Progress: Progress reports and analytics
  - Rewards: Badges and achievements
  - Settings: Profile and settings management
- **Stats Cards**: Display key metrics (courses completed, progress, etc.)
- **AI Buddy Chat**: Integrated chat modal for AI assistance
- **Notifications**: Real-time notifications system
- **Avatar Selection**: Customizable avatar selection
- **Language Support**: Multi-language interface
- **Responsive Design**: Mobile-friendly with collapsible sidebar

## User Access
- **Authenticated Students**: Requires student role authentication
- **Session Management**: Uses session hooks for state preservation

## Navigation Tabs
1. **Overview**: Dashboard statistics, recent activity, quick actions
2. **Learning Path**: Personalized learning paths based on assessments
3. **Modules**: Browse and access learning modules
4. **Enhanced Learning**: AI-powered learning tools and features
5. **Progress**: Detailed progress reports and analytics
6. **Rewards**: Badges, achievements, and gamification elements
7. **Settings**: Profile management and preferences

## State Management
- User profile data
- Dashboard statistics
- Active tab selection
- Language preference (localStorage)
- Sidebar open/close state
- Chat modal state
- Notifications
- Avatar selection
- Loading states

## Dependencies
- Sidebar component
- Tab components (OverviewTab, ModulesTab, ProgressTab, etc.)
- StatsCards component
- ChatModal component
- ConsistentLoadingPage component
- Text animations and interactive elements
- API endpoints:
  - `/api/dashboard/student/overview` - Dashboard data
  - `/api/auth/me` - User information
  - `/api/notifications` - Notifications

## Related Pages
- `/modules/[id]` - Individual module pages
- `/career-details` - Career path details
- `/student-onboarding` - Student onboarding flow
- `/diagnostic-assessment` - Diagnostic assessment
- `/interest-assessment` - Interest assessment

## Notes
- Uses client-side rendering (`'use client'`)
- Implements dynamic imports for browser-only components
- Avatar selection uses consistent hashing based on user ID
- Supports window resize detection for responsive behavior
- Cache busting implemented for data refresh
