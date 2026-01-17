# Modules Check Access API Route Context

**Path:** `/api/modules/check-access`  
**Method:** `GET` | `POST`  
**File:** `app/api/modules/check-access/route.ts`

## Purpose
Checks if a student has access to a specific module or chapter. Validates subscription status and module unlock rules. Returns access status and unlock requirements.

## Request Body (POST) / Query Parameters (GET)
- `moduleId` (required): Module ID to check
- `chapterId` (optional): Chapter ID to check (inherits from module)
- `learningPathId` (required): Learning path ID for subscription lookup

## Response
**Success (200):**
```json
{
  "success": true,
  "hasAccess": true,
  "isLocked": false,
  "moduleIndex": 0,
  "unlockedModulesCount": 1,
  "unlockRequirement": null
}
```

**Locked Module (200):**
```json
{
  "success": true,
  "hasAccess": false,
  "isLocked": true,
  "moduleIndex": 2,
  "unlockedModulesCount": 1,
  "unlockRequirement": {
    "type": "renewal",
    "requiredRenewals": 2,
    "currentRenewals": 0,
    "message": "Unlock after 2 renewal cycles"
  }
}
```

## Access Control Rules
- **Module 1 (index 0)**: Unlocked after initial payment
- **Module 2 (index 1)**: Unlocked after first renewal cycle
- **Module 3 (index 2)**: Unlocked after second renewal cycle
- **And so on...**

## Unlock Calculation
Based on subscription age in months (simplified):
- Initial payment unlocks Module 1
- Each renewal cycle (1 month) unlocks next module
- For production, implement actual renewal counting

## Flow
1. Validates JWT token from HTTP-only cookie
2. Verifies student exists
3. Gets module index from learning path structure
4. Checks subscription status for learning path
5. Calculates unlocked modules count
6. Determines if requested module is unlocked
7. Returns access status and unlock requirements

## Chapter Access
- Chapters inherit access from their parent module
- If module is locked, all chapters are locked
- If module is unlocked, all chapters are accessible

## Dependencies
- MongoDB connection (`connectDB`)
- Student model
- Subscription model
- LearningPath model
- Module model
- `checkModuleAccess` utility function
- `checkChapterAccess` utility function

## Security
- JWT authentication required
- Student-scoped access
- Per-learning-path subscription lookup
- Prevents access to locked modules

## Related Routes
- `/api/modules/[id]` - Get module details
- `/api/payments/subscription-status` - Check subscription status
- `/api/payments/create-order` - Create payment for access

## Notes
- Returns detailed unlock requirements for locked modules
- Supports both module and chapter access checks
- Per-learning-path subscription resolution
- Module index calculated from learning path structure
