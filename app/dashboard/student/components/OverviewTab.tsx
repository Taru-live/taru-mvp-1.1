'use client';

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Award, Bot, CheckCircle2, ChevronRight, Computer, Calculator, FlaskConical, Palette, MessageSquare, BookOpen, GraduationCap } from 'lucide-react';

interface OverviewTabProps {
  courses: any[];
  onTabChange: (tab: string) => void;
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
  dashboardData, 
  user
}: OverviewTabProps) {
  
  // Calculate real data from dashboardData
  const overviewStats = useMemo(() => {
    return {
      inProgress: dashboardData?.overview?.inProgressModules || 0,
      completed: dashboardData?.overview?.completedModules || 0,
      certificates: dashboardData?.progress?.badgesEarned?.length || 0,
      aiSupport: 100, // Placeholder for AI support metric
      totalXp: dashboardData?.overview?.totalXp || 0,
    };
  }, [dashboardData]);

  // Process courses from courses prop or recentActivity
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

    // Fallback to processing recentActivity
    if (!dashboardData?.recentActivity || dashboardData.recentActivity.length === 0) {
      return [];
    }

    return dashboardData.recentActivity.slice(0, 5).map((activity) => {
      // Find matching module info from recommendedModules
      const matchedModule = dashboardData.recommendedModules?.find(
        (m) => m.id === activity.moduleId
      );

      const subject = (matchedModule && 'subject' in matchedModule) ? matchedModule.subject : 'Mathematics';
      const Icon = getSubjectIcon(subject);
      const color = subjectColors[subject] || '#EFC806';
      
      // Calculate lessons completed (assuming 10 lessons per module)
      const totalLessons = 10;
      const lessonsCompleted = Math.round((activity.progress / 100) * totalLessons);
      
      // Calculate duration (estimate based on progress)
      const baseDuration = 20; // Base 20 minutes per module
      const duration = Math.round(baseDuration * (activity.progress / 100));
      
      // Calculate XP earned
      const xp = activity.xpEarned || Math.round(activity.progress * 0.8);

      const moduleName = (matchedModule && 'name' in matchedModule) 
        ? matchedModule.name 
        : (activity.moduleName || activity.moduleId);

      // Ensure unique ID by converting to string and adding index if needed
      const uniqueId = activity.moduleId 
        ? String(activity.moduleId).replace(/[^a-zA-Z0-9]/g, '-')
        : `activity-${Date.now()}-${Math.random()}`;

      return {
        id: uniqueId,
        title: moduleName,
        lessonsCompleted,
        totalLessons,
        duration: `${duration} min`,
        xp,
        icon: Icon,
        color,
        progress: activity.progress,
      };
    });
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

  // Generate upcoming tests from assessment or create placeholder
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

    // Add placeholder tests if no real tests available
    if (tests.length === 0) {
      // Use active courses to generate test suggestions
      activeCourses.slice(0, 3).forEach((course, index) => {
        tests.push({
          id: `test-${index + 1}`,
          course: course.title,
          testName: `Module Quiz ${index + 1}`,
          date: formatDate(new Date(Date.now() + (index + 1) * 7 * 24 * 60 * 60 * 1000).toISOString()) || 'Soon',
          icon: course.icon,
          color: course.color,
        });
      });
    }

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
  }, [dashboardData, activeCourses]);

  return (
    <div className="relative w-full min-h-screen overflow-hidden">
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

      {/* AI Bot floating button */}
      <motion.button
        className="fixed bottom-8 right-8 w-[68px] h-[68px] bg-[#6D18CE] rounded-full flex items-center justify-center shadow-lg z-50 hover:scale-110 transition-transform"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => onTabChange('enhanced-learning')}
      >
        <span className="text-3xl">🤖</span>
      </motion.button>

      <div className="relative z-10 px-8 py-6 max-w-7xl mx-auto">
        {/* Overview Section */}
        <div className="mb-8">
          <h2 className="text-[20px] font-bold text-black mb-4">Overview</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
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
                <span className="text-[11.43px] font-medium text-[#878787]">Course in Progress</span>
              </div>
              <div className="text-[36.08px] font-bold text-black mb-2">
                {overviewStats.inProgress.toString().padStart(2, '0')}
              </div>
              <div className="inline-block bg-[#6D18CE] rounded-full px-5 py-2 min-w-[70px] text-center">
                <span className="text-[11px] font-medium text-white">
                  {Math.round(overviewStats.totalXp * 0.1)}+ XP
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
                <span className="text-[11.43px] font-medium text-[#878787]">Course Completed</span>
              </div>
              <div className="text-[36.08px] font-bold text-black mb-2">
                {overviewStats.completed.toString().padStart(2, '0')}
              </div>
              <div className="inline-block bg-[#6D18CE] rounded-full px-5 py-2 min-w-[70px] text-center">
                <span className="text-[11px] font-medium text-white">
                  {Math.round(overviewStats.totalXp * 0.15)}+ XP
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
                <span className="text-[11.43px] font-medium text-[#878787]">Certificates Earned</span>
              </div>
              <div className="text-[36.08px] font-bold text-black mb-2">
                {overviewStats.certificates.toString().padStart(2, '0')}
              </div>
              <div className="inline-block bg-[#6D18CE] rounded-full px-5 py-2 min-w-[70px] text-center">
                <span className="text-[11px] font-medium text-white">
                  {Math.round(overviewStats.totalXp * 0.2)}+ XP
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
                <span className="text-[11.43px] font-medium text-[#878787]">Ai Avatar Support</span>
              </div>
              <div className="text-[36.08px] font-bold text-black mb-2">
                {overviewStats.aiSupport}
              </div>
              <div className="inline-block bg-[#6D18CE] rounded-full px-5 py-2 min-w-[70px] text-center">
                <span className="text-[11px] font-medium text-white">
                  {Math.round(overviewStats.totalXp * 0.25)}+ XP
                </span>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Course You're taking */}
          <div className="lg:col-span-2">
            <h2 className="text-[20px] font-bold text-black mb-4">Course You're taking</h2>
            <div className="bg-[#F5F5F5] rounded-[15px] p-6">
              {/* Table Header */}
              <div className="grid grid-cols-[auto_1fr_1fr_1fr_1fr] gap-4 pb-4 border-b border-[#DDDDDD] mb-4">
                <div></div>
                <div className="text-[14px] font-semibold text-[#878787]">Course title</div>
                <div className="text-[14px] font-semibold text-[#878787]">Lessons Completed</div>
                <div className="text-[14px] font-semibold text-[#878787]">Duration</div>
                <div className="text-[14px] font-semibold text-[#878787]">XP Points</div>
              </div>

              {/* Course Rows */}
              {activeCourses.length > 0 ? (
                activeCourses.map((course, index) => {
                  const Icon = course.icon;
                  const percentage = Math.round((course.lessonsCompleted / course.totalLessons) * 100);
                  // Ensure unique key by combining id with index
                  const uniqueKey = `${course.id || 'course'}-${index}`;
                  return (
                    <motion.div
                      key={uniqueKey}
                      className="grid grid-cols-[auto_1fr_1fr_1fr_1fr] gap-4 items-center py-4 border-b border-[#DDDDDD] last:border-0"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 * index }}
                    >
                      <div className="flex items-center justify-center w-[47px]">
                        <div 
                          className="w-[47px] h-[47px] rounded-full flex items-center justify-center"
                          style={{ backgroundColor: course.color }}
                        >
                          <Icon className="w-[30px] h-[30px] text-white" />
                        </div>
                      </div>
                      <div className="text-[14px] font-semibold text-black truncate">{course.title}</div>
                      <div className="text-[14px] font-semibold text-black">
                        {course.lessonsCompleted.toString().padStart(2, '0')}/{course.totalLessons} ({percentage}%)
                      </div>
                      <div className="text-[14px] font-semibold text-black">{course.duration}</div>
                      <div className="text-[14px] font-semibold text-black">{course.xp}+ XP</div>
                    </motion.div>
                  );
                })
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <p className="text-sm">No active courses yet. Start learning to see your progress here!</p>
                </div>
              )}
            </div>

            {/* Continue Learning Section */}
            <div className="mt-12">
              <h2 className="text-[20px] font-bold text-black mb-4">Continue Learning</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {continueLearningModules.length > 0 ? (
                  continueLearningModules.map((module, index) => {
                    // Ensure unique key
                    const uniqueKey = `${module.id || 'module'}-${index}`;
                    return (
                    <motion.div
                      key={uniqueKey}
                      className="relative pb-20 cursor-pointer"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 * index }}
                      onClick={() => onTabChange('modules')}
                    >
                      {/* Course Image */}
                      <div 
                        className="w-full h-[181px] rounded-[15px] overflow-hidden relative"
                        style={{ backgroundColor: module.color + '40' }}
                      >
                        <div 
                          className="w-full h-full bg-gradient-to-br opacity-60"
                          style={{
                            background: `linear-gradient(135deg, ${module.color}40 0%, ${module.color}20 100%)`,
                          }}
                        />
                      </div>
                      
                      {/* Course Info Card */}
                      <div className="bg-white rounded-[15px] p-4 absolute top-[157px] left-0 right-0" style={{ boxShadow: '0px 4px 35px rgba(88, 14, 172, 0.15)' }}>
                        <h3 className="text-[16px] font-bold text-black mb-3 truncate">{module.title}</h3>
                        <div className="flex items-center gap-2">
                          <div className="bg-[#F5F5F5] rounded-full px-3 py-1">
                            <span className="text-[9.38px] font-medium text-[#787878]">⏱️ {module.duration}</span>
                          </div>
                          <div className="bg-[#6D18CE] rounded-full px-3 py-1">
                            <span className="text-[9.38px] font-medium text-white">{module.xp}+ XP</span>
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
          <div className="lg:col-span-1">
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
