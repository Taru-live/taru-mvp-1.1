# Razorpay Payment Integration - Testing Guide

## Prerequisites

1. **Environment Variables** (`.env.local`):
   ```env
   RAZORPAY_KEY_ID=your_razorpay_key_id
   RAZORPAY_KEY_SECRET=your_razorpay_secret
   JWT_SECRET=your_jwt_secret
   MONGODB_URI=your_mongodb_connection_string
   ```

2. **Razorpay Test Credentials**:
   - Use Razorpay test mode for testing
   - Test card: `4111 1111 1111 1111`
   - CVV: Any 3 digits
   - Expiry: Any future date

3. **Database Setup**:
   - Ensure MongoDB is running
   - Run cleanup script if needed: `node scripts/cleanup-orphaned-payments.js`

## Test Scenarios

### 1. Initial Payment Flow (Career Options → Payment → Career Details)

#### Test Case 1.1: Basic Plan Payment
**Steps**:
1. Navigate to `/career-exploration`
2. Click "Learn More" on any career option
3. Verify payment modal appears
4. Select Basic plan (₹99)
5. Complete Razorpay payment with test card
6. Verify redirect to Career Details page
7. Verify Career Details loads successfully

**Expected Results**:
- ✅ Payment modal shows Basic plan selected
- ✅ Razorpay checkout opens
- ✅ Payment completes successfully
- ✅ Redirects to Career Details
- ✅ Career Details page loads with full content

#### Test Case 1.2: Premium Plan Payment
**Steps**:
1. Navigate to `/career-exploration`
2. Click "Learn More" on any career option
3. Select Premium plan (₹199)
4. Complete Razorpay payment
5. Verify redirect to Career Details

**Expected Results**:
- ✅ Premium plan selected
- ✅ Payment amount is ₹199
- ✅ Redirects successfully after payment

#### Test Case 1.3: Plan Switching Before Payment
**Steps**:
1. Navigate to `/career-exploration`
2. Click "Learn More"
3. Select Basic plan
4. Switch to Premium plan
5. Complete payment

**Expected Results**:
- ✅ Plan selection updates correctly
- ✅ Payment amount updates to ₹199
- ✅ Payment processes with Premium plan

### 2. Direct URL Access Protection

#### Test Case 2.1: Access Without Payment
**Steps**:
1. Logout or use incognito mode
2. Navigate directly to: `/career-details?careerPath=Software%20Engineer&description=Test`
3. Observe behavior

**Expected Results**:
- ✅ API returns 403 error
- ✅ Frontend shows error message
- ✅ Redirects to Career Exploration page
- ✅ Payment prompt appears

#### Test Case 2.2: Access After Payment
**Steps**:
1. Complete payment flow (Test Case 1.1)
2. Navigate directly to Career Details URL
3. Verify access

**Expected Results**:
- ✅ Career Details page loads successfully
- ✅ No payment prompt
- ✅ Full content accessible

### 3. Learning Path Save Restrictions

#### Test Case 3.1: First Learning Path Save
**Steps**:
1. Complete payment (Basic or Premium)
2. Navigate to Career Details
3. Click "Save Learning Path"
4. Verify save succeeds

**Expected Results**:
- ✅ Learning path saves successfully
- ✅ Success message appears
- ✅ Learning path appears in Dashboard

#### Test Case 3.2: Second Learning Path Save (Should Fail)
**Steps**:
1. After saving first learning path (Test Case 3.1)
2. Navigate to another Career Details page
3. Click "Save Learning Path"
4. Observe behavior

**Expected Results**:
- ✅ Save fails with error message
- ✅ Payment modal appears
- ✅ Error message: "You have reached the limit for saving learning paths"

#### Test Case 3.3: Payment for Additional Learning Path
**Steps**:
1. After Test Case 3.2 (save blocked)
2. Complete payment in modal
3. Verify save retries automatically
4. Verify learning path saves

**Expected Results**:
- ✅ Payment completes successfully
- ✅ Learning path saves after payment
- ✅ Counter increments correctly

### 4. Usage Limits - AI Buddy Chats

#### Test Case 4.1: Basic Plan Chat Limit (3/day/chapter)
**Steps**:
1. Subscribe to Basic plan
2. Navigate to any chapter page
3. Use AI Buddy chat 3 times
4. Attempt 4th chat

**Expected Results**:
- ✅ First 3 chats work successfully
- ✅ 4th chat blocked with error message
- ✅ Error: "Daily chat limit reached"
- ✅ Chat input disabled
- ✅ Remaining chats shown as 0

#### Test Case 4.2: Premium Plan Chat Limit (5/day/chapter)
**Steps**:
1. Subscribe to Premium plan
2. Navigate to any chapter page
3. Use AI Buddy chat 5 times
4. Attempt 6th chat

