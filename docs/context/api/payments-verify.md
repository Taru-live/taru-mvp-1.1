# Payments Verify API Route Context

**Path:** `/api/payments/verify`  
**Method:** `POST`  
**File:** `app/api/payments/verify/route.ts`

## Purpose
Verifies Razorpay payment signature and creates/updates subscription. Handles payment completion, subscription creation, and usage tracking initialization.

## Request Body
```json
{
  "razorpay_order_id": "order_xxx",
  "razorpay_payment_id": "pay_xxx",
  "razorpay_signature": "signature_xxx",
  "paymentId": "payment_db_id (optional)"
}
```

## Response
**Success (200):**
```json
{
  "success": true,
  "message": "Payment verified successfully",
  "payment": {
    "id": "payment_id",
    "orderId": "order_xxx",
    "paymentId": "pay_xxx",
    "amount": 99,
    "planType": "basic",
    "status": "completed"
  }
}
```

**Error (400/401/404/500):**
```json
{
  "error": "string"
}
```

## Verification Flow
1. Validates JWT token from HTTP-only cookie
2. Verifies student exists and onboarding is completed
3. Finds payment record by order ID and student ID
4. Verifies Razorpay signature using HMAC SHA256
5. Updates payment status to "completed"
6. Determines plan type from payment amount
7. Creates or updates subscription
8. Initializes usage tracking
9. Links subscription to learning path if applicable
10. Handles plan upgrades (preserves learning paths saved count)

## Signature Verification
Uses HMAC SHA256 with Razorpay key secret:
```
signature = HMAC_SHA256(razorpay_order_id + "|" + razorpay_payment_id, RAZORPAY_KEY_SECRET)
```

## Subscription Creation
- Creates new subscription if none exists for learning path
- Updates existing subscription if renewal/upgrade
- Sets expiry date (1 month from start)
- Links to learning path if provided
- Preserves usage limits and learning paths saved count on upgrade

## Plan Determination
- ₹99 → Basic Plan
- ₹199 → Premium Plan
- Auto-corrects payment record if amount doesn't match plan type

## Dependencies
- MongoDB connection (`connectDB`)
- Student model
- Payment model
- Subscription model
- UsageTracking model
- `getPlanFromAmount` utility function
- Environment variables:
  - `RAZORPAY_KEY_SECRET`
  - `JWT_SECRET`

## Security
- JWT authentication required
- Razorpay signature verification (prevents tampering)
- Payment record validation
- Idempotent verification (can be called multiple times safely)

## Related Routes
- `/api/payments/create-order` - Create payment order
- `/api/payments/subscription-status` - Check subscription status
- `/api/payments/create-learning-path-order` - Create order for learning path saves

## Notes
- Payment verification is idempotent (safe to retry)
- Automatically corrects plan type if payment amount doesn't match
- Preserves learning paths saved count when upgrading plans
- Creates usage tracking record with zero usage on first payment
- Links subscription to learning path when learningPathId is provided
