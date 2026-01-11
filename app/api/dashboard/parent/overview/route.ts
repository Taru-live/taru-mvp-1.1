import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import Student from '@/models/Student';
import StudentProgress from '@/models/StudentProgress';
import Assessment from '@/models/Assessment';
import Module from '@/models/Module';
import YoutubeUrl from '@/models/YoutubeUrl';
import { sanitizeProfilePictureUrl } from '@/lib/utils';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

interface DecodedToken {
  userId: string;
  [key: string]: unknown;
}

interface ModuleProgress {
  moduleId: string;
  status: string;
  progress: number;
  xpEarned: number;
  startedAt: Date;
}

interface SubjectStats {
  total: number;
  completed: number;
  xpEarned: number;
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
    if (!user || user.role !== 'parent') {
      return NextResponse.json(
        { error: 'Only parents can access this endpoint' },
        { status: 403 }
      );
    }

    // Get linked student
    const linkedStudentId = user.profile?.linkedStudentId;
    if (!linkedStudentId) {
      return NextResponse.json(
        { error: 'No student linked to this parent account' },
        { status: 400 }
      );
    }

    // Get student profile
    console.log('🔍 Looking for student with userId:', linkedStudentId);
    const student = await Student.findOne({ userId: linkedStudentId });
    if (!student) {
      console.log('❌ Student not found with userId:', linkedStudentId);
      return NextResponse.json(
        { error: 'Linked student not found' },
        { status: 404 }
      );
    }
    console.log('✅ Found student:', {
      id: student._id,
      uniqueId: student.uniqueId,
      fullName: student.fullName,
      userId: student.userId
    });

    // Get student user data for email
    const studentUser = await User.findById(linkedStudentId);
    if (!studentUser) {
      return NextResponse.json(
        { error: 'Student user data not found' },
        { status: 404 }
      );
    }

    // Get student progress - use new structure with studentId (same as student dashboard)
    console.log('🔍 Looking for student progress with studentId:', student.uniqueId);
    const progress = await StudentProgress.findOne({ studentId: student.uniqueId });
    console.log('📊 Found progress data:', progress ? 'Yes' : 'No');
    if (progress) {
      console.log('📈 Progress details:', {
        moduleProgressCount: progress.moduleProgress?.length || 0,
        totalPoints: progress.totalPoints || 0,
        learningStreak: progress.learningStreak || 0
      });
    }
    
    // Get assessment data
    const assessment = await Assessment.findOne({ userId: linkedStudentId });
    
    // Get actual total modules from YouTube data (same as student dashboard)
    const youtubeData = await YoutubeUrl.findOne({ uniqueid: student.uniqueId });
    let totalModules = 0;
    
    if (youtubeData && youtubeData.Module && youtubeData.Module.length > 0) {
      console.log('📺 YouTube data found for parent dashboard:', {
        totalModules: youtubeData.Module.length,
        modules: youtubeData.Module.map((module: any, index: number) => ({
          moduleIndex: index,
          chapterKey: Object.keys(module)[0],
          videoTitle: module[Object.keys(module)[0]]?.videoTitle || 'Unknown'
        }))
      });
      
      // Each item in Module array is one chapter, so total is just the array length
      totalModules = youtubeData.Module.length;
    } else {
      console.log('📚 No YouTube data found, using Module collection');
      // Fallback to Module collection if no YouTube data
      const allModules = await Module.find({});
      totalModules = allModules.length;
    }
    
    // Get active modules
    const activeModules = await Module.find({ isActive: true }).limit(5);

    // Calculate statistics using new progress structure
    let completedModules = 0;
    let inProgressModules = 0;
    let totalXp = 0;
    let averageScore = 0;
    let recentActivity: any[] = [];

