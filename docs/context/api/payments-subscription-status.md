# Payments Subscription Status API Route Context

**Path:** `/api/payments/subscription-status`  
**Method:** `GET`  
**File:** `app/api/payments/subscription-status/route.ts`

## Purpose
Returns current subscription status, usage information, and limits for a student. Supports per-learning-path subscription lookup. Provides free access for linked students.

## Query Parameters
- `learningPathId` (optional): Learning path ID to check subscription for

## Response
**Success (200):**
```json
{
  "success": true,
  "hasSubscription": true,
  "isLinkedStudent": false,
  "subscription": {
    "planType": "basic",
    "planAmount": 99,
    "learningPathId": "path_id",
    "startDate": "2024-01-01T00:00:00.000Z",
    "expiryDate": "2024-02-01T00:00:00.000Z",
    "isActive": true,
    "dailyChatLimit": 3,
    "monthlyMcqLimit": 3,
    "learningPathsSaved": 0,
    "maxLearningPathsPerPayment": 1
  },
  "usage": {
    "dailyChatsUsed": 1,
    "dailyChatsRemaining": 2,
    "monthlyMcqsUsed": 0,
    "monthlyMcqsRemaining": 3,
    "canSaveLearningPath": true,
    "learningPathsSaved": 0
  }
}
```

**No Subscription (200):**
```json
{
  "success": true,
  "hasSubscription": false,
  "subscription": null,
  "usage": null
}
```

**Error (401/404/500):**
```json
{
  "error": "string"
}
```

## Flow
1. Validates JWT token from HTTP-only cookie
2. Verifies student exists and onboarding is completed
3. Checks if student is linked to teacher/organization (free access)
4. Looks up subscription per learning path (if learningPathId provided)
5. Auto-corrects subscription from most recent payment if needed
6. Calculates usage statistics (chats, MCQs, learning paths)
7. Returns subscription status and usage information

## Linked Student Free Access
Students linked to teachers/organizations get free access with:
- Unlimited AI Buddy chats
- Unlimited MCQ generations
- Unlimited learning path saves
- No subscription required

## Subscription Lookup Priority
1. Learning-path-specific subscription (if learningPathId provided)
2. Most recent subscription for student
3. Auto-correction from most recent payment if subscription data is incorrect

## Usage Calculation
- **Daily Chats**: Counts chats used today per chapter
- **Monthly MCQs**: Counts MCQs generated this month per chapter
- **Learning Paths Saved**: Counts learning paths saved for current payment cycle
- **Can Save Learning Path**: Checks if limit reached (1 per payment)

## Auto-Correction
If subscription data is incorrect, automatically corrects from most recent verified payment:
- Plan type
- Plan amount
- Usage limits
- Learning path ID

## Dependencies
- MongoDB connection (`connectDB`)
- Student model
- Subscription model
- UsageTracking model
- Payment model
- Utility functions:
  - `getPlanFromAmount`
  - `getMostRecentCompletedPayment`
  - `correctSubscriptionFromPayment`
  - `isStudentLinked`

## Security
- JWT authentication required
- Student-scoped access only
- Per-learning-path subscription resolution

## Related Routes
- `/api/payments/create-order` - Create payment order
- `/api/payments/verify` - Verify payment
- `/api/payments/create-learning-path-order` - Create order for learning path saves

## Notes
- Returns free access for linked students automatically
- Supports per-learning-path subscription lookup
- Auto-corrects subscription data from payments
- Calculates real-time usage statistics
- Handles both basic and premium plan limits
