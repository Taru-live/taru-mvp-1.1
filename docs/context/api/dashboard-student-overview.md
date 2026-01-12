# Dashboard Student Overview API Route Context

**Path:** `/api/dashboard/student/overview`  
**Method:** `GET`  
**File:** `app/api/dashboard/student/overview/route.ts`

## Purpose
Fetches comprehensive dashboard data for students including statistics, progress, modules, assessments, and YouTube data.

## Response
**Success (200):**
```json
{
  "overview": {
    "totalModules": number,
    "completedModules": number,
    "inProgressModules": number,
    "totalXP": number,
    "level": number,
    "badges": []
  },
  "recentActivity": [],
  "recommendedModules": [],
  "progress": {
    "overallProgress": number,
    "subjectProgress": {}
  }
}
```

## Data Aggregated
- **Module Statistics**: Total, completed, in-progress modules
- **XP and Level**: Total XP earned and current level
- **Progress Tracking**: Overall and subject-specific progress
- **YouTube Data**: Module data from YouTubeUrl collection
- **Recent Activity**: Recent learning activities
- **Recommended Modules**: Personalized module recommendations
- **Badges**: Earned badges and achievements

## Flow
1. Validates authentication token
2. Verifies user is a student
3. Gets student profile
4. Aggregates data from multiple collections:
   - StudentProgress
   - Module
   - Assessment
   - YoutubeUrl
   - Badges
5. Calculates statistics and progress
6. Returns comprehensive dashboard data

## Dependencies
- MongoDB connection (`connectDB`)
- User model
- Student model
- StudentProgress model
- Module model
- Assessment model
- YoutubeUrl model
- JWT authentication

## Related Routes
- `/api/dashboard/student` - Alternative dashboard endpoint
- `/api/modules/recommended` - Recommended modules
- `/api/student/profile` - Student profile

## Notes
- Requires student authentication
- Aggregates data from multiple collections
- Uses YouTubeUrl collection for module count
- Supports cache busting via query parameters
- Returns comprehensive dashboard statistics
