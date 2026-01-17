import connectDB from '@/lib/mongodb';
import Subscription from '@/models/Subscription';
import UsageTracking from '@/models/UsageTracking';
import Payment from '@/models/Payment';
import Student from '@/models/Student';

/**
 * Check if a student is linked to a teacher or organization
 * 
 * FREE ACCESS RULE: Linked students bypass all subscription and payment checks.
 * This is enforced server-side and cannot be bypassed from the frontend.
 * 
 * A student is considered "linked" if:
 * - student.teacherId is set (linked to a teacher), OR
 * - student.organizationId is set (linked to an organization), OR
 * - student.createdBy.type is 'teacher' or 'organization', OR
 * - student.managedBy.type is 'teacher' or 'organization'
 * 
 * @param uniqueId - Student unique ID (Student.uniqueId)
 * @returns Promise<boolean> - true if student is linked to teacher or organization
 * 
 * SECURITY: This check is performed server-side in all subscription/usage functions.
 * Frontend should never determine free access - always check server-side.
 */
export async function isStudentLinked(uniqueId: string): Promise<boolean> {
  try {
    await connectDB();
    
    const student = await Student.findOne({ uniqueId });
    
    if (!student) {
      return false;
    }
    
    // Check if student is linked to a teacher or organization
    // Primary checks: teacherId and organizationId fields
    const isLinkedToTeacher = !!(student.teacherId && student.teacherId.trim() !== '');
    const isLinkedToOrganization = !!(student.organizationId && student.organizationId.trim() !== '');
    
    // Secondary checks: createdBy/managedBy fields as additional indicators
    // These ensure students created by teachers/organizations are also considered linked
    const isCreatedByTeacher = student.createdBy?.type === 'teacher';
    const isCreatedByOrganization = student.createdBy?.type === 'organization';
    const isManagedByTeacher = student.managedBy?.type === 'teacher';
    const isManagedByOrganization = student.managedBy?.type === 'organization';
    
    return isLinkedToTeacher || isLinkedToOrganization || 
           isCreatedByTeacher || isCreatedByOrganization ||
           isManagedByTeacher || isManagedByOrganization;
  } catch (error) {
    console.error('Error checking if student is linked:', error);
    return false;
  }
}

/**
 * Map payment amount to plan type and limits
 * This is the single source of truth for plan determination
 * ₹99 = Basic plan, ₹199 = Premium plan
 */
export function getPlanFromAmount(amount: number): {
  planType: 'basic' | 'premium';
  planAmount: number;
  dailyChatLimit: number;
  monthlyMcqLimit: number;
} {
  // Use amount as single source of truth
  const actualAmount = amount || 0;
  
  if (actualAmount === 199) {
    return {
      planType: 'premium',
      planAmount: 199,
      dailyChatLimit: 5,
      monthlyMcqLimit: 5
    };
  } else {
    // Default to basic for ₹99 or any other amount
    return {
      planType: 'basic',
      planAmount: 99,
      dailyChatLimit: 3,
      monthlyMcqLimit: 3
    };
  }
}

/**
 * Get the most recent completed payment for a student
 * This is used as the source of truth for subscription status
 * @param uniqueId - Student unique ID
 * @param learningPathId - Optional learning path ID to scope the payment lookup
 */
export async function getMostRecentCompletedPayment(
  uniqueId: string, 
  learningPathId?: string | null
): Promise<any> {
  try {
    await connectDB();
    
    // Build query - scope to learning path if provided
    const query: any = {
      uniqueId,
      status: 'completed',
      paymentFor: 'career_access' // Only career access payments create subscriptions
    };
    
    // CRITICAL: If learningPathId is provided, only fetch payments for that specific path
    // This ensures subscriptions are scoped to individual learning paths
    if (learningPathId) {
      // Normalize learningPathId to string for comparison
      const normalizedLearningPathId = learningPathId.toString();
      
      // Check both learningPathId field and metadata.learningPathId
      // Some payments might have it stored in metadata
      query.$or = [
        { learningPathId: normalizedLearningPathId },
        { 'metadata.learningPathId': normalizedLearningPathId }
      ];
    }
    
    const payment = await Payment.findOne(query).sort({ completedAt: -1 });
    
    if (payment && learningPathId) {
      console.log(`💰 Found payment for learning path "${learningPathId}":`, {
        paymentId: payment._id,
        amount: payment.amount,
        paymentLearningPathId: payment.learningPathId?.toString() || 'null',
        metadataLearningPathId: payment.metadata?.learningPathId?.toString() || 'null',
        requestedLearningPathId: learningPathId.toString()
      });
    } else if (learningPathId) {
      // Debug: Check if there are any payments for this learning path with different format
      const allPayments = await Payment.find({
        uniqueId,
        status: 'completed',
        paymentFor: 'career_access'
      }).sort({ completedAt: -1 });
      
      console.log(`🔍 Debug: Checking payments for learning path "${learningPathId}":`, {
        totalPayments: allPayments.length,
        payments: allPayments.map(p => ({
          paymentId: p._id,
          learningPathId: p.learningPathId?.toString() || 'null',
          metadataLearningPathId: p.metadata?.learningPathId?.toString() || 'null',
          amount: p.amount
        }))
      });
    }
    
    return payment;
  } catch (error) {
    console.error('Error fetching most recent completed payment:', error);
    return null;
  }
}