    if (progress && progress.moduleProgress) {
      console.log('📊 Processing progress data:', {
        totalModuleProgress: progress.moduleProgress.length,
        sampleModule: progress.moduleProgress[0]
      });
      
      // Count completed modules (score >= 75% or has completedAt)
      completedModules = progress.moduleProgress.filter((mp: any) => 
        mp.quizScore >= 75 || mp.completedAt
      ).length;
      
      console.log('✅ Completed modules calculation:', {
        totalModules: progress.moduleProgress.length,
        completedModules,
        completedDetails: progress.moduleProgress.filter((mp: any) => 
          mp.quizScore >= 75 || mp.completedAt
        ).map((mp: any) => ({
          moduleId: mp.moduleId,
          quizScore: mp.quizScore,
          completedAt: mp.completedAt
        }))
      });

      // Count in-progress modules (has some progress but not completed)
      inProgressModules = progress.moduleProgress.filter((mp: any) => 
        (mp.quizScore > 0 || mp.videoProgress?.watchTime > 0) && 
        !(mp.quizScore >= 75 || mp.completedAt)
      ).length;

      // Calculate total XP with detailed breakdown (same as student dashboard)
      totalXp = progress.moduleProgress.reduce((sum: number, mp: any) => {
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
      
      console.log('⭐ XP calculation details:', {
        totalXp,
        moduleProgressCount: progress.moduleProgress.length,
        sampleModuleXP: progress.moduleProgress[0] ? {
          moduleId: progress.moduleProgress[0].moduleId,
          quizScore: progress.moduleProgress[0].quizScore,
          pointsEarned: progress.moduleProgress[0].pointsEarned,
          videoWatchTime: progress.moduleProgress[0].videoProgress?.watchTime
        } : 'No modules'
      });
      
      // Add learning streak bonus
      const streakBonus = Math.min((progress.learningStreak || 0) * 10, 100);
      totalXp += streakBonus;

      // Calculate average score from quiz scores
      const scoresWithQuiz = progress.moduleProgress.filter((mp: any) => mp.quizScore > 0);
      averageScore = scoresWithQuiz.length > 0 
        ? Math.round(scoresWithQuiz.reduce((sum: number, mp: any) => sum + mp.quizScore, 0) / scoresWithQuiz.length)
        : 0;

      // Get recent activity (last 5 modules)
      recentActivity = progress.moduleProgress
        .sort((a: any, b: any) => new Date(b.lastAccessedAt || b.startedAt).getTime() - new Date(a.lastAccessedAt || a.startedAt).getTime())
        .slice(0, 5)
        .map((mp: any) => {
          const isCompleted = mp.quizScore >= 75 || mp.completedAt;
          
          // Try to get module name from YouTube data
          let moduleName = mp.moduleId;
          if (youtubeData && youtubeData.Module && youtubeData.Module.length > 0) {
            const moduleIndex = youtubeData.Module.findIndex((module: any) => {
              const chapterKey = Object.keys(module)[0];
              return chapterKey === mp.moduleId;
            });
            if (moduleIndex !== -1) {
              const chapterKey = Object.keys(youtubeData.Module[moduleIndex])[0];
              const chapter = youtubeData.Module[moduleIndex][chapterKey];
              moduleName = chapter.videoTitle || chapterKey;
            }
          }
          
          return {
            moduleId: mp.moduleId,
            moduleName: moduleName,
            status: isCompleted ? 'completed' : 'in-progress',
            progress: isCompleted ? 100 : Math.min(mp.quizScore || 0, 100),
            xpEarned: mp.pointsEarned || 0,
            lastAccessed: mp.lastAccessedAt || mp.startedAt
          };
        });
    }

    // Calculate completion rate
    const completionRate = totalModules > 0 ? Math.round((completedModules / totalModules) * 100) : 0;

    // Get test results from assessment
    const testResults = [];
    if (assessment?.diagnosticCompleted) {
      testResults.push({
        id: '1',
        testName: 'Learning Profile Assessment',
        score: assessment.diagnosticScore || 0,
        totalQuestions: 15,
        date: assessment.assessmentCompletedAt?.toISOString().split('T')[0] || new Date().toISOString().split('T')[0],
        subject: 'Overall Assessment',
        grade: getGradeFromScore(assessment.diagnosticScore || 0)
      });
    }

    // Get notifications based on student progress
    const notifications = [];
    
    if (completedModules === 0) {
      notifications.push({
        id: '1',
        title: 'Student Onboarding Complete',
        message: `${student.fullName} has completed their profile setup. They can now start learning!`,
        type: 'info',
        date: new Date().toISOString().split('T')[0],
        read: false
      });
    }
    
    if (inProgressModules > 0) {
      notifications.push({
        id: '2',
        title: 'Active Learning',
        message: `${student.fullName} is currently working on ${inProgressModules} module(s).`,
        type: 'success',
        date: new Date().toISOString().split('T')[0],
        read: false
      });
    }

    if (completedModules > 0) {
      notifications.push({
        id: '3',
        title: 'Great Progress!',
        message: `${student.fullName} has completed ${completedModules} module(s) and earned ${totalXp} XP!`,
        type: 'success',
        date: new Date().toISOString().split('T')[0],
        read: false
      });
    }

    // Get progress reports by subject
    const progressReports: Array<{
      subject: string;
      currentGrade: string;
      improvement: number;
      attendance: number;
      assignmentsCompleted: number;
      totalAssignments: number;
    }> = [];
    if (progress?.moduleProgress) {
      const subjectStats: Record<string, SubjectStats> = {};
      
      progress.moduleProgress.forEach((mp: any) => {
        let subject = 'General';
        
        // Try to find module info from YouTube data first
        if (youtubeData && youtubeData.Module && youtubeData.Module.length > 0) {
          const moduleIndex = youtubeData.Module.findIndex((module: any) => {
            const chapterKey = Object.keys(module)[0];
            return chapterKey === mp.moduleId;
          });
          if (moduleIndex !== -1) {
            subject = `Chapter ${moduleIndex + 1}`;
          }
        } else {
          // Fallback to active modules
          const foundModule = activeModules.find(m => m._id.toString() === mp.moduleId);
          if (foundModule) {
            subject = foundModule.subject;
          }
        }
        
        if (!subjectStats[subject]) {
          subjectStats[subject] = {
            total: 0,
            completed: 0,
            xpEarned: 0
          };
        }
        subjectStats[subject].total++;
        // Check if module is completed (score >= 75% or has completedAt)
        if (mp.quizScore >= 75 || mp.completedAt) {
          subjectStats[subject].completed++;
        }
        subjectStats[subject].xpEarned += mp.pointsEarned || 0;
      });

      Object.entries(subjectStats).forEach(([subject, stats]: [string, SubjectStats]) => {
        progressReports.push({
          subject,
          currentGrade: getGradeFromScore((stats.completed / stats.total) * 100),
          improvement: Math.round((stats.completed / stats.total) * 100),
          attendance: (() => {
            // Calculate real attendance based on learning activity
            // Attendance = percentage of days with activity in last 30 days
            if (!progress?.moduleProgress) return 0;
            
            const last30Days = new Set<string>();
            const now = Date.now();
            const thirtyDaysAgo = now - (30 * 24 * 60 * 60 * 1000);
            
            progress.moduleProgress.forEach((mp: any) => {
              // Check lastAccessedAt dates
              if (mp.lastAccessedAt) {
                const accessDate = new Date(mp.lastAccessedAt);
                if (accessDate.getTime() >= thirtyDaysAgo) {
                  const dateKey = accessDate.toISOString().split('T')[0];
                  last30Days.add(dateKey);
                }
              }
              
              // Check completedAt dates
              if (mp.completedAt) {
                const completedDate = new Date(mp.completedAt);
                if (completedDate.getTime() >= thirtyDaysAgo) {
                  const dateKey = completedDate.toISOString().split('T')[0];
                  last30Days.add(dateKey);
                }
              }
            });
            
            // Calculate percentage (days with activity / 30 days)
            return Math.min(Math.round((last30Days.size / 30) * 100), 100);
          })(),
          assignmentsCompleted: stats.completed,
          totalAssignments: stats.total
        });
      });
    }

    console.log('📤 Final API response data:', {
      totalModules,
      completedModules,
      inProgressModules,
      totalXp,
      averageScore,
      learningStreak: progress?.learningStreak || 0,
      hasProgress: !!progress,
      hasModuleProgress: !!(progress?.moduleProgress)
    });

    return NextResponse.json({
      // Parent-specific fields
      student: {
        id: student.userId,
        name: student.fullName,
        email: studentUser.email,
        grade: student.classGrade,
        school: student.schoolName,
        profilePicture: sanitizeProfilePictureUrl(student.profilePictureUrl)
      },
      testResults,
      progressReports,
      completionRate,
      // Student dashboard parity block
      studentDashboard: {
        overview: {
          totalModules,
          completedModules,
          inProgressModules,
          totalXp,
          averageScore,
          learningStreak: progress?.learningStreak || 0,
          studentName: student.fullName || studentUser.name,
          grade: student.classGrade || studentUser.profile?.grade || 'Not set',
          school: student.schoolName || 'Not set',
          studentKey: student.uniqueId || 'Not available'
        },
        recentActivity,
        notifications,
        recommendedModules: (() => {
          // Get recommended modules (chapters not started yet) - same logic as student dashboard
          const startedModuleIds = progress?.moduleProgress?.map((mp: any) => mp.moduleId) || [];
          let recommendedModules: any[] = [];
          
          if (youtubeData && youtubeData.Module && youtubeData.Module.length > 0) {
            // Get all available chapters from YouTube data
            const allChapters: any[] = [];
            youtubeData.Module.forEach((module: any, moduleIndex: number) => {
              // Each module item contains one chapter
              const chapterKey = Object.keys(module)[0];
              const chapter = module[chapterKey];
              allChapters.push({
                id: chapterKey, // Use the actual chapter key like "Chapter 1"
                name: chapter.videoTitle,
                subject: `Chapter ${moduleIndex + 1}`,
                description: `Chapter: ${chapterKey}`,
                xpPoints: 100,
                estimatedDuration: '5-10 min',
                videoUrl: chapter.videoUrl
              });
            });
            
            // Filter out chapters that have been started
            recommendedModules = allChapters
              .filter(chapter => !startedModuleIds.includes(chapter.id))
              .slice(0, 6);
          } else {
            // Fallback to Module collection
            recommendedModules = activeModules
              .filter((module: any) => !startedModuleIds.includes(module._id.toString()))
              .slice(0, 3)
              .map((module: any) => ({
                id: module._id.toString(),
                name: module.name,
                subject: module.subject,
                description: module.description,
                xpPoints: module.xpPoints,
                estimatedDuration: module.estimatedDuration
              }));
          }
          
          return recommendedModules;
        })(),
        progress: {
          totalTimeSpent: progress?.moduleProgress?.reduce((sum: number, mp: any) => {
            return sum + (mp.videoProgress?.watchTime || 0);
          }, 0) || 0,
          badgesEarned: progress?.moduleProgress?.flatMap((mp: any) => 
            mp.gamificationProgress?.badges || []
          ).map((badge: any) => ({
            badgeId: badge.badgeId,
            name: badge.name,
            description: `Achievement earned through learning progress`,
            earnedAt: badge.earnedAt
          })) || [],
          currentModule: recentActivity[0] || null
        }
      }
    });

  } catch (error: unknown) {
    console.error('Get parent overview error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function getGradeFromScore(score: number): string {
  if (score >= 90) return 'A';
  if (score >= 80) return 'B';
  if (score >= 70) return 'C';
  if (score >= 60) return 'D';
  return 'F';
} 