**Expected Results**:
- ✅ First 5 chats work successfully
- ✅ 6th chat blocked
- ✅ Limit correctly enforced

#### Test Case 4.3: Daily Reset
**Steps**:
1. Use all 3 chats (Basic plan)
2. Wait until next day (or manually adjust date)
3. Verify chats reset

**Expected Results**:
- ✅ Daily limit resets at midnight
- ✅ Can use chats again next day
- ✅ Counter resets correctly

#### Test Case 4.4: Per-Chapter Limit
**Steps**:
1. Use 3 chats in Chapter 1
2. Navigate to Chapter 2
3. Verify can use 3 more chats

**Expected Results**:
- ✅ Each chapter has separate daily limit
- ✅ Can use full limit in each chapter
- ✅ Limits tracked independently

### 5. Usage Limits - MCQ Generation

#### Test Case 5.1: Basic Plan MCQ Limit (3/month)
**Steps**:
1. Subscribe to Basic plan
2. Navigate to any chapter Quiz tab
3. Generate MCQ 3 times
4. Attempt 4th generation

**Expected Results**:
- ✅ First 3 MCQs generate successfully
- ✅ 4th generation blocked
- ✅ Error: "Monthly MCQ limit reached"
- ✅ Generate button disabled

#### Test Case 5.2: Premium Plan MCQ Limit (5/month)
**Steps**:
1. Subscribe to Premium plan
2. Generate MCQ 5 times
3. Attempt 6th generation

**Expected Results**:
- ✅ First 5 MCQs generate successfully
- ✅ 6th generation blocked
- ✅ Limit correctly enforced

#### Test Case 5.3: Monthly Reset
**Steps**:
1. Use all 3 MCQs (Basic plan)
2. Wait until next month (or manually adjust date)
3. Verify MCQs reset

**Expected Results**:
- ✅ Monthly limit resets on 1st of month
- ✅ Can generate MCQs again
- ✅ Counter resets correctly

### 6. Plan Upgrade/Downgrade

#### Test Case 6.1: Upgrade Basic to Premium
**Steps**:
1. Subscribe to Basic plan
2. Use 2 chats and 2 MCQs
3. Navigate to Career Exploration
4. Click "Learn More" (or use payment modal)
5. Select Premium plan
6. Complete payment

**Expected Results**:
- ✅ Subscription updates to Premium
- ✅ Limits increase to 5/5
- ✅ Can use 3 more chats (5 total)
- ✅ Can use 3 more MCQs (5 total)
- ✅ Learning paths saved count preserved
- ✅ Subscription period extends by 1 month

#### Test Case 6.2: Downgrade Premium to Basic
**Steps**:
1. Subscribe to Premium plan
2. Use 4 chats and 4 MCQs
3. Make new payment selecting Basic plan
4. Verify limits decrease

**Expected Results**:
- ✅ Subscription updates to Basic
- ✅ Limits decrease to 3/3
- ✅ If usage exceeds new limits, further usage blocked
- ✅ Learning paths saved count preserved

### 7. Subscription Expiry

#### Test Case 7.1: Expired Subscription Access
**Steps**:
1. Complete payment
2. Manually expire subscription in database (set expiryDate to past)
3. Attempt to access Career Details
4. Attempt to use AI Buddy
5. Attempt to generate MCQ

**Expected Results**:
- ✅ Career Details access blocked
- ✅ AI Buddy access blocked
- ✅ MCQ generation blocked
- ✅ Error messages indicate expired subscription
- ✅ Payment prompt appears

### 8. Payment Verification & Security

#### Test Case 8.1: Payment Signature Verification
**Steps**:
1. Complete payment
2. Verify payment record in database
3. Check signature stored correctly

**Expected Results**:
- ✅ Payment signature verified server-side
- ✅ Invalid signatures rejected
- ✅ Payment status updated correctly

#### Test Case 8.2: Duplicate Payment Handling
**Steps**:
1. Initiate payment
2. Complete payment
3. Attempt to create duplicate order with same orderId

**Expected Results**:
- ✅ Duplicate orders detected
- ✅ Existing payment returned
- ✅ No duplicate records created

### 9. UI/UX Verification

#### Test Case 9.1: Payment Modal
**Steps**:
1. Trigger payment modal
2. Verify UI elements

**Expected Results**:
- ✅ Modal opens correctly
- ✅ Plan selection visible
- ✅ Plan features displayed
- ✅ Amount shown correctly
- ✅ Loading states during payment
- ✅ Success/failure messages clear

#### Test Case 9.2: Usage Display
**Steps**:
1. Navigate to chapter page
2. Check usage displays

