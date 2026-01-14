import connectDB from '@/lib/mongodb';
import Subscription from '@/models/Subscription';
import LearningPathResponse from '@/models/LearningPathResponse';

/**
 * Calculate number of unlocked modules based on subscription renewals
 * Rule: First module unlocked after initial payment, each renewal unlocks next module
 * @param subscription - The subscription object
 * @returns Number of modules that should be unlocked (1-based, so 1 = first module only)
 */
export function calculateUnlockedModulesCount(subscription: any): number {
  if (!subscription || !subscription.isActive) {
    console.log('⚠️ calculateUnlockedModulesCount: No subscription or inactive');
    return 0;
  }

  // Check if subscription is expired
  const now = new Date();
  if (subscription.expiryDate < now) {
    console.log('⚠️ calculateUnlockedModulesCount: Subscription expired', {
      expiryDate: subscription.expiryDate,
      now: now
    });
    return 0;
  }

  // CRITICAL: For any active, non-expired subscription, unlock at least the first module
  // This ensures that users who have paid can access their learning content
  // The initial payment should unlock the first module immediately
  
  // Count renewals based on payment history
  // Each payment/renewal unlocks one additional module
  // Initial payment unlocks module 1, first renewal unlocks module 2, etc.
  
  // For now, we'll use a simple calculation:
  // - Any active subscription unlocks at least 1 module (the first module)
  // - Each month of active subscription = 1 additional module unlocked
  // This is a simplified approach - in production, you'd count actual renewals
  
  const subscriptionAgeMonths = Math.floor(
    (now.getTime() - subscription.startDate.getTime()) / (1000 * 60 * 60 * 24 * 30)
  );
  
  // Minimum 1 module unlocked (first module), plus 1 per renewal cycle
  // Since each subscription is 1 month, we count months since start
  // For new subscriptions (age = 0), this returns 1 (first module unlocked)
  const unlockedCount = Math.max(1, subscriptionAgeMonths + 1);
  
  console.log('✅ calculateUnlockedModulesCount:', {
    subscriptionId: subscription._id,
    subscriptionAgeMonths,
    unlockedCount,
    startDate: subscription.startDate,
    expiryDate: subscription.expiryDate
  });
  
  return unlockedCount;
}

/**
 * Check if a module is unlocked for a learning path subscription
 * @param uniqueId - Student unique ID
 * @param learningPathId - Learning path ID
 * @param moduleIndex - Zero-based index of the module in the learning path
 * @returns Object with access status and reason
 */
