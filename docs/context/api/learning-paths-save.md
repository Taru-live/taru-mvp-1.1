# Learning Paths Save API Route Context

**Path:** `/api/learning-paths/save`  
**Method:** `POST`  
**File:** `app/api/learning-paths/save/route.ts`

## Purpose
Saves a learning path for a student. Enforces payment-based restrictions (one learning path save per payment). Links subscription to learning path if applicable.

## Request Body
```json
{
  "title": "string",
  "description": "string",
  "careerPath": "string",
  "modules": [
    {
      "moduleId": "module_id",
      "order": 1
    }
  ],
  "learningPathId": "string (optional)"
}
```

## Response
**Success (200):**
```json
{
  "success": true,
  "learningPath": {
    "_id": "path_id",
    "studentId": "student_id",
    "title": "string",
    "status": "active",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**Payment Required (403):**
```json
{
  "error": "Payment required to save learning path",
  "requiresPayment": true,
  "canSaveLearningPath": false
}
```

**Error (400/401/500):**
```json
{
  "error": "string"
}
```

## Save Restrictions
- **One save per payment**: Students can save one learning path per payment
- **Payment verification**: Requires active subscription or payment
- **Linked students**: Free access for students linked to teachers/organizations

## Flow
1. Validates JWT token from HTTP-only cookie
2. Verifies student exists and onboarding is completed
3. Checks if student can save learning path (payment check)
4. Validates learning path data
5. Creates or updates learning path
6. Links subscription to learning path if applicable
7. Increments learning paths saved count
8. Returns saved learning path

## Payment Check
Uses `canSaveLearningPath` utility:
- Checks subscription status
- Verifies learning paths saved count
- Enforces limit (1 per payment)
- Grants free access to linked students

## Subscription Linking
- Links subscription to learning path if payment was for career_access
- Updates subscription with learning path ID
- Enables per-learning-path subscription management

## Dependencies
- MongoDB connection (`connectDB`)
- Student model
- LearningPath model (if exists)
- Subscription model
- Payment model
- `canSaveLearningPath` utility function

## Security
- JWT authentication required
- Student-scoped access
- Payment verification required
- Enforces save limits

## Related Routes
- `/api/payments/create-order` - Create payment order
- `/api/payments/verify` - Verify payment
- `/api/payments/subscription-status` - Check subscription and save limit
- `/api/learning-paths` - List learning paths

## Notes
- Enforces one learning path save per payment
- Links subscription to learning path
- Free access for linked students
- Updates usage tracking (learningPathsSaved count)
