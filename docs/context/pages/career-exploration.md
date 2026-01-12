# Career Exploration Page Context

**Path:** `/career-exploration`  
**File:** `app/career-exploration/page.tsx`

## Purpose
Interactive page where students explore career options generated from their assessments. Allows browsing, filtering, and selecting career paths.

## Key Features
- **Career Options Display**: Grid/list view of career options
- **Career Details**: Click to view detailed information
- **Filtering**: Filter careers by category, domain, etc.
- **Search**: Search functionality for careers
- **Selection**: Select career paths for detailed exploration
- **Navigation**: Navigate to career details page

## User Access
- **Authenticated Students**: Requires student authentication
- **Prerequisites**: Should complete interest assessment

## Career Data Structure
```typescript
interface CareerOption {
  ID: string;
  career: string;
  description: string;
}
```

## State Management
- Career options list
- Selected career
- Filter state
- Search query
- Loading states

## Dependencies
- ConsistentLoadingPage component
- API endpoints:
  - `/api/career-options` - Get career options
  - `/api/career-details` - Get career details

## Related Pages
- `/interest-assessment` - Interest assessment (prerequisite)
- `/career-details` - Career details page
- `/curriculum-path` - Curriculum path selection

## Notes
- Uses client-side rendering (`'use client'`)
- Career options generated from assessment results
- Integrates with N8N workflow for career generation
- Supports filtering and search functionality