export async function checkModuleAccess(
  uniqueId: string,
  learningPathId: string,
  moduleIndex: number
): Promise<{
  hasAccess: boolean;
  isLocked: boolean;
  unlockedModulesCount: number;
  reason?: string;
  subscription?: any;
}> {
  try {
    await connectDB();

    console.log(`🔍 Checking module access:`, {
      uniqueId,
      learningPathId,
      moduleIndex
    });

    // Normalize learningPathId to string for comparison
    const normalizedLearningPathId = learningPathId?.toString() || null;

    // Find subscription for this learning path
    // Try multiple strategies to find the subscription
    let subscription = null;
    
    // Strategy 1: Exact match with normalized learningPathId
    if (normalizedLearningPathId) {
      subscription = await Subscription.findOne({
        uniqueId,
        learningPathId: normalizedLearningPathId,
        isActive: true
      });
      
      // Strategy 2: Try with ObjectId if first didn't work
      if (!subscription) {
        try {
          const mongoose = await import('mongoose');
          const learningPathObjectId = new mongoose.Types.ObjectId(normalizedLearningPathId);
          subscription = await Subscription.findOne({
            uniqueId,
            learningPathId: learningPathObjectId,
            isActive: true
          });
        } catch (e) {
          // Invalid ObjectId format, skip
        }
      }
      
      // Strategy 3: Try string comparison (in case it's stored as string but we're comparing ObjectId)
      if (!subscription) {
        const allSubs = await Subscription.find({
          uniqueId,
          isActive: true
        });
        
        subscription = allSubs.find(s => {
          const subLearningPathId = s.learningPathId?.toString() || null;
          return subLearningPathId === normalizedLearningPathId;
        }) || null;
      }
    }

    console.log(`🔍 Subscription lookup for specific learning path:`, {
      found: !!subscription,
      subscriptionId: subscription?._id,
      subscriptionLearningPathId: subscription?.learningPathId?.toString() || 'null',
      requestedLearningPathId: normalizedLearningPathId
    });

    // If not found, try temporary subscription (learningPathId: null)
    if (!subscription) {
      subscription = await Subscription.findOne({
        uniqueId,
        learningPathId: null,
        isActive: true
      }).sort({ createdAt: -1 });
      
      console.log(`🔍 Temporary subscription lookup:`, {
        found: !!subscription,
        subscriptionId: subscription?._id,
        subscriptionLearningPathId: subscription?.learningPathId?.toString() || 'null'
      });
    }

    // If still not found, try to find any active subscription for this user
    // This handles edge cases where subscription might be linked differently
    if (!subscription) {
      const allSubscriptions = await Subscription.find({
        uniqueId,
        isActive: true
      }).sort({ createdAt: -1 });
      
      console.log(`🔍 All active subscriptions for user:`, {
        count: allSubscriptions.length,
        subscriptions: allSubscriptions.map(s => ({
          id: s._id,
          learningPathId: s.learningPathId?.toString() || 'null',
          planType: s.planType,
          isActive: s.isActive,
          expiryDate: s.expiryDate
        }))
      });
      
      // Use the most recent active subscription if available
      // This allows temporary subscriptions or subscriptions for other learning paths to grant access
      // The subscription system is per-learning-path, but we should allow access if they have ANY active subscription
      if (allSubscriptions.length > 0) {
        subscription = allSubscriptions[0];
        console.log(`✅ Using most recent active subscription:`, {
          subscriptionId: subscription._id,
          subscriptionLearningPathId: subscription.learningPathId?.toString() || 'null (temporary)',
          planType: subscription.planType,
          note: 'This subscription may be for a different learning path, but will grant access'
        });
      }
    }

    if (!subscription) {
      console.log(`❌ No subscription found for user ${uniqueId}, learningPathId: ${normalizedLearningPathId}`);
      
      // CRITICAL: Double-check by looking for ANY subscription (including inactive ones)
      // This helps debug if subscriptions exist but are marked inactive incorrectly
      const debugSubscriptions = await Subscription.find({
        uniqueId
      }).sort({ createdAt: -1 });
      
      console.log(`🔍 Debug: All subscriptions (including inactive) for user:`, {
        count: debugSubscriptions.length,
        subscriptions: debugSubscriptions.map(s => ({
          id: s._id,
          learningPathId: s.learningPathId?.toString() || 'null',
          planType: s.planType,
          isActive: s.isActive,
          expiryDate: s.expiryDate,
          startDate: s.startDate
        }))
      });
      
      return {
        hasAccess: false,
        isLocked: true,
        unlockedModulesCount: 0,
        reason: 'No active subscription found for this learning path'
      };
    }

    // Check if subscription is expired
    const now = new Date();
    if (subscription.expiryDate < now) {
      console.log(`⚠️ Subscription found but expired:`, {
        subscriptionId: subscription._id,
        expiryDate: subscription.expiryDate,
        now: now
      });
      // Mark subscription as inactive
      subscription.isActive = false;
      await subscription.save();
      
      return {
        hasAccess: false,
        isLocked: true,
        unlockedModulesCount: 0,
        reason: 'Subscription has expired',
        subscription
      };
    }

    console.log(`✅ Valid subscription found:`, {
      subscriptionId: subscription._id,
      planType: subscription.planType,
      learningPathId: subscription.learningPathId?.toString() || 'null (temporary)',
      isActive: subscription.isActive,
      expiryDate: subscription.expiryDate
    });

    // Calculate how many modules are unlocked
    const unlockedCount = calculateUnlockedModulesCount(subscription);
    
    // Module index is 0-based, so module 0 = first module
    // unlockedCount is 1-based (1 = first module unlocked)
    const hasAccess = moduleIndex < unlockedCount;

    return {
      hasAccess,
      isLocked: !hasAccess,
      unlockedModulesCount: unlockedCount,
      reason: hasAccess 
        ? undefined 
        : `Module ${moduleIndex + 1} is locked. Complete module ${unlockedCount} and renew your subscription to unlock.`,
      subscription
    };
  } catch (error) {
    console.error('Error checking module access:', error);
    return {
      hasAccess: false,
      isLocked: true,
      unlockedModulesCount: 0,
      reason: 'Error checking module access'
    };
  }
}

