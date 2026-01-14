import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import LearningPath from '@/models/LearningPath';
import LearningPathResponse from '@/models/LearningPathResponse';
import StudentProgress from '@/models/StudentProgress';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

interface DecodedToken {
  userId: string;
  [key: string]: unknown;
}

interface PathProgress {
  pathId: string;
  status: string;
  progress: number;
  milestoneProgress?: Array<{
    milestoneId: string;
    status: string;
    progress: number;
  }>;
}

interface Milestone {
  milestoneId: string;
  toObject?: () => Record<string, unknown>;
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

    // Get user
    const user = await User.findById(decoded.userId);
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Get studentId from query params
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId');

    // Validate access and determine effective studentId based on role
    const Student = (await import('@/models/Student')).default;
    let effectiveStudentId: string;

    if (user.role === 'student') {
      // Students can only access their own learning paths
      const student = await Student.findOne({ userId: decoded.userId });
      if (!student) {
        return NextResponse.json(
          { error: 'Student profile not found' },
          { status: 404 }
        );
      }
      effectiveStudentId = studentId || student.uniqueId;
      if (effectiveStudentId !== student.uniqueId) {
        return NextResponse.json(
          { error: 'You can only access your own learning paths' },
          { status: 403 }
        );
      }
    } else if (user.role === 'parent') {
      // Parents can access their linked child's learning paths
      const linkedStudentId = user.profile?.linkedStudentId;
      if (!linkedStudentId) {
        return NextResponse.json(
          { error: 'No student linked to this parent account' },
          { status: 400 }
        );
      }
      const linkedStudent = await Student.findOne({ userId: linkedStudentId });
      if (!linkedStudent) {
        return NextResponse.json(
          { error: 'Linked student not found' },
          { status: 404 }
        );
      }
      effectiveStudentId = studentId || linkedStudent.uniqueId;
      // If studentId is provided, verify it matches the linked student
      if (studentId && studentId !== linkedStudent.uniqueId) {
        return NextResponse.json(
          { error: 'You can only access your linked child\'s learning paths' },
          { status: 403 }
        );
      }
    } else if (user.role === 'teacher') {
      // Teachers can access their students' learning paths
      if (!studentId) {
        return NextResponse.json(
          { error: 'Student ID is required for teachers' },
          { status: 400 }
        );
      }
      const student = await Student.findOne({ uniqueId: studentId });
      if (!student) {
        return NextResponse.json(
          { error: 'Student not found' },
          { status: 404 }
        );
      }
      if (student.teacherId?.toString() !== decoded.userId) {
        return NextResponse.json(
          { error: 'You can only access learning paths of your students' },
          { status: 403 }
        );
      }
      effectiveStudentId = studentId;
    } else {
      return NextResponse.json(
        { error: 'Access denied. Only students, parents, and teachers can access learning paths' },
        { status: 403 }
      );
    }