**Expected Results**:
- ✅ Remaining chats shown in header
- ✅ Remaining MCQs shown in quiz section
- ✅ Color coding (green/orange/red)
- ✅ Updates after usage

#### Test Case 9.3: Disabled States
**Steps**:
1. Reach chat limit
2. Reach MCQ limit
3. Verify UI states

**Expected Results**:
- ✅ Chat input disabled when limit reached
- ✅ MCQ button disabled when limit reached
- ✅ Clear visual indicators
- ✅ Helpful error messages

### 10. Database Verification

#### Test Case 10.1: Payment Records
**Steps**:
1. Complete payment
2. Check MongoDB Payment collection

**Expected Results**:
- ✅ Payment record created
- ✅ Order ID stored
- ✅ Payment ID stored
- ✅ Signature stored
- ✅ Status: "completed"
- ✅ Plan type and amount correct

#### Test Case 10.2: Subscription Records
**Steps**:
1. Complete payment
2. Check MongoDB Subscription collection

**Expected Results**:
- ✅ Subscription record created/updated
- ✅ Plan type correct
- ✅ Start/expiry dates correct
- ✅ Limits set correctly
- ✅ Learning paths saved: 0 initially

#### Test Case 10.3: Usage Tracking
**Steps**:
1. Use AI Buddy chat
2. Generate MCQ
3. Save learning path
4. Check MongoDB UsageTracking collection

**Expected Results**:
- ✅ Daily chat usage tracked per chapter
- ✅ Monthly MCQ usage tracked
- ✅ Learning paths saved count tracked
- ✅ Usage increments correctly

## Automated Testing Scripts

### Database Verification Script
```javascript
// scripts/verify-payment-integration.js
const mongoose = require('mongoose');
const Payment = require('../models/Payment');
const Subscription = require('../models/Subscription');
const UsageTracking = require('../models/UsageTracking');

async function verifyIntegration() {
  await mongoose.connect(process.env.MONGODB_URI);
  
  // Check payments
  const payments = await Payment.find({ status: 'completed' });
  console.log(`✅ Found ${payments.length} completed payments`);
  
  // Check subscriptions
  const subscriptions = await Subscription.find({ isActive: true });
  console.log(`✅ Found ${subscriptions.length} active subscriptions`);
  
  // Check usage tracking
  const usageTracking = await UsageTracking.find();
  console.log(`✅ Found ${usageTracking.length} usage tracking records`);
  
  await mongoose.disconnect();
}
```

## Common Issues & Solutions

### Issue 1: Payment Order Creation Fails
**Symptoms**: "Payment order creation failed" error
**Solutions**:
- Check Razorpay credentials in `.env.local`
- Verify network connectivity
- Check server logs for detailed error
- Run cleanup script for orphaned payments

### Issue 2: Duplicate Key Error
**Symptoms**: `E11000 duplicate key error`
**Solutions**:
- Run cleanup script: `node scripts/cleanup-orphaned-payments.js`
- Check for null orderIds in database
- Verify order creation logic

### Issue 3: Usage Limits Not Enforcing
**Symptoms**: Can exceed limits
**Solutions**:
- Verify backend API calls check limits
- Check usage tracking records
- Verify subscription expiry dates

### Issue 4: Plan Upgrade Not Working
**Symptoms**: Limits don't update after upgrade
**Solutions**:
- Check payment verification logic
- Verify subscription update in database
- Check frontend subscription status fetch

## Performance Testing

### Load Testing
- Test multiple concurrent payments
- Test usage limit checks under load
- Test subscription status queries

### Stress Testing
- Test with expired subscriptions
- Test with multiple learning paths
- Test with high usage counts

## Security Testing

### Test Cases
1. **Payment Signature Tampering**: Attempt to modify payment signature
2. **Unauthorized Access**: Try to access Career Details without payment
3. **API Manipulation**: Try to bypass limits via direct API calls
4. **Token Tampering**: Try to use invalid/expired tokens

**Expected Results**:
- ✅ All security checks pass
- ✅ Invalid requests rejected
- ✅ Proper error messages
- ✅ No sensitive data exposed

## Monitoring & Logging

### Key Metrics to Monitor
1. Payment success rate
2. Payment failure reasons
3. Usage limit hits
4. Subscription expiry events
5. Plan upgrade/downgrade frequency

### Logging Points
- Payment order creation
- Payment verification
- Usage limit checks
- Subscription updates
- Error conditions

## Post-Deployment Checklist

- [ ] Verify Razorpay production credentials
- [ ] Test payment flow end-to-end
- [ ] Verify all usage limits enforced
- [ ] Check database indexes created
- [ ] Monitor error logs
- [ ] Set up alerts for payment failures
- [ ] Document any customizations
- [ ] Train support team on payment issues
