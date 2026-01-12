# Context Documentation Index

This directory contains context documentation for all pages and API routes in the Taru MVP application.

## Structure

```
docs/context/
├── pages/          # Page context files
├── api/            # API route context files
└── README.md       # This file
```

## Pages

### Public Pages
- [Home](./pages/home.md) - Landing page (`/`)
- [About Us](./pages/about-us.md) - About page (`/about-us`)
- [Contact](./pages/contact.md) - Contact form (`/contact`)
- [Pricing](./pages/pricing.md) - Pricing information (`/pricing`)
- [Privacy Policy](./pages/privacy-policy.md) - Privacy policy (`/privacy-policy`)
- [Terms and Conditions](./pages/terms-and-conditions.md) - Terms (`/terms-and-conditions`)

### Authentication Pages
- [Login](./pages/login.md) - User login (`/login`)
- [Register](./pages/register.md) - User registration (`/register`)

### Student Pages
- [Student Dashboard](./pages/dashboard-student.md) - Student dashboard (`/dashboard/student`)
- [Student Onboarding](./pages/student-onboarding.md) - Student onboarding (`/student-onboarding`)
- [Diagnostic Assessment](./pages/diagnostic-assessment.md) - Diagnostic assessment (`/diagnostic-assessment`)
- [Career Details](./pages/career-details.md) - Career path details (`/career-details`)

### Dashboard Pages
- [Student Dashboard](./pages/dashboard-student.md) - Student dashboard
- [Teacher Dashboard](./pages/dashboard-teacher.md) - Teacher dashboard (`/dashboard/teacher`)
- [Parent Dashboard](./pages/dashboard-parent.md) - Parent dashboard (`/dashboard/parent`)
- [Admin Dashboard](./pages/dashboard-admin.md) - Admin dashboard (`/dashboard/admin`)
- [Organization Admin Dashboard](./pages/dashboard-organization-admin.md) - Organization admin dashboard (`/dashboard/organization-admin`)
- [Platform Super Admin Dashboard](./pages/dashboard-platform-super-admin.md) - Super admin dashboard (`/dashboard/platform-super-admin`)

### Module Pages
- [Module Detail](./pages/module-detail.md) - Module details (`/modules/[id]`)
- [YouTube Module Chapter](./pages/module-youtube-chapter.md) - YouTube module chapters (`/modules/youtube/[moduleId]/chapter/[chapterId]`)

## API Routes

### Authentication
- [Auth Login](./api/auth-login.md) - `POST /api/auth/login`
- [Auth Register](./api/auth-register.md) - `POST /api/auth/register`
- [Auth Logout](./api/auth-logout.md) - `POST /api/auth/logout`
- [Auth Me](./api/auth-me.md) - `GET /api/auth/me`

### Career & Learning Paths
- [Career Details](./api/career-details.md) - `GET /api/career-details`
- [Career Details Save](./api/career-details-save.md) - `POST /api/career-details/save`
- [Career Options](./api/career-options.md) - `GET /api/career-options`
- [Learning Paths](./api/learning-paths.md) - `GET /api/learning-paths`
- [Learning Paths Save](./api/learning-paths-save.md) - `POST /api/learning-paths/save`

### Assessments
- [Assessment Diagnostic](./api/assessment-diagnostic.md) - `POST /api/assessment/diagnostic`
- [Assessment Questions](./api/assessment-questions.md) - `GET /api/assessment/questions`
- [Assessment Result](./api/assessment-result.md) - `GET /api/assessment/result`
- [Assessment Store Answers](./api/assessment-store-answers.md) - `POST /api/assessment/store-answers`

### Modules
- [Modules ID](./api/modules-id.md) - `GET /api/modules/[id]`
- [Modules Progress](./api/modules-progress.md) - `POST /api/modules/progress`
- [Modules Recommended](./api/modules-recommended.md) - `GET /api/modules/recommended`

