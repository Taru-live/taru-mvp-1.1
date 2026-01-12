# Interest Assessment Page Context

**Path:** `/interest-assessment`  
**File:** `app/interest-assessment/page.tsx`

## Purpose
Multi-step interest assessment where students explore and select their interests across various domains. Results are used to generate personalized career recommendations and learning paths.

## Key Features
- **Multi-Step Assessment**: Progressive form with multiple interest clusters
- **Broad Interest Clusters**: Initial selection of interest areas
- **Deep Dive Questions**: Detailed questions for selected clusters
- **Session Management**: Preserves assessment progress
- **Career Recommendations**: Generates career options based on interests
- **Loading States**: Loading indicators during processing

## Interest Clusters
- Technology & Computers
- Science & Experiments
- Art & Design
- Language & Communication
- Business & Money
- Performing Arts
- Cooking & Nutrition
- Sports & Fitness
- And more...

## User Access
- **Authenticated Students**: Requires student authentication
- **Prerequisites**: Should complete onboarding first

## Assessment Flow
1. Select broad interest clusters
2. Answer deep dive questions for selected clusters
3. Submit assessment
4. Generate career recommendations
5. Redirect to career exploration

## State Management
- Assessment data across steps
- Current step tracking
- Selected interest clusters
- Deep dive responses
- Loading states
- Session state preservation

## Dependencies
- ConsistentLoadingPage component
- Session management hooks
- API endpoints:
  - `/api/student/interest-assessment` - Submit assessment
  - `/api/career-options` - Get career recommendations

## Related Pages
- `/student-onboarding` - Student onboarding (prerequisite)
- `/career-exploration` - Career exploration (next step)
- `/diagnostic-assessment` - Diagnostic assessment

## Notes
- Uses client-side rendering (`'use client'`)
- Multi-step progressive form
- Results used for personalized career path generation
- Integrates with N8N workflow for career option generation
