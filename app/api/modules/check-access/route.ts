import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import connectDB from '@/lib/mongodb';
import Student from '@/models/Student';
import { checkModuleAccess, checkChapterAccess, getLearningPathIdFromModule } from '@/lib/utils/moduleAccessControl';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

interface DecodedToken {
  userId: string;
  [key: string]: unknown;
}

export async function GET(request: NextRequest) {
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

    // Get student profile
    const student = await Student.findOne({ 
      userId: decoded.userId,
      onboardingCompleted: true 
    });

    if (!student) {
      return NextResponse.json(
        { error: 'Student not found or onboarding not completed' },
        { status: 404 }
      );
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const learningPathId = searchParams.get('learningPathId');
    const moduleId = searchParams.get('moduleId');
    const moduleIndex = searchParams.get('moduleIndex');
    const chapterId = searchParams.get('chapterId');
    const chapterIndex = searchParams.get('chapterIndex');

    if (!moduleId && !moduleIndex) {
      return NextResponse.json(
        { error: 'Module ID or module index is required' },
        { status: 400 }
      );
    }

    // Determine learning path ID
    let resolvedLearningPathId = learningPathId;
    if (!resolvedLearningPathId && moduleId) {
      // Try to find learning path from module
      resolvedLearningPathId = await getLearningPathIdFromModule(
        student.uniqueId,
        moduleId,
        chapterId ? parseInt(chapterId) : undefined
      );
    }

    if (!resolvedLearningPathId) {
      return NextResponse.json(
        { 
          error: 'Learning path ID is required',
          message: 'Unable to determine learning path. Please provide learningPathId parameter.'
        },
        { status: 400 }
      );
    }

    // Get module index
    let resolvedModuleIndex: number;
    if (moduleIndex !== null) {
      resolvedModuleIndex = parseInt(moduleIndex);
    } else if (moduleId) {
      // Try to parse moduleId as index
      const parsed = parseInt(moduleId);
      resolvedModuleIndex = isNaN(parsed) ? 0 : parsed;
    } else {
      resolvedModuleIndex = 0;
    }

    // Check module access
    const moduleAccess = await checkModuleAccess(
      student.uniqueId,
      resolvedLearningPathId,
      resolvedModuleIndex
    );

    // If chapter is specified, also check chapter access
    let chapterAccess = null;
    if (chapterId !== null || chapterIndex !== null) {
      const resolvedChapterIndex = chapterIndex !== null 
        ? parseInt(chapterIndex) 
        : (chapterId ? parseInt(chapterId) : undefined);
      
      chapterAccess = await checkChapterAccess(
        student.uniqueId,
        resolvedLearningPathId,
        resolvedModuleIndex,
        resolvedChapterIndex
      );
    }

    return NextResponse.json({
      success: true,
      hasAccess: moduleAccess.hasAccess && (!chapterAccess || chapterAccess.hasAccess),
      moduleAccess: {
        hasAccess: moduleAccess.hasAccess,
        isLocked: moduleAccess.isLocked,
        unlockedModulesCount: moduleAccess.unlockedModulesCount,
        reason: moduleAccess.reason
      },
      chapterAccess: chapterAccess ? {
        hasAccess: chapterAccess.hasAccess,
        isLocked: chapterAccess.isLocked,
        reason: chapterAccess.reason
      } : null,
      learningPathId: resolvedLearningPathId,
      moduleIndex: resolvedModuleIndex
    });

  } catch (error) {
    console.error('Error checking module access:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
