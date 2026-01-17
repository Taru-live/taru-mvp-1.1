# Payments Create Learning Path Order API Route Context

**Path:** `/api/payments/create-learning-path-order`  
**Method:** `POST`  
**File:** `app/api/payments/create-learning-path-order/route.ts`

## Purpose
Creates a Razorpay payment order specifically for saving additional learning paths. Used when a student has reached their learning path save limit and wants to save more.

## Request Body
```json
{
  "learningPathId": "string (optional)",
  "planType": "basic" | "premium"
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
4. Creates payment record with `paymentFor: "learning_path_save"`
5. Creates Razorpay order
6. Returns order details for frontend payment modal

## Use Case
When a student has already saved their allowed learning paths (1 per payment) and wants to save additional learning paths, they need to make a new payment.

## Plan Types
- **Basic Plan**: ₹99
- **Premium Plan**: ₹199

Note: The plan type determines the payment amount but doesn't affect learning path save limits (always 1 per payment).

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
- `/api/payments/subscription-status` - Check subscription status and learning path save limit
- `/api/payments/create-order` - Create order for career access

## Notes
- Specifically for learning path save payments
- Learning path ID is optional (can be provided for tracking)
- Payment amount matches plan type (₹99 or ₹199)
- After verification, student can save one additional learning path
