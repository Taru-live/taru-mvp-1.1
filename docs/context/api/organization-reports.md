# Organization Reports API Route Context

**Path:** `/api/organization/reports`  
**Method:** `GET`  
**File:** `app/api/organization/reports/route.ts`

## Purpose
Generates comprehensive reports for organization admins. Provides student progress, teacher performance, test analytics, and audit logs. Supports date filtering and various report types.

## Query Parameters
- `reportType` (required): Type of report to generate
  - `student_progress`: Student progress and performance
  - `teacher_performance`: Teacher activity and performance
  - `test_analytics`: Test results and analytics
  - `audit_logs`: System audit logs
  - `overview`: Summary dashboard data
- `startDate` (optional): Start date for filtering (ISO format)
- `endDate` (optional): End date for filtering (ISO format)
- `studentId` (optional): Filter by specific student
- `teacherId` (optional): Filter by specific teacher
- `branchId` (optional): Filter by specific branch

## Response
**Success (200):**
```json
{
  "success": true,
  "reportType": "student_progress",
  "data": {
    "students": [
      {
        "id": "student_id",
        "name": "string",
        "email": "string",
        "classGrade": "string",
        "overallProgress": 75,
        "completedModules": 5,
        "inProgressModules": 2,
        "totalModules": 10,
        "averageQuizScore": 85,
        "learningPathCompletion": 60,
        "totalPoints": 500,
        "learningStreak": 7,
        "recentActivity": "2024-01-01T00:00:00.000Z"
      }
    ],
    "summary": {
      "totalStudents": 50,
      "activeStudents": 45,
      "averageProgress": 72
    }
  }
}
```

## Report Types

### Student Progress Report
- Individual student progress metrics
- Module completion statistics
- Quiz scores and averages
- Learning path completion
- Points and streaks
- Recent activity tracking

### Teacher Performance Report
- Teacher activity metrics
- Student management statistics
- Test creation and grading activity
- Class performance overview

### Test Analytics Report
- Test completion rates
- Average scores by test
- Student performance distribution
- Grade-wise analytics

### Audit Logs Report
- System activity logs
- User actions tracking
- Data changes history
- Security events

### Overview Report
- Summary statistics
- Key metrics dashboard
- Recent activity overview
- Quick insights

## Authorization
- Organization Admin: Can access all reports for their organization
- Platform Super Admin: Can access reports for any organization (via query param)

## Dependencies
- MongoDB connection (`connectDB`)
- User model
- Organization model
- Branch model
- Teacher model
- Student model
- StudentProgress model
- Test model
- TestSubmission model
- TestEvaluation model
- AuditLog model

## Security
- JWT authentication required
- Organization-scoped access
- Platform super admin can access any organization
- Date filtering for data privacy

## Related Routes
- `/api/organization/dashboard-stats` - Dashboard statistics
- `/api/organization/students` - Student management
- `/api/organization/teachers` - Teacher management

## Notes
- Supports comprehensive filtering by date, student, teacher, branch
- Generates real-time statistics from database
- Handles large datasets with efficient queries
- Provides summary statistics alongside detailed data
- Platform super admin can access any organization's reports
