# Payments Create Order API Route Context

**Path:** `/api/payments/create-order`  
**Method:** `POST`  
**File:** `app/api/payments/create-order/route.ts`

## Purpose
Creates a Razorpay payment order for subscription plans. Supports both career access and learning path save payments. Handles initial subscriptions and upgrades/renewals.

## Request Body
```json
{
  "planType": "basic" | "premium",
  "paymentFor": "career_access" | "learning_path_save",
  "learningPathId": "string (optional)"
}
```

## Response
**Success (200):**
```json
{
  "success": true,
  "orderId": "order_xxx",
  "amount": 99,
  "currency": "INR",
  "keyId": "rzp_test_xxx",
  "paymentId": "payment_db_id"
}
```

**Error (400/401/404/500):**
```json
{
  "error": "string"
}
```

## Payment Flow
1. Validates JWT token from HTTP-only cookie
2. Verifies student exists and onboarding is completed
3. Validates plan type (basic: ₹99, premium: ₹199)
4. Validates payment purpose (career_access or learning_path_save)
5. Creates payment record in database
6. Creates Razorpay order
7. Returns order details for frontend payment modal

## Plan Types
- **Basic Plan**: ₹99/month
  - 3 AI Buddy chats per day per chapter
  - 3 MCQ generations per month per chapter
- **Premium Plan**: ₹199/month
  - 5 AI Buddy chats per day per chapter
  - 5 MCQ generations per month per chapter

## Payment Purposes
- **career_access**: Payment for accessing career details page
  - If `learningPathId` provided: Upgrade/renewal for existing learning path
  - If not provided: Initial access, subscription linked when learning path is created
- **learning_path_save**: Payment for saving additional learning paths

## Dependencies
- MongoDB connection (`connectDB`)
- Student model
- Payment model
- Razorpay SDK
- Environment variables:
  - `RAZORPAY_KEY_ID`
  - `RAZORPAY_KEY_SECRET`
  - `JWT_SECRET`

## Security
- JWT authentication required
- HTTP-only cookie for token
- Student must have completed onboarding
- Payment records stored before order creation

## Related Routes
- `/api/payments/verify` - Verify payment after completion
- `/api/payments/subscription-status` - Check subscription status
- `/api/payments/create-learning-path-order` - Create order for learning path saves

## Notes
- Payment record is created with status "pending" before Razorpay order
- Order amount matches plan type (₹99 or ₹199)
- Supports both initial subscriptions and renewals/upgrades
- Learning path ID is optional for career_access payments