    if (effectiveStudentId) {
      // Get learning paths for specific student from learning-path-responses collection
      console.log(`🔍 Fetching learning paths for student: ${effectiveStudentId}`);
      const learningPathResponses = await LearningPathResponse.find({ 
        uniqueid: effectiveStudentId 
      }).sort({ updatedAt: -1 });
      
      console.log(`📊 Found ${learningPathResponses.length} learning path response(s) in database for student ${effectiveStudentId}`);

      // Helper function to extract and normalize career path from greeting
      const extractCareerPath = (greeting: string): string => {
        if (!greeting) return 'Career Path';
        
        // Remove "Hi [name]!" prefix
        let extracted = greeting.replace(/^Hi\s+[^!]+!\s*/i, '').trim();
        
        // Try to extract career path from common patterns
        // Pattern 1: "Welcome to your {careerPath} learning journey!"
        const welcomeMatch = extracted.match(/Welcome\s+to\s+your\s+(.+?)\s+learning\s+journey/i);
        if (welcomeMatch && welcomeMatch[1]) {
          return welcomeMatch[1].trim();
        }
        
        // Pattern 2: "You're on a thrilling path! As a {careerPath}..."
        const pathMatch = extracted.match(/As\s+a\s+([^,\.!]+)/i);
        if (pathMatch && pathMatch[1]) {
          return pathMatch[1].trim();
        }
        
        // Pattern 3: Remove common suffixes and prefixes
        extracted = extracted
          .replace(/Welcome\s+to\s+your\s+/i, '')
          .replace(/\s+learning\s+journey!?\s*$/i, '')
          .replace(/\s+career\s+path!?\s*$/i, '')
          .replace(/\s+path!?\s*$/i, '')
          .trim();
        
        // If we still have a long sentence, try to extract the main career title
        // Look for capitalized words (likely the career name)
        if (extracted.length > 50) {
          const words = extracted.split(/\s+/);
          const capitalizedWords = words.filter(word => /^[A-Z][a-z]+/.test(word));
          if (capitalizedWords.length > 0) {
            // Take the last few capitalized words (likely the career name)
            return capitalizedWords.slice(-2).join(' ') || extracted;
          }
        }
        
        return extracted || 'Career Path';
      };

      const normalizeCareerPath = (careerPath: string): string => {
        return careerPath.trim().toLowerCase();
      };

      // Group responses by normalized career path title to find duplicates
      const pathsByTitle = new Map<string, typeof learningPathResponses>();
      
      learningPathResponses.forEach((response) => {
        const extractedPath = extractCareerPath(response.output.greeting || '');
        const normalizedTitle = normalizeCareerPath(extractedPath);
        
        if (!pathsByTitle.has(normalizedTitle)) {
          pathsByTitle.set(normalizedTitle, []);
        }
        pathsByTitle.get(normalizedTitle)!.push(response);
      });
      
      // Identify duplicates to delete (keep only the most recent one for each title)
      const pathsToDelete: mongoose.Types.ObjectId[] = [];
      const pathsToKeep: typeof learningPathResponses = [];
      
      pathsByTitle.forEach((responses, normalizedTitle) => {
        if (responses.length > 1) {
          // Sort by updatedAt (most recent first)
          responses.sort((a, b) => {
            const dateA = a.updatedAt || a.createdAt || new Date(0);
            const dateB = b.updatedAt || b.createdAt || new Date(0);
            return dateB.getTime() - dateA.getTime();
          });
          
          // Keep the most recent one
          pathsToKeep.push(responses[0]);
          
          // Mark the rest for deletion
          responses.slice(1).forEach(response => {
            pathsToDelete.push(response._id);
          });
        } else {
          // Only one path with this title, keep it
          pathsToKeep.push(responses[0]);
        }
      });
      
      // Actually delete duplicates from the database
      if (pathsToDelete.length > 0) {
        try {
          const deleteResult = await LearningPathResponse.deleteMany({
            _id: { $in: pathsToDelete }
          });
          console.log(`🗑️ Deleted ${deleteResult.deletedCount} duplicate learning path(s) from database for student ${effectiveStudentId}`);
        } catch (deleteError) {
          console.error('❌ Error deleting duplicate learning paths:', deleteError);
          // Continue even if deletion fails - we'll still filter for display
        }
      }
      
      // Transform the kept paths to match the expected format
      // Handle both 'modules' and 'learningPath' structures from the collection
      const learningPaths = pathsToKeep
        .map(response => {
          const output = response.output as any;
          
          // Check if data uses 'modules' structure (new format) or 'learningPath' structure (old format)
          const modulesData = output.modules || output.learningPath || [];
          
          // Transform modules structure to learningPath format if needed
          let learningModules: any[] = [];
          
          if (modulesData.length > 0) {
            // Check if it's the new format (has moduleId/moduleTitle) or old format
            const firstModule = modulesData[0];
            const isNewFormat = firstModule.moduleId !== undefined || firstModule.moduleTitle !== undefined;
            
            if (isNewFormat) {
              // New format with moduleId, moduleTitle, moduleDescription
              learningModules = modulesData.map((module: any) => ({
                module: module.moduleTitle || module.module || '',
                description: module.moduleDescription || module.description || '',
                submodules: (module.submodules || []).map((submodule: any) => ({
                  title: submodule.submoduleTitle || submodule.title || '',
                  description: submodule.submoduleDescription || submodule.description || '',
                  chapters: (submodule.chapters || []).map((chapter: any) => ({
                    title: chapter.chapterTitle || chapter.title || '',
                    description: chapter.chapterDescription || chapter.description || undefined
                  }))
                }))
              }));
            } else {
              // Old format already in learningPath structure
              learningModules = modulesData;
            }
          }
          
          return {
            _id: response._id.toString(),
            studentId: response.uniqueid,
            careerPath: extractCareerPath(output.greeting || '') || 'Career Path',
            description: Array.isArray(output.overview) ? output.overview.join(' ') : (output.overview || 'Learning path description'),
            learningModules: learningModules,
            timeRequired: output.timeRequired || 'Not specified',
            focusAreas: Array.isArray(output.focusAreas) ? output.focusAreas : [],
            createdAt: response.createdAt ? (response.createdAt instanceof Date ? response.createdAt.toISOString() : response.createdAt) : new Date().toISOString(),
            updatedAt: response.updatedAt ? (response.updatedAt instanceof Date ? response.updatedAt.toISOString() : response.updatedAt) : new Date().toISOString(),
            isActive: response.isActive || false,
            // Include raw output for detailed view
            rawOutput: output
          };
        })
        .sort((a, b) => {
          // Sort by isActive first (active paths first), then by updatedAt
          if (a.isActive !== b.isActive) {
            return a.isActive ? -1 : 1;
          }
          const dateA = new Date(a.updatedAt || a.createdAt || 0);
          const dateB = new Date(b.updatedAt || b.createdAt || 0);
          return dateB.getTime() - dateA.getTime();
        });

      const duplicateCount = learningPathResponses.length - learningPaths.length;
      if (duplicateCount > 0) {
        console.log(`✅ Cleaned up ${duplicateCount} duplicate learning path(s) from database for student ${effectiveStudentId}`);
      }

      // Log transformation results for debugging
      console.log('📋 Learning paths transformation complete:', {
        originalCount: learningPathResponses.length,
        transformedCount: learningPaths.length,
        studentId: effectiveStudentId
      });
      
      if (learningPaths.length > 0) {
        console.log('📋 Transformed learning paths:', {
          count: learningPaths.length,
          firstPath: {
            careerPath: learningPaths[0].careerPath,
            modulesCount: learningPaths[0].learningModules?.length || 0,
            firstModuleStructure: learningPaths[0].learningModules?.[0]
          }
        });
      } else {
        console.log('⚠️ No learning paths found after transformation. Original responses:', {
          count: learningPathResponses.length,
          responses: learningPathResponses.map(r => ({
            id: r._id,
            hasOutput: !!r.output,
            hasGreeting: !!r.output?.greeting,
            uniqueid: r.uniqueid,
            isActive: r.isActive
          }))
        });
      }

      return NextResponse.json({
        learningPaths: learningPaths
      });
    } else {
      // Get all active learning paths (original functionality)
      const learningPaths = await LearningPath.find({ isActive: true });
      
      // Get student progress
      const progress = await StudentProgress.findOne({ userId: decoded.userId });

      // Update path progress with student data
      const pathsWithProgress = learningPaths.map(path => {
        const pathProgress = progress?.pathProgress?.find((pp: PathProgress) => pp.pathId === path.pathId);
        
        if (pathProgress) {
          // Update milestone status based on progress
          const updatedMilestones = path.milestones.map((milestone: Milestone) => {
            const milestoneProgress = pathProgress.milestoneProgress?.find((mp: { milestoneId: string }) => mp.milestoneId === milestone.milestoneId);
            return {
              ...(milestone.toObject ? milestone.toObject() : milestone),
              status: milestoneProgress?.status || 'locked',
              progress: milestoneProgress?.progress || 0
            };
          });

          return {
            ...path.toObject(),
            milestones: updatedMilestones,
            status: pathProgress.status,
            progress: pathProgress.progress
          };
        }

        return path.toObject();
      });

      return NextResponse.json({
        paths: pathsWithProgress
      });
    }

  } catch (error) {
    console.error('Get learning paths error:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
} 