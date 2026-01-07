import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import Assessment from '@/models/Assessment';
import LearningPath from '@/models/LearningPath';
import Student from '@/models/Student';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const N8N_WEBHOOK_URL = process.env.N8N_LEARNING_PATH_WEBHOOK_URL || 'https://nclbtaru.app.n8n.cloud/webhook/learnign-path';

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

    // Verify user is a student
    const user = await User.findById(decoded.userId);
    if (!user || user.role !== 'student') {
      return NextResponse.json(
        { error: 'Only students can generate learning paths' },
        { status: 403 }
      );
    }

    // Get student's assessment data
    const assessment = await Assessment.findOne({ userId: decoded.userId });
    if (!assessment || !assessment.assessmentCompleted) {
      return NextResponse.json(
        { error: 'Please complete assessment first' },
        { status: 400 }
      );
    }

    // Get student profile to access uniqueId
    const student = await Student.findOne({ userId: decoded.userId });
    if (!student) {
      return NextResponse.json(
        { error: 'Student profile not found' },
        { status: 404 }
      );
    }

    const { assessmentResults, validationResults } = await request.json();

    // Prepare data for N8N learning path generation
    const learningPathData = {
      studentProfile: {
        skills: assessment.subjectsILike || [],
        interests: assessment.topicsThatExciteMe || [],
        careerGoals: assessment.currentCareerInterest || [],
        dreamJob: assessment.dreamJobAsKid || '',
        aspirations: assessment.whatImMostProudOf || '',
        problemsToSolve: assessment.ifICouldFixOneProblem || '',
        learningStyle: assessment.preferredLearningStyle || [],
        languagePreference: assessment.languagePreference || 'English'
      },
      assessmentResults: assessmentResults || {},
      validationResults: validationResults || {},
      studentId: decoded.userId,
      studentName: user.name,
      grade: user.profile?.grade || '6',
      requirements: {
        duration: '6 months',
        format: 'video-based',
        platform: 'YouTube',
        includeProjects: true,
        includeAssessments: true
      }
    };

    // Call N8N webhook for learning path generation
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 45000); // 45 seconds for complex generation

    try {
      const response = await fetch(N8N_WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'generate_learning_path',
          data: learningPathData
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const result = await response.json();
        
        // Extract learning path from N8N response
        const learningPath = result.learningPath || result.data?.learningPath || {};
        
        if (!learningPath.milestones || learningPath.milestones.length === 0) {
          throw new Error('No learning path generated');
        }

        // Create learning path in database
        const pathId = `LP_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
        const newLearningPath = new LearningPath({
          pathId,
          uniqueId: student.uniqueId,
          name: learningPath.name || 'Personalized Learning Path',
          description: learningPath.description || 'AI-generated learning path based on your assessment',
          category: learningPath.category || 'academic',
          targetGrade: user.profile?.grade || '6',
          careerGoal: assessment.dreamJobAsKid || '',
          milestones: learningPath.milestones.map((milestone: any, index: number) => ({
            milestoneId: `MIL_${pathId}_${index}`,
            name: milestone.name || `Milestone ${index + 1}`,
            description: milestone.description || '',
            modules: milestone.modules || [],
            estimatedTime: milestone.estimatedTime || 120,
            prerequisites: milestone.prerequisites || [],
            status: index === 0 ? 'available' : 'locked',
            progress: 0
          })),
          totalModules: learningPath.totalModules || learningPath.milestones.length * 3,
          totalDuration: learningPath.totalDuration || learningPath.milestones.reduce((sum: number, m: any) => sum + (m.estimatedTime || 120), 0),
          totalXpPoints: learningPath.totalXpPoints || learningPath.milestones.length * 100,
          isActive: true
        });

        await newLearningPath.save();

        return NextResponse.json({
          success: true,
          learningPath: {
            pathId,
            name: newLearningPath.name,
            description: newLearningPath.description,
            milestones: newLearningPath.milestones,
            totalModules: newLearningPath.totalModules,
            totalDuration: newLearningPath.totalDuration,
            totalXpPoints: newLearningPath.totalXpPoints
          },
          metadata: {
            generatedAt: new Date().toISOString(),
            studentId: decoded.userId,
            totalMilestones: newLearningPath.milestones.length
          }
        });

      } else {
        throw new Error(`N8N returned ${response.status}`);
      }

    } catch (error) {
      console.error('N8N learning path generation error:', error);
      
      // Fallback learning path generation
      const fallbackPath = generateFallbackLearningPath(learningPathData, student.uniqueId);
      
      return NextResponse.json({
        success: true,
        learningPath: fallbackPath,
        fallback: true,
        metadata: {
          generatedAt: new Date().toISOString(),
          studentId: decoded.userId,
          totalMilestones: fallbackPath.milestones.length,
          error: 'Using fallback learning path due to N8N unavailability'
        }
      });
    }

  } catch (error) {
    console.error('Generate learning path error:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}

// Fallback learning path generator
function generateFallbackLearningPath(data: any, uniqueId: string) {
  const { studentProfile } = data;
  const pathId = `LP_FALLBACK_${Date.now()}`;
  
  // Create milestones based on student's skills and interests
  const milestones = [];
  const skills = studentProfile.skills.slice(0, 3);
  const interests = studentProfile.interests.slice(0, 2);
  
  // Milestone 1: Foundation (first skill)
  if (skills.length > 0) {
    milestones.push({
      milestoneId: `${pathId}_M1`,
      name: `${skills[0]} Foundation`,
      description: `Build a strong foundation in ${skills[0]}`,
      modules: [`${skills[0]}_basic_1`, `${skills[0]}_basic_2`, `${skills[0]}_basic_3`],
      estimatedTime: 120,
      prerequisites: [],
      status: 'available',
      progress: 0
    });
  }

  // Milestone 2: Interest Exploration
  if (interests.length > 0) {
    milestones.push({
      milestoneId: `${pathId}_M2`,
      name: `${interests[0]} Exploration`,
      description: `Explore your interest in ${interests[0]}`,
      modules: [`${interests[0]}_explore_1`, `${interests[0]}_explore_2`],
      estimatedTime: 180,
      prerequisites: [`${pathId}_M1`],
      status: 'locked',
      progress: 0
    });
  }

  // Milestone 3: Advanced Skills
  if (skills.length > 1) {
    milestones.push({
      milestoneId: `${pathId}_M3`,
      name: `${skills[1]} Advanced`,
      description: `Advanced concepts in ${skills[1]}`,
      modules: [`${skills[1]}_advanced_1`, `${skills[1]}_advanced_2`],
      estimatedTime: 240,
      prerequisites: [`${pathId}_M1`],
      status: 'locked',
      progress: 0
    });
  }

  // Milestone 4: Project Work
  milestones.push({
    milestoneId: `${pathId}_M4`,
    name: 'Project Portfolio',
    description: 'Apply your learning through hands-on projects',
    modules: ['project_planning', 'project_execution', 'project_presentation'],
    estimatedTime: 300,
    prerequisites: [`${pathId}_M1`, `${pathId}_M2`],
    status: 'locked',
    progress: 0
  });

  // Milestone 5: Career Preparation
  if (studentProfile.careerGoals.length > 0) {
    milestones.push({
      milestoneId: `${pathId}_M5`,
      name: 'Career Preparation',
      description: `Prepare for a career in ${studentProfile.careerGoals[0]}`,
      modules: ['career_research', 'skill_development', 'portfolio_building'],
      estimatedTime: 240,
      prerequisites: [`${pathId}_M4`],
      status: 'locked',
      progress: 0
    });
  }

  return {
    pathId,
    uniqueId,
    name: 'Personalized Learning Journey',
    description: 'A customized learning path based on your skills, interests, and goals',
    milestones,
    totalModules: milestones.reduce((sum, m) => sum + m.modules.length, 0),
    totalDuration: milestones.reduce((sum, m) => sum + m.estimatedTime, 0),
    totalXpPoints: milestones.length * 100
  };
} 