/**
 * Check if a chapter is accessible (chapter is accessible if its module is unlocked)
 * @param uniqueId - Student unique ID
 * @param learningPathId - Learning path ID
 * @param moduleIndex - Zero-based index of the module containing the chapter
 * @param chapterIndex - Zero-based index of the chapter within the module
 * @returns Object with access status
 */
export async function checkChapterAccess(
  uniqueId: string,
  learningPathId: string,
  moduleIndex: number,
  chapterIndex?: number
): Promise<{
  hasAccess: boolean;
  isLocked: boolean;
  reason?: string;
  moduleAccess?: any;
}> {
  const moduleAccess = await checkModuleAccess(uniqueId, learningPathId, moduleIndex);
  
  return {
    hasAccess: moduleAccess.hasAccess,
    isLocked: moduleAccess.isLocked,
    reason: moduleAccess.reason,
    moduleAccess
  };
}

/**
 * Get learning path ID from module/chapter identifiers
 * This tries to find which learning path a module/chapter belongs to
 * @param uniqueId - Student unique ID
 * @param moduleId - Module identifier (could be moduleId from URL or module index)
 * @param chapterId - Optional chapter identifier
 * @returns Learning path ID if found, null otherwise
 */
export async function getLearningPathIdFromModule(
  uniqueId: string,
  moduleId: string | number,
  chapterId?: string | number
): Promise<string | null> {
  try {
    await connectDB();

    // Find active learning paths for this student
    const learningPaths = await LearningPathResponse.find({
      uniqueid: uniqueId,
      isActive: true
    }).sort({ updatedAt: -1 });

    if (learningPaths.length === 0) {
      return null;
    }

    // If only one learning path, return it
    if (learningPaths.length === 1) {
      return learningPaths[0]._id.toString();
    }

    // Try to match module/chapter to a learning path
    // This is a simplified matching - in production, you'd have better module-to-path mapping
    for (const path of learningPaths) {
      const output = path.output as any;
      const modules = output.modules || output.learningPath || [];
      
      // Check if moduleId matches any module in this path
      const moduleIndex = typeof moduleId === 'string' 
        ? parseInt(moduleId) 
        : moduleId;
      
      if (modules[moduleIndex] !== undefined) {
        return path._id.toString();
      }
    }

    // If no match found, return the most recent active learning path
    return learningPaths[0]._id.toString();
  } catch (error) {
    console.error('Error getting learning path ID from module:', error);
    return null;
  }
}

/**
 * Get module index from learning path structure
 * @param learningPathId - Learning path ID
 * @param moduleIdentifier - Module identifier (title, name, or index)
 * @returns Module index (0-based) or -1 if not found
 */
export async function getModuleIndexFromLearningPath(
  learningPathId: string,
  moduleIdentifier: string | number
): Promise<number> {
  try {
    await connectDB();

    const learningPath = await LearningPathResponse.findById(learningPathId);
    if (!learningPath) {
      return -1;
    }

    const output = learningPath.output as any;
    const modules = output.modules || output.learningPath || [];

    // If moduleIdentifier is a number, use it directly
    if (typeof moduleIdentifier === 'number') {
      return moduleIdentifier >= 0 && moduleIdentifier < modules.length 
        ? moduleIdentifier 
        : -1;
    }

    // Otherwise, try to find by module name/title
    const moduleIndex = modules.findIndex((mod: any) => {
      const moduleName = mod.module || mod.name || mod.moduleTitle || '';
      return moduleName.toLowerCase().includes(moduleIdentifier.toLowerCase()) ||
             moduleIdentifier.toLowerCase().includes(moduleName.toLowerCase());
    });

    return moduleIndex;
  } catch (error) {
    console.error('Error getting module index:', error);
    return -1;
  }
}
