import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import Student from '@/models/Student';
import StudentProgress from '@/models/StudentProgress';
import Module from '@/models/Module';
import Assessment from '@/models/Assessment';
import YoutubeUrl from '@/models/YoutubeUrl';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

interface DecodedToken {
  userId: string;
  role: string;
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

    if (decoded.role !== 'student') {
      return NextResponse.json(
        { error: 'Access denied. Student role required.' },
        { status: 403 }
      );
    }

    await connectDB();

    // Get user and student info
    const user = await User.findById(decoded.userId);
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const student = await Student.findOne({ userId: decoded.userId });
    if (!student) {
      return NextResponse.json(
        { error: 'Student profile not found' },
        { status: 404 }
      );
    }

    // Get actual total modules from YouTube data
    const youtubeData = await YoutubeUrl.findOne({ uniqueid: student.uniqueId });
    let totalModules = 0;
    
    if (youtubeData && youtubeData.Module && youtubeData.Module.length > 0) {
      console.log('📺 YouTube data found:', {
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


    // Get student progress - use the new structure with moduleProgress array
    const studentProgress = await StudentProgress.findOne({ studentId: student.uniqueId });
    
    let completedModules = 0;
    let inProgressModules = 0;
    let totalXp = 0;
    let averageScore = 0;
    let recentActivity: any[] = [];

    if (studentProgress && studentProgress.moduleProgress) {
      // Count completed modules (score >= 75% or has completedAt)
      const completedModulesList = studentProgress.moduleProgress.filter((mp: any) => {
        const isCompleted = mp.quizScore >= 75 || mp.completedAt;
        return isCompleted;
      });
      
      completedModules = completedModulesList.length;

      // Count in-progress modules (has some progress but not completed)
      inProgressModules = studentProgress.moduleProgress.filter((mp: any) => 
        (mp.quizScore > 0 || mp.videoProgress?.watchTime > 0) && 
        !(mp.quizScore >= 75 || mp.completedAt)
      ).length;


      // Calculate total XP with detailed breakdown
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
      
      // Add learning streak bonus
      const streakBonus = Math.min((studentProgress.learningStreak || 0) * 10, 100);
      totalXp += streakBonus;

      // Calculate average score from quiz scores
      const scoresWithQuiz = studentProgress.moduleProgress.filter((mp: any) => mp.quizScore > 0);
      averageScore = scoresWithQuiz.length > 0 
        ? Math.round(scoresWithQuiz.reduce((sum: number, mp: any) => sum + mp.quizScore, 0) / scoresWithQuiz.length)
        : 0;

      // Get recent activity - fetch chapters from YouTube URL and map to student progress
      // First, get all chapters from YouTube data
      const allChapters: any[] = [];
      if (youtubeData && youtubeData.Module && youtubeData.Module.length > 0) {
        youtubeData.Module.forEach((moduleItem: any, moduleIndex: number) => {
          const chapterKey = Object.keys(moduleItem)[0]; // e.g., "Chapter 1"
          const chapterData = moduleItem[chapterKey];
          
          if (chapterData && chapterData.videoTitle && chapterData.videoUrl) {
            allChapters.push({
              chapterKey: chapterKey,
              chapterIndex: moduleIndex + 1,
              videoTitle: chapterData.videoTitle,
              videoUrl: chapterData.videoUrl,
              moduleIndex: moduleIndex
            });
          }
        });
      }
      
      // Map student progress to chapters from YouTube data
      recentActivity = studentProgress.moduleProgress
        .sort((a: any, b: any) => new Date(b.lastAccessedAt || b.startedAt).getTime() - new Date(a.lastAccessedAt || a.startedAt).getTime())
        .slice(0, 10) // Get more to ensure we have enough chapters
        .map((mp: any) => {
          const isCompleted = mp.quizScore >= 75 || mp.completedAt;
          
          // Find matching chapter from YouTube data
          let moduleName = mp.moduleId;
          let moduleSubject = 'Mathematics';
          let moduleDuration = '20 min';
          let chapterVideoUrl = '';
          
          // Try to find chapter by moduleId (chapterKey)
          const matchedChapter = allChapters.find((chapter: any) => chapter.chapterKey === mp.moduleId);
          
          if (matchedChapter) {
            moduleName = matchedChapter.videoTitle || matchedChapter.chapterKey;
            moduleSubject = `Chapter ${matchedChapter.chapterIndex}`;
            chapterVideoUrl = matchedChapter.videoUrl;
            moduleDuration = '20 min'; // Default duration
          } else if (youtubeData && youtubeData.Module && youtubeData.Module.length > 0) {
            // Fallback: try to find by index if chapterKey doesn't match
            const moduleIndex = youtubeData.Module.findIndex((module: any) => {
              const chapterKey = Object.keys(module)[0];
              return chapterKey === mp.moduleId;
            });
            
            if (moduleIndex !== -1) {
              const chapterKey = Object.keys(youtubeData.Module[moduleIndex])[0];
              const chapter = youtubeData.Module[moduleIndex][chapterKey];
              moduleName = chapter.videoTitle || chapterKey;
              moduleSubject = `Chapter ${moduleIndex + 1}`;
              chapterVideoUrl = chapter.videoUrl || '';
            }
          }
          
          return {
            moduleId: mp.moduleId,
            status: isCompleted ? 'completed' : 'in-progress',
            progress: isCompleted ? 100 : Math.min(mp.quizScore || 0, 100),
            xpEarned: mp.pointsEarned || 0,
            lastAccessed: mp.lastAccessedAt || mp.startedAt,
            moduleName: moduleName,
            moduleSubject: moduleSubject,
            moduleDuration: moduleDuration,
            videoUrl: chapterVideoUrl
          };
        })
        .filter((activity: any) => activity.moduleName && activity.moduleName !== activity.moduleId) // Filter out invalid entries
        .slice(0, 5); // Return top 5
    }

    // Get recommended modules (chapters not started yet)
    const startedModuleIds = studentProgress?.moduleProgress?.map((mp: any) => mp.moduleId) || [];
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
      const allModules = await Module.find({});
      recommendedModules = allModules
        .filter((module: any) => !startedModuleIds.includes(module._id.toString()))
        .slice(0, 6)
        .map((module: any) => ({
          id: module._id.toString(),
          name: module.title,
          subject: module.subject,
          description: module.description,
          xpPoints: module.points,
          estimatedDuration: module.duration
        }));
    }

    // Get badges earned (from gamification progress)
    const badgesEarned = studentProgress?.moduleProgress?.flatMap((mp: any) => 
      mp.gamificationProgress?.badges || []
    ).map((badge: any) => ({
      badgeId: badge.badgeId,
      name: badge.name,
      description: `Achievement earned through learning progress`,
      earnedAt: badge.earnedAt
    })) || [];

    // Get assessment info
    let assessment = null;
    try {
      const userAssessment = await Assessment.findOne({ userId: decoded.userId });
      if (userAssessment) {
        assessment = {
          diagnosticCompleted: userAssessment.completed,
          diagnosticScore: userAssessment.overallScore || 0,
          assessmentCompletedAt: userAssessment.createdAt
        };
      }
         } catch {
       console.log('Assessment not found, continuing without it');
     }

    // Calculate total time spent
    const totalTimeSpent = studentProgress?.moduleProgress?.reduce((sum: number, mp: any) => {
      return sum + (mp.videoProgress?.watchTime || 0);
    }, 0) || 0;

    // Get all chapters from YouTube data for display
    const allChaptersFromYouTube: any[] = [];
    if (youtubeData && youtubeData.Module && youtubeData.Module.length > 0) {
      youtubeData.Module.forEach((moduleItem: any, moduleIndex: number) => {
        const chapterKey = Object.keys(moduleItem)[0];
        const chapterData = moduleItem[chapterKey];
        
        if (chapterData && chapterData.videoTitle && chapterData.videoUrl) {
          // Check if this chapter is in student progress
          const progressData = studentProgress?.moduleProgress?.find((mp: any) => mp.moduleId === chapterKey);
          
          // Calculate real XP from progress data if available
          let chapterXp = 100; // Default XP
          if (progressData) {
            chapterXp = progressData.pointsEarned || 0;
            // If no pointsEarned, calculate from quiz score
            if (chapterXp === 0 && progressData.quizScore > 0) {
              chapterXp = Math.round(progressData.quizScore * 0.5) + 25; // Base 25 + quiz performance
              if (progressData.quizScore >= 75 || progressData.completedAt) {
                chapterXp += 75; // Completion bonus
              }
            }
          }
          
          allChaptersFromYouTube.push({
            chapterKey: chapterKey,
            chapterIndex: moduleIndex + 1,
            videoTitle: chapterData.videoTitle,
            videoUrl: chapterData.videoUrl,
            moduleId: chapterKey,
            name: chapterData.videoTitle,
            subject: `Chapter ${moduleIndex + 1}`,
            description: `Chapter: ${chapterKey}`,
            xpPoints: chapterXp,
            estimatedDuration: '20 min',
            hasProgress: !!progressData,
            progress: progressData ? (progressData.quizScore >= 75 || progressData.completedAt ? 100 : Math.min(progressData.quizScore || 0, 100)) : 0,
            status: progressData ? (progressData.quizScore >= 75 || progressData.completedAt ? 'completed' : 'in-progress') : 'not-started'
          });
        }
      });
    }

    const dashboardData = {
      overview: {
        totalModules,
        completedModules,
        inProgressModules,
        totalXp,
        averageScore,
        learningStreak: studentProgress?.learningStreak || 0,
        studentName: user.name,
        grade: student.grade || user.profile?.grade || '',
        school: student.school || user.profile?.school || '',
        studentKey: student.studentKey || `STU${student._id.toString().slice(-6).toUpperCase()}`
      },
      recentActivity,
      notifications: [], // TODO: Implement notifications system
      recommendedModules,
      allChapters: allChaptersFromYouTube, // Add all chapters from YouTube
      progress: {
        totalTimeSpent,
        badgesEarned,
        currentModule: recentActivity[0] || null
      },
      assessment
    };


    return NextResponse.json(dashboardData);

  } catch (error) {
    console.error('Dashboard overview error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 