'use client';

import React, { useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Award, Bot, CheckCircle2, ChevronRight, Computer, Calculator, FlaskConical, Palette, MessageSquare, BookOpen, GraduationCap } from 'lucide-react';

interface OverviewTabProps {
  courses: any[];
  onTabChange: (tab: string) => void;
  onRefresh?: () => void | Promise<void>;
  dashboardData?: {
    overview?: {
      totalXp?: number;
      totalModules?: number;
      completedModules?: number;
      inProgressModules?: number;
      studentKey?: string;
    };
    progress?: {
      badgesEarned?: Array<{
        name: string;
        description: string;
        earnedAt: string;
      }>;
    };
    recentActivity?: Array<{
      moduleId: string;
      status: string;
      progress: number;
      xpEarned: number;
      lastAccessed: string;
      moduleName?: string;
      moduleSubject?: string;
      moduleDuration?: string;
      videoUrl?: string;
    }>;
    recommendedModules?: Array<{
      id: string;
      name: string;
      subject: string;
      description: string;
      xpPoints: number;
      estimatedDuration: string | number;
      videoUrl?: string;
    }>;
    allChapters?: Array<{
      chapterKey: string;
      chapterIndex: number;
      videoTitle: string;
      videoUrl: string;
      moduleId: string;
      name: string;
      subject: string;
      description: string;
      xpPoints: number;
      estimatedDuration: string;
      hasProgress: boolean;
      progress: number;
      status: string;
    }>;
    assessment?: {
      diagnosticCompleted?: boolean;
      diagnosticScore?: number;
      assessmentCompletedAt?: string;
    };
  };
  user?: {
    uniqueId?: string;
  };
}

// Subject to color mapping
const subjectColors: Record<string, string> = {
  Mathematics: '#00B396',
  Science: '#1756AE',
  Arts: '#FF0100',
  Computer: '#EFC806',
  English: '#FF6B6B',
  History: '#F59E0B',
  Geography: '#10B981',
  Physics: '#EF4444',
  Chemistry: '#8B5CF6',
  Biology: '#06B6D4',
  'Chapter 1': '#EFC806',
  'Chapter 2': '#00B396',
  'Chapter 3': '#1756AE',
};

// Subject to icon mapping
const getSubjectIcon = (subject: string) => {
  const iconMap: Record<string, any> = {
    Mathematics: Calculator,
    Science: FlaskConical,
    Arts: Palette,
    Computer: Computer,
    English: BookOpen,
    History: GraduationCap,
    Geography: BookOpen,
    Physics: FlaskConical,
    Chemistry: FlaskConical,
    Biology: FlaskConical,
  };
  
  // Default to Calculator for unknown subjects
  return iconMap[subject] || Calculator;
};

// Format date for upcoming tests
const formatDate = (dateString: string) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const day = date.getDate();
  const month = date.toLocaleDateString('en-US', { month: 'short' });
  return `${day} ${month}`;
};

