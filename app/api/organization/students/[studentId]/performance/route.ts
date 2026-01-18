import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import connectDB from '@/lib/mongodb';
import Student from '@/models/Student';
import User from '@/models/User';
import Organization from '@/models/Organization';
import StudentProgress from '@/models/StudentProgress';
import AssessmentResponse from '@/models/AssessmentResponse';
import LearningPathResponse from '@/models/LearningPathResponse';
import Module from '@/models/Module';
import YoutubeUrl from '@/models/YoutubeUrl';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

interface DecodedToken {
  userId: string;
  role: string;
  [key: string]: unknown;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ studentId: string }> }
) {
  try {
    await connectDB();

    // Get JWT token from cookies
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Verify JWT token
    let decoded: DecodedToken;
    try {
      decoded = jwt.verify(token, JWT_SECRET) as DecodedToken;
    } catch (jwtError) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
    }

    // Get authenticated user
    const user = await User.findById(decoded.userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if user is organization admin or super admin
    const isSuperAdmin = user.role === 'platform_super_admin' || user.role === 'admin';
    const isOrganizationAdmin = user.role === 'organization';

    if (!isSuperAdmin && !isOrganizationAdmin) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const { studentId } = await params;

    // Find the student
    const student = await Student.findById(studentId);
    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    // If organization admin, verify the student belongs to their organization
    if (isOrganizationAdmin && !isSuperAdmin) {
      const organization = await Organization.findOne({ userId: user._id.toString() });
      if (!organization) {
        return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
      }

      if (student.organizationId?.toString() !== organization._id.toString()) {
        return NextResponse.json(
          { error: 'You can only view students from your own organization' },
          { status: 403 }
        );
      }
    }

    // Get student user
    const studentUser = await User.findById(student.userId);
    if (!studentUser) {
      return NextResponse.json({ error: 'Student user account not found' }, { status: 404 });
    }

    // Get student progress - try both studentId (by uniqueId) and by student _id
    let studentProgress = await StudentProgress.findOne({ studentId: student.uniqueId });
    if (!studentProgress) {
      studentProgress = await StudentProgress.findOne({ studentId: student._id.toString() });
    }

    // Get total available modules dynamically (same logic as student dashboard)
    // Try YouTube data first, then fallback to Module collection
    const youtubeData = await YoutubeUrl.findOne({ uniqueid: student.uniqueId });
    let totalModules = 0;
    
    if (youtubeData && youtubeData.Module && youtubeData.Module.length > 0) {
      // Each item in Module array represents one chapter/module
      totalModules = youtubeData.Module.length;
    } else {
      // Fallback to Module collection - count active modules by default
      totalModules = await Module.countDocuments({ isActive: { $ne: false } });
      // If no active modules filter, count all modules
      if (totalModules === 0) {
        totalModules = await Module.countDocuments({});
      }
    }

    // Get completed modules (completed if quizScore >= 75% OR completedAt exists OR isCompleted === true)
    const completedModules = studentProgress?.moduleProgress?.filter(
      (mp: any) => mp.quizScore >= 75 || mp.completedAt || (mp.isCompleted === true)
    ) || [];

    // Get in-progress modules (has some progress but not completed)
    // In-progress: has quizScore > 0 OR videoProgress > 0 OR lastAccessedAt, but not completed
    const inProgressModules = studentProgress?.moduleProgress?.filter(
      (mp: any) => {
        const hasProgress = (mp.quizScore > 0) || 
                           (mp.videoProgress?.watchTime > 0) || 
                           (mp.lastAccessedAt);
        const isCompleted = mp.quizScore >= 75 || mp.completedAt || (mp.isCompleted === true);
        return hasProgress && !isCompleted;
      }
    ) || [];

    // Calculate total XP dynamically from module progress (same formula as other dashboards)
    let totalXp = 0;
    if (studentProgress && studentProgress.moduleProgress) {
      totalXp = studentProgress.moduleProgress.reduce((sum: number, mp: any) => {
        let moduleXp = 0;
        
        // Base XP for starting a module
        moduleXp += 25;
        
        // XP for quiz performance (0.5 XP per percentage point)
        if (mp.quizScore > 0) {
          moduleXp += Math.round(mp.quizScore * 0.5);
        }
        
        // Bonus XP for completion (75 XP bonus)
        if (mp.quizScore >= 75 || mp.completedAt) {
          moduleXp += 75;
        }
        
        // Video watch time bonus (1 XP per 10 minutes watched)
        if (mp.videoProgress?.watchTime > 0) {
          moduleXp += Math.floor(mp.videoProgress.watchTime / 600); // 600 seconds = 10 minutes
        }
        
        return sum + moduleXp;
      }, 0);
      
      // Add learning streak bonus (if not already included in totalPoints)
      const streakBonus = Math.min((studentProgress.learningStreak || 0) * 10, 100);
      totalXp += streakBonus;
    } else {
      // Fallback to totalPoints if available
      totalXp = studentProgress?.totalPoints || 0;
    }

    // Get assessment responses
    const assessmentResponses = await AssessmentResponse.find({
      uniqueId: student.uniqueId
    }).sort({ completedAt: -1 }).limit(5);

    // Get learning paths
    const learningPaths = await LearningPathResponse.find({
      uniqueId: student.uniqueId
    }).sort({ createdAt: -1 });

    // Calculate module completion rate based on total available modules
    const completionRate = totalModules > 0
      ? (completedModules.length / totalModules) * 100
      : 0;

    // Get recent activity (from module progress, sorted by lastAccessedAt)
    const recentActivity = studentProgress?.moduleProgress
      ?.filter((mp: any) => mp.lastAccessedAt)
      ?.sort((a: any, b: any) => {
        const dateA = new Date(a.lastAccessedAt).getTime();
        const dateB = new Date(b.lastAccessedAt).getTime();
        return dateB - dateA;
      })
      ?.slice(0, 5) || [];

    // Enhance recent activity with module names
    const enrichedRecentActivity = await Promise.all(
      recentActivity.map(async (activity: any) => {
        if (activity.moduleId) {
          const module = await Module.findById(activity.moduleId);
          return {
            ...activity,
            moduleName: module?.title || 'Unknown Module',
            moduleSubject: module?.subject || 'Unknown'
          };
        }
        return activity;
      })
    );

    // Get latest assessment score
    const latestAssessment = assessmentResponses[0];
    const latestAssessmentScore = latestAssessment?.score || 0;

    // Calculate average assessment score
    const allAssessmentScores = assessmentResponses
      .map((ar: any) => ar.score)
      .filter((score: any) => typeof score === 'number');
    const averageAssessmentScore = allAssessmentScores.length > 0
      ? allAssessmentScores.reduce((sum: number, score: number) => sum + score, 0) / allAssessmentScores.length
      : 0;

    // Prepare performance summary
    const performanceData = {
      student: {
        id: student._id.toString(),
        userId: student.userId,
        fullName: student.fullName,
        email: studentUser.email,
        uniqueId: student.uniqueId,
        classGrade: student.classGrade,
        schoolName: student.schoolName,
        isActive: studentUser.isActive !== false,
        onboardingCompleted: student.onboardingCompleted,
        createdAt: student.createdAt
      },
      overview: {
        totalModules: totalModules, // Use dynamically calculated total modules
        completedModules: completedModules.length,
        inProgressModules: inProgressModules.length,
        completionRate: Math.round(completionRate),
        totalXp: totalXp,
        learningStreak: studentProgress?.learningStreak || 0,
        badgesEarned: studentProgress?.badgesEarned?.length || 0
      },
      assessments: {
        totalCompleted: assessmentResponses.length,
        latestScore: latestAssessmentScore,
        averageScore: Math.round(averageAssessmentScore),
        completedAssessments: assessmentResponses.map((ar: any) => ({
          type: ar.assessmentType,
          score: ar.score,
          completedAt: ar.completedAt,
          isCompleted: ar.isCompleted
        }))
      },
      learningPaths: {
        total: learningPaths.length,
        completed: learningPaths.filter((lp: any) => lp.isCompleted).length,
        paths: learningPaths.map((lp: any) => ({
          id: lp._id.toString(),
          careerDomain: lp.careerDomain,
          isCompleted: lp.isCompleted,
          createdAt: lp.createdAt
        }))
      },
      recentActivity: enrichedRecentActivity,
      progress: {
        modulesCompleted: completedModules.length,
        modulesInProgress: inProgressModules.length,
        lastActivityDate: studentProgress?.moduleProgress?.[0]?.lastAccessedAt || null
      }
    };

    return NextResponse.json(performanceData);
  } catch (error) {
    console.error('Error fetching student performance:', error);
    return NextResponse.json(
      { error: 'Failed to fetch student performance' },
      { status: 500 }
    );
  }
}
