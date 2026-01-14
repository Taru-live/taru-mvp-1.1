'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '../student/components/Sidebar';
import Image from 'next/image';
import { isValidProfilePictureUrl } from '@/lib/utils';
import ChatModal from '../student/components/ChatModal';
import { motion, AnimatePresence } from 'framer-motion';
import { TypewriterText, StaggeredText, GradientText, CharacterAnimation } from '../../components/TextAnimations';
import { TiltCard, MagneticButton } from '../../components/InteractiveElements';
import { StaggerContainer, StaggerItem } from '../../components/PageTransitions';
import { ScrollFade, ScrollCounter, ParallaxScroll, ScrollProgress } from '../../components/ScrollAnimations';
import ConsistentLoadingPage from '../../components/ConsistentLoadingPage';
import LearningPathTab from '../student/components/LearningPathTab';

// Add custom hook for responsive behavior
function useWindowSize() {
  const [windowSize, setWindowSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1024,
    height: typeof window !== 'undefined' ? window.innerHeight : 768,
  });

  useEffect(() => {
    function handleResize() {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('resize', handleResize);
      handleResize(); // Call once to set initial size
      return () => window.removeEventListener('resize', handleResize);
    }
  }, []);

  return windowSize;
}

interface ChildProfile {
  name: string;
  grade: string;
  avatar: string;
  school?: string;
  email?: string;
  id?: string;
}

interface RecentActivity {
  moduleId: string;
  moduleName?: string;
  status: string;
  progress: number;
  xpEarned: number;
  lastAccessed: string;
}

interface DashboardData {
  student: ChildProfile;
  studentDashboard: {
    overview: {
      totalModules: number;
      completedModules: number;
      inProgressModules: number;
      totalXp: number;
      averageScore: number;
      learningStreak: number;
      studentName: string;
      grade: string;
      school: string;
      studentKey: string;
    };
    recentActivity: RecentActivity[];
    notifications: Array<{
      id: string;
      title: string;
      message: string;
      type: string;
      date: string;
      read: boolean;
    }>;
    recommendedModules: Array<{
      id: string;
      name: string;
      subject: string;
      description: string;
      xpPoints: number;
      estimatedDuration: number;
    }>;
    progress: {
      totalTimeSpent: number;
      badgesEarned: Array<{
        badgeId: string;
        name: string;
        description: string;
        earnedAt: string;
      }>;
      currentModule: unknown;
    };
  };
}

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error';
  date: string;
  read: boolean;
}

// Avatar utility functions
const AVAILABLE_AVATARS = [
  '/avatars/Group.svg',
  '/avatars/Group-1.svg',
  '/avatars/Group-2.svg',
  '/avatars/Group-3.svg',
  '/avatars/Group-4.svg',
  '/avatars/Group-5.svg',
  '/avatars/Group-6.svg',
  '/avatars/Group-7.svg',
  '/avatars/Group-8.svg'
];

function getRandomAvatar(userId?: string): string {
  if (userId) {
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      const char = userId.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    const index = Math.abs(hash) % AVAILABLE_AVATARS.length;
    return AVAILABLE_AVATARS[index];
  }
  const randomIndex = Math.floor(Math.random() * AVAILABLE_AVATARS.length);
  return AVAILABLE_AVATARS[randomIndex];
}

export default function ParentDashboard() {
  const [child, setChild] = useState<ChildProfile | null>(null);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [stats, setStats] = useState<Array<{ label: string; value: string; icon: string; subtitle?: string }>>([]);
  const [analytics, setAnalytics] = useState<number[]>([]);
  const [activityGraphData, setActivityGraphData] = useState<Array<{ day: string; height: number }> | null>(null);
  const [activityPeriod, setActivityPeriod] = useState<'day' | 'week' | 'month'>('week');
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [language, setLanguage] = useState('English (USA)');
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isRightPanelHovered, setIsRightPanelHovered] = useState(false);
  const [isRightPanelOpen, setIsRightPanelOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [user, setUser] = useState<any>(null);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [userAvatar, setUserAvatar] = useState<string>('/avatars/Group.svg');
  const [isAvatarSelectorOpen, setIsAvatarSelectorOpen] = useState(false);
  const [selectedChild, setSelectedChild] = useState<string>('');
  const [children, setChildren] = useState<Array<{ name: string; grade: string }>>([]);
  const [studentDetails, setStudentDetails] = useState<any>(null);
  const [isLoadingStudentDetails, setIsLoadingStudentDetails] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);
  const languageDropdownRef = useRef<HTMLDivElement>(null);
  const [isLanguageDropdownOpen, setIsLanguageDropdownOpen] = useState(false);
  const router = useRouter();
  const logoutTriggered = useRef(false);
  const { width: windowWidth } = useWindowSize();
  const isMobile = windowWidth < 1024;

  // Parent-specific navigation items
  const navItems = [
    { id: 'overview', label: 'Overview', icon: '/icons/overview.png' },
    { id: 'child-progress', label: "Child's Progress", icon: '/icons/report.png' },
    { id: 'learning-paths', label: 'Learning Path', icon: '/icons/learning-path.png' },
    { id: 'reports', label: 'Reports', icon: '/icons/rewards.png' },
    { id: 'messages', label: 'Message', icon: '/icons/bot.png' },
  ];

  useEffect(() => {
    const savedLang = localStorage.getItem('lang')
    if (savedLang) setLanguage(savedLang)
  }, [])

  const handleLanguageChange = (lang: string) => {
    setLanguage(lang)
    localStorage.setItem('lang', lang)
  }

  const handleLogout = useCallback(async () => {
    try {
      console.log('🔍 Logging out...');
      const response = await fetch('/api/auth/logout', { method: 'POST' });
      if (response.ok) {
        console.log('🔍 Logout successful');
        router.push('/login');
      } else {
        console.error('🔍 Logout failed');
      }
    } catch (error) {
      console.error('🔍 Logout error:', error);
      // Still redirect to login even if logout API fails
      router.push('/login');
    }
  }, [router]);

  useEffect(() => {
    const fetchUserAndDashboard = async () => {
      try {
        console.log('🔍 Fetching parent dashboard data...');
        
        // Fetch user
        const userRes = await fetch('/api/auth/me');
        if (userRes.ok) {
          const userData = await userRes.json();
          console.log('🔍 User data:', userData.user);
          
          if (userData.user.role !== 'parent') {
            console.log('🔍 User is not a parent, redirecting to login');
            router.push('/login');
            return;
          }
          
          // Store user data in state
          setUser(userData.user);
        } else {
          console.log('🔍 Failed to fetch user data, redirecting to login');
          router.push('/login');
          return;
        }
        
        // Fetch dashboard data
        const dashRes = await fetch('/api/dashboard/parent/overview');
        if (dashRes.ok) {
          const dashData = await dashRes.json();
          console.log('🔍 Dashboard data:', dashData);
          console.log('📊 Student dashboard overview:', dashData.studentDashboard?.overview);
          console.log('📈 Progress data:', {
            totalModules: dashData.studentDashboard?.overview?.totalModules,
            completedModules: dashData.studentDashboard?.overview?.completedModules,
            inProgressModules: dashData.studentDashboard?.overview?.inProgressModules,
            totalXp: dashData.studentDashboard?.overview?.totalXp,
            averageScore: dashData.studentDashboard?.overview?.averageScore,
            learningStreak: dashData.studentDashboard?.overview?.learningStreak
          });
          setDashboardData(dashData);

          // Set child info
          if (dashData.student) {
            setChild({
              name: dashData.student.name || '',
              grade: dashData.student.grade || '',
              avatar: dashData.student.profilePicture || '',
              school: dashData.student.school || '',
              email: dashData.student.email || '',
              id: dashData.student.id || '',
            });
            // Set children list for selector
            const childName = dashData.student.name || '';
            const childGrade = dashData.student.grade || '';
            setChildren([{
              name: childName,
              grade: childGrade
            }]);
            // Set selected child to the first (and only) child
            if (!selectedChild && childName) {
              setSelectedChild(childName);
            }
          }

          // Set stats from studentDashboard.overview - exact same format as student dashboard
          const sd = dashData.studentDashboard || {};
          if (sd.overview) {
            // Calculate XP breakdown exactly like student dashboard
            const xpBreakdown = {
              totalXp: sd.overview.totalXp || 0,
              completedXp: (sd.overview.completedModules || 0) * 100, // 100 XP per completed module
              inProgressXp: (sd.overview.inProgressModules || 0) * 25, // 25 XP for starting a module
              quizXp: Math.round((sd.overview.averageScore || 0) * 0.5), // 0.5 XP per percentage point
              streakBonus: Math.min((sd.overview.learningStreak || 0) * 10, 100), // 10 XP per day streak, max 100
              currentLevel: Math.floor((sd.overview.totalXp || 0) / 1000) + 1,
              xpToNextLevel: 1000 - ((sd.overview.totalXp || 0) % 1000)
            };
            
            setStats([
              { 
                label: 'Courses in Progress', 
                value: `${sd.overview.inProgressModules || 0}`, 
                icon: '📚',
                subtitle: `${xpBreakdown.inProgressXp} XP Available`
              },
              { 
                label: 'Courses Completed', 
                value: `${sd.overview.completedModules || 0}`, 
                icon: '✅',
                subtitle: `${xpBreakdown.completedXp} XP Earned`
              },
              { 
                label: 'Total XP Earned', 
                value: `${xpBreakdown.totalXp}`, 
                icon: '⭐',
                subtitle: `Level ${xpBreakdown.currentLevel} • ${xpBreakdown.xpToNextLevel} to next`
              },
              { 
                label: 'Average Score', 
                value: `${sd.overview.averageScore || 0}%`, 
                icon: '🎯',
                subtitle: `${xpBreakdown.quizXp} XP from Quizzes`
              },
              { 
                label: 'Learning Streak', 
                value: `${sd.overview.learningStreak || 0} days`, 
                icon: '🔥',
                subtitle: `${xpBreakdown.streakBonus} XP Bonus`
              },
            ]);
          }

          // Set analytics from studentDashboard.recentActivity
          if (sd.recentActivity && Array.isArray(sd.recentActivity)) {
            const activityAnalytics = sd.recentActivity.map((activity: RecentActivity) => 
              Math.round((activity.progress || 0) * 100)
            );
            // Fill remaining days with decreasing values for visual effect
            while (activityAnalytics.length < 7) {
              activityAnalytics.unshift(Math.max(0, (activityAnalytics[0] || 0) - 10));
            }
            setAnalytics(activityAnalytics.slice(-7));
          } else {
            // Default analytics for empty state
            setAnalytics([20, 35, 45, 60, 55, 70, 80]);
          }

          // Fetch activity graph data
          const fetchActivityGraph = async (period: 'day' | 'week' | 'month') => {
            try {
              const activityGraphResponse = await fetch(`/api/dashboard/parent/activity-graph?period=${period}`);
              if (activityGraphResponse.ok) {
                const activityGraphResult = await activityGraphResponse.json();
                if (activityGraphResult.success && activityGraphResult.activityData) {
                  setActivityGraphData(activityGraphResult.activityData);
                }
              }
            } catch (error) {
              console.error('Error fetching activity graph data:', error);
              setActivityGraphData(null);
            }
          };
          fetchActivityGraph(activityPeriod);

          // Fetch real notifications
          try {
            const notificationsResponse = await fetch('/api/notifications');
            if (notificationsResponse.ok) {
              const notificationsData = await notificationsResponse.json();
              setNotifications(notificationsData.notifications || []);
            }
          } catch (error) {
            console.error('Error fetching notifications:', error);
            // Use empty array if API fails - no placeholder notifications
            setNotifications([]);
          }

          // Fetch student details for settings tab
          try {
            const studentDetailsResponse = await fetch('/api/parent/child-details');
            if (studentDetailsResponse.ok) {
              const studentDetailsData = await studentDetailsResponse.json();
              setStudentDetails(studentDetailsData);
            }
          } catch (error) {
            console.error('Error fetching student details:', error);
            setStudentDetails(null);
          }
        } else {
          setChild(null);
          setStats([]);
          setAnalytics([]);
        }
      } catch {
        // Handle error silently and use dummy data
        setChild(null);
        setStats([]);
        setAnalytics([]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchUserAndDashboard();
  }, [router]);

  // Fix React Hook dependency
  useEffect(() => {
    if (activeTab === 'logout' && !logoutTriggered.current) {
      logoutTriggered.current = true;
      handleLogout();
    }
    if (activeTab !== 'logout') {
      logoutTriggered.current = false;
    }
  }, [activeTab]);

  const getCompletionPercentage = () => {
    if (!dashboardData?.studentDashboard?.overview) return 0;
    const { completedModules, totalModules } = dashboardData.studentDashboard.overview;
    return totalModules > 0 ? Math.round((completedModules / totalModules) * 100) : 0;
  };

  // Helper function to calculate progress history (same as student dashboard)
  const calculateProgressHistory = (data: DashboardData) => {
    if (!data.studentDashboard?.overview) return [0];
    
    const total = data.studentDashboard.overview.totalModules;
    const completed = data.studentDashboard.overview.completedModules;
    
    if (total === 0) return [0];
    
    // Create a simple progress history based on completion rate
    const baseProgress = Math.round((completed / total) * 100);
    return [baseProgress * 0.6, baseProgress * 0.7, baseProgress * 0.8, baseProgress * 0.9, baseProgress];
  };

  // Helper function to calculate recent scores (same as student dashboard)
  const calculateRecentScores = (data: DashboardData) => {
    if (!data.studentDashboard?.recentActivity || data.studentDashboard.recentActivity.length === 0) return [0];
    
    // Calculate scores based on recent activity progress
    return data.studentDashboard.recentActivity
      .slice(-5)
      .map(activity => Math.round(activity.progress))
      .filter(score => score > 0);
  };

  const getRecentActivities = () => {
    if (!dashboardData?.studentDashboard?.recentActivity) return [];
    return dashboardData.studentDashboard.recentActivity.slice(0, 5).map((activity) => ({
      title: activity.moduleName || activity.moduleId.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      type: activity.status,
      progress: activity.progress,
      xpEarned: activity.xpEarned,
      date: new Date(activity.lastAccessed).toLocaleDateString(),
    }));
  };

  // Notification functions
  const unreadCount = notifications.filter(n => !n.read).length;
  
  const handleNotificationClick = () => {
    setIsNotificationOpen(!isNotificationOpen);
  };

  const handleAvatarSelect = async (avatarPath: string) => {
    setUserAvatar(avatarPath);
    setIsAvatarSelectorOpen(false);
    
    // Save avatar selection to backend
    try {
      const response = await fetch('/api/user/update-avatar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          avatar: avatarPath
        }),
        credentials: 'include'
      });
      
      if (response.ok) {
        console.log('✅ Avatar saved successfully');
      } else {
        console.error('❌ Failed to save avatar:', response.statusText);
      }
    } catch (error) {
      console.error('❌ Error saving avatar:', error);
    }
  };

  const markNotificationAsRead = (notificationId: string) => {
    setNotifications(prev => 
      prev.map(n => 
        n.id === notificationId ? { ...n, read: true } : n
      )
    );
  };

  const markAllNotificationsAsRead = () => {
    setNotifications(prev => 
      prev.map(n => ({ ...n, read: true }))
    );
  };

  // Handle clicks outside notification dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setIsNotificationOpen(false);
      }
    };

    if (isNotificationOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isNotificationOpen]);

  // Handle clicks outside language dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (languageDropdownRef.current && !languageDropdownRef.current.contains(event.target as Node)) {
        setIsLanguageDropdownOpen(false);
      }
    };

    if (isLanguageDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isLanguageDropdownOpen]);

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'success': return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      );
      case 'warning': return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
      );
      case 'error': return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      );
      default: return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    }
  };

  const getNotificationColor = (type: Notification['type']) => {
    switch (type) {
      case 'success': return 'text-green-600 bg-green-50 border-green-200';
      case 'warning': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'error': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-blue-600 bg-blue-50 border-blue-200';
    }
  };

  const formatNotificationTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  };

  if (isLoading) {
    return (
      <ConsistentLoadingPage
        type="dashboard"
        title="Loading Parent Dashboard"
        subtitle="Preparing your child's learning overview..."
        tips={[
          'Loading your child\'s progress and achievements',
          'Preparing learning analytics and reports',
          'Setting up your monitoring dashboard'
        ]}
      />
    );
  }

  return (
    <motion.div 
      className="dashboard-container"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      
      {/* Additional Particle Effects */}
      <div className="fixed inset-0 pointer-events-none z-0">
        {/* Floating Geometric Shapes */}
        {[...Array(8)].map((_, i) => {
          // Use deterministic positioning based on index to avoid hydration mismatch
          const left = (i * 73) % 100;
          const top = (i * 97) % 100;
          const xOffset = (i * 23) % 20 - 10;
          const duration = 6 + (i % 4);
          const delay = (i % 3) * 0.5;
          
          return (
            <motion.div
              key={`shape-${i}`}
              className="absolute w-4 h-4 bg-gradient-to-r from-purple-400/20 to-pink-400/20 rounded-full"
              style={{
                left: `${left}%`,
                top: `${top}%`,
              }}
              animate={{
                y: [0, -30, 0],
                x: [0, xOffset, 0],
                scale: [1, 1.2, 1],
                opacity: [0.3, 0.8, 0.3],
              }}
              transition={{
                duration: duration,
                repeat: Infinity,
                ease: "easeInOut",
                delay: delay,
              }}
            />
          );
        })}
        
        {/* Floating Lines */}
        {[...Array(5)].map((_, i) => {
          // Use deterministic positioning based on index to avoid hydration mismatch
          const left = (i * 67) % 100;
          const top = (i * 89) % 100;
          const width = 100 + (i * 37) % 200;
          const xOffset = (i * 41) % 100 - 50;
          const duration = 4 + (i % 3);
          const delay = (i % 4) * 0.5;
          
          return (
            <motion.div
              key={`line-${i}`}
              className="absolute h-px bg-gradient-to-r from-transparent via-purple-400/30 to-transparent"
              style={{
                left: `${left}%`,
                top: `${top}%`,
                width: `${width}px`,
              }}
              animate={{
                x: [0, xOffset, 0],
                opacity: [0, 1, 0],
              }}
              transition={{
                duration: duration,
                repeat: Infinity,
                ease: "easeInOut",
                delay: delay,
              }}
            />
          );
        })}
      </div>

      {/* Scroll Progress Indicator */}
      <ScrollProgress 
        color="linear-gradient(90deg, #6D18CE, #8B5CF6, #A855F7)"
        height="3px"
        className="shadow-lg z-50"
      />
      
      {/* Responsive Sidebar */}
      <div className={`transition-all duration-300 ${isNotificationOpen ? 'blur-sm pointer-events-none' : ''}`}>
        <Sidebar
          activeTab={activeTab}
          onTabChange={setActiveTab}
          isOpen={isSidebarOpen}
          onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
          navItems={navItems}
          role="parent"
        />
      </div>
      
      {/* Main Content Area */}
      <div className={`dashboard-main bg-gradient-to-br from-gray-50 via-purple-50/30 to-blue-50/30 relative transition-all duration-300 ${!isMobile ? 'ml-20' : ''}`}>
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle at 25% 25%, #8B5CF6 2px, transparent 2px),
                             radial-gradient(circle at 75% 75%, #A855F7 2px, transparent 2px),
                             radial-gradient(circle at 50% 50%, #EC4899 1px, transparent 1px)`,
            backgroundSize: '50px 50px, 80px 80px, 30px 30px'
          }} />
        </div>
        
        {/* Floating Orbs */}
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(3)].map((_, i) => (
            <motion.div
              key={`orb-${i}`}
              className="absolute w-32 h-32 rounded-full bg-gradient-to-r from-purple-400/10 to-pink-400/10 blur-xl"
              style={{
                left: `${20 + i * 30}%`,
                top: `${10 + i * 20}%`,
              }}
              animate={{
                y: [0, -20, 0],
                x: [0, 10, 0],
                scale: [1, 1.1, 1],
              }}
              transition={{
                duration: 4 + i,
                repeat: Infinity,
                ease: "easeInOut",
                delay: i * 0.5,
              }}
            />
          ))}
        </div>
        
        {/* Main Content with Responsive Layout */}
        <div className={`dashboard-content relative transition-all duration-300 ${isNotificationOpen ? 'blur-sm pointer-events-none' : ''}`}>
          {/* Content Background Effects */}
          <div className="absolute inset-0 pointer-events-none">
            {/* Gradient Orbs */}
            {[...Array(4)].map((_, i) => {
              // Use deterministic positioning based on index to avoid hydration mismatch
              const left = (i * 79) % 100;
              const top = (i * 83) % 100;
              const xOffset = (i * 47) % 50 - 25;
              const yOffset = (i * 53) % 50 - 25;
              const duration = 8 + (i % 4);
              const delay = (i % 3) * 0.5;
              
              return (
                <motion.div
                  key={`content-orb-${i}`}
                  className="absolute w-64 h-64 rounded-full bg-gradient-to-r from-purple-400/5 to-pink-400/5 blur-3xl"
                  style={{
                    left: `${left}%`,
                    top: `${top}%`,
                  }}
                  animate={{
                    x: [0, xOffset, 0],
                    y: [0, yOffset, 0],
                    scale: [1, 1.2, 1],
                  }}
                  transition={{
                    duration: duration,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: delay,
                  }}
                />
              );
            })}
            
            {/* Floating Dots */}
            {[...Array(12)].map((_, i) => {
              // Use deterministic positioning based on index to avoid hydration mismatch
              const left = (i * 71) % 100;
              const top = (i * 91) % 100;
              const duration = 3 + (i % 2);
              const delay = (i % 5) * 0.4;
              
              return (
                <motion.div
                  key={`content-dot-${i}`}
                  className="absolute w-2 h-2 bg-gradient-to-r from-purple-400/30 to-pink-400/30 rounded-full"
                  style={{
                    left: `${left}%`,
                    top: `${top}%`,
                  }}
                  animate={{
                    y: [0, -20, 0],
                    opacity: [0.3, 0.8, 0.3],
                    scale: [1, 1.5, 1],
                  }}
                  transition={{
                    duration: duration,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: delay,
                  }}
                />
              );
            })}
          </div>
          {/* Main Panel */}
          <main className="flex-1 min-h-0 flex pr-12">
            {/* Tab Content */}
            <AnimatePresence mode="wait">
              <motion.div 
                key={activeTab}
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.95 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
              >
              {activeTab === 'overview' && (
                <motion.div 
                  className="parent-dashboard relative" 
                  style={{ width: '1400px', height: '1006px', background: '#FFFFFF', borderRadius: '40px' }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                >
                  {/* Background decorative vectors */}
                  <div className="absolute" style={{ width: '1801.59px', height: '1290.12px', left: '-247px', top: '-97px' }}>
                    <div className="absolute opacity-60" style={{ width: '948.59px', height: '467.12px', left: '606px', top: '-97px', background: 'url(Vector11111.png)' }}></div>
                    <div className="absolute opacity-60" style={{ width: '948.59px', height: '467.12px', left: '-247px', top: '726px', background: 'url(Vector11111.png)' }}></div>
                  </div>

                  {/* Header Section */}
                  <div className="relative flex items-center justify-between" style={{ padding: '47px 63px 0' }}>
                    {/* Logo */}
                    
                    {/* Title */}
                    <h1 className="font-bold" style={{ 
                      fontFamily: 'Inter', 
                      fontWeight: 700, 
                      fontSize: '45px', 
                      lineHeight: '54px', 
                      width: 'auto',
                      height: '54px'
                    }}>
                      <span style={{ color: '#1F2937' }}>Welcome </span>
                      <span style={{ color: '#6D18CE' }}>{user?.name || 'Parent'}</span>
                    </h1>

                    {/* Language Selector */}
                    <div className="flex items-center gap-2" style={{ width: '131.05px', height: '34px' }}>
                      <div className="relative" ref={languageDropdownRef} style={{ width: '131.05px', height: '34px' }}>
                        <button 
                          className="flex items-center justify-between px-3 rounded-full"
                          style={{ 
                            background: '#6D18CE', 
                            borderRadius: '86.5455px',
                            width: '131.05px',
                            height: '34px'
                          }}
                          onClick={() => setIsLanguageDropdownOpen(!isLanguageDropdownOpen)}
                        >
                          <span className="text-white font-semibold" style={{ 
                            fontFamily: 'Inter',
                            fontWeight: 600,
                            fontSize: '9.88811px',
                            lineHeight: '12px',
                            color: '#FFFFFF'
                          }}>
                            {language}
                          </span>
                          <svg 
                            width="16.44" 
                            height="16.44" 
                            viewBox="0 0 16 16" 
                            fill="none" 
                            style={{ 
                              transform: isLanguageDropdownOpen ? 'matrix(1, 0, 0, 1, 0, 0)' : 'matrix(1, 0, 0, -1, 0, 0)',
                              transition: 'transform 0.2s ease'
                            }}
                          >
                            <path d="M4 6L8 10L12 6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </button>
                        
                        {/* Language Dropdown Menu */}
                        {isLanguageDropdownOpen && (
                          <div 
                            className="absolute top-full mt-2 bg-white rounded-lg shadow-lg border border-gray-200 z-50 overflow-hidden"
                            style={{
                              width: '131.05px',
                              minWidth: '150px'
                            }}
                          >
                            {['English (USA)', 'Hindi', 'Spanish', 'French', 'German'].map((lang) => (
                              <button
                                key={lang}
                                onClick={() => {
                                  handleLanguageChange(lang);
                                  setIsLanguageDropdownOpen(false);
                                }}
                                className={`w-full text-left px-4 py-2 text-sm hover:bg-purple-50 transition-colors ${
                                  language === lang ? 'bg-purple-100 text-purple-700 font-semibold' : 'text-gray-700'
                                }`}
                                style={{
                                  fontFamily: 'Inter',
                                  fontWeight: language === lang ? 600 : 400,
                                  fontSize: '9.88811px',
                                  lineHeight: '12px'
                                }}
                              >
                                {lang}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Children Selector Section */}
                  <div className="relative" style={{ marginTop: '54px', marginLeft: '65px', width: '307px', height: '88px' }}>
                    <h2 className="font-bold mb-4" style={{ 
                      fontFamily: 'Inter',
                      fontWeight: 700,
                      fontSize: '24.7297px',
                      lineHeight: '30px',
                      color: '#000000',
                      width: '165px',
                      height: '30px'
                    }}>
                      Your Children
                    </h2>
                    <div className="flex gap-3">
                      {children.length > 0 ? (
                        children.map((childItem) => (
                          <button
                            key={childItem.name}
                            onClick={() => setSelectedChild(childItem.name)}
                            className="flex items-center justify-center rounded-full font-medium"
                            style={{
                              width: '148px',
                              height: '41px',
                              borderRadius: '47.6503px',
                              background: selectedChild === childItem.name ? '#6D18CE' : '#F5F5F5',
                              color: selectedChild === childItem.name ? '#FFFFFF' : '#999999',
                              fontFamily: 'Inter',
                              fontWeight: 500,
                              fontSize: '14.2946px',
                              lineHeight: '17px'
                            }}
                          >
                            {childItem.name} ({childItem.grade})
                          </button>
                        ))
                      ) : (
                        <div className="text-gray-500 text-sm">No children data available</div>
                      )}
                    </div>
                  </div>

                  {/* Group 149 - Download Report, Notification, and Settings */}
                  <div style={{
                    position: 'absolute',
                    width: '277px',
                    height: '48px',
                    left: '1063px',
                    top: '197px'
                  }}>
                    {/* Rectangle 26 - Background */}
                    <div style={{
                      position: 'absolute',
                      width: '277px',
                      height: '48px',
                      left: '0px',
                      top: '0px',
                      background: '#F5F5F5',
                      borderRadius: '100px'
                    }}>
                      {/* Group 83 - Download Report Button */}
                      <button
                        onClick={() => {
                          // Handle download report functionality
                          console.log('Download report clicked');
                        }}
                        style={{
                          position: 'absolute',
                          width: '136px',
                          height: '34px',
                          left: '12px',
                          top: '7px',
                          background: '#6D18CE',
                          borderRadius: '141.311px',
                          border: 'none',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        <span style={{
                          position: 'absolute',
                          width: '100px',
                          height: '15px',
                          left: '18px',
                          top: '10px',
                          fontFamily: 'Inter',
                          fontStyle: 'normal',
                          fontWeight: 500,
                          fontSize: '12px',
                          lineHeight: '15px',
                          display: 'flex',
                          alignItems: 'center',
                          textAlign: 'center',
                          color: '#FFFFFF'
                        }}>
                          Download Report
                        </span>
                      </button>

                      {/* Notification Bell - mingcute:notification-fill */}
                      <button
                        onClick={handleNotificationClick}
                        style={{
                          position: 'absolute',
                          width: '34px',
                          height: '34px',
                          left: '158px',
                          top: '7px',
                          background: '#F5F5F5',
                          borderRadius: '50%',
                          border: 'none',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        <svg width="24" height="24" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" style={{
                          position: 'absolute',
                          left: '12.75%',
                          right: '12.76%',
                          top: '8.33%',
                          bottom: '0.77%'
                        }}>
                          <rect width="30.24" height="30.24" transform="translate(0.899902 1.38086)" fill="#F5F5F5"/>
                          <path d="M16.0204 3.90039C13.6812 3.90039 11.4378 4.82964 9.7837 6.48371C8.12963 8.13778 7.20039 10.3812 7.20039 12.7204V17.1657C7.20057 17.3611 7.15527 17.554 7.06809 17.7289L4.90467 22.0545C4.79899 22.2658 4.74908 22.5006 4.7597 22.7367C4.77032 22.9727 4.8411 23.2021 4.96533 23.4031C5.08956 23.6041 5.2631 23.77 5.46948 23.885C5.67586 24.0001 5.90823 24.0604 6.14451 24.0604H25.8963C26.1325 24.0604 26.3649 24.0001 26.5713 23.885C26.7777 23.77 26.9512 23.6041 27.0754 23.4031C27.1997 23.2021 27.2705 22.9727 27.2811 22.7367C27.2917 22.5006 27.2418 22.2658 27.1361 22.0545L24.9739 17.7289C24.8863 17.5541 24.8406 17.3612 24.8404 17.1657V12.7204C24.8404 10.3812 23.9111 8.13778 22.2571 6.48371C20.603 4.82964 18.3596 3.90039 16.0204 3.90039ZM16.0204 27.8404C15.2384 27.8408 14.4755 27.5987 13.8368 27.1473C13.1982 26.696 12.7153 26.0577 12.4546 25.3204H19.5862C19.3255 26.0577 18.8426 26.696 18.2039 27.1473C17.5653 27.5987 16.8024 27.8408 16.0204 27.8404Z" fill="#A5A5A5"/>
                          <circle cx="23.58" cy="6.27336" r="5.78118" fill="#FDBB30"/>
                          <path d="M21.8094 7.82227V7.15526L23.579 5.42054C23.7482 5.24964 23.8893 5.09782 24.0021 4.96508C24.1149 4.83234 24.1995 4.70375 24.2559 4.57931C24.3124 4.45487 24.3406 4.32213 24.3406 4.1811C24.3406 4.02015 24.3041 3.88244 24.2311 3.76795C24.158 3.6518 24.0577 3.56221 23.9299 3.49916C23.8021 3.43611 23.657 3.40458 23.4944 3.40458C23.3268 3.40458 23.1799 3.43942 23.0538 3.50911C22.9277 3.57714 22.8298 3.6742 22.7601 3.80031C22.6921 3.92641 22.6581 4.07657 22.6581 4.25078H21.7795C21.7795 3.92724 21.8534 3.646 22.0011 3.40707C22.1487 3.16814 22.352 2.98314 22.6108 2.85206C22.8713 2.72098 23.17 2.65544 23.5068 2.65544C23.8486 2.65544 24.1489 2.71932 24.4078 2.84708C24.6666 2.97484 24.8674 3.14989 25.0101 3.37223C25.1544 3.59456 25.2266 3.84842 25.2266 4.13381C25.2266 4.32462 25.1901 4.51211 25.1171 4.69629C25.0441 4.88046 24.9155 5.08454 24.7313 5.30854C24.5488 5.53254 24.2924 5.80382 23.9623 6.12239L23.0837 7.01588V7.05073H25.3037V7.82227H21.8094Z" fill="white"/>
                        </svg>
                        {/* Notification count badge */}
                        {unreadCount > 0 && (
                          <span style={{
                            position: 'absolute',
                            top: '-2px',
                            right: '-2px',
                            width: '18px',
                            height: '18px',
                            background: '#FDBB30',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '10px',
                            color: 'white',
                            fontWeight: 700
                          }}>
                            {unreadCount > 9 ? '9+' : unreadCount}
                          </span>
                        )}
                      </button>

                      {/* Settings Icon */}
                      <button
                        onClick={() => setActiveTab('settings')}
                        style={{
                          position: 'absolute',
                          width: '34px',
                          height: '34px',
                          left: '202px',
                          top: '7px',
                          background: '#F5F5F5',
                          borderRadius: '50%',
                          border: 'none',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" style={{
                          position: 'absolute',
                          left: '8.33%',
                          right: '8.34%',
                          top: '8.33%',
                          bottom: '8.33%'
                        }}>
                          <path d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z" stroke="#A5A5A5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M19.4 15C19.2669 15.3016 19.2272 15.6362 19.286 15.9606C19.3448 16.285 19.4995 16.5843 19.73 16.82L19.79 16.88C19.976 17.0657 20.1235 17.2863 20.2241 17.5291C20.3248 17.7719 20.3766 18.0322 20.3766 18.295C20.3766 18.5578 20.3248 18.8181 20.2241 19.0609C20.1235 19.3037 19.976 19.5243 19.79 19.71C19.6043 19.896 19.3837 20.0435 19.1409 20.1441C18.8981 20.2448 18.6378 20.2966 18.375 20.2966C18.1122 20.2966 17.8519 20.2448 17.6091 20.1441C17.3663 20.0435 17.1457 19.896 16.96 19.71L16.9 19.65C16.6643 19.4195 16.365 19.2648 16.0406 19.206C15.7162 19.1472 15.3816 19.1869 15.08 19.32C14.7842 19.4468 14.532 19.6572 14.3543 19.9255C14.1766 20.1938 14.0813 20.5082 14.08 20.83V21C14.08 21.5304 13.8693 22.0391 13.4942 22.4142C13.1191 22.7893 12.6104 23 12.08 23C11.5496 23 11.0409 22.7893 10.6658 22.4142C10.2907 22.0391 10.08 21.5304 10.08 21V20.91C10.0723 20.579 9.96512 20.258 9.77251 19.9887C9.5799 19.7194 9.31074 19.5143 9 19.4C8.69838 19.2669 8.36381 19.2272 8.03941 19.286C7.71502 19.3448 7.41568 19.4995 7.18 19.73L7.12 19.79C6.93425 19.976 6.71368 20.1235 6.47088 20.2241C6.22808 20.3248 5.96783 20.3766 5.705 20.3766C5.44217 20.3766 5.18192 20.3248 4.93912 20.2241C4.69632 20.1235 4.47575 19.976 4.29 19.79C4.10405 19.6043 3.95653 19.3837 3.85588 19.1409C3.75523 18.8981 3.70343 18.6378 3.70343 18.375C3.70343 18.1122 3.75523 17.8519 3.85588 17.6091C3.95653 17.3663 4.10405 17.1457 4.29 16.96L4.35 16.9C4.58054 16.6643 4.73519 16.365 4.794 16.0406C4.85282 15.7162 4.81312 15.3816 4.68 15.08C4.55324 14.7842 4.34276 14.532 4.07447 14.3543C3.80618 14.1766 3.49179 14.0813 3.17 14.08H3C2.46957 14.08 1.96086 13.8693 1.58579 13.4942C1.21071 13.1191 1 12.6104 1 12.08C1 11.5496 1.21071 11.0409 1.58579 10.6658C1.96086 10.2907 2.46957 10.08 3 10.08H3.09C3.42099 10.0723 3.742 9.96512 4.01129 9.77251C4.28059 9.5799 4.48571 9.31074 4.6 9C4.73312 8.69838 4.77282 8.36381 4.714 8.03941C4.65519 7.71502 4.50054 7.41568 4.27 7.18L4.21 7.12C4.02405 6.93425 3.87653 6.71368 3.77588 6.47088C3.67523 6.22808 3.62343 5.96783 3.62343 5.705C3.62343 5.44217 3.67523 5.18192 3.77588 4.93912C3.87653 4.69632 4.02405 4.47575 4.21 4.29C4.39575 4.10405 4.61632 3.95653 4.85912 3.85588C5.10192 3.75523 5.36217 3.70343 5.625 3.70343C5.88783 3.70343 6.14808 3.75523 6.39088 3.85588C6.63368 3.95653 6.85425 4.10405 7.04 4.29L7.1 4.35C7.33568 4.58054 7.63502 4.73519 7.95941 4.794C8.28381 4.85282 8.61838 4.81312 8.92 4.68H9C9.29577 4.55324 9.54802 4.34276 9.72569 4.07447C9.90337 3.80618 9.99872 3.49179 10 3.17V3C10 2.46957 10.2107 1.96086 10.5858 1.58579C10.9609 1.21071 11.4696 1 12 1C12.5304 1 13.0391 1.21071 13.4142 1.58579C13.7893 1.96086 14 2.46957 14 3V3.09C14.0013 3.41179 14.0966 3.72618 14.2743 3.99447C14.452 4.26276 14.7042 4.47324 15 4.6C15.3016 4.73312 15.6362 4.77282 15.9606 4.714C16.285 4.65519 16.5843 4.50054 16.82 4.27L16.88 4.21C17.0657 4.02405 17.2863 3.87653 17.5291 3.77588C17.7719 3.67523 18.0322 3.62343 18.295 3.62343C18.5578 3.62343 18.8181 3.67523 19.0609 3.77588C19.3037 3.87653 19.5243 4.02405 19.71 4.21C19.896 4.39575 20.0435 4.61632 20.1441 4.85912C20.2448 5.10192 20.2966 5.36217 20.2966 5.625C20.2966 5.88783 20.2448 6.14808 20.1441 6.39088C20.0435 6.63368 19.896 6.85425 19.71 7.04L19.65 7.1C19.4195 7.33568 19.2648 7.63502 19.206 7.95941C19.1472 8.28381 19.1869 8.61838 19.32 8.92V9C19.4468 9.29577 19.6572 9.54802 19.9255 9.72569C20.1938 9.90337 20.5082 9.99872 20.83 10H21C21.5304 10 22.0391 10.2107 22.4142 10.5858C22.7893 10.9609 23 11.4696 23 12C23 12.5304 22.7893 13.0391 22.4142 13.4142C22.0391 13.7893 21.5304 14 21 14H20.91C20.5882 14.0013 20.2738 14.0966 20.0055 14.2743C19.7372 14.452 19.5268 14.7042 19.4 15Z" stroke="#A5A5A5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </button>
                    </div>
                  </div>

                  {/* Learning Style Card */}
                  <div className="relative" style={{ marginTop: '30px', marginLeft: '65px', width: '404.91px', height: '122px' }}>
                    <div className="rounded-2xl relative overflow-hidden" style={{
                      width: '404.91px',
                      height: '122px',
                      background: 'linear-gradient(92.93deg, #6D18CE 0%, #370C68 102.68%)',
                      borderRadius: '15px'
                    }}>
                      <div className="absolute" style={{ left: '30px', top: '30px' }}>
                        <p className="text-white" style={{
                          fontFamily: 'Inter',
                          fontWeight: 400,
                          fontSize: '18px',
                          lineHeight: '32px',
                          color: '#FFFFFF',
                          width: '135px',
                          height: '32px'
                        }}>
                          Learning Style
                        </p>
                        <p className="text-white font-bold" style={{
                          fontFamily: 'Inter',
                          fontWeight: 700,
                          fontSize: '25px',
                          lineHeight: '30px',
                          color: '#FFFFFF',
                          width: '177px',
                          height: '30px',
                          marginTop: '1px'
                        }}>
                          {dashboardData?.studentDashboard?.overview?.learningStreak 
                            ? (dashboardData.studentDashboard.overview.learningStreak > 10 
                                ? 'Visual Learner' 
                                : dashboardData.studentDashboard.overview.learningStreak > 5 
                                ? 'Auditory Learner' 
                                : 'Kinesthetic Learner')
                            : 'Visual Learner'}
                        </p>
                      </div>
                      {/* Learning Style Illustration */}
                      <div className="absolute right-0 top-0 bottom-0 flex items-center justify-end pr-4" style={{ width: '50%' }}>
                        <Image 
                          src="/images/layer3.png" 
                          alt="Learning Style Illustration" 
                          width={200} 
                          height={122}
                          className="object-contain h-full"
                          style={{ maxHeight: '122px' }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Stats Cards Row */}
                  <div className="relative flex gap-4" style={{ marginTop: '30px', marginLeft: '63px' }}>
                    {/* Weekly Progress Card */}
                    <div className="rounded-2xl relative" style={{
                      width: '404.93px',
                      height: '152px',
                      background: '#F5F5F5',
                      borderRadius: '15px',
                      padding: '30px'
                    }}>
                      <h3 className="font-bold mb-4" style={{
                        fontFamily: 'Inter',
                        fontWeight: 700,
                        fontSize: '21.9784px',
                        lineHeight: '27px',
                        color: '#000000',
                        width: '375.44px',
                        height: '27px'
                      }}>
                        Weekly Progress
                      </h3>
                      <div className="relative mb-3" style={{ width: '345.38px', height: '12.11px' }}>
                        <div className="absolute rounded-full" style={{
                          width: '344.88px',
                          height: '12.11px',
                          background: '#D9D9D9',
                          borderRadius: '100px'
                        }}></div>
                        {(() => {
                          const completed = dashboardData?.studentDashboard?.overview?.completedModules || 0;
                          const total = dashboardData?.studentDashboard?.overview?.totalModules || 1;
                          const percentage = total > 0 ? (completed / total) * 100 : 0;
                          const progressWidth = (percentage / 100) * 344.88;
                          return (
                            <div className="absolute rounded-full" style={{
                              width: `${progressWidth}px`,
                              height: '12px',
                              background: '#733CEB',
                              borderRadius: '100px'
                            }}></div>
                          );
                        })()}
                      </div>
                      <p className="text-gray-600" style={{
                        fontFamily: 'Inter',
                        fontWeight: 400,
                        fontSize: '12.2102px',
                        lineHeight: '15px',
                        color: '#878787',
                        width: '284.43px',
                        height: '15px'
                      }}>
                        {dashboardData?.studentDashboard?.overview?.completedModules || 0} out of {dashboardData?.studentDashboard?.overview?.totalModules || 0} modules completed
                      </p>
                    </div>

                    {/* XP Earned Card */}
                    <div className="rounded-2xl relative" style={{
                      width: '404.93px',
                      height: '152px',
                      background: '#F5F5F5',
                      borderRadius: '15px',
                      padding: '30px'
                    }}>
                      <h3 className="font-bold mb-4" style={{
                        fontFamily: 'Inter',
                        fontWeight: 700,
                        fontSize: '21.9784px',
                        lineHeight: '27px',
                        color: '#000000',
                        width: '375.43px',
                        height: '27px'
                      }}>
                        XP Earned: {dashboardData?.studentDashboard?.overview?.totalXp || 0} XP
                      </h3>
                      <div className="relative mb-3" style={{ width: '345.37px', height: '12.11px' }}>
                        <div className="absolute rounded-full" style={{
                          width: '344.88px',
                          height: '12.11px',
                          background: '#D9D9D9',
                          borderRadius: '100px'
                        }}></div>
                        {(() => {
                          const currentXp = dashboardData?.studentDashboard?.overview?.totalXp || 0;
                          const weeklyGoal = 3000;
                          const percentage = weeklyGoal > 0 ? Math.min((currentXp / weeklyGoal) * 100, 100) : 0;
                          const progressWidth = (percentage / 100) * 344.88;
                          return (
                            <div className="absolute rounded-full" style={{
                              width: `${progressWidth}px`,
                              height: '12px',
                              background: '#733CEB',
                              borderRadius: '100px'
                            }}></div>
                          );
                        })()}
                      </div>
                      <p className="text-gray-600" style={{
                        fontFamily: 'Inter',
                        fontWeight: 400,
                        fontSize: '14px',
                        lineHeight: '17px',
                        color: '#878787',
                        width: '284.43px',
                        height: '17px'
                      }}>
                        Weekly Goal: 3000 XP
                      </p>
                    </div>

                    {/* Badges Earned Card */}
                    <div className="rounded-2xl relative" style={{
                      width: '404.93px',
                      height: '152px',
                      background: '#F5F5F5',
                      borderRadius: '15px',
                      padding: '30px'
                    }}>
                      <h3 className="font-bold mb-4" style={{
                        fontFamily: 'Inter',
                        fontWeight: 700,
                        fontSize: '21.9784px',
                        lineHeight: '27px',
                        color: '#000000',
                        width: '375.43px',
                        height: '27px'
                      }}>
                        Badges Earned
                      </h3>
                      <div className="flex gap-3 flex-wrap">
                        {dashboardData?.studentDashboard?.progress?.badgesEarned && dashboardData.studentDashboard.progress.badgesEarned.length > 0 ? (
                          dashboardData.studentDashboard.progress.badgesEarned.slice(0, 3).map((badge) => (
                            <span 
                              key={badge.badgeId}
                              className="px-3 py-2 rounded-full text-white font-medium"
                              style={{
                                background: '#6D18CE',
                                borderRadius: '141.311px',
                                fontFamily: 'Inter',
                                fontWeight: 500,
                                fontSize: '12px',
                                lineHeight: '15px',
                                color: '#FFFFFF'
                              }}
                            >
                              {badge.name}
                            </span>
                          ))
                        ) : (
                          <span className="text-gray-500 text-sm">No badges earned yet</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Analytics Section */}
                  <div className="relative flex gap-4" style={{ marginTop: '27px', marginLeft: '63px' }}>
                    {/* Modules Completed */}
                    <div className="rounded-2xl relative" style={{
                      width: '282px',
                      height: '244px',
                      background: '#F5F5F5',
                      borderRadius: '15px',
                      padding: '30px'
                    }}>
                      <h3 className="font-bold mb-6" style={{
                        fontFamily: 'Inter',
                        fontWeight: 700,
                        fontSize: '21.9784px',
                        lineHeight: '27px',
                        color: '#000000',
                        width: '261.46px',
                        height: '27px'
                      }}>
                        Modules Completed
                      </h3>
                      {/* Progressbar */}
                      <div style={{
                        position: 'absolute',
                        width: '149px',
                        height: '147px',
                        left: '66.5px',
                        top: '71px'
                      }}>
                        {/* Total - Background Circle */}
                        <div style={{
                          position: 'absolute',
                          width: '147.36px',
                          height: '147.36px',
                          left: '0.21px',
                          top: '0px',
                          background: '#CBCBCB',
                          borderRadius: '50%'
                        }}></div>
                        {(() => {
                          const completed = dashboardData?.studentDashboard?.overview?.completedModules || 0;
                          const total = dashboardData?.studentDashboard?.overview?.totalModules || 1;
                          const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
                          return (
                            <>
                              {/* Value - Progress Circle */}
                              <div style={{
                                position: 'absolute',
                                width: '147.36px',
                                height: '147.36px',
                                left: '0.21px',
                                top: '0px',
                                background: `conic-gradient(from 0deg, #6C18CD 0deg ${percentage * 3.6}deg, transparent ${percentage * 3.6}deg 360deg)`,
                                borderRadius: '50%',
                                clipPath: 'circle(50% at 50% 50%)',
                                WebkitClipPath: 'circle(50% at 50% 50%)'
                              }}></div>
                              {/* Percentage Text */}
                              <span style={{
                                position: 'absolute',
                                width: '79px',
                                height: '44px',
                                left: '35px',
                                top: '52px',
                                fontFamily: 'Inter',
                                fontStyle: 'normal',
                                fontWeight: 700,
                                fontSize: '36.0787px',
                                lineHeight: '44px',
                                display: 'flex',
                                alignItems: 'center',
                                color: '#000000',
                                zIndex: 1
                              }}>
                                {percentage}%
                              </span>
                            </>
                          );
                        })()}
                      </div>
                    </div>

                    {/* Learning Streak Days */}
                    <div className="rounded-2xl relative" style={{
                      width: '282px',
                      height: '244px',
                      background: '#F5F5F5',
                      borderRadius: '15px',
                      padding: '30px'
                    }}>
                      <h3 className="font-bold mb-6" style={{
                        fontFamily: 'Inter',
                        fontWeight: 700,
                        fontSize: '21.9784px',
                        lineHeight: '27px',
                        color: '#000000',
                        width: '261.46px',
                        height: '27px'
                      }}>
                        Learning Streak Days
                      </h3>
                      {/* Progressbar */}
                      <div style={{
                        position: 'absolute',
                        width: '149px',
                        height: '147px',
                        left: '66.5px',
                        top: '71px'
                      }}>
                        {/* Total - Background Circle */}
                        <div style={{
                          position: 'absolute',
                          width: '147.36px',
                          height: '147.36px',
                          left: '0.21px',
                          top: '0px',
                          background: '#CBCBCB',
                          borderRadius: '50%'
                        }}></div>
                        {(() => {
                          const streak = dashboardData?.studentDashboard?.overview?.learningStreak || 0;
                          const maxStreak = 30; // Maximum streak for display purposes
                          const percentage = Math.min((streak / maxStreak) * 100, 100);
                          return (
                            <>
                              {/* Value - Progress Circle */}
                              <div style={{
                                position: 'absolute',
                                width: '147.36px',
                                height: '147.36px',
                                left: '0.21px',
                                top: '0px',
                                background: `conic-gradient(from 0deg, #6C18CD 0deg ${percentage * 3.6}deg, transparent ${percentage * 3.6}deg 360deg)`,
                                borderRadius: '50%',
                                clipPath: 'circle(50% at 50% 50%)',
                                WebkitClipPath: 'circle(50% at 50% 50%)'
                              }}></div>
                              {/* Streak Days Text */}
                              <span style={{
                                position: 'absolute',
                                width: '49px',
                                height: '44px',
                                left: '54.21px',
                                top: '52px',
                                fontFamily: 'Inter',
                                fontStyle: 'normal',
                                fontWeight: 700,
                                fontSize: '36.0787px',
                                lineHeight: '44px',
                                display: 'flex',
                                alignItems: 'center',
                                color: '#000000',
                                zIndex: 1
                              }}>
                                {String(streak).padStart(2, '0')}
                              </span>
                            </>
                          );
                        })()}
                      </div>
                    </div>

                    {/* Aanya Activities Chart */}
                    <div className="rounded-2xl relative" style={{
                      width: '651px',
                      height: '244px',
                      background: '#F5F5F5',
                      borderRadius: '15px',
                      padding: '30px'
                    }}>
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-bold" style={{
                          fontFamily: 'Inter',
                          fontWeight: 700,
                          fontSize: '21.9784px',
                          lineHeight: '27px',
                          color: '#000000',
                          width: '261.46px',
                          height: '27px'
                        }}>
                          {dashboardData?.studentDashboard?.overview?.studentName || child?.name || 'Student'} Activities
                        </h3>
                        <div className="flex gap-4">
                          <button 
                            onClick={async () => {
                              setActivityPeriod('day');
                              try {
                                const response = await fetch('/api/dashboard/parent/activity-graph?period=day');
                                if (response.ok) {
                                  const result = await response.json();
                                  if (result.success && result.activityData) {
                                    setActivityGraphData(result.activityData);
                                  }
                                }
                              } catch (error) {
                                console.error('Error fetching day activity:', error);
                              }
                            }}
                            style={{
                              fontFamily: 'Inter',
                              fontWeight: activityPeriod === 'day' ? 700 : 400,
                              fontSize: '12.122px',
                              lineHeight: '15px',
                              color: activityPeriod === 'day' ? '#6A16C8' : '#8E8E8E',
                              background: 'transparent',
                              border: 'none',
                              cursor: 'pointer'
                            }}
                          >
                            Day
                          </button>
                          <button 
                            onClick={async () => {
                              setActivityPeriod('week');
                              try {
                                const response = await fetch('/api/dashboard/parent/activity-graph?period=week');
                                if (response.ok) {
                                  const result = await response.json();
                                  if (result.success && result.activityData) {
                                    setActivityGraphData(result.activityData);
                                  }
                                }
                              } catch (error) {
                                console.error('Error fetching week activity:', error);
                              }
                            }}
                            style={{
                              fontFamily: 'Inter',
                              fontWeight: activityPeriod === 'week' ? 700 : 400,
                              fontSize: '12.122px',
                              lineHeight: '15px',
                              color: activityPeriod === 'week' ? '#6A16C8' : '#8E8E8E',
                              background: 'transparent',
                              border: 'none',
                              cursor: 'pointer'
                            }}
                          >
                            Week
                          </button>
                          <button 
                            onClick={async () => {
                              setActivityPeriod('month');
                              try {
                                const response = await fetch('/api/dashboard/parent/activity-graph?period=month');
                                if (response.ok) {
                                  const result = await response.json();
                                  if (result.success && result.activityData) {
                                    setActivityGraphData(result.activityData);
                                  }
                                }
                              } catch (error) {
                                console.error('Error fetching month activity:', error);
                              }
                            }}
                            style={{
                              fontFamily: 'Inter',
                              fontWeight: activityPeriod === 'month' ? 700 : 400,
                              fontSize: '12.122px',
                              lineHeight: '15px',
                              color: activityPeriod === 'month' ? '#6A16C8' : '#8E8E8E',
                              background: 'transparent',
                              border: 'none',
                              cursor: 'pointer'
                            }}
                          >
                            Month
                          </button>
                        </div>
                      </div>
                      {/* Bar Chart */}
                      <div className="flex items-end justify-between gap-2" style={{ height: '94px', marginTop: '55px' }}>
                        {(() => {
                          // Use activity graph data from API if available, otherwise fallback to default
                          let defaultData: Array<{ day: string; height: number }>;
                          
                          if (activityPeriod === 'day') {
                            // Default hourly data for day view (show every 2 hours - 12 bars)
                            defaultData = Array.from({ length: 12 }, (_, i) => ({
                              day: `${(i * 2).toString().padStart(2, '0')}:00`,
                              height: 59 + Math.random() * 65
                            }));
                          } else if (activityPeriod === 'month') {
                            // Default weekly data for month view
                            defaultData = [
                              { day: 'Week 1', height: 94 },
                              { day: 'Week 2', height: 85 },
                              { day: 'Week 3', height: 124 },
                              { day: 'Week 4', height: 75 }
                            ];
                          } else {
                            // Default daily data for week view
                            defaultData = [
                              { day: 'Mon', height: 94 },
                              { day: 'Tues', height: 85 },
                              { day: 'Wed', height: 59 },
                              { day: 'Thurs', height: 124 },
                              { day: 'Fri', height: 75 },
                              { day: 'Sat', height: 105 },
                              { day: 'Sun', height: 89 }
                            ];
                          }
                          
                          const chartData = activityGraphData || defaultData;
                          const maxHeight = Math.max(...chartData.map(d => d.height));
                          const highlightIndex = chartData.findIndex(d => d.height === maxHeight);
                          
                          // Adjust gap and width based on number of items
                          const itemWidth = activityPeriod === 'day' ? '20px' : activityPeriod === 'month' ? '60px' : '33px';
                          const gap = activityPeriod === 'day' ? '4px' : activityPeriod === 'month' ? '8px' : '2px';
                          
                          return chartData.map((item, index) => (
                            <div key={`${item.day}-${index}`} className="flex flex-col items-center" style={{ flex: 1 }}>
                              <div 
                                className="rounded-t-lg"
                                style={{
                                  width: itemWidth,
                                  height: `${item.height}px`,
                                  background: index === highlightIndex
                                    ? 'linear-gradient(180deg, #6B17CA 0%, rgba(245, 245, 245, 0) 100%)'
                                    : 'linear-gradient(180deg, #EEDFFF 15.87%, rgba(238, 223, 255, 0) 100%)',
                                  borderRadius: '44.1232px'
                                }}
                              ></div>
                              <span className="font-bold mt-2" style={{
                                fontFamily: 'Inter',
                                fontWeight: 700,
                                fontSize: activityPeriod === 'day' ? '10px' : activityPeriod === 'month' ? '11px' : '12.122px',
                                lineHeight: '15px',
                                color: '#000000',
                                textAlign: 'center'
                              }}>
                                {activityPeriod === 'day' 
                                  ? item.day.split(':')[0] // Show only hour for day view (e.g., "00" instead of "00:00")
                                  : item.day.length > 6 
                                    ? item.day.substring(0, 6) // Truncate long labels
                                    : item.day
                                }
                              </span>
                            </div>
                          ));
                        })()}
                      </div>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="relative flex items-center justify-center" style={{ marginTop: '27px', width: '100%' }}>
                    {/* Learn more button */}
                    <button 
                      className="flex items-center justify-center rounded-full text-white font-medium"
                      style={{
                        width: '125.78px',
                        height: '40.79px',
                        background: '#6D18CE',
                        borderRadius: '47.6503px',
                        fontFamily: 'Inter',
                        fontWeight: 500,
                        fontSize: '14.2946px',
                        lineHeight: '17px',
                        color: '#FFFFFF'
                      }}
                    >
                      Learn more
                    </button>
                  </div>
                </motion.div>
              )}
              {activeTab === 'child-progress' && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                >
                <div className="space-y-6">
                  {/* Progress Overview and Achievements in Same Row */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Progress Overview */}
                    <motion.div 
                      className="bg-white rounded-2xl shadow-xl p-8 border border-gray-200/50 relative overflow-hidden"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.6, delay: 0.2 }}
                    >
                      {/* Background gradient */}
                      <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 via-cyan-50/30 to-purple-50/50 pointer-events-none" />
                      
                      <div className="relative z-10">
                        <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent mb-6">Learning Progress Overview</h3>
                      {dashboardData?.studentDashboard ? (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          <motion.div 
                            className="text-center p-6 bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl border border-purple-200/50 shadow-lg hover:shadow-xl transition-all duration-300"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.4, delay: 0.4 }}
                            whileHover={{ scale: 1.05 }}
                          >
                            <div className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">{dashboardData.studentDashboard.overview.completedModules}</div>
                            <div className="text-sm text-gray-700 font-medium">Modules Completed</div>
                          </motion.div>
                          <motion.div 
                            className="text-center p-6 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl border border-blue-200/50 shadow-lg hover:shadow-xl transition-all duration-300"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.4, delay: 0.6 }}
                            whileHover={{ scale: 1.05 }}
                          >
                            <div className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent mb-2">{dashboardData.studentDashboard.overview.totalXp}</div>
                            <div className="text-sm text-gray-700 font-medium">XP Points Earned</div>
                          </motion.div>
                          <motion.div 
                            className="text-center p-6 bg-gradient-to-br from-emerald-50 to-green-50 rounded-2xl border border-emerald-200/50 shadow-lg hover:shadow-xl transition-all duration-300"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.4, delay: 0.8 }}
                            whileHover={{ scale: 1.05 }}
                          >
                            <div className="text-4xl font-bold bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent mb-2">{Math.floor(dashboardData.studentDashboard.progress.totalTimeSpent / 60)}h</div>
                            <div className="text-sm text-gray-700 font-medium">Total Learning Time</div>
                          </motion.div>
                        </div>
                      ) : (
                        <div className="text-center py-12">
                          <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                            <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                          </div>
                          <p className="text-gray-500 text-lg">No progress data available</p>
                        </div>
                      )}
                      </div>
                    </motion.div>

                    {/* Badges and Achievements */}
                    <motion.div 
                      className="bg-white rounded-2xl shadow-xl p-8 border border-gray-200/50 relative overflow-hidden"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.6, delay: 0.4 }}
                    >
                      {/* Background gradient */}
                      <div className="absolute inset-0 bg-gradient-to-br from-yellow-50/50 via-amber-50/30 to-orange-50/50 pointer-events-none" />
                      
                      <div className="relative z-10">
                        <h3 className="text-2xl font-bold bg-gradient-to-r from-yellow-600 to-amber-600 bg-clip-text text-transparent mb-6">Achievements & Badges</h3>
                      {dashboardData?.studentDashboard?.progress?.badgesEarned?.length && dashboardData.studentDashboard.progress.badgesEarned.length > 0 ? (
                        <div className="grid grid-cols-1 gap-4">
                          {dashboardData.studentDashboard.progress.badgesEarned.map((badge, index) => (
                            <motion.div 
                              key={index} 
                              className="flex items-center gap-4 p-4 bg-gradient-to-br from-yellow-50/80 to-amber-50/80 rounded-2xl border border-yellow-200/50 shadow-lg hover:shadow-xl transition-all duration-300 group"
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.4, delay: 0.6 + index * 0.1 }}
                              whileHover={{ scale: 1.05 }}
                            >
                              <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-amber-500 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg group-hover:scale-110 transition-transform duration-300">🏆</div>
                              <div>
                                <div className="font-bold text-gray-900 text-lg">{badge.name}</div>
                                <div className="text-sm text-gray-600 font-medium">{new Date(badge.earnedAt).toLocaleDateString()}</div>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-12">
                          <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                            <div className="text-4xl">🏆</div>
                          </div>
                          <p className="text-gray-500 text-lg">No badges earned yet. Keep learning to unlock achievements!</p>
                        </div>
                      )}
                      </div>
                    </motion.div>
                  </div>
                </div>
                </motion.div>
              )}
              {activeTab === 'learning-paths' && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                  className="w-full"
                >
                  {dashboardData?.studentDashboard?.overview?.studentKey ? (
                    <LearningPathTab 
                      user={{ 
                        uniqueId: dashboardData.studentDashboard.overview.studentKey,
                        name: dashboardData.student?.name || dashboardData.studentDashboard.overview.studentName
                      }} 
                      onTabChange={setActiveTab}
                      isParentView={true}
                    />
                  ) : (
                    <div className="flex items-center justify-center min-h-[60vh] w-full">
                      <div className="text-center">
                        <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                          <div className="text-4xl">📚</div>
                        </div>
                        <p className="text-gray-500 text-lg">Loading learning paths...</p>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
              {activeTab === 'reports' && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                >
                <div className="space-y-6">
                  {/* Academic Reports */}
                  <motion.div 
                    className="bg-white rounded-2xl shadow-xl border border-gray-200/50 relative overflow-hidden"
                    style={{ width: '100%', minWidth: '1200px', minHeight: '800px', padding: '3rem' }}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                  >
                    {/* Background gradient */}
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/50 via-purple-50/30 to-pink-50/50 pointer-events-none" />
                    
                    <div className="relative z-10">
                      <h3 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-6">Academic Reports</h3>
                      {dashboardData?.studentDashboard ? (
                        <div className="space-y-6">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <motion.div 
                              className="p-6 bg-gradient-to-br from-blue-50/80 to-cyan-50/80 rounded-2xl border border-blue-200/50 shadow-lg hover:shadow-xl transition-all duration-300"
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.4, delay: 0.4 }}
                              whileHover={{ scale: 1.02 }}
                            >
                              <h4 className="font-bold text-blue-900 text-lg mb-3">Performance Summary</h4>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span>Average Score:</span>
                              <span className="font-semibold">{dashboardData.studentDashboard.overview.averageScore}%</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Modules Completed:</span>
                              <span className="font-semibold">{dashboardData.studentDashboard.overview.completedModules}/{dashboardData.studentDashboard.overview.totalModules}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Time Invested:</span>
                              <span className="font-semibold">{Math.floor(dashboardData.studentDashboard.progress.totalTimeSpent / 60)}h {dashboardData.studentDashboard.progress.totalTimeSpent % 60}m</span>
                            </div>
                          </div>
                        </motion.div>
                        <motion.div 
                          className="p-6 bg-gradient-to-br from-green-50/80 to-emerald-50/80 rounded-2xl border border-green-200/50 shadow-lg hover:shadow-xl transition-all duration-300"
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.4, delay: 0.6 }}
                          whileHover={{ scale: 1.02 }}
                        >
                          <h4 className="font-bold text-green-900 text-lg mb-3">Learning Insights</h4>
                          <div className="space-y-2 text-sm text-green-800">
                            <div>✓ Consistent learning patterns</div>
                            <div>✓ Strong engagement with interactive content</div>
                            <div>✓ Good progress tracking</div>
                          </div>
                        </motion.div>
                      </div>

                      <motion.div 
                        className="border-t pt-6"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: 0.8 }}
                      >
                        <h4 className="font-bold text-gray-700 mb-4 text-lg">Recent Module Performance</h4>
                        <div className="space-y-3">
                          {dashboardData.studentDashboard.recentActivity.slice(0, 5).map((activity, index) => (
                            <motion.div 
                              key={index} 
                              className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50/80 to-gray-100/80 rounded-xl border border-gray-200/50 shadow-sm hover:shadow-md transition-all duration-300"
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ duration: 0.4, delay: 1.0 + index * 0.1 }}
                            >
                              <div>
                                <div className="font-bold text-gray-900">{activity.moduleName || activity.moduleId.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</div>
                                <div className="text-sm text-gray-500">Last accessed: {new Date(activity.lastAccessed).toLocaleDateString()}</div>
                              </div>
                              <div className="text-right">
                                <div className="font-bold text-purple-600">{Math.round(activity.progress)}%</div>
                                <div className="text-sm text-gray-500">{activity.xpEarned} XP</div>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      </motion.div>
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                        <div className="text-4xl">📊</div>
                      </div>
                      <p className="text-gray-500 text-lg">No report data available yet. Reports will appear as your child progresses through modules.</p>
                    </div>
                  )}
                    </div>
                  </motion.div>
                </div>
                </motion.div>
              )}
              {activeTab === 'messages' && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                >
                <div className="space-y-6">
                  {/* Messages & Communication */}
                  <motion.div 
                    className="bg-white rounded-2xl shadow-xl p-8 border border-gray-200/50 relative overflow-hidden"
                    style={{ width: '100%', minWidth: '1200px' }}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                  >
                    {/* Background gradient */}
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 via-cyan-50/30 to-purple-50/50 pointer-events-none" />
                    
                    <div className="relative z-10">
                      <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent mb-6">Messages & Communication</h3>
                      <div className="space-y-4">
                        {dashboardData?.studentDashboard?.notifications?.length && dashboardData.studentDashboard.notifications.length > 0 ? (
                          <div className="space-y-3">
                            <h4 className="font-bold text-gray-700 text-lg">Recent Notifications</h4>
                            {dashboardData.studentDashboard.notifications.map((notification) => (
                              <motion.div 
                                key={notification.id} 
                                className={`p-4 rounded-xl border shadow-sm hover:shadow-md transition-all duration-300 ${
                                  notification.type === 'success' ? 'bg-gradient-to-r from-green-50/80 to-emerald-50/80 border-green-200/50' :
                                  notification.type === 'warning' ? 'bg-gradient-to-r from-yellow-50/80 to-amber-50/80 border-yellow-200/50' :
                                  'bg-gradient-to-r from-blue-50/80 to-cyan-50/80 border-blue-200/50'
                                }`}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.4, delay: 0.4 }}
                              >
                                <div className="flex items-start justify-between">
                                  <div>
                                    <div className="font-bold text-gray-900">{notification.title}</div>
                                    <div className="text-sm text-gray-600 mt-1">{notification.message}</div>
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    {new Date(notification.date).toLocaleDateString()}
                                  </div>
                                </div>
                              </motion.div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-12">
                            <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                              <div className="text-4xl">💬</div>
                            </div>
                            <p className="text-gray-500 text-lg">No messages yet. Communication features will be available soon.</p>
                          </div>
                        )}
                        
                        <motion.div 
                          className="border-t pt-6"
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.4, delay: 0.6 }}
                        >
                          <h4 className="font-bold text-gray-700 mb-4 text-lg">Quick Actions</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <motion.button 
                              className="p-6 text-left bg-gradient-to-br from-purple-50/80 to-pink-50/80 hover:from-purple-100/80 hover:to-pink-100/80 rounded-xl border border-purple-200/50 shadow-lg hover:shadow-xl transition-all duration-300"
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                            >
                              <div className="font-bold text-purple-900 text-lg">📧 Contact Teacher</div>
                              <div className="text-sm text-purple-700 mt-1">Send a message to your child&apos;s teacher</div>
                            </motion.button>
                            <motion.button 
                              className="p-6 text-left bg-gradient-to-br from-blue-50/80 to-cyan-50/80 hover:from-blue-100/80 hover:to-cyan-100/80 rounded-xl border border-blue-200/50 shadow-lg hover:shadow-xl transition-all duration-300"
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                            >
                              <div className="font-bold text-blue-900 text-lg">📅 Schedule Meeting</div>
                              <div className="text-sm text-blue-700 mt-1">Book a parent-teacher conference</div>
                            </motion.button>
                          </div>
                        </motion.div>
                      </div>
                    </div>
                  </motion.div>
                </div>
                </motion.div>
              )}
              {activeTab === 'settings' && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                >
                <div className="max-w-7xl mx-40">
                  {/* Back Button */}
                  <motion.button
                    onClick={() => setActiveTab('overview')}
                    className="flex items-center gap-2 mb-6 text-gray-600 hover:text-purple-600 transition-colors group"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <svg 
                      className="w-5 h-5 transform group-hover:-translate-x-1 transition-transform" 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    <span className="font-medium">Back to Dashboard</span>
                  </motion.button>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Account Settings */}
                  <motion.div 
                    className="bg-white rounded-2xl shadow-xl p-8 border border-gray-200/50 relative overflow-hidden"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                  >
                    {/* Background gradient */}
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-50/50 via-pink-50/30 to-blue-50/50 pointer-events-none" />
                    
                    <div className="relative z-10">
                      <h3 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-6">Account Settings</h3>
                      <div className="space-y-6">
                        <div>
                          <label className="block text-sm font-bold text-gray-700 mb-3">Language Preference</label>
                          <select
                            value={language}
                            onChange={e => handleLanguageChange(e.target.value)}
                            className="w-full border border-gray-300 px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-300 bg-white shadow-sm"
                          >
                            <option value="English (USA)">English (USA)</option>
                            <option value="Hindi">Hindi</option>
                            <option value="Spanish">Spanish</option>
                            <option value="French">French</option>
                            <option value="German">German</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-bold text-gray-700 mb-3">Notification Preferences</label>
                          <div className="space-y-3">
                            <label className="flex items-center p-3 bg-white rounded-xl border border-gray-200/50 hover:bg-gray-50 transition-colors cursor-pointer">
                              <input type="checkbox" className="rounded border-gray-300 text-purple-600 focus:ring-purple-500" defaultChecked />
                              <span className="ml-3 text-sm text-gray-700 font-medium">Email notifications for progress updates</span>
                            </label>
                            <label className="flex items-center p-3 bg-white rounded-xl border border-gray-200/50 hover:bg-gray-50 transition-colors cursor-pointer">
                              <input type="checkbox" className="rounded border-gray-300 text-purple-600 focus:ring-purple-500" defaultChecked />
                              <span className="ml-3 text-sm text-gray-700 font-medium">Weekly progress reports</span>
                            </label>
                            <label className="flex items-center p-3 bg-white rounded-xl border border-gray-200/50 hover:bg-gray-50 transition-colors cursor-pointer">
                              <input type="checkbox" className="rounded border-gray-300 text-purple-600 focus:ring-purple-500" />
                              <span className="ml-3 text-sm text-gray-700 font-medium">SMS notifications for important updates</span>
                            </label>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>

                  {/* Student Details Section */}
                  <motion.div 
                    className="bg-white rounded-2xl shadow-xl p-8 border border-gray-200/50 relative overflow-hidden"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.4 }}
                  >
                    {/* Background gradient */}
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 via-cyan-50/30 to-purple-50/50 pointer-events-none" />
                    
                    <div className="relative z-10">
                      <div className="flex items-center justify-between mb-6">
                        <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">Student Details</h3>
                        <button
                          onClick={async () => {
                            setIsLoadingStudentDetails(true);
                            try {
                              const response = await fetch('/api/parent/child-details');
                              if (response.ok) {
                                const data = await response.json();
                                setStudentDetails(data);
                              } else {
                                const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
                                console.error('Failed to fetch student details:', errorData.error || response.statusText);
                                // Show user-friendly error message
                                alert(`Failed to load student details: ${errorData.error || 'Please try again later'}`);
                              }
                            } catch (error) {
                              console.error('Error fetching student details:', error);
                              alert('Failed to load student details. Please check your connection and try again.');
                            } finally {
                              setIsLoadingStudentDetails(false);
                            }
                          }}
                          disabled={isLoadingStudentDetails}
                          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                        >
                          {isLoadingStudentDetails ? 'Loading...' : 'Refresh Details'}
                        </button>
                      </div>

                      {isLoadingStudentDetails ? (
                        <div className="text-center py-12">
                          <div className="w-16 h-16 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                          <p className="text-gray-500">Loading student details...</p>
                        </div>
                      ) : studentDetails?.student ? (
                        <div className="space-y-6">
                          {/* Basic Information */}
                          <div>
                            <h4 className="text-lg font-bold text-gray-800 mb-4 pb-2 border-b border-gray-200">Basic Information</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <div>
                                <label className="block text-sm font-semibold text-gray-600 mb-2">Full Name</label>
                                <div className="px-4 py-3 border border-gray-300 rounded-xl bg-white text-gray-800 shadow-sm font-medium">
                                  {studentDetails.student.fullName || 'N/A'}
                                </div>
                              </div>
                              <div>
                                <label className="block text-sm font-semibold text-gray-600 mb-2">Student ID</label>
                                <div className="px-4 py-3 border border-gray-300 rounded-xl bg-white text-gray-800 shadow-sm font-medium">
                                  {studentDetails.student.uniqueId || 'N/A'}
                                </div>
                              </div>
                              <div>
                                <label className="block text-sm font-semibold text-gray-600 mb-2">Grade/Class</label>
                                <div className="px-4 py-3 border border-gray-300 rounded-xl bg-white text-gray-800 shadow-sm font-medium">
                                  {studentDetails.student.classGrade || 'N/A'}
                                </div>
                              </div>
                              <div>
                                <label className="block text-sm font-semibold text-gray-600 mb-2">Email</label>
                                <div className="px-4 py-3 border border-gray-300 rounded-xl bg-white text-gray-800 shadow-sm font-medium">
                                  {studentDetails.student.email || 'N/A'}
                                </div>
                              </div>
                              <div>
                                <label className="block text-sm font-semibold text-gray-600 mb-2">School Name</label>
                                <div className="px-4 py-3 border border-gray-300 rounded-xl bg-white text-gray-800 shadow-sm font-medium">
                                  {studentDetails.student.schoolName || 'N/A'}
                                </div>
                              </div>
                              <div>
                                <label className="block text-sm font-semibold text-gray-600 mb-2">Status</label>
                                <div className="px-4 py-3 border border-gray-300 rounded-xl bg-white shadow-sm">
                                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                                    studentDetails.student.isActive 
                                      ? 'bg-green-100 text-green-800' 
                                      : 'bg-gray-100 text-gray-800'
                                  }`}>
                                    {studentDetails.student.isActive ? 'Active' : 'Inactive'}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Organization & Branch Information */}
                          {(studentDetails.organization || studentDetails.branch) && (
                            <div>
                              <h4 className="text-lg font-bold text-gray-800 mb-4 pb-2 border-b border-gray-200">School Information</h4>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {studentDetails.organization && (
                                  <>
                                    <div>
                                      <label className="block text-sm font-semibold text-gray-600 mb-2">Organization</label>
                                      <div className="px-4 py-3 border border-gray-300 rounded-xl bg-white text-gray-800 shadow-sm font-medium">
                                        {studentDetails.organization.organizationName || 'N/A'}
                                      </div>
                                    </div>
                                    <div>
                                      <label className="block text-sm font-semibold text-gray-600 mb-2">Organization Type</label>
                                      <div className="px-4 py-3 border border-gray-300 rounded-xl bg-white text-gray-800 shadow-sm font-medium">
                                        {studentDetails.organization.organizationType || 'N/A'}
                                      </div>
                                    </div>
                                  </>
                                )}
                                {studentDetails.branch && (
                                  <>
                                    <div>
                                      <label className="block text-sm font-semibold text-gray-600 mb-2">Branch Name</label>
                                      <div className="px-4 py-3 border border-gray-300 rounded-xl bg-white text-gray-800 shadow-sm font-medium">
                                        {studentDetails.branch.branchName || 'N/A'}
                                      </div>
                                    </div>
                                    <div>
                                      <label className="block text-sm font-semibold text-gray-600 mb-2">Branch Code</label>
                                      <div className="px-4 py-3 border border-gray-300 rounded-xl bg-white text-gray-800 shadow-sm font-medium">
                                        {studentDetails.branch.branchCode || 'N/A'}
                                      </div>
                                    </div>
                                    {studentDetails.branch.principalName && (
                                      <div>
                                        <label className="block text-sm font-semibold text-gray-600 mb-2">Principal Name</label>
                                        <div className="px-4 py-3 border border-gray-300 rounded-xl bg-white text-gray-800 shadow-sm font-medium">
                                          {studentDetails.branch.principalName}
                                        </div>
                                      </div>
                                    )}
                                  </>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Teachers Information */}
                          {studentDetails.teachers && studentDetails.teachers.length > 0 && (
                            <div>
                              <h4 className="text-lg font-bold text-gray-800 mb-4 pb-2 border-b border-gray-200">Assigned Teachers</h4>
                              <div className="space-y-3">
                                {studentDetails.teachers.map((teacher: any, index: number) => (
                                  <div
                                    key={teacher.id || index}
                                    className="p-4 border border-gray-200 rounded-xl bg-white shadow-sm hover:shadow-md transition-shadow"
                                  >
                                    <div className="flex items-start justify-between">
                                      <div className="flex-1">
                                        <h5 className="font-bold text-gray-900 mb-1">{teacher.fullName || 'N/A'}</h5>
                                        <div className="space-y-1 text-sm text-gray-600">
                                          {teacher.subjectSpecialization && (
                                            <p><span className="font-semibold">Subject:</span> {teacher.subjectSpecialization}</p>
                                          )}
                                          {teacher.experienceYears && (
                                            <p><span className="font-semibold">Experience:</span> {teacher.experienceYears} years</p>
                                          )}
                                          {teacher.email && (
                                            <p><span className="font-semibold">Email:</span> {teacher.email}</p>
                                          )}
                                          {teacher.phoneNumber && (
                                            <p><span className="font-semibold">Phone:</span> {teacher.phoneNumber}</p>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-center py-12">
                          <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                            <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                            </svg>
                          </div>
                          <p className="text-gray-500 text-lg mb-4">No student details loaded</p>
                          <button
                            onClick={async () => {
                              setIsLoadingStudentDetails(true);
                              try {
                                const response = await fetch('/api/parent/child-details');
                                if (response.ok) {
                                  const data = await response.json();
                                  setStudentDetails(data);
                                } else {
                                  const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
                                  console.error('Failed to fetch student details:', errorData.error || response.statusText);
                                  alert(`Failed to load student details: ${errorData.error || 'Please try again later'}`);
                                }
                              } catch (error) {
                                console.error('Error fetching student details:', error);
                                alert('Failed to load student details. Please check your connection and try again.');
                              } finally {
                                setIsLoadingStudentDetails(false);
                              }
                            }}
                            className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
                          >
                            Load Student Details
                          </button>
                        </div>
                      )}
                    </div>
                  </motion.div>
                  </div>
                </div>
                </motion.div>
              )}
              </motion.div>
            </AnimatePresence>
          </main>
          
          {/* Right Panel */}
          
          
          {/* Mobile Right Panel Overlay */}
          {isRightPanelOpen && (
            <div 
              className="fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden"
              onClick={() => setIsRightPanelOpen(false)}
            />
          )}
          
        </div>
      </div>
      {/* Chat Modal */}
      {child && (
        <ChatModal
          isOpen={isChatOpen}
          onClose={() => setIsChatOpen(false)}
          studentData={{
            name: child?.name || 'Student',
            grade: child?.grade || '',
            email: child?.email || '',
            school: child?.school || '',
            studentId: child?.id || '',
          }}
        />
      )}

      {/* Floating FAB for right panel on mobile/tablet */}
      {isMobile && !isRightPanelOpen && (
        <button
          className="right-panel-fab"
          aria-label="Open Quick Actions"
          onClick={() => setIsRightPanelOpen(true)}
        >
          <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      )}

      {/* Notification Overlay - Outside blurred content */}
      <AnimatePresence>
        {isNotificationOpen && (
          <motion.div
            className="fixed inset-0 bg-black/20 z-[10000]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setIsNotificationOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Notifications Dropdown - Outside blurred content */}
      <AnimatePresence>
        {isNotificationOpen && (
          <motion.div 
            className="fixed right-4 top-14 z-[10001]"
            style={{
              width: '310.06px',
              height: '643.67px',
              marginRight: '1rem',
            }}
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
            {/* Header with Notification Bell and User Profile */}
            <div className="relative" style={{ width: '310.06px', height: '67.67px', marginBottom: '18.27px' }}>
              {/* Notification Bell with Badge */}
              <div 
                className="absolute rounded-full"
                style={{
                  width: '250px',
                  height: '67.67px',
                  left: '60px',
                  top: '0px',
                  background: '#F5F5F5',
                  borderRadius: '135.35px',
                }}
              >
                {/* Notification Icon */}
                <div style={{ position: 'absolute', left: '20.31px', top: '17.6px', width: '32.48px', height: '32.48px' }}>
                  <div className="relative" style={{ width: '100%', height: '100%' }}>
                  <svg width="33" height="33" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M16.0204 3.90039C13.6812 3.90039 11.4378 4.82964 9.7837 6.48371C8.12963 8.13778 7.20039 10.3812 7.20039 12.7204V17.1657C7.20057 17.3611 7.15527 17.554 7.06809 17.7289L4.90467 22.0545C4.79899 22.2658 4.74908 22.5006 4.7597 22.7367C4.77032 22.9727 4.8411 23.2021 4.96533 23.4031C5.08956 23.6041 5.2631 23.77 5.46948 23.885C5.67586 24.0001 5.90823 24.0604 6.14451 24.0604H25.8963C26.1325 24.0604 26.3649 24.0001 26.5713 23.885C26.7777 23.77 26.9512 23.6041 27.0754 23.4031C27.1997 23.2021 27.2705 22.9727 27.2811 22.7367C27.2917 22.5006 27.2418 22.2658 27.1361 22.0545L24.9739 17.7289C24.8863 17.5541 24.8406 17.3612 24.8404 17.1657V12.7204C24.8404 10.3812 23.9111 8.13778 22.2571 6.48371C20.603 4.82964 18.3596 3.90039 16.0204 3.90039ZM16.0204 27.8404C15.2384 27.8408 14.4755 27.5987 13.8368 27.1473C13.1982 26.696 12.7153 26.0577 12.4546 25.3204H19.5862C19.3255 26.0577 18.8426 26.696 18.2039 27.1473C17.5653 27.5987 16.8024 27.8408 16.0204 27.8404Z" fill="#6D18CE"/>
                  </svg>
                  
                  {/* Badge - Upper right corner of bell icon */}
                  {notifications.filter(n => !n.read).length > 0 && (
                    <div 
                      className="absolute rounded-full flex items-center justify-center"
                      style={{
                        width: '14px',
                        height: '14px',
                        right: '-2px',
                        top: '-2px',
                        background: '#FDBB30',
                      }}
                    >
                      <span 
                        className="text-white font-semibold flex items-center justify-center"
                        style={{
                          fontSize: '8px',
                          lineHeight: '14px',
                          fontFamily: 'Inter',
                          fontWeight: 600,
                        }}
                      >
                        {notifications.filter(n => !n.read).length > 9 ? '9+' : notifications.filter(n => !n.read).length}
                      </span>
                    </div>
                  )}
                  </div>
                </div>
              </div>

              {/* User Profile Section */}
              <div className="absolute" style={{ left: '120px', top: '9.47px', width: '158px', height: '48.01px' }}>
                {/* Avatar */}
                <div 
                  className="absolute rounded-full overflow-hidden flex-shrink-0"
                  style={{
                    width: '47.37px',
                    height: '47.37px',
                    left: '0px',
                    top: '0px',
                    background: '#6C18CD',
                  }}
                >
                  <Image 
                    src={userAvatar} 
                    alt="User Avatar" 
                    width={47} 
                    height={47} 
                    className="w-full h-full object-cover rounded-full"
                  />
                </div>
                
                {/* Name */}
                <span 
                  className="absolute font-bold text-black hidden sm:flex items-center"
                  style={{
                    left: '56.85px',
                    top: '5.42px',
                    width: '100px',
                    height: '22px',
                    fontFamily: 'Inter',
                    fontWeight: 700,
                    fontSize: '18.5843px',
                    lineHeight: '22px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                  title={user?.name || 'Parent'}
                >
                  {user?.name || 'Parent'}
                </span>
                
                {/* ID */}
                <span 
                  className="absolute text-gray-600 hidden sm:flex items-center"
                  style={{
                    left: '56.85px',
                    top: '22.48px',
                    width: '100px',
                    height: '25px',
                    fontFamily: 'Inter',
                    fontWeight: 400,
                    fontSize: '12.0239px',
                    lineHeight: '24px',
                    color: '#454545',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  #{user?.uniqueId?.toString() || '0000'}
                </span>
              </div>
            </div>

            {/* Notifications List */}
            <div 
              className="overflow-y-auto"
              style={{
                position: 'absolute',
                top: '85.94px',
                left: '0px',
                width: '301.39px',
                height: '557.74px',
              }}
            >
              {notifications.length > 0 ? (
                <div className="flex flex-col gap-3">
                  {notifications.map((notification, index) => (
                    <div
                      key={notification.id}
                      className="flex flex-col cursor-pointer"
                      style={{
                        padding: '12.41px 14.1828px',
                        background: 'rgba(255, 255, 255, 0.88)',
                        boxShadow: '21.4841px 15.0389px 79.4912px rgba(0, 0, 0, 0.16)',
                        borderRadius: '17.7285px',
                      }}
                      onClick={() => markNotificationAsRead(notification.id)}
                    >
                      {/* Notification Header */}
                      <div className="flex flex-row justify-start items-center mb-2.5" style={{ gap: '14.18px' }}>
                        <div className="flex flex-row items-center" style={{ gap: '5.32px' }}>
                          {/* App Icon */}
                          <div className="relative" style={{ width: '14.18px', height: '14.18px' }}>
                            <div 
                              className="absolute rounded"
                              style={{
                                width: '12.41px',
                                height: '12.41px',
                                left: '0.89px',
                                top: '0.89px',
                                background: '#6D18CE',
                              }}
                            />
                          </div>
                          
                          {/* App Name */}
                          <span 
                            className="text-purple-600"
                            style={{
                              fontFamily: 'Roboto',
                              fontWeight: 400,
                              fontSize: '10.6371px',
                              lineHeight: '14px',
                              color: '#6D18CE',
                            }}
                          >
                            Hangouts
                          </span>
                          
                          {/* Arrow Icon */}
                          <svg 
                            width="14.18" 
                            height="14.18" 
                            viewBox="0 0 14 14" 
                            fill="none"
                            style={{ transform: 'matrix(-1, 0, 0, 1, 0, 0)' }}
                          >
                            <path 
                              d="M3.28 5.05L8.33 9.84L3.28 5.05Z" 
                              fill="#A1A1A1"
                              style={{ transform: 'matrix(1, 0, 0, -1, 0, 0)' }}
                            />
                          </svg>
                          
                          {/* Time */}
                          <span 
                            className="text-gray-600"
                            style={{
                              fontFamily: 'Roboto',
                              fontWeight: 400,
                              fontSize: '10.6371px',
                              lineHeight: '14px',
                              color: '#595959',
                            }}
                          >
                            {formatNotificationTime(notification.date)}
                          </span>
                        </div>
                      </div>

                      {/* Notification Content */}
                      <div className="flex flex-col" style={{ gap: '3.55px' }}>
                        {/* Title */}
                        <span 
                          className="text-gray-900"
                          style={{
                            fontFamily: 'Roboto',
                            fontWeight: 400,
                            fontSize: '13.2964px',
                            lineHeight: '18px',
                            color: '#222222',
                          }}
                        >
                          {notification.title}
                        </span>
                        
                        {/* Message */}
                        <span 
                          className="text-gray-600"
                          style={{
                            fontFamily: 'Roboto',
                            fontWeight: 400,
                            fontSize: '11.5235px',
                            lineHeight: '18px',
                            color: '#686868',
                          }}
                        >
                          {notification.message}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="px-4 py-8 text-center text-gray-500">
                  <svg className="w-12 h-12 mx-auto mb-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                  <p className="text-sm">No notifications yet</p>
                </div>
              )}
            </div>

          </motion.div>
        )}
      </AnimatePresence>

      {/* Avatar Selector Modal */}
      <AnimatePresence>
        {isAvatarSelectorOpen && (
          <>
            {/* Dark Overlay */}
            <motion.div
              className="fixed inset-0 bg-black/50 z-[10002]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setIsAvatarSelectorOpen(false)}
            />
            
            {/* Avatar Selector Modal */}
            <motion.div 
              className="fixed inset-0 flex items-center justify-center z-[10003] p-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <motion.div 
                className="bg-white rounded-2xl shadow-2xl border border-gray-200 max-w-md w-full max-h-[80vh] overflow-hidden"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
              >
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-pink-50">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-bold text-gray-900">Choose Your Avatar</h3>
                    <button
                      onClick={() => setIsAvatarSelectorOpen(false)}
                      className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
                    >
                      <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">Select an avatar that represents you</p>
                </div>

                {/* Avatar Grid */}
                <div className="p-6">
                  <div className="grid grid-cols-3 gap-4">
                    {AVAILABLE_AVATARS.map((avatar, index) => (
                      <motion.button
                        key={avatar}
                        className={`relative p-3 rounded-xl border-2 transition-all duration-200 ${
                          userAvatar === avatar 
                            ? 'border-purple-500 bg-purple-50 shadow-lg' 
                            : 'border-gray-200 hover:border-purple-300 hover:bg-purple-50'
                        }`}
                        onClick={() => handleAvatarSelect(avatar)}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                      >
                        <div className="w-16 h-16 mx-auto relative">
                          <Image 
                            src={avatar} 
                            alt={`Avatar ${index + 1}`} 
                            fill 
                            className="rounded-full object-cover" 
                          />
                        </div>
                        
                        {/* Selected Indicator */}
                        {userAvatar === avatar && (
                          <motion.div
                            className="absolute -top-1 -right-1 w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center"
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ duration: 0.2 }}
                          >
                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          </motion.div>
                        )}
                      </motion.button>
                    ))}
                  </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-600">
                      Click on any avatar to select it
                    </p>
                    <button
                      onClick={() => setIsAvatarSelectorOpen(false)}
                      className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium"
                    >
                      Done
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
      
    </motion.div>
  );
}