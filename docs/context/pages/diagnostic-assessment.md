# Diagnostic Assessment Page Context

**Path:** `/diagnostic-assessment`  
**File:** `app/diagnostic-assessment/page.tsx`

## Purpose
Diagnostic assessment page where students complete skill and knowledge assessments to determine their current level and learning needs.

## Key Features
- **Assessment Questions**: Multiple-choice and skill-based questions
- **Progress Tracking**: Visual progress indicators
- **Session Management**: Preserves assessment progress using hooks
- **Result Summary**: Modal showing assessment results
- **State Preservation**: Saves progress when navigating away
- **Completion Tracking**: Tracks completion status
- **Celebration Effects**: Confetti and animations on completion

## User Access
- **Authenticated Students**: Requires student authentication
- **Prerequisites**: Should complete onboarding and interest assessment first

## Assessment Flow
1. Load assessment questions
2. Student answers questions
3. Progress is saved automatically
4. On completion, results are calculated
5. Result summary modal displayed
6. Redirects to next step (career exploration or modules)

## State Management
- Assessment questions
- Current question index
- Answers provided
- Progress state
- Loading states
- Result data
- Session state via `useAssessmentState` hook
- Navigation state via `useNavigationWithState` hook

## Dependencies
- ResultSummaryModal component
- useAssessmentState hook
- useNavigationWithState hook
- ConsistentLoadingPage component
- API endpoints:
  - `/api/assessment/diagnostic` - Get assessment questions
  - `/api/assessment/store-answers` - Save answers
  - `/api/assessment/result` - Get results
  - `/api/session/save-assessment-progress` - Save progress

## Related Pages
- `/student-onboarding` - Student onboarding (prerequisite)
- `/interest-assessment` - Interest assessment (prerequisite)
- `/career-exploration` - Career exploration (next step)
- `/recommended-modules` - Recommended modules (after completion)

## Notes
- Uses client-side rendering (`'use client'`)
- Implements session state preservation
- Supports resuming incomplete assessments
- Results used for personalized learning path generation