### Dashboard
- [Dashboard Student Overview](./api/dashboard-student-overview.md) - `GET /api/dashboard/student/overview`
- [Dashboard Parent Overview](./api/dashboard-parent-overview.md) - `GET /api/dashboard/parent/overview`
- [Dashboard Teacher Stats](./api/dashboard-teacher-stats.md) - `GET /api/teacher/dashboard-stats`
- [Dashboard Admin Stats](./api/dashboard-admin-stats.md) - `GET /api/admin/dashboard-stats`

### Student Management
- [Student Onboarding](./api/student-onboarding.md) - `POST /api/student/onboarding`
- [Student Profile](./api/student-profile.md) - `GET /api/student/profile`
- [Student Interest Assessment](./api/student-interest-assessment.md) - `POST /api/student/interest-assessment`

### Teacher Management
- [Teacher Students](./api/teacher-students.md) - `GET /api/teacher/students`
- [Teacher Add Student](./api/teacher-add-student.md) - `POST /api/teacher/add-student`
- [Teacher Assign Test](./api/teacher-assign-test.md) - `POST /api/teacher/assign-test`
- [Teacher Analytics](./api/teacher-analytics.md) - `GET /api/teacher/analytics`

### Organization Management
- [Organization Teachers](./api/organization-teachers.md) - `GET /api/organization/teachers`
- [Organization Students](./api/organization-students.md) - `GET /api/organization/students`
- [Organization Branches](./api/organization-branches.md) - `GET /api/organization/branches`
- [Organization Invite Teacher](./api/organization-invite-teacher.md) - `POST /api/organization/invite-teacher`
- [Organization Invite Parent](./api/organization-invite-parent.md) - `POST /api/organization/invite-parent`

### Admin Management
- [Admin Users](./api/admin-users.md) - `GET /api/admin/users`
- [Admin Modules](./api/admin-modules.md) - `GET /api/admin/modules`
- [Admin Organizations](./api/admin-organizations.md) - `GET /api/admin/organizations`
- [Admin Clear Cache](./api/admin-clear-cache.md) - `POST /api/admin/clear-cache`

### Session Management
- [Session Create](./api/session-create.md) - `POST /api/session/create`
- [Session Load](./api/session-load.md) - `GET /api/session/load`
- [Session Save](./api/session-save.md) - `POST /api/session/save`
- [Session Assessment Progress](./api/session-assessment-progress.md) - `POST /api/session/save-assessment-progress`
- [Session Module Progress](./api/session-module-progress.md) - `POST /api/session/save-module-progress`

### Chat & AI
- [Chat](./api/chat.md) - `POST /api/chat`
- [Mindmap Process PDF](./api/mindmap-process-pdf.md) - `POST /api/mindmap/process-pdf`
- [PDF to Info Brainstorm](./api/pdf-to-info-brainstorm.md) - `POST /api/pdf-to-info/brainstorm-topics`

### Webhooks
- [Webhook Chat Transcribe](./api/webhook-chat-transcribe.md) - `POST /api/webhook/chat-transcribe`
- [Webhook Generate MCQ](./api/webhook-generate-mcq.md) - `POST /api/webhook/generate-mcq`
- [Webhook YouTube Scrapper](./api/webhook-youtube-scrapper.md) - `POST /api/webhook/trigger-youtube-scrapper`

## How to Use

Each context file provides:
- **Purpose**: What the page/route does
- **Key Features**: Main functionality
- **User Access**: Who can access it
- **Request/Response**: API request/response formats
- **Dependencies**: Required models, services, utilities
- **Related Pages/Routes**: Links to related functionality
- **Notes**: Additional important information

## Contributing

When adding new pages or routes:
1. Create a context file in the appropriate directory
2. Follow the existing format
3. Update this README with the new entry
4. Include all relevant details about functionality and dependencies

## Notes

- All pages use client-side rendering (`'use client'`) unless specified
- Most API routes require JWT authentication via HTTP-only cookies
- Session management is used extensively for state preservation
- N8N webhooks are integrated for external workflow processing
- Fallback mechanisms are implemented for reliability