export default function OverviewTab({ 
  courses, 
  onTabChange, 
  onRefresh,
  dashboardData, 
  user
}: OverviewTabProps) {
  
  // Refresh data when component mounts or when switching to this tab
  useEffect(() => {
    if (onRefresh) {
      // Refresh data when tab becomes active to ensure latest data
      const refreshTimer = setTimeout(() => {
        onRefresh();
      }, 100);
      return () => clearTimeout(refreshTimer);
    }
  }, [onRefresh]);
  
  // Monitor dashboardData changes to ensure proper display
  useEffect(() => {
    if (dashboardData) {
      // Log data availability for debugging
      const hasData = !!(
        dashboardData.overview ||
        dashboardData.recentActivity?.length ||
        dashboardData.allChapters?.length ||
        dashboardData.recommendedModules?.length
      );
      
      if (!hasData) {
        console.warn('⚠️ OverviewTab: No data available, may need refresh');
      }
    }
  }, [dashboardData]);
  
  // Log data for debugging
  useEffect(() => {
    if (dashboardData) {
      console.log('📊 OverviewTab received data:', {
        totalModules: dashboardData.overview?.totalModules,
        completedModules: dashboardData.overview?.completedModules,
        inProgressModules: dashboardData.overview?.inProgressModules,
        totalXp: dashboardData.overview?.totalXp,
        recentActivityCount: dashboardData.recentActivity?.length || 0,
        allChaptersCount: dashboardData.allChapters?.length || 0,
        recommendedModulesCount: dashboardData.recommendedModules?.length || 0
      });
    }
  }, [dashboardData]);
  
  // Calculate real data from dashboardData
  const overviewStats = useMemo(() => {
    // Calculate AI Support based on actual module engagement
    // AI Support represents how many modules the user has engaged with (indicating AI-powered platform usage)
    const totalModules = dashboardData?.overview?.totalModules || 0;
    const inProgressModules = dashboardData?.overview?.inProgressModules || 0;
    const completedModules = dashboardData?.overview?.completedModules || 0;
    const engagedModules = inProgressModules + completedModules;
    
    // Calculate as percentage of total modules engaged with
    // This represents the user's engagement with the AI-powered learning platform
    const aiSupportPercentage = totalModules > 0 
      ? Math.min(Math.round((engagedModules / totalModules) * 100), 100)
      : 0;
    
    return {
      inProgress: inProgressModules,
      completed: completedModules,
      certificates: dashboardData?.progress?.badgesEarned?.length || 0,
      aiSupport: aiSupportPercentage, // Real AI support metric: percentage of modules engaged with
      totalXp: dashboardData?.overview?.totalXp || 0,
    };
  }, [dashboardData]);

  // Process courses from courses prop, allChapters, or recentActivity
  const activeCourses = useMemo(() => {
    // Use courses prop if available (already processed by parent)
    if (courses && courses.length > 0) {
      return courses.slice(0, 5).map((course: any, index: number) => {
        const Icon = getSubjectIcon(course.icon || 'Mathematics');
        const color = course.color || subjectColors['Mathematics'] || '#EFC806';
        
        // Parse progress from lessonsCompleted string (e.g., "75%")
        const progressMatch = course.lessonsCompleted?.match(/(\d+)%/);
        const progress = progressMatch ? parseInt(progressMatch[1]) : 0;
        const totalLessons = 10;
        const lessonsCompleted = Math.round((progress / 100) * totalLessons);
        
        // Parse XP from string (e.g., "50+ XP")
        const xpMatch = course.xp?.match(/(\d+)/);
        const xp = xpMatch ? parseInt(xpMatch[1]) : 0;

        // Ensure unique ID using title and index
        const uniqueId = course.title 
          ? `course-${String(course.title).replace(/[^a-zA-Z0-9]/g, '-')}-${index}`
          : `course-${index}-${Date.now()}`;

        return {
          id: uniqueId,
          title: course.title,
          lessonsCompleted,
          totalLessons,
          duration: course.duration || '20 min',
          xp,
          icon: Icon,
          color,
          progress,
        };
      });
    }

    // Priority 1: Use allChapters from YouTube URL (chapters with progress)
    if (dashboardData?.allChapters && dashboardData.allChapters.length > 0) {
      // Filter chapters that have progress (started or completed)
      const chaptersWithProgress = dashboardData.allChapters
        .filter((chapter: any) => chapter.hasProgress && chapter.status !== 'not-started')
        .sort((a: any, b: any) => {
          // Sort by progress status: completed first, then by progress percentage
          if (a.status === 'completed' && b.status !== 'completed') return -1;
          if (a.status !== 'completed' && b.status === 'completed') return 1;
          return b.progress - a.progress;
        })
        .slice(0, 5);

      if (chaptersWithProgress.length > 0) {
        return chaptersWithProgress.map((chapter: any, index: number) => {
          const subject = chapter.subject || 'Mathematics';
          const Icon = getSubjectIcon(subject);
          const color = subjectColors[subject] || '#EFC806';
          
          const totalLessons = 10;
          const lessonsCompleted = Math.round((chapter.progress / 100) * totalLessons);
          // Use real XP from chapter data (calculated from actual progress)
          const xp = chapter.xpPoints || 0;

          return {
            id: `chapter-${chapter.chapterKey}-${index}`,
            title: chapter.videoTitle || chapter.name,
            lessonsCompleted,
            totalLessons,
            duration: chapter.estimatedDuration || '20 min',
            xp,
            icon: Icon,
            color,
            progress: chapter.progress,
            moduleId: chapter.moduleId || chapter.chapterKey,
            videoUrl: chapter.videoUrl,
          };
        });
      }
    }

    // Priority 2: Fallback to processing recentActivity - use real module data
    if (dashboardData?.recentActivity && dashboardData.recentActivity.length > 0) {
      return dashboardData.recentActivity.slice(0, 5).map((activity: any) => {
        // Use module subject from activity if available, otherwise try to find from recommendedModules
        let subject = activity.moduleSubject || 'Mathematics';
        const matchedModule = dashboardData.recommendedModules?.find(
          (m: any) => m.id === activity.moduleId
        );
        if (matchedModule && 'subject' in matchedModule) {
          subject = matchedModule.subject;
        }
        
        const Icon = getSubjectIcon(subject);
        const color = subjectColors[subject] || '#EFC806';
        
        // Use real module name from activity
        const moduleName = activity.moduleName || activity.moduleId;
        
        // Use real duration from activity if available, otherwise estimate
        let duration = activity.moduleDuration || '20 min';
        if (!activity.moduleDuration && activity.progress > 0) {
          // Estimate based on progress if no duration available
          const baseDuration = 20;
          duration = `${Math.round(baseDuration * (activity.progress / 100))} min`;
        }
        
        // Calculate lessons completed (assuming 10 lessons per module)
        const totalLessons = 10;
        const lessonsCompleted = Math.round((activity.progress / 100) * totalLessons);
        
        // Use real XP earned from activity
        const xp = activity.xpEarned || Math.round(activity.progress * 0.8);

        // Ensure unique ID by converting to string and adding index if needed
        const uniqueId = activity.moduleId 
          ? String(activity.moduleId).replace(/[^a-zA-Z0-9]/g, '-')
          : `activity-${Date.now()}-${Math.random()}`;

        return {
          id: uniqueId,
          title: moduleName,
          lessonsCompleted,
          totalLessons,
          duration: duration,
          xp,
          icon: Icon,
          color,
          progress: activity.progress,
          moduleId: activity.moduleId, // Include moduleId for navigation
          videoUrl: activity.videoUrl,
        };
      });
    }

    return [];
  }, [courses, dashboardData]);

  // Process continue learning modules
  const continueLearningModules = useMemo(() => {
    if (!dashboardData?.recommendedModules || dashboardData.recommendedModules.length === 0) {
      return [];
    }

    return dashboardData.recommendedModules.slice(0, 3).map((module, index) => {
      const subject = module.subject || 'Mathematics';
      const color = subjectColors[subject] || '#EFC806';
      
      // Parse duration
      let duration = '20 min';
      if (typeof module.estimatedDuration === 'string') {
        duration = module.estimatedDuration;
      } else if (typeof module.estimatedDuration === 'number') {
        duration = `${module.estimatedDuration} min`;
      }

      // Ensure unique ID
      const uniqueId = module.id 
        ? `${String(module.id).replace(/[^a-zA-Z0-9]/g, '-')}-${index}`
        : `module-${index}-${Date.now()}`;

      return {
        id: uniqueId,
        title: module.name,
        duration,
        xp: module.xpPoints || 50,
        color,
      };
    });
  }, [dashboardData]);

  // Generate upcoming tests from real data only (no placeholders)
  const upcomingTests = useMemo(() => {
    const tests: Array<{
      id: string;
      course: string;
      testName: string;
      date: string;
      icon: any;
      color: string;
    }> = [];

    // If assessment exists and is not completed, show it as upcoming
    if (dashboardData?.assessment && !dashboardData.assessment.diagnosticCompleted) {
      tests.push({
        id: 'assessment-1',
        course: 'Learning Profile',
        testName: 'Diagnostic Assessment',
        date: formatDate(new Date().toISOString()) || 'Today',
        icon: MessageSquare,
        color: '#1756AE',
      });
    }

    // Add real module quizzes that are in progress but not completed
    // These are modules where user has started but hasn't achieved 75%+ score
    if (dashboardData?.recentActivity && dashboardData.recentActivity.length > 0) {
      dashboardData.recentActivity
        .filter((activity: any) => 
          activity.status === 'in-progress' && 
          activity.progress > 0 && 
          activity.progress < 75
        )
        .slice(0, 3)
        .forEach((activity: any, index: number) => {
          // Find matching module info for icon and color
          const matchedModule = dashboardData.recommendedModules?.find(
            (m: any) => m.id === activity.moduleId
          );
          const subject = (matchedModule && 'subject' in matchedModule) 
            ? matchedModule.subject 
            : 'Mathematics';
          const Icon = getSubjectIcon(subject);
          const color = subjectColors[subject] || '#EFC806';
          
          tests.push({
            id: `module-quiz-${activity.moduleId}-${index}`,
            course: activity.moduleName || activity.moduleId,
            testName: 'Module Quiz',
            date: formatDate(activity.lastAccessed) || 'Continue',
            icon: Icon,
            color: color,
          });
        });
    }

    // Only return real tests, no placeholder generation
    return tests.length > 0 ? tests : [
      {
        id: 'no-tests',
        course: 'No Upcoming Tests',
        testName: 'All caught up!',
        date: '',
        icon: CheckCircle2,
        color: '#878787',
      },
    ];
  }, [dashboardData]);

  return (
    <div className="relative w-full min-h-screen overflow-hidden rounded-[15px]">
      {/* Background decorative vectors */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div 
          className="absolute w-[948px] h-[467px] opacity-60"
          style={{
            left: '606px',
            top: '-97px',
            background: 'linear-gradient(135deg, rgba(109, 24, 206, 0.1) 0%, rgba(109, 24, 206, 0.05) 100%)',
            borderRadius: '50%',
            filter: 'blur(100px)',
          }}
        />
        <div 
          className="absolute w-[948px] h-[467px] opacity-60"
          style={{
            left: '-247px',
            top: '726px',
            background: 'linear-gradient(135deg, rgba(109, 24, 206, 0.1) 0%, rgba(109, 24, 206, 0.05) 100%)',
            borderRadius: '50%',
            filter: 'blur(100px)',
          }}
        />
      </div>

      <div className="relative z-10 px-2 sm:px-4 md:px-8 pr-4 sm:pr-6 md:pr-12 py-6 max-w-7xl mx-auto w-full">
        {/* Overview and Course You're taking Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Left Column - Overview and Course You're taking */}
          <div className="lg:col-span-2 space-y-8">
            {/* Overview Section */}
            <div>
              <h2 className="text-[20px] font-bold text-black mb-4">Overview</h2>
              <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Course in Progress */}
            <motion.div 
              className="bg-[#F5F5F5] rounded-[10.56px] p-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <div className="flex items-center gap-2 mb-3">
                <div className="w-[18.7px] h-[18.7px] bg-[#FF8C23] rounded-[3.44px] flex items-center justify-center">
                  <div className="w-[14.54px] h-[14.54px] bg-white rounded-sm" />
                </div>
                <span className="text-[14px] font-semibold text-[#878787]">Course in Progress</span>
              </div>
              <div className="text-[36.08px] font-bold text-black mb-2">
                {overviewStats.inProgress.toString().padStart(2, '0')}
              </div>
              <div className="inline-block bg-[#6D18CE] rounded-full px-5 py-2 min-w-[70px] text-center">
                <span className="text-[11px] font-medium text-white">
                  {Math.max(overviewStats.inProgress * 25, 0)}+ XP
                </span>
              </div>
            </motion.div>

            {/* Course Completed */}
            <motion.div 
              className="bg-[#F5F5F5] rounded-[10.56px] p-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className="flex items-center gap-2 mb-3">
                <div className="w-[18.7px] h-[18.7px] bg-[#00A679] rounded-[3.44px] flex items-center justify-center">
                  <CheckCircle2 className="w-[14.54px] h-[14.54px] text-white" />
                </div>
                <span className="text-[14px] font-semibold text-[#878787]">Course Completed</span>
              </div>
              <div className="text-[36.08px] font-bold text-black mb-2">
                {overviewStats.completed.toString().padStart(2, '0')}
              </div>
              <div className="inline-block bg-[#6D18CE] rounded-full px-5 py-2 min-w-[70px] text-center">
                <span className="text-[11px] font-medium text-white">
                  {Math.max(overviewStats.completed * 100, 0)}+ XP
                </span>
              </div>
            </motion.div>

            {/* Certificates Earned */}
            <motion.div 
              className="bg-[#F5F5F5] rounded-[10.56px] p-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <div className="flex items-center gap-2 mb-3">
                <div className="w-[18.7px] h-[18.7px] bg-[#4281EE] rounded-[3.44px] flex items-center justify-center">
                  <Award className="w-[14.54px] h-[14.54px] text-white" />
                </div>
                <span className="text-[14px] font-semibold text-[#878787]">Certificates Earned</span>
              </div>
              <div className="text-[36.08px] font-bold text-black mb-2">
                {overviewStats.certificates.toString().padStart(2, '0')}
              </div>
              <div className="inline-block bg-[#6D18CE] rounded-full px-5 py-2 min-w-[70px] text-center">
                <span className="text-[11px] font-medium text-white">
                  {Math.max(overviewStats.certificates * 50, 0)}+ XP
                </span>
              </div>
            </motion.div>

            {/* Ai Avatar Support */}
            <motion.div 
              className="bg-[#F5F5F5] rounded-[10.56px] p-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <div className="flex items-center gap-2 mb-3">
                <div className="w-[18.7px] h-[18.7px] bg-[#FFC700] rounded-[3.44px] flex items-center justify-center">
                  <Bot className="w-[14.54px] h-[14.54px] text-white" />
                </div>
                <span className="text-[14px] font-semibold text-[#878787]">Ai Avatar Support</span>
              </div>
              <div className="text-[36.08px] font-bold text-black mb-2">
                {overviewStats.aiSupport}
              </div>
              <div className="inline-block bg-[#6D18CE] rounded-full px-5 py-2 min-w-[70px] text-center">
                <span className="text-[11px] font-medium text-white">
                  {Math.max(Math.round(overviewStats.aiSupport * 2), 0)}+ XP
                </span>
              </div>
            </motion.div>
              </div>
            </div>

            {/* Course You're taking Section */}
            <div>
              <h2 className="text-[20px] font-bold text-black mb-4 px-2 sm:px-0">Course You're taking</h2>
            <div className="bg-[#F5F5F5] rounded-[15px] p-3 sm:p-6 overflow-x-auto">
              {/* Table Header - Hidden on mobile */}
              <div className="hidden md:grid grid-cols-[auto_1fr_1fr_1fr_1fr] gap-4 pb-4 border-b border-[#DDDDDD] mb-4">
                <div></div>
                <div className="text-[14px] font-semibold text-[#878787]">Course title</div>
                <div className="text-[14px] font-semibold text-[#878787]">Lessons Completed</div>
                <div className="text-[14px] font-semibold text-[#878787]">Duration</div>
                <div className="text-[14px] font-semibold text-[#878787]">XP Points</div>
              </div>

              {/* Course Rows - Show real module data */}
              {activeCourses.length > 0 ? (
                activeCourses.map((course, index) => {
                  const Icon = course.icon;
                  const percentage = Math.round((course.lessonsCompleted / course.totalLessons) * 100);
                  // Ensure unique key by combining id with index
                  const uniqueKey = `${course.id || 'course'}-${index}`;
                  const moduleId = (course as any).moduleId;
                  
                  return (
                    <motion.div
                      key={uniqueKey}
                      className="md:grid md:grid-cols-[auto_1fr_1fr_1fr_1fr] md:gap-4 md:items-center py-3 md:py-4 border-b border-[#DDDDDD] last:border-0 cursor-pointer hover:bg-gray-50 transition-colors rounded-lg px-2"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 * index }}
                      onClick={() => {
                        if (moduleId) {
                          // Navigate to module page
                          window.location.href = `/modules/${moduleId}`;
                        } else {
                          // Navigate to modules tab
                          onTabChange('modules');
                        }
                      }}
                    >
                      {/* Mobile Layout */}
                      <div className="md:hidden flex items-center gap-3 mb-3">
                        <div 
                          className="w-[40px] h-[40px] rounded-full flex items-center justify-center flex-shrink-0"
                          style={{ backgroundColor: course.color }}
                        >
                          <Icon className="w-[24px] h-[24px] text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-[14px] font-semibold text-black truncate" title={course.title}>
                            {course.title}
                          </div>
                        </div>
                      </div>
                      <div className="md:hidden grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-[#878787]">Lessons: </span>
                          <span className="font-semibold text-black">
                            {course.lessonsCompleted.toString().padStart(2, '0')}/{course.totalLessons} ({percentage}%)
                          </span>
                        </div>
                        <div>
                          <span className="text-[#878787]">Duration: </span>
                          <span className="font-semibold text-black">{course.duration}</span>
                        </div>
                        <div className="col-span-2">
                          <span className="text-[#878787]">XP Points: </span>
                          <span className="font-semibold text-black">{course.xp}+ XP</span>
                        </div>
                      </div>

                      {/* Desktop Layout */}
                      <div className="hidden md:flex items-center justify-center w-[47px]">
                        <div 
                          className="w-[47px] h-[47px] rounded-full flex items-center justify-center"
                          style={{ backgroundColor: course.color }}
                        >
                          <Icon className="w-[30px] h-[30px] text-white" />
                        </div>
                      </div>
                      <div className="hidden md:block text-[14px] font-semibold text-black truncate" title={course.title}>
                        {course.title}
                      </div>
                      <div className="hidden md:block text-[14px] font-semibold text-black">
                        {course.lessonsCompleted.toString().padStart(2, '0')}/{course.totalLessons} ({percentage}%)
                      </div>
                      <div className="hidden md:block text-[14px] font-semibold text-black">{course.duration}</div>
                      <div className="hidden md:block text-[14px] font-semibold text-black">{course.xp}+ XP</div>
                    </motion.div>
                  );
                })
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <p className="text-sm mb-2">No active courses yet.</p>
                  <button
                    onClick={() => onTabChange('modules')}
                    className="text-[#6D18CE] hover:text-[#5A14B0] font-medium text-sm underline"
                  >
                    Browse available modules to start learning
                  </button>
                </div>
              )}
            </div>
            </div>

            {/* Continue Learning Section */}
            <div className="mt-12">
              <h2 className="text-[20px] font-bold text-black mb-4">Continue Learning</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-8 md:gap-6">
                {continueLearningModules.length > 0 ? (
                  continueLearningModules.map((module, index) => {
                    // Ensure unique key
                    const uniqueKey = `${module.id || 'module'}-${index}`;
                    return (
                    <motion.div
                      key={uniqueKey}
                      className="relative cursor-pointer w-full"
                      style={{
                        height: '181px',
                      }}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 * index }}
                      onClick={() => onTabChange('modules')}
                    >
                      {/* Course Image */}
                      <div 
                        className="w-full h-[181px] rounded-[15px] overflow-hidden relative"
                        style={{ 
                          backgroundColor: '#D9D9D9',
                        }}
                      >
                        <div 
                          className="w-full h-full bg-gradient-to-br opacity-60"
                          style={{
                            background: `linear-gradient(135deg, ${module.color}40 0%, ${module.color}20 100%)`,
                          }}
                        />
                      </div>
                      
                      {/* Course Info Card */}
                      <div 
                        className="bg-white rounded-[15px] absolute h-[80px] md:h-[110px] flex flex-col justify-center md:justify-start"
                        style={{ 
                          width: 'calc(100% - 18px)',
                          left: '9px',
                          top: '120px',
                          boxShadow: '0px 4px 35px rgba(88, 14, 172, 0.15)',
                          padding: '14px 16px',
                        }}
                      >
                        <h3 
                          className="font-bold text-black mb-3 truncate hidden md:block"
                          style={{
                            fontFamily: 'Inter',
                            fontSize: '16px',
                            lineHeight: '19px',
                            fontWeight: 700,
                            color: '#000000',
                          }}
                        >
                          {module.title}
                        </h3>
                        <div className="flex flex-col md:flex-row items-center md:items-center justify-center md:justify-start gap-2 mb-0 md:mb-2">
                          <div 
                            className="bg-[#F5F5F5] rounded-full flex items-center justify-center w-full md:w-[80px]"
                            style={{
                              height: '24px',
                            }}
                          >
                            <span 
                              className="text-center"
                              style={{
                                fontFamily: 'Inter',
                                fontSize: '12px',
                                lineHeight: '14px',
                                fontWeight: 500,
                                color: '#787878',
                              }}
                            >
                              ⏱️ {module.duration}
                            </span>
                          </div>
                          <div 
                            className="bg-[#6D18CE] rounded-full flex items-center justify-center w-full md:w-[65.01px]"
                            style={{
                              height: '24px',
                            }}
                          >
                            <span 
                              className="text-center"
                              style={{
                                fontFamily: 'Inter',
                                fontSize: '12px',
                                lineHeight: '14px',
                                fontWeight: 500,
                                color: '#FFFFFF',
                              }}
                            >
                              {module.xp}+ XP
                            </span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                    );
                  })
                ) : (
                  <div className="col-span-3 text-center py-8 text-gray-500">
                    <p className="text-sm">No recommended modules available. Check back later!</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Upcoming Tests */}
          <div className="lg:col-span-1 mt-8 md:mt-0">
            <div className="bg-[#F5F5F5] rounded-[15px] p-6 sticky top-6">
              <h2 className="text-[20px] font-bold text-black mb-6">Upcoming Tests</h2>
              
              <div className="space-y-0">
                {upcomingTests.map((test, index) => {
                  const Icon = test.icon;
                  // Ensure unique key
                  const uniqueKey = `${test.id || 'test'}-${index}`;
                  return (
                    <motion.div
                      key={uniqueKey}
                      className="relative"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 * index }}
                    >
                      {index > 0 && <div className="absolute top-0 left-0 right-0 h-px bg-[#DDDDDD]" style={{ left: '19px', right: '19px' }} />}
                      <div className="flex items-center gap-4 py-4">
                        <div 
                          className="w-[47px] h-[47px] rounded-full flex items-center justify-center flex-shrink-0"
                          style={{ backgroundColor: test.color }}
                        >
                          <Icon className="w-[30px] h-[30px] text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-[14px] font-semibold text-black mb-1 truncate">{test.course}</div>
                          <div className="flex items-center gap-2">
                            <span className="text-[11.93px] font-normal text-[#454545]">{test.testName}</span>
                            {test.date && (
                              <span className="text-[11.93px] font-bold text-[#6C18CD]">{test.date}</span>
                            )}
                          </div>
                        </div>
                        <ChevronRight className="w-3 h-3 text-[#A9A9A9] flex-shrink-0" />
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              <motion.button
                className="w-full mt-6 bg-black rounded-full py-3 text-white text-[13.4px] font-medium"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onTabChange('progress')}
              >
                See All Upcoming Tests
              </motion.button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
