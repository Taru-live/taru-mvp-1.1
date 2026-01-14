# Per-Learning-Path Subscriptions Implementation

## Overview
This document describes the implementation of per-learning-path subscriptions, where users can have different subscription plans (Basic ₹99/month or Premium ₹199/month) for each learning path.

## Changes Made

### 1. Subscription Model (`models/Subscription.ts`)
- Added `learningPathId` field (optional, null for global subscriptions)
- Updated unique index to allow one subscription per user per learning path
- Supports both global subscriptions (learningPathId: null) and per-learning-path subscriptions

### 2. Payment Verification (`app/api/payments/verify/route.ts`)
- Creates/updates subscription per learning path based on `payment.learningPathId`
- **Automatically corrects planType based on amount paid:**
  - ₹99 → Basic Plan (3 chats/day/chapter, 3 MCQs/month/chapter)
  - ₹199 → Premium Plan (5 chats/day/chapter, 5 MCQs/month/chapter)
- Updates payment record with correct planType if mismatch detected

### 3. Subscription Status API (`app/api/payments/subscription-status/route.ts`)
- Accepts optional `learningPathId` query parameter
- Returns subscription for specific learning path if provided
- Falls back to global subscription if learning-path-specific not found

### 4. Payment Utilities (`lib/utils/paymentUtils.ts`)
- `canUseAIBuddy()` - Accepts optional `learningPathId` parameter
- `canGenerateMCQ()` - Accepts optional `learningPathId` parameter
- `getChapterUsageStatus()` - Accepts optional `learningPathId` parameter
- All functions check subscription for specific learning path first, then fallback to global

### 5. Payment Creation (`app/api/payments/create-order/route.ts`)
- Validates planType matches amount (₹99=basic, ₹199=premium)
- Stores `learningPathId` in payment record
- Includes `learningPathId` in Razorpay order notes

### 6. UI Updates (`app/dashboard/student/components/LearningPathTab.tsx`)
- Fetches subscription status with `learningPathId` parameter
- Displays plan and amount paid for current learning path
- Shows upgrade button only if not premium for that learning path
- Passes `learningPathId` to payment modal

## Plan Types and Limits

### Basic Plan (₹99/month)
- 3 AI Buddy chats per day per chapter
- 3 MCQ generations per month per chapter

### Premium Plan (₹199/month)
- 5 AI Buddy chats per day per chapter
- 5 MCQ generations per month per chapter

## Migration Script

To fix existing subscriptions with incorrect planType:

```bash
node scripts/fix-subscription-plan-types.js
```

This script will:
1. Find all active subscriptions
2. Check if planType matches planAmount
3. Correct planType based on planAmount:
   - ₹99 → basic
   - ₹199 → premium
4. Update dailyChatLimit and monthlyMcqLimit accordingly

## Usage Flow

1. **User selects learning path** → UI fetches subscription status with learningPathId
2. **User clicks upgrade/subscribe** → Payment modal opens with learningPathId
3. **Payment created** → Payment record includes learningPathId
4. **Payment verified** → Subscription created/updated for that learning path
5. **Usage checks** → System checks subscription for that learning path

## Database Schema

### Subscription
```javascript
{
  uniqueId: String,           // User's unique ID
  learningPathId: String,     // Learning path ID (null for global)
  planType: 'basic' | 'premium',
  planAmount: 99 | 199,
  dailyChatLimit: 3 | 5,
  monthlyMcqLimit: 3 | 5,
  // ... other fields
}
```

### Payment
```javascript
{
  uniqueId: String,
  learningPathId: String,     // Learning path ID (null for global)
  planType: 'basic' | 'premium',
  planAmount: 99 | 199,
  paymentFor: 'career_access' | 'learning_path_save',
  // ... other fields
}
```

## Important Notes

1. **PlanType Correction**: Payment verification automatically corrects planType based on amount paid. This ensures ₹199 payments always result in premium subscriptions.

2. **Backward Compatibility**: The system supports both:
   - Global subscriptions (learningPathId: null) for backward compatibility
   - Per-learning-path subscriptions (learningPathId: specific ID)

3. **Fallback Logic**: When checking subscriptions:
   - First checks for learning-path-specific subscription
   - Falls back to global subscription if not found
   - This allows gradual migration

4. **Usage Tracking**: Usage tracking remains per-chapter and is linked to subscription via subscriptionId. Multiple subscriptions can share the same usage tracking record.

## Testing Checklist

- [ ] Create payment for ₹99 → Should create Basic subscription
- [ ] Create payment for ₹199 → Should create Premium subscription
- [ ] Create payment for ₹199 with incorrect planType → Should be corrected to premium
- [ ] Subscribe to different plans for different learning paths
- [ ] Upgrade from basic to premium for a learning path
- [ ] Check subscription status with learningPathId parameter
- [ ] Verify limits are enforced per learning path
- [ ] Run migration script to fix existing subscriptions
