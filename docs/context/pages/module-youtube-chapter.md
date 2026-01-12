# YouTube Module Chapter Page Context

**Path:** `/modules/youtube/[moduleId]/chapter/[chapterId]`  
**File:** `app/modules/youtube/[moduleId]/chapter/[chapterId]/page.tsx`

## Purpose
Displays YouTube video-based learning content with chapter navigation, progress tracking, and interactive learning features.

## Key Features
- **YouTube Video Player**: Embedded YouTube video player
- **Chapter Navigation**: Navigate between chapters within a module
- **Progress Tracking**: Tracks video watch progress
- **Session Management**: Preserves progress when navigating away
- **Submodule Navigation**: Navigate to submodules
- **Learning Features**: Interactive learning tools and features

## User Access
- **Authenticated Students**: Requires student authentication
- **Dynamic Routes**: Module ID and Chapter ID from URL parameters

## Route Parameters
- `moduleId`: YouTube module identifier
- `chapterId`: Chapter identifier within the module

## State Management
- Video data
- Chapter data
- Progress state
- Session state
- Loading states

## Dependencies
- StudentVideoViewer component
- YouTubeVideoPlayer component
- Session management hooks
- API endpoints:
  - `/api/modules/[id]/progress` - Progress tracking
  - `/api/modules/[id]/transcript` - Video transcripts

## Related Pages
- `/modules/youtube/[moduleId]` - Module overview
- `/modules/youtube/[moduleId]/submodule/[submoduleId]` - Submodule pages
- `/dashboard/student` - Student dashboard

## Notes
- Uses client-side rendering (`'use client'`)
- Implements video progress tracking
- Supports chapter-based navigation
- Integrates with YouTube API
