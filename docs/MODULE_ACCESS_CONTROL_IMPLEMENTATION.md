# Module/Chapter Access Control Implementation

## Overview
This document describes the implementation of sequential module locking based on subscription renewal cycles per learning path.

## Implementation Details

### 1. Module Access Control Utility (`lib/utils/moduleAccessControl.ts`)

**Key Functions:**

#### `calculateUnlockedModulesCount(subscription)`
- Calculates number of unlocked modules based on subscription age
- Rule: First module unlocked after initial payment, each renewal cycle unlocks next module
- Returns: Number of modules unlocked (1-based: 1 = first module only)

#### `checkModuleAccess(uniqueId, learningPathId, moduleIndex)`
- Checks if a specific module is unlocked for a learning path subscription
- Returns: Access status, locked status, unlocked count, and reason

#### `checkChapterAccess(uniqueId, learningPathId, moduleIndex, chapterIndex)`
- Checks if a chapter is accessible (inherits from module access)
- Returns: Access status based on parent module

#### `getLearningPathIdFromModule(uniqueId, moduleId, chapterId)`
- Attempts to find learning path ID from module/chapter identifiers
- Used when learningPathId is not directly available

### 2. Module Access Check API (`app/api/modules/check-access/route.ts`)

**Endpoint:** `GET /api/modules/check-access`

**Query Parameters:**
- `learningPathId` (required): Learning path ID
- `moduleId` or `moduleIndex` (required): Module identifier
- `chapterId` or `chapterIndex` (optional): Chapter identifier

**Response:**
```json
{
  "success": true,
  "hasAccess": boolean,
  "moduleAccess": {
    "hasAccess": boolean,
    "isLocked": boolean,
    "unlockedModulesCount": number,
    "reason": string
  },
  "chapterAccess": {
    "hasAccess": boolean,
    "isLocked": boolean,
    "reason": string
  },
  "learningPathId": string,
  "moduleIndex": number
}
```

### 3. Frontend Implementation

#### Chapter Page Updates (`app/modules/youtube/[moduleId]/chapter/[chapterId]/page.tsx`)

**Changes:**
1. **State Management:**
   - Added `learningPathId` state extracted from API response
   - Added `moduleAccess` state for access control

2. **Learning Path ID Extraction:**
   - Extracts `learningPathId` from `/api/youtube-urls` response (`result.data._id`)
   - Stores in state for use in API calls

3. **Module Access Check:**
   - Calls `/api/modules/check-access` when module/chapter loads
   - Prevents rendering content if module is locked
   - Shows locked module UI with unlock instructions

4. **API Integration:**
   - Passes `learningPathId` to:
     - `/api/chat` (AI Buddy chat)
     - `/api/webhook/generate-mcq` (MCQ generation)
     - `/api/usage/chapter-status` (usage tracking)
     - `/api/payments/subscription-status` (subscription status)

5. **Locked Module UI:**
   - Displays warning banner when module is locked
   - Shows unlocked modules count
   - Provides link to dashboard
   - Prevents video/chat/quiz access

### 4. Dashboard Integration

#### Learning Path Tab (`app/dashboard/student/components/LearningPathTab.tsx`)

**Already Implemented:**
- `fetchSubscriptionStatus()` accepts `pathId` parameter
- Fetches subscription status per learning path: `/api/payments/subscription-status?learningPathId={id}`
- Updates when learning path changes
- Displays plan type, limits, and usage per learning path

**Real-Time Updates:**
- Subscription status refreshes when:
  - Learning path is activated
  - Payment is completed
  - Learning path changes

### 5. Access Control Rules

#### Module Unlocking Logic:
1. **Initial Payment:** Unlocks Module 1 (index 0)
2. **First Renewal:** Unlocks Module 2 (index 1)
3. **Second Renewal:** Unlocks Module 3 (index 2)
4. **And so on...**

#### Calculation:
```typescript
const subscriptionAgeMonths = Math.floor(
  (now.getTime() - subscription.startDate.getTime()) / (1000 * 60 * 60 * 24 * 30)
);
const unlockedCount = Math.max(1, subscriptionAgeMonths + 1);
```

**Note:** This is a simplified calculation. In production, you would count actual renewals by tracking payment history.

### 6. Backend Validation

**Current Implementation:**
- Frontend checks module access before rendering
- API endpoints accept `learningPathId` for scoped checks

**Recommended Enhancement:**
- Add backend validation in module/chapter access routes
- Prevent direct URL access to locked modules
- Return 403 Forbidden for locked content

**Example Implementation:**
```typescript
// In module/chapter access routes
const accessCheck = await checkModuleAccess(uniqueId, learningPathId, moduleIndex);
if (!accessCheck.hasAccess) {
  return NextResponse.json(
    { error: 'Module is locked', reason: accessCheck.reason },
    { status: 403 }
  );
}
```

### 7. UI Indicators

#### Locked Module Display:
- Orange/red warning banner
- Lock icon
- Clear message explaining why module is locked
- Unlocked modules count
- Link to dashboard for subscription management

#### Unlocked Module Display:
- Normal content rendering
- Full access to video, chat, and quiz features

### 8. Data Flow

```
1. User navigates to chapter page
   ↓
2. Page extracts learningPathId from API response
   ↓
3. Calls /api/modules/check-access with learningPathId + moduleIndex
   ↓
4. Backend checks subscription and calculates unlocked modules
   ↓
5. If locked: Show locked UI, prevent content access
   ↓
6. If unlocked: Render content, pass learningPathId to all APIs
   ↓
7. All API calls (chat, MCQ, usage) are scoped to learning path subscription
```

### 9. Testing Checklist

- [ ] Module 1 unlocks after initial payment
- [ ] Module 2 unlocks after first renewal
- [ ] Locked modules show warning UI
- [ ] Locked modules prevent content access
- [ ] learningPathId is extracted correctly from API
- [ ] learningPathId is passed to all API calls
- [ ] Dashboard shows correct subscription per learning path
- [ ] Subscription status updates in real-time
- [ ] Direct URL access to locked modules is prevented (if backend validation added)

### 10. Future Enhancements

1. **Renewal Tracking:**
   - Track actual renewals instead of subscription age
   - Store renewal count in subscription model
   - More accurate module unlocking

2. **Backend Validation:**
   - Add access checks to all module/chapter routes
   - Prevent API access to locked content
   - Return proper error responses

3. **Module Progress Tracking:**
   - Track which modules are completed
   - Unlock next module only after previous is completed
   - Add completion requirements

4. **Visual Indicators:**
   - Show locked/unlocked status in learning path view
   - Add progress indicators
   - Show unlock countdown or requirements

5. **Admin Tools:**
   - Manual module unlock capability
   - Override access for testing
   - Access audit logs

## Files Modified

1. `lib/utils/moduleAccessControl.ts` - New utility file
2. `app/api/modules/check-access/route.ts` - New API endpoint
3. `app/modules/youtube/[moduleId]/chapter/[chapterId]/page.tsx` - Updated frontend
4. `app/dashboard/student/components/LearningPathTab.tsx` - Already had per-learning-path support

## Notes

- Module locking is currently based on subscription age (simplified)
- For production, implement actual renewal counting
- Backend validation recommended but not yet implemented in all routes
- Frontend validation prevents UI access, but direct API calls may still work
- Consider adding backend middleware for comprehensive access control