/**
 * Auto-correct subscription based on payment amount
 * This ensures subscription always matches the actual payment made
 */
export async function correctSubscriptionFromPayment(
  subscription: any,
  payment: any
): Promise<boolean> {
  try {
    if (!payment || payment.status !== 'completed') {
      return false;
    }
    
    const actualAmountPaid = payment.amount || payment.planAmount || 0;
    const planInfo = getPlanFromAmount(actualAmountPaid);
    
    // Check if correction is needed
    if (
      subscription.planType !== planInfo.planType ||
      subscription.planAmount !== planInfo.planAmount ||
      subscription.dailyChatLimit !== planInfo.dailyChatLimit ||
      subscription.monthlyMcqLimit !== planInfo.monthlyMcqLimit
    ) {
      console.log(`🔧 Auto-correcting subscription:`, {
        subscriptionId: subscription._id,
        current: `${subscription.planType} (₹${subscription.planAmount})`,
        correct: `${planInfo.planType} (₹${planInfo.planAmount})`,
        paymentAmount: actualAmountPaid,
        paymentId: payment._id
      });
      
      subscription.planType = planInfo.planType;
      subscription.planAmount = planInfo.planAmount;
      subscription.dailyChatLimit = planInfo.dailyChatLimit;
      subscription.monthlyMcqLimit = planInfo.monthlyMcqLimit;
      
      if (payment._id) {
        subscription.paymentId = payment._id;
      }
      
      await subscription.save();
      
      console.log(`✅ Subscription auto-corrected to ${planInfo.planType} plan (₹${planInfo.planAmount})`);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Error correcting subscription from payment:', error);
    return false;
  }
}

/**
 * Check if student has active subscription
 * Linked students (to teacher or organization) automatically have free access
 * @param uniqueId - Student unique ID
 * @param learningPathId - Optional learning path ID to scope the check
 * Note: If learningPathId is provided, only checks subscription for that specific path
 */
export async function hasActiveSubscription(
  uniqueId: string, 
  learningPathId?: string | null
): Promise<boolean> {
  try {
    await connectDB();
    
    // CRITICAL: Linked students get free access - bypass subscription check
    const isLinked = await isStudentLinked(uniqueId);
    if (isLinked) {
      console.log(`✅ Student ${uniqueId} is linked to teacher/organization - granting free access`);
      return true;
    }
    
    // Build query - scope to learning path if provided
    const query: any = {
      uniqueId,
      isActive: true
    };
    
    // CRITICAL: If learningPathId is provided, only check subscription for that path
    if (learningPathId) {
      query.learningPathId = learningPathId;
    }
    
    const subscription = await Subscription.findOne(query);

    if (!subscription) {
      return false;
    }

    // Check if subscription is expired
    const now = new Date();
    if (subscription.expiryDate < now) {
      subscription.isActive = false;
      await subscription.save();
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error checking subscription:', error);
    return false;
  }
}

/**
 * Check if student can save learning path
 * Linked students (to teacher or organization) can save unlimited learning paths
 * Note: This checks for ANY active subscription (not scoped to learning path)
 * as learning path saving is a global feature
 */
export async function canSaveLearningPath(uniqueId: string): Promise<boolean> {
  try {
    await connectDB();
    
    // CRITICAL: Linked students get free access - can save unlimited learning paths
    const isLinked = await isStudentLinked(uniqueId);
    if (isLinked) {
      console.log(`✅ Student ${uniqueId} is linked to teacher/organization - allowing unlimited learning path saves`);
      return true;
    }
    
    // Find any active subscription (learning path saving is a global feature)
    const subscription = await Subscription.findOne({
      uniqueId,
      isActive: true
    });

    if (!subscription) {
      return false;
    }

    // Check if subscription is expired
    const now = new Date();
    if (subscription.expiryDate < now) {
      subscription.isActive = false;
      await subscription.save();
      return false;
    }

    // Check if student has reached the limit for this payment
    const savedCount = subscription.learningPathsSaved || 0;
    return savedCount < subscription.maxLearningPathsPerPayment;
  } catch (error) {
    console.error('Error checking learning path save permission:', error);
    return false;
  }
}

/**
 * Check if student can use AI Buddy chat for a specific chapter
 * Linked students (to teacher or organization) get unlimited access
 * Note: This function checks subscription and per-chapter usage limits.
 * Locked chapter validation should be done at the route level before calling this function.
 * @param learningPathId - Optional learning path ID. If provided, checks subscription for that path.
 */
export async function canUseAIBuddy(uniqueId: string, chapterId: string, learningPathId?: string | null): Promise<{
  allowed: boolean;
  remaining: number;
  limit: number;
}> {
  try {
    await connectDB();
    
    // CRITICAL: Linked students get free access - unlimited AI Buddy chats
    const isLinked = await isStudentLinked(uniqueId);
    if (isLinked) {
      console.log(`✅ Student ${uniqueId} is linked to teacher/organization - granting unlimited AI Buddy access`);
      // Return unlimited access (high limit to indicate unlimited)
      return { allowed: true, remaining: 999, limit: 999 };
    }
    
    // First try to find subscription for specific learning path, then fallback to global
    let subscription = null;
    if (learningPathId) {
      subscription = await Subscription.findOne({
        uniqueId,
        learningPathId: learningPathId,
        isActive: true
      });
    }
    
    // If no learning-path-specific subscription found, try global subscription
    if (!subscription) {
      subscription = await Subscription.findOne({
        uniqueId,
        learningPathId: null,
        isActive: true
      });
    }

    if (!subscription) {
      return { allowed: false, remaining: 0, limit: 0 };
    }

    // Check if subscription is expired
    const now = new Date();
    if (subscription.expiryDate < now) {
      subscription.isActive = false;
      await subscription.save();
      return { allowed: false, remaining: 0, limit: 0 };
    }

    const usageTracking = await UsageTracking.findOne({
      uniqueId,
      subscriptionId: subscription._id
    });

    const currentDate = new Date();
    const currentDateStr = currentDate.toISOString().split('T')[0];
    const dailyLimit = subscription.dailyChatLimit;

    // Calculate today's usage for this chapter
    let todayUsage = 0;
    if (usageTracking && usageTracking.dailyChatUsage) {
      const dailyUsage = usageTracking.dailyChatUsage as Map<string, any>;
      const chapterKey = `${currentDateStr}_${chapterId}`;
      const chapterUsage = dailyUsage.get(chapterKey);
      
      if (chapterUsage && chapterUsage.date) {
        const usageDate = new Date(chapterUsage.date).toISOString().split('T')[0];
        if (usageDate === currentDateStr) {
          todayUsage = chapterUsage.count || 0;
        }
      }
    }

    const remaining = Math.max(0, dailyLimit - todayUsage);
    const allowed = remaining > 0;

    return { allowed, remaining, limit: dailyLimit };
  } catch (error) {
    console.error('Error checking AI Buddy usage:', error);
    return { allowed: false, remaining: 0, limit: 0 };
  }
}

/**
 * Record AI Buddy chat usage
 * @param learningPathId - Optional learning path ID. If provided, uses subscription for that path.
 */
export async function recordAIBuddyUsage(uniqueId: string, chapterId: string, learningPathId?: string | null): Promise<boolean> {
  try {
    await connectDB();
    
    // First try to find subscription for specific learning path, then fallback to global
    let subscription = null;
    if (learningPathId) {
      subscription = await Subscription.findOne({
        uniqueId,
        learningPathId: learningPathId,
        isActive: true
      });
    }
    
    // If no learning-path-specific subscription found, try global subscription
    if (!subscription) {
      subscription = await Subscription.findOne({
        uniqueId,
        learningPathId: null,
        isActive: true
      });
    }
    
    // FALLBACK: If still no subscription found, check for ANY active subscription
    if (!subscription) {
      const now = new Date();
      subscription = await Subscription.findOne({
        uniqueId,
        isActive: true,
        expiryDate: { $gt: now }
      }).sort({ createdAt: -1 }); // Get most recent active subscription
    }

    if (!subscription) {
      console.error(`❌ No subscription found for recording AI Buddy usage:`, {
        uniqueId,
        learningPathId: learningPathId || 'null'
      });
      return false;
    }

    let usageTracking = await UsageTracking.findOne({
      uniqueId,
      subscriptionId: subscription._id
    });

    if (!usageTracking) {
      usageTracking = new UsageTracking({
        studentId: subscription.studentId,
        uniqueId,
        subscriptionId: subscription._id,
        dailyChatUsage: {},
        monthlyMcqUsage: {},
        learningPathsSaved: 0
      });
    }

    const currentDate = new Date();
    const currentDateStr = currentDate.toISOString().split('T')[0];
    const chapterKey = `${currentDateStr}_${chapterId}`;

    // Update daily chat usage
    // CRITICAL: Mongoose Maps need to be properly updated to trigger change detection
    const dailyUsage = usageTracking.dailyChatUsage as Map<string, any> || new Map();
    const existingUsage = dailyUsage.get(chapterKey);
    
    if (existingUsage && existingUsage.date) {
      const usageDate = new Date(existingUsage.date).toISOString().split('T')[0];
      if (usageDate === currentDateStr) {
        // Increment count - create new object to ensure change detection
        const newCount = (existingUsage.count || 0) + 1;
        dailyUsage.set(chapterKey, {
          chapterId: existingUsage.chapterId || chapterId,
          count: newCount,
          date: existingUsage.date
        });
      } else {
        // New day - reset count
        dailyUsage.set(chapterKey, {
          chapterId,
          count: 1,
          date: currentDate
        });
      }
    } else {
      // First usage for this chapter today
      dailyUsage.set(chapterKey, {
        chapterId,
        count: 1,
        date: currentDate
      });
    }

    // CRITICAL: Mark the Map as modified so Mongoose detects the change
    usageTracking.dailyChatUsage = dailyUsage as any;
    usageTracking.markModified('dailyChatUsage');
    usageTracking.lastUpdated = currentDate;
    await usageTracking.save();

    return true;
  } catch (error) {
    console.error('Error recording AI Buddy usage:', error);
    return false;
  }
}

/**
 * Check if student can generate MCQ for a specific chapter
 * Linked students (to teacher or organization) get unlimited access
 * Note: This function checks subscription and per-chapter usage limits.
 * Locked chapter validation should be done at the route level before calling this function.
 * @param learningPathId - Optional learning path ID. If provided, checks subscription for that path.
 */
export async function canGenerateMCQ(uniqueId: string, chapterId: string, learningPathId?: string | null): Promise<{
  allowed: boolean;
  remaining: number;
  limit: number;
}> {
  try {
    await connectDB();
    
    // CRITICAL: Linked students get free access - unlimited MCQ generation
    const isLinked = await isStudentLinked(uniqueId);
    if (isLinked) {
      console.log(`✅ Student ${uniqueId} is linked to teacher/organization - granting unlimited MCQ generation access`);
      // Return unlimited access (high limit to indicate unlimited)
      return { allowed: true, remaining: 999, limit: 999 };
    }
    
    console.log(`🔍 Checking MCQ generation access:`, {
      uniqueId,
      chapterId,
      learningPathId: learningPathId || 'null'
    });
    
    // First try to find subscription for specific learning path, then fallback to global
    let subscription = null;
    if (learningPathId) {
      subscription = await Subscription.findOne({
        uniqueId,
        learningPathId: learningPathId,
        isActive: true
      });
      console.log(`🔍 Subscription lookup for learning path "${learningPathId}":`, subscription ? 'Found' : 'Not found');
    }
    
    // If no learning-path-specific subscription found, try global subscription
    if (!subscription) {
      subscription = await Subscription.findOne({
        uniqueId,
        learningPathId: null,
        isActive: true
      }).sort({ createdAt: -1 });
      console.log(`🔍 Temporary subscription lookup:`, subscription ? 'Found' : 'Not found');
    }
    
    // If still not found, try any active subscription
    if (!subscription) {
      const allSubs = await Subscription.find({
        uniqueId,
        isActive: true
      }).sort({ createdAt: -1 });
      
      if (allSubs.length > 0) {
        subscription = allSubs[0];
        console.log(`✅ Using most recent active subscription:`, {
          subscriptionId: subscription._id,
          learningPathId: subscription.learningPathId?.toString() || 'null'
        });
      }
    }

    if (!subscription) {
      console.log(`❌ No subscription found for MCQ generation:`, {
        uniqueId,
        learningPathId: learningPathId || 'null'
      });
      return { allowed: false, remaining: 0, limit: 0 };
    }

    // Check if subscription is expired
    const now = new Date();
    if (subscription.expiryDate < now) {
      console.log(`⚠️ Subscription expired:`, {
        subscriptionId: subscription._id,
        expiryDate: subscription.expiryDate,
        now: now
      });
      subscription.isActive = false;
      await subscription.save();
      return { allowed: false, remaining: 0, limit: 0 };
    }

    // Check if monthlyMcqLimit is set
    const monthlyLimit = subscription.monthlyMcqLimit || 0;
    if (monthlyLimit === 0) {
      console.error(`❌ Subscription has no monthlyMcqLimit set:`, {
        subscriptionId: subscription._id,
        planType: subscription.planType,
        planAmount: subscription.planAmount,
        monthlyMcqLimit: subscription.monthlyMcqLimit
      });
      // This shouldn't happen, but if it does, default to plan limits
      const planInfo = getPlanFromAmount(subscription.planAmount || 0);
      const defaultLimit = planInfo.monthlyMcqLimit;
      console.log(`⚠️ Using default limit from plan:`, defaultLimit);
      
      // Update subscription with correct limit
      subscription.monthlyMcqLimit = defaultLimit;
      await subscription.save();
      
      return { allowed: defaultLimit > 0, remaining: defaultLimit, limit: defaultLimit };
    }

    const usageTracking = await UsageTracking.findOne({
      uniqueId,
      subscriptionId: subscription._id
    });

    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1;

    // Calculate monthly usage for this specific chapter
    let monthlyUsage = 0;
    if (usageTracking && usageTracking.monthlyMcqUsage) {
      const monthlyUsageMap = usageTracking.monthlyMcqUsage as Map<string, any>;
      const chapterUsage = monthlyUsageMap.get(chapterId);
      
      if (chapterUsage && 
          chapterUsage.year === currentYear &&
          chapterUsage.month === currentMonth) {
        monthlyUsage = chapterUsage.count || 0;
      }
    }

    const remaining = Math.max(0, monthlyLimit - monthlyUsage);
    const allowed = remaining > 0;

    console.log(`✅ MCQ generation check result:`, {
      allowed,
      remaining,
      limit: monthlyLimit,
      monthlyUsage,
      chapterId
    });

    return { allowed, remaining, limit: monthlyLimit };
  } catch (error) {
    console.error('❌ Error checking MCQ usage:', error);
    return { allowed: false, remaining: 0, limit: 0 };
  }
}

/**
 * Record MCQ generation usage for a specific chapter
 * @param learningPathId - Optional learning path ID. If provided, uses subscription for that path.
 */
export async function recordMCQUsage(uniqueId: string, chapterId: string, learningPathId?: string | null): Promise<boolean> {
  try {
    await connectDB();
    
    // First try to find subscription for specific learning path, then fallback to global
    let subscription = null;
    if (learningPathId) {
      subscription = await Subscription.findOne({
        uniqueId,
        learningPathId: learningPathId,
        isActive: true
      });
    }
    
    // If no learning-path-specific subscription found, try global subscription
    if (!subscription) {
      subscription = await Subscription.findOne({
        uniqueId,
        learningPathId: null,
        isActive: true
      });
    }
    
    // FALLBACK: If still no subscription found, check for ANY active subscription
    if (!subscription) {
      const now = new Date();
      subscription = await Subscription.findOne({
        uniqueId,
        isActive: true,
        expiryDate: { $gt: now }
      }).sort({ createdAt: -1 }); // Get most recent active subscription
    }

    if (!subscription) {
      console.error(`❌ No subscription found for recording MCQ usage:`, {
        uniqueId,
        learningPathId: learningPathId || 'null'
      });
      return false;
    }

    let usageTracking = await UsageTracking.findOne({
      uniqueId,
      subscriptionId: subscription._id
    });

    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1;

    if (!usageTracking) {
      // Initialize monthlyMcqUsage as empty object - Mongoose will convert to Map
      const initialMonthlyMcqUsage: Record<string, any> = {};
      initialMonthlyMcqUsage[chapterId] = {
        chapterId,
        year: currentYear,
        month: currentMonth,
        count: 1,
        lastReset: currentDate
      };

      usageTracking = new UsageTracking({
        studentId: subscription.studentId,
        uniqueId,
        subscriptionId: subscription._id,
        dailyChatUsage: {},
        monthlyMcqUsage: initialMonthlyMcqUsage,
        learningPathsSaved: 0
      });
    } else {
      // Update monthly MCQ usage for this specific chapter
      // CRITICAL: Mongoose Maps need to be properly updated to trigger change detection
      const monthlyUsageMap = usageTracking.monthlyMcqUsage as Map<string, any> || new Map();
      const chapterUsage = monthlyUsageMap.get(chapterId);
      
      if (chapterUsage) {
        // Reset if new month for this chapter
        if (
          chapterUsage.year !== currentYear ||
          chapterUsage.month !== currentMonth
        ) {
          // Create new object to ensure Mongoose detects the change
          monthlyUsageMap.set(chapterId, {
            chapterId,
            year: currentYear,
            month: currentMonth,
            count: 1,
            lastReset: currentDate
          });
        } else {
          // Increment count for current month - create new object to ensure change detection
          const newCount = (chapterUsage.count || 0) + 1;
          monthlyUsageMap.set(chapterId, {
            chapterId: chapterUsage.chapterId || chapterId,
            year: currentYear,
            month: currentMonth,
            count: newCount,
            lastReset: chapterUsage.lastReset || currentDate
          });
        }
      } else {
        // First usage for this chapter
        monthlyUsageMap.set(chapterId, {
          chapterId,
          year: currentYear,
          month: currentMonth,
          count: 1,
          lastReset: currentDate
        });
      }
      
      // CRITICAL: Mark the Map as modified so Mongoose detects the change
      usageTracking.monthlyMcqUsage = monthlyUsageMap as any;
      usageTracking.markModified('monthlyMcqUsage');
    }

    usageTracking.lastUpdated = currentDate;
    await usageTracking.save();

    return true;
  } catch (error) {
    console.error('Error recording MCQ usage:', error);
    return false;
  }
}

/**
 * Get per-chapter usage status for UI display
 * @param learningPathId - Optional learning path ID. If provided, checks subscription for that path.
 */
export async function getChapterUsageStatus(uniqueId: string, chapterId: string, learningPathId?: string | null): Promise<{
  chatUsage: {
    remaining: number;
    limit: number;
    used: number;
  };
  mcqUsage: {
    remaining: number;
    limit: number;
    used: number;
  };
  hasSubscription: boolean;
  planType?: string;
}> {
  try {
    await connectDB();
    
    // First try to find subscription for specific learning path, then fallback to global
    let subscription = null;
    if (learningPathId) {
      subscription = await Subscription.findOne({
        uniqueId,
        learningPathId: learningPathId,
        isActive: true
      });
    }
    
    // If no learning-path-specific subscription found, try global subscription
    if (!subscription) {
      subscription = await Subscription.findOne({
        uniqueId,
        learningPathId: null,
        isActive: true
      });
    }
    
    // FALLBACK: If still no subscription found, check for ANY active subscription
    // This ensures users see their subscription details even if it's for a different learning path
    if (!subscription) {
      const now = new Date();
      subscription = await Subscription.findOne({
        uniqueId,
        isActive: true,
        expiryDate: { $gt: now }
      }).sort({ createdAt: -1 }); // Get most recent active subscription
    }

    if (!subscription) {
      return {
        chatUsage: { remaining: 0, limit: 0, used: 0 },
        mcqUsage: { remaining: 0, limit: 0, used: 0 },
        hasSubscription: false
      };
    }

    // Check if subscription is expired
    const now = new Date();
    if (subscription.expiryDate < now) {
      subscription.isActive = false;
      await subscription.save();
      return {
        chatUsage: { remaining: 0, limit: 0, used: 0 },
        mcqUsage: { remaining: 0, limit: 0, used: 0 },
        hasSubscription: false
      };
    }

    const usageTracking = await UsageTracking.findOne({
      uniqueId,
      subscriptionId: subscription._id
    });

    // Calculate chat usage for this chapter
    const currentDate = new Date();
    const currentDateStr = currentDate.toISOString().split('T')[0];
    const dailyLimit = subscription.dailyChatLimit;
    let chatUsed = 0;
    
    if (usageTracking && usageTracking.dailyChatUsage) {
      const dailyUsage = usageTracking.dailyChatUsage as Map<string, any>;
      const chapterKey = `${currentDateStr}_${chapterId}`;
      const chapterUsage = dailyUsage.get(chapterKey);
      
      if (chapterUsage && chapterUsage.date) {
        const usageDate = new Date(chapterUsage.date).toISOString().split('T')[0];
        if (usageDate === currentDateStr) {
          chatUsed = chapterUsage.count || 0;
        }
      }
    }

    // Calculate MCQ usage for this chapter
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1;
    const monthlyLimit = subscription.monthlyMcqLimit;
    let mcqUsed = 0;
    
    if (usageTracking && usageTracking.monthlyMcqUsage) {
      const monthlyUsageMap = usageTracking.monthlyMcqUsage as Map<string, any>;
      const chapterUsage = monthlyUsageMap.get(chapterId);
      
      if (chapterUsage && 
          chapterUsage.year === currentYear &&
          chapterUsage.month === currentMonth) {
        mcqUsed = chapterUsage.count || 0;
      }
    }

    return {
      chatUsage: {
        remaining: Math.max(0, dailyLimit - chatUsed),
        limit: dailyLimit,
        used: chatUsed
      },
      mcqUsage: {
        remaining: Math.max(0, monthlyLimit - mcqUsed),
        limit: monthlyLimit,
        used: mcqUsed
      },
      hasSubscription: true,
      planType: subscription.planType
    };
  } catch (error) {
    console.error('Error getting chapter usage status:', error);
    return {
      chatUsage: { remaining: 0, limit: 0, used: 0 },
      mcqUsage: { remaining: 0, limit: 0, used: 0 },
      hasSubscription: false
    };
  }
}

/**
 * Record learning path save
 * @param learningPathId - Optional learning path ID. If provided, increments counter on subscription for that path.
 *                         If not provided, finds first subscription with available save slots.
 */
export async function recordLearningPathSave(uniqueId: string, learningPathId?: string | null): Promise<boolean> {
  try {
    await connectDB();
    
    // Find subscription for this learning path, or find first available subscription
    let subscription = null;
    
    if (learningPathId) {
      // First try to find subscription for this specific learning path
      subscription = await Subscription.findOne({
        uniqueId,
        learningPathId: learningPathId,
        isActive: true
      });
    }
    
    // If not found and learningPathId provided, try temporary subscription
    if (!subscription && learningPathId) {
      subscription = await Subscription.findOne({
        uniqueId,
        learningPathId: null,
        isActive: true,
        $expr: { $lt: ['$learningPathsSaved', '$maxLearningPathsPerPayment'] }
      }).sort({ createdAt: -1 });
    }
    
    // If still not found, find any subscription with available save slots
    if (!subscription) {
      subscription = await Subscription.findOne({
        uniqueId,
        isActive: true,
        $expr: { $lt: ['$learningPathsSaved', '$maxLearningPathsPerPayment'] }
      }).sort({ createdAt: -1 });
    }

    if (!subscription) {
      console.error('No available subscription found for learning path save');
      return false;
    }

    // Check if subscription is expired
    const now = new Date();
    if (subscription.expiryDate < now) {
      subscription.isActive = false;
      await subscription.save();
      return false;
    }

    // Increment counter
    subscription.learningPathsSaved = (subscription.learningPathsSaved || 0) + 1;
    await subscription.save();

    // Update usage tracking
    let usageTracking = await UsageTracking.findOne({
      uniqueId,
      subscriptionId: subscription._id
    });

    if (usageTracking) {
      usageTracking.learningPathsSaved = (usageTracking.learningPathsSaved || 0) + 1;
      await usageTracking.save();
    } else {
      // Create usage tracking if it doesn't exist
      usageTracking = new UsageTracking({
        studentId: subscription.studentId,
        uniqueId,
        subscriptionId: subscription._id,
        dailyChatUsage: {},
        monthlyMcqUsage: {
          year: new Date().getFullYear(),
          month: new Date().getMonth() + 1,
          count: 0,
          lastReset: new Date()
        },
        learningPathsSaved: 1
      });
      await usageTracking.save();
    }

    return true;
  } catch (error) {
    console.error('Error recording learning path save:', error);
    return false;
  }
}
