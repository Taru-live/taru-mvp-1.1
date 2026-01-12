# Career Details Page Context

**Path:** `/career-details`  
**File:** `app/career-details/page.tsx`

## Purpose
Displays detailed information about a specific career path, including learning modules, focus areas, time requirements, and personalized recommendations. This page shows the output from career exploration assessments.

## Key Features
- **Career Overview**: Greeting, overview, and time requirements
- **Focus Areas**: Key areas to focus on for the career
- **Learning Path**: Expandable modules with submodules and chapters
- **Save Functionality**: Save learning path for future reference
- **Session Management**: Uses enhanced session hooks for state preservation
- **Navigation State**: Preserves state when navigating away
- **User Info Display**: Shows user name and avatar
- **Interactive UI**: Mouse tracking for interactive effects

## User Access
- **Authenticated Users**: Primarily for students who have completed career assessments
- **Query Parameters**: 
  - `careerPath`: Career path identifier
  - `description`: Career description
  - `learningPathId`: Learning path ID

## Data Flow
1. Receives career details from query parameters or session
2. Fetches career details from `/api/career-details` if not in session
3. Displays learning modules with expandable sections
4. Allows saving learning path to `/api/learning-paths/save`
5. Preserves state using session management hooks

## State Management
- Career details state
- Loading and error states
- Expanded modules tracking
- User information
- Save operation states
- Mouse position for interactive effects
- Session state via `useEnhancedSession` hook
- Career state via `useCareerState` hook

## Dependencies
- `useNavigationWithState` hook for state-preserving navigation
- `useCareerState` hook for career-related state
- `useEnhancedSession` hook for session management
- ConsistentLoadingPage component
- Framer Motion for animations
- API endpoints:
  - `/api/career-details` - Fetch career details
  - `/api/learning-paths/save` - Save learning path
  - `/api/auth/me` - Get user info

## Related Pages
- `/career-exploration` - Career exploration assessment
- `/curriculum-path` - Curriculum path selection
- `/recommended-modules` - Recommended learning modules
- `/dashboard/student` - Student dashboard

## Data Structure
```typescript
interface CareerDetails {
  output?: {
    greeting: string;
    overview: string[];
    timeRequired: string;
    focusAreas: string[];
    learningPath: LearningModule[];
    finalTip: string;
  };
}
```

## Notes
- Uses client-side rendering (`'use client'`)
- Implements session state preservation
- Supports expandable/collapsible learning modules
- Integrates with N8N workflow for career details generation
- Handles multiple possible student name field formats from API
