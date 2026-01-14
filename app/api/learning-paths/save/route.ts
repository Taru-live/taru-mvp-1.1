import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import LearningPath from '@/models/LearningPath';
import LearningPathResponse from '@/models/LearningPathResponse';
import Student from '@/models/Student';
import { normalizeCareerDetailsData, validateCareerDetailsData } from '@/lib/utils/learningPathUtils';
import { canSaveLearningPath, recordLearningPathSave } from '@/lib/utils/paymentUtils';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

interface DecodedToken {
  userId: string;
  [key: string]: unknown;
}

export async function POST(request: NextRequest) {
  try {
    // Get token from HTTP-only cookie
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json(
        { error: 'Authorization token required' },
        { status: 401 }
      );
    }

    // Verify token
    let decoded: DecodedToken;
    try {
      decoded = jwt.verify(token, JWT_SECRET) as DecodedToken;
    } catch {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    // Connect to database
    await connectDB();

    // Get user
    const user = await User.findById(decoded.userId);
    if (!user || user.role !== 'student') {
      return NextResponse.json(
        { error: 'Only students can save learning paths' },
        { status: 403 }
      );
    }

    // Get request body
    const body = await request.json();
    const { 
      studentId, 
      careerPath, 
      description, 
      learningModules, 
      timeRequired, 
      focusAreas 
    } = body;

    // Get student's uniqueId - prefer from body, fallback to user.id or fetch from Student model
    // We need to get the uniqueId for payment checks
    let studentUniqueId = studentId;
    
    // If studentId is not provided or doesn't look like a uniqueId, fetch from Student model
    if (!studentUniqueId || !studentUniqueId.startsWith('STU')) {
      const student = await Student.findOne({ userId: decoded.userId });
      if (student) {
        studentUniqueId = student.uniqueId;
      } else {
        studentUniqueId = user.id; // Fallback
      }
    }

    // Check if student can save learning path (has active subscription and hasn't exceeded limit)
    const canSave = await canSaveLearningPath(studentUniqueId);
    if (!canSave) {
      return NextResponse.json(
        { 
          error: 'Cannot save learning path',
          requiresPayment: true,
          message: 'You have reached the limit for saving learning paths. Please make a payment to save additional paths.'
        },
        { status: 403 }
      );
    }

    // Validate required fields
    if (!careerPath || !description || !learningModules || !Array.isArray(learningModules)) {
      return NextResponse.json(
        { error: 'Missing required fields: careerPath, description, learningModules' },
        { status: 400 }
      );
    }

    // Normalize learningModules to ensure proper structure
    const normalizedModules = learningModules.map((module: any) => {
      // Ensure module has required fields
      const normalizedModule: any = {
        module: module.module || module.name || 'Module',
        description: module.description || '',
        submodules: []
      };

      // Normalize submodules if present
      if (module.submodules && Array.isArray(module.submodules)) {
        normalizedModule.submodules = module.submodules.map((sub: any) => {
          const normalizedSub: any = {
            title: sub.title || sub.name || 'Submodule',
            description: sub.description || '',
            chapters: []
          };

          // Normalize chapters if present
          if (sub.chapters && Array.isArray(sub.chapters)) {
            normalizedSub.chapters = sub.chapters.map((chapter: any) => ({
              title: chapter.title || chapter.name || 'Chapter'
            }));
          }

          return normalizedSub;
        });
      }

      return normalizedModule;
    });

    // Create a normalized career details structure for validation
    const careerDetailsForValidation = {
      uniqueid: studentUniqueId,
      output: {
        greeting: `Hi Student! Welcome to your ${careerPath} learning journey!`,
        overview: Array.isArray(description) ? description : description.split('. ').filter((s: string) => s.trim()),
        timeRequired: timeRequired || 'Not specified',
        focusAreas: Array.isArray(focusAreas) ? focusAreas : [],
        learningPath: normalizedModules,
        finalTip: `Keep exploring and learning in ${careerPath}!`
      }
    };

    // Normalize and validate the data
    const normalizedCareerDetails = normalizeCareerDetailsData(careerDetailsForValidation, studentUniqueId);
    
    if (!normalizedCareerDetails) {
      return NextResponse.json(
        { error: 'Failed to normalize learning path data' },
        { status: 400 }
      );
    }

    // Validate the structure
    const validationResult = validateCareerDetailsData(normalizedCareerDetails);
    if (!validationResult.isValid) {
      console.error('❌ Learning path validation failed:', validationResult.errors);
      return NextResponse.json(
        { 
          error: 'Invalid learning path data structure',
          validationErrors: validationResult.errors
        },
        { status: 400 }
      );
    }

    // Helper function to extract career path from greeting
    const extractCareerPathFromGreeting = (greeting: string): string => {
      // Remove "Hi [name]!" prefix and common suffixes
      return greeting
        .replace(/^Hi\s+[^!]+!\s*/i, '')
        .replace(/\s*(learning journey|career path|path)!?\s*$/i, '')
        .trim();
    };

    // Normalize career path for comparison (case-insensitive, trimmed)
    const normalizedCareerPathForComparison = careerPath.trim().toLowerCase();

    // Find ALL learning paths with the same career path for this student
    const allLearningPaths = await LearningPathResponse.find({
      uniqueid: normalizedCareerDetails.uniqueid
    });

    // Filter to find duplicates by comparing extracted career paths
    const duplicatePaths = allLearningPaths.filter(path => {
      if (!path.output?.greeting) return false;
      const extractedPath = extractCareerPathFromGreeting(path.output.greeting);
      return extractedPath.toLowerCase().trim() === normalizedCareerPathForComparison;
    });

    console.log(`🔍 Found ${duplicatePaths.length} learning path(s) with title "${careerPath}" for student ${normalizedCareerDetails.uniqueid}`);

    // Check if there's already an active learning path for this student
    const existingActivePath = await LearningPathResponse.findOne({
      uniqueid: normalizedCareerDetails.uniqueid,
      isActive: true
    });

    let savedLearningPath;

    if (duplicatePaths.length > 0) {
      // Sort by updatedAt (most recent first)
      duplicatePaths.sort((a, b) => {
        const dateA = a.updatedAt || a.createdAt || new Date(0);
        const dateB = b.updatedAt || b.createdAt || new Date(0);
        return dateB.getTime() - dateA.getTime();
      });

      // Keep the most recent one and update it
      const mostRecentPath = duplicatePaths[0];
      const pathsToDelete = duplicatePaths.slice(1);

      // Delete all duplicates except the most recent one
      if (pathsToDelete.length > 0) {
        const deleteIds = pathsToDelete.map(p => p._id);
        const deleteResult = await LearningPathResponse.deleteMany({
          _id: { $in: deleteIds }
        });
        console.log(`🗑️ Deleted ${deleteResult.deletedCount} duplicate learning path(s) with title "${careerPath}"`);
      }

      // Update the most recent one with new data
      mostRecentPath.output = normalizedCareerDetails.output;
      mostRecentPath.updatedAt = new Date();
      // Set as active if no active path exists
      if (!existingActivePath) {
        mostRecentPath.isActive = true;
      }
      await mostRecentPath.save();
      
      savedLearningPath = mostRecentPath;
      console.log(`✅ Updated existing learning path (kept most recent, deleted ${pathsToDelete.length} duplicate(s))`);
    } else {
      // No duplicates found, create new learning path
      const newLearningPathResponse = new LearningPathResponse({
        uniqueid: normalizedCareerDetails.uniqueid,
        output: normalizedCareerDetails.output,
        isActive: !existingActivePath // Set as active if no active path exists
      });

      await newLearningPathResponse.save();
      savedLearningPath = newLearningPathResponse;
      console.log(`✅ Created new learning path for "${careerPath}"${!existingActivePath ? ' (set as active)' : ''}`);
    }

    // CRITICAL: Link temporary subscription (if exists) to this learning path
    // This handles the case where user paid from career exploration page before learning path was created
    try {
      const Subscription = (await import('@/models/Subscription')).default;
      const Payment = (await import('@/models/Payment')).default;
      
      // Find temporary subscription (learningPathId: null) for this student
      const temporarySubscription = await Subscription.findOne({
        uniqueId: normalizedCareerDetails.uniqueid,
        learningPathId: null,
        isActive: true
      }).sort({ createdAt: -1 });
      
      if (temporarySubscription) {
        console.log(`🔗 Linking temporary subscription to learning path "${savedLearningPath._id}"`);
        
        // Check if there's already a subscription for this learning path
        const existingSubscription = await Subscription.findOne({
          uniqueId: normalizedCareerDetails.uniqueid,
          learningPathId: savedLearningPath._id.toString()
        });
        
        if (!existingSubscription) {
          // Link temporary subscription to this learning path
          temporarySubscription.learningPathId = savedLearningPath._id.toString();
          await temporarySubscription.save();
          
          // Also update the payment record to link it to this learning path
          if (temporarySubscription.paymentId) {
            const payment = await Payment.findById(temporarySubscription.paymentId);
            if (payment && !payment.learningPathId) {
              payment.learningPathId = savedLearningPath._id.toString();
              if (payment.metadata) {
                payment.metadata.learningPathId = savedLearningPath._id.toString();
              }
              await payment.save();
              console.log(`✅ Linked payment ${payment._id} to learning path ${savedLearningPath._id}`);
            }
          }
          
          console.log(`✅ Successfully linked temporary subscription to learning path`);
        } else {
          console.log(`⚠️ Subscription already exists for this learning path, keeping temporary subscription separate`);
        }
      }
    } catch (linkError) {
      console.error('Error linking temporary subscription to learning path:', linkError);
      // Don't fail the save operation if linking fails
    }

    // Record learning path save in usage tracking
    // Pass learningPathId to ensure we increment the counter on the correct subscription
    await recordLearningPathSave(normalizedCareerDetails.uniqueid, savedLearningPath._id.toString());

    return NextResponse.json({
      message: duplicatePaths.length > 0 
        ? `Learning path updated successfully (removed ${duplicatePaths.length - 1} duplicate(s))`
        : 'Learning path saved successfully',
      learningPath: {
        _id: savedLearningPath._id,
        studentId: savedLearningPath.uniqueid,
        careerPath: careerPath,
        description: description,
        learningModules: normalizedCareerDetails.output.learningPath,
        timeRequired: normalizedCareerDetails.output.timeRequired,
        focusAreas: normalizedCareerDetails.output.focusAreas,
        createdAt: savedLearningPath.createdAt,
        updatedAt: savedLearningPath.updatedAt
      }
    });

  } catch (error) {
    console.error('Save learning path error:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}