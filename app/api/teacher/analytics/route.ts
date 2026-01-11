import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Student from '@/models/Student';
import Module from '@/models/Module';
import StudentProgress from '@/models/StudentProgress';
import User from '@/models/User';
import YoutubeUrl from '@/models/YoutubeUrl';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    // For now, we'll use a mock teacher ID - in production, decode JWT
    const teacherId = 'teacher123';
    
    // TODO: Implement proper JWT authentication
    // const token = request.headers.get('authorization')?.replace('Bearer ', '');
    // if (!token) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }

    // Get students
    const students = await Student.find({ teacherId });

    // Get modules
    const modules = await Module.find({ isActive: true });

    // Calculate analytics
    const totalStudents = students.length;
    const activeStudents = students.filter(s => s.onboardingCompleted).length;
    
    // Calculate average progress
    const totalProgress = students.reduce((sum, student) => {
      return sum + (student.totalModulesCompleted || 0);
    }, 0);
    const averageProgress = totalStudents > 0 ? Math.round(totalProgress / totalStudents) : 0;

    // Calculate total XP
    const totalXp = students.reduce((sum, student) => {
      return sum + (student.totalXpEarned || 0);
    }, 0);

    // Calculate average score
    const totalScore = students.reduce((sum, student) => {
      return sum + (student.diagnosticScore || 0);
    }, 0);
    const averageScore = totalStudents > 0 ? Math.round(totalScore / totalStudents) : 0;

    // Get top performing students
    const topStudents = students
      .sort((a, b) => (b.totalXpEarned || 0) - (a.totalXpEarned || 0))
      .slice(0, 5)
      .map(student => ({
        id: student._id.toString(),
        name: student.userId?.name || 'Unknown',
        xp: student.totalXpEarned || 0,
        modulesCompleted: student.totalModulesCompleted || 0,
        classGrade: student.classGrade || 'Not specified'
      }));

    // Get real recent activity from StudentProgress
    const recentActivity: any[] = [];
    
    // Get all student progress data for teacher's students
    const studentIds = students.map(s => s.uniqueId);
    const allProgress = await StudentProgress.find({ studentId: { $in: studentIds } });
    
    // Collect recent module completions and activities
    const activities: any[] = [];
    
    for (const progress of allProgress) {
      const student = students.find(s => s.uniqueId === progress.studentId);
      if (!student) continue;
      
      // Get student user data for name
      const studentUser = await User.findById(student.userId);
      const studentName = studentUser?.name || student.fullName || 'Unknown Student';
      
      // Process module progress for recent completions
      if (progress.moduleProgress && progress.moduleProgress.length > 0) {
        for (const mp of progress.moduleProgress) {
          // Get module name from YouTube data or Module collection
          let moduleName = mp.moduleId;
          
          // Try to get module name from YouTube data
          const youtubeData = await YoutubeUrl.findOne({ uniqueid: progress.studentId });
          if (youtubeData && youtubeData.Module) {
            const moduleItem = youtubeData.Module.find((item: any) => {
              const chapterKey = Object.keys(item)[0];
              return chapterKey === mp.moduleId;
            });
            if (moduleItem) {
              const chapterKey = Object.keys(moduleItem)[0];
              moduleName = moduleItem[chapterKey]?.videoTitle || moduleName;
            }
          }
          
          // If still not found, try Module collection
          if (moduleName === mp.moduleId) {
            const module = await Module.findOne({ moduleId: mp.moduleId });
            if (module) {
              moduleName = module.title || moduleName;
            }
          }
          
          // Add completion activity if module was recently completed
          if (mp.completedAt) {
            const timeDiff = Date.now() - new Date(mp.completedAt).getTime();
            const hoursAgo = Math.floor(timeDiff / (1000 * 60 * 60));
            const daysAgo = Math.floor(hoursAgo / 24);
            
            let timeAgo = '';
            if (daysAgo > 0) {
              timeAgo = `${daysAgo} day${daysAgo > 1 ? 's' : ''} ago`;
            } else if (hoursAgo > 0) {
              timeAgo = `${hoursAgo} hour${hoursAgo > 1 ? 's' : ''} ago`;
            } else {
              timeAgo = 'Just now';
            }
            
            activities.push({
              id: `${progress.studentId}-${mp.moduleId}-${mp.completedAt}`,
              action: 'Student completed module',
              student: studentName,
              module: moduleName,
              time: timeAgo,
              type: 'completion',
              timestamp: mp.completedAt
            });
          }
          
          // Add recent access activity (last 24 hours)
          if (mp.lastAccessedAt) {
            const timeDiff = Date.now() - new Date(mp.lastAccessedAt).getTime();
            const hoursAgo = Math.floor(timeDiff / (1000 * 60 * 60));
            
            if (hoursAgo < 24 && !mp.completedAt) {
              const timeAgo = hoursAgo > 0 ? `${hoursAgo} hour${hoursAgo > 1 ? 's' : ''} ago` : 'Just now';
              activities.push({
                id: `${progress.studentId}-${mp.moduleId}-access-${mp.lastAccessedAt}`,
                action: 'Student accessed module',
                student: studentName,
                module: moduleName,
                time: timeAgo,
                type: 'access',
                timestamp: mp.lastAccessedAt
              });
            }
          }
        }
      }
      
      // Add enrollment activity for recently joined students
      if (student.createdAt) {
        const timeDiff = Date.now() - new Date(student.createdAt).getTime();
        const daysAgo = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
        
        if (daysAgo <= 7) {
          activities.push({
            id: `${student._id}-enrollment`,
            action: 'New student joined',
            student: studentName,
            module: student.classGrade || 'Unknown Grade',
            time: daysAgo === 0 ? 'Today' : `${daysAgo} day${daysAgo > 1 ? 's' : ''} ago`,
            type: 'enrollment',
            timestamp: student.createdAt
          });
        }
      }
    }
    
    // Sort by timestamp (most recent first) and take top 10
    recentActivity.push(...activities
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 10)
    );

    // Get subject distribution
    const subjectDistribution = modules.reduce((acc, module) => {
      acc[module.subject] = (acc[module.subject] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Get grade distribution
    const gradeDistribution = students.reduce((acc, student) => {
      const grade = student.classGrade || 'Unknown';
      acc[grade] = (acc[grade] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const analytics = {
      overview: {
        totalStudents,
        activeStudents,
        averageProgress,
        totalXp,
        averageScore,
        totalModules: modules.length
      },
      topStudents,
      recentActivity,
      distributions: {
        subjects: subjectDistribution,
        grades: gradeDistribution
      },
      charts: {
        // Real chart data based on actual student progress
        studentProgress: (() => {
          // Calculate progress over last 4 weeks
          const weeks = [];
          const now = new Date();
          for (let i = 3; i >= 0; i--) {
            const weekStart = new Date(now);
            weekStart.setDate(weekStart.getDate() - (i * 7));
            weekStart.setHours(0, 0, 0, 0);
            
            const weekEnd = new Date(weekStart);
            weekEnd.setDate(weekEnd.getDate() + 7);
            
            // Count modules completed in this week
            let weekCompletions = 0;
            for (const progress of allProgress) {
              if (progress.moduleProgress) {
                weekCompletions += progress.moduleProgress.filter((mp: any) => {
                  if (!mp.completedAt) return false;
                  const completedDate = new Date(mp.completedAt);
                  return completedDate >= weekStart && completedDate < weekEnd;
                }).length;
              }
            }
            
            weeks.push({
              label: `Week ${4 - i}`,
              data: weekCompletions
            });
          }
          
          return {
            labels: weeks.map(w => w.label),
            data: weeks.map(w => w.data)
          };
        })(),
        assignmentCompletion: (() => {
          // Calculate completion rates by subject from modules
          const subjectCompletion: Record<string, { total: number; completed: number }> = {};
          
          for (const progress of allProgress) {
            if (progress.moduleProgress) {
              for (const mp of progress.moduleProgress) {
                // Try to get subject from module
                const module = modules.find(m => m.moduleId === mp.moduleId || m._id.toString() === mp.moduleId);
                const subject = module?.subject || 'General';
                
                if (!subjectCompletion[subject]) {
                  subjectCompletion[subject] = { total: 0, completed: 0 };
                }
                
                subjectCompletion[subject].total++;
                if (mp.completedAt || mp.quizScore >= 75) {
                  subjectCompletion[subject].completed++;
                }
              }
            }
          }
          
          const labels: string[] = [];
          const data: number[] = [];
          
          Object.entries(subjectCompletion).forEach(([subject, stats]) => {
            labels.push(subject);
            data.push(stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0);
          });
          
          return { labels, data };
        })()
      }
    };

    return NextResponse.json(analytics);
  } catch (error) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}
