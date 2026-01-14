# Razorpay Payment Integration Guide

## Overview

This document describes the Razorpay payment gateway integration for the Taru Learning Platform. The integration enables subscription-based access control, usage limits, and learning path management.

## Features

1. **Payment Flow**: Payment modal appears after Career Options page when accessing Career Details
2. **Subscription Plans**: 
   - Basic Plan (₹99/month): 3 AI Buddy chats/day/chapter, 3 MCQ generations/month
   - Premium Plan (₹199/month): 5 AI Buddy chats/day/chapter, 5 MCQ generations/month
3. **Access Control**: Career Details page requires active subscription
4. **Learning Path Restrictions**: One learning path save per payment
5. **Usage Tracking**: Backend enforcement of chat and MCQ limits
6. **Dashboard Integration**: Subscription status and usage displayed in Student Dashboard

## Environment Variables

Add the following environment variables to your `.env.local` file:

```env
# Razorpay Configuration
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret

# JWT Secret (if not already set)
JWT_SECRET=your_jwt_secret
```

## Database Models

### Payment Model (`models/Payment.ts`)
- Tracks all payment transactions
- Stores Razorpay order IDs, payment IDs, and signatures
- Links payments to subscriptions and learning path saves

### Subscription Model (`models/Subscription.ts`)
- Manages active subscriptions
- Tracks plan type, start/expiry dates
- Enforces usage limits (chats, MCQs, learning paths)

### UsageTracking Model (`models/UsageTracking.ts`)
- Records daily chat usage per chapter
- Tracks monthly MCQ generation count
- Monitors learning paths saved count

## API Endpoints

### 1. Create Payment Order
**POST** `/api/payments/create-order`

Creates a Razorpay order for subscription payment.

**Request Body:**
```json
{
  "planType": "basic" | "premium",
  "paymentFor": "career_access" | "learning_path_save",
  "learningPathId": "optional_path_id"
}
```

**Response:**
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

### 2. Verify Payment
**POST** `/api/payments/verify`

Verifies Razorpay payment signature and creates/updates subscription.

**Request Body:**
```json
{
  "razorpay_order_id": "order_xxx",
  "razorpay_payment_id": "pay_xxx",
  "razorpay_signature": "signature_xxx",
  "paymentId": "payment_db_id"
}
```

**Response:**
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

### 3. Subscription Status
**GET** `/api/payments/subscription-status`

Returns current subscription status and usage information.

**Response:**
```json
{
  "success": true,
  "hasSubscription": true,
  "subscription": {
    "planType": "basic",
    "planAmount": 99,
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

### 4. Create Learning Path Payment Order
**POST** `/api/payments/create-learning-path-order`

Creates a Razorpay order for saving additional learning paths.

**Request Body:**
```json
{
  "learningPathId": "optional_path_id",
  "planType": "basic" | "premium"
}
```

## Payment Flow

1. **Career Options Page** → User clicks "Learn More" on a career option
2. **Subscription Check** → System checks if user has active subscription
3. **Payment Modal** → If no subscription, payment modal appears
4. **Razorpay Checkout** → User completes payment via Razorpay
5. **Payment Verification** → Backend verifies payment signature
6. **Subscription Creation** → Active subscription created/updated
7. **Access Granted** → User can now access Career Details page

## Access Control

### Career Details Page
- Protected route requiring active subscription
- Returns 403 error if subscription is missing or expired
- Frontend redirects to Career Options with payment prompt

### Learning Path Save
- Checks if user has reached save limit (1 per payment)
- Returns 403 error if limit reached
- Shows payment modal for additional saves

### AI Buddy Chat
- Checks daily chat limit per chapter
- Returns 403 error if limit exceeded
- Records usage after successful chat

### MCQ Generation
- Checks monthly MCQ limit
- Returns 403 error if limit exceeded
- Records usage after successful generation

## Usage Tracking

### Daily Chat Usage
- Tracked per chapter per day
- Resets at midnight
- Enforced at backend level

### Monthly MCQ Usage
- Tracked per calendar month
- Resets on 1st of each month
- Enforced at backend level

### Learning Path Saves
- Tracked per subscription payment
- One save allowed per payment
- Additional saves require new payment

## Frontend Components

### RazorpayPaymentModal (`components/RazorpayPaymentModal.tsx`)
- Payment modal component
- Handles Razorpay checkout integration
- Shows plan features and pricing
- Displays payment success/failure states

### Career Exploration Page Updates
- Checks subscription status on mount
- Shows payment modal when accessing Career Details without subscription
- Handles payment success callback

### Student Dashboard Updates
- Displays subscription status
- Shows usage limits and remaining counts
- Provides payment option for additional learning paths

## Testing

### Test Mode
Use Razorpay test credentials:
- Key ID: `rzp_test_xxx`
- Key Secret: `rzp_test_xxx`

### Test Cards
- Success: `4111 1111 1111 1111`
- Failure: `4000 0000 0000 0002`

## Security Considerations

1. **Payment Verification**: All payments are verified server-side using Razorpay signatures
2. **JWT Authentication**: All API endpoints require valid JWT tokens
3. **HTTPS**: Ensure HTTPS is enabled in production
4. **Environment Variables**: Never commit Razorpay credentials to version control
5. **Signature Verification**: Always verify payment signatures before processing

## Error Handling

### Payment Failures
- User sees error message in payment modal
- Payment record marked as "failed"
- User can retry payment

### Subscription Expiry
- System automatically deactivates expired subscriptions
- User must make new payment to continue access
- Usage limits enforced even after expiry

### Network Errors
- Payment modal shows error message
- User can retry payment
- No partial state created

## Monitoring

### Payment Metrics
- Track successful vs failed payments
- Monitor subscription renewal rates
- Analyze usage patterns

### Usage Analytics
- Daily chat usage per user
- Monthly MCQ generation trends
- Learning path save frequency

## Troubleshooting

### Payment Not Processing
1. Check Razorpay credentials in environment variables
2. Verify Razorpay script is loaded in browser
3. Check browser console for errors
4. Verify payment signature verification logic

### Subscription Not Activating
1. Check payment verification endpoint logs
2. Verify subscription creation logic
3. Check database for payment records
4. Verify JWT token validity

### Usage Limits Not Enforcing
1. Check usage tracking records in database
2. Verify usage check functions
3. Check API endpoint error handling
4. Verify frontend error display

## Support

For Razorpay-specific issues, refer to:
- [Razorpay Documentation](https://razorpay.com/docs/)
- [Razorpay Orders API](https://razorpay.com/docs/api/orders/)
- [Razorpay Payment Verification](https://razorpay.com/docs/payments/server-integration/nodejs/payment-gateway/build-integration/)
