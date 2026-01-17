'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '../student/components/Sidebar';
import Image from 'next/image';
import { Dialog } from '@headlessui/react';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { TypewriterText, StaggeredText, GradientText, CharacterAnimation } from '../../components/TextAnimations';
import { TiltCard, MagneticButton } from '../../components/InteractiveElements';
import { StaggerContainer, StaggerItem } from '../../components/PageTransitions';
import { ScrollFade, ScrollCounter, ParallaxScroll, ScrollProgress } from '../../components/ScrollAnimations';
import VantaBackground from '../../components/VantaBackground';
import ConsistentLoadingPage from '../../components/ConsistentLoadingPage';
import LearningPathTab from '../student/components/LearningPathTab';
import TestManagement from './components/TestManagement';
import TestAssignment from './components/TestAssignment';
import TestEvaluation from './components/TestEvaluation';
import NotificationCenter from '../../components/NotificationCenter';

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

interface TeacherProfile {
  _id: string;
  name: string;
  email: string;
  role: string;
  avatar?: string;
  profile?: {
    subjectSpecialization?: string;
    experienceYears?: number;
  };
}

interface Notification {
  id: string;
  title: string;
  message: string;
  date: string;
  read: boolean;
  type: 'info' | 'success' | 'warning' | 'error';
}

interface StudentData {
  id: string;
  userId: string;
  fullName: string;
  email: string;
  password?: string; // Include password for teacher-created accounts
  classGrade: string;
  schoolName: string;
  uniqueId: string;
  onboardingCompleted: boolean;
  joinedAt: string;
  totalModulesCompleted: number;
  totalXpEarned: number;
  learningStreak: number;
  badgesEarned: number;
  assessmentCompleted: boolean;
  diagnosticCompleted: boolean;
  diagnosticScore: number;
  createdBy?: {
    type?: 'teacher' | 'organization' | 'self';
    id?: string;
    name?: string;
  } | null;
  managedBy?: {
    type?: 'teacher' | 'organization' | 'self';
    id?: string;
    name?: string;
  } | null;
  organizationId?: string | null;
}

interface ModuleData {
  id: string;
  title: string;
  subject: string;
  grade: string;
  difficulty: string;
  duration: number;
  points: number;
}

interface TeacherStats {
  totalStudents: number;
  activeStudents: number;
  averageProgress: number;
  totalAssignments: number;
  averageScore: number;
  totalXpAcrossStudents: number;
}

// Avatar utility functions
const AVAILABLE_AVATARS = [
  '/avatars/Group-1.svg',
  '/avatars/Group-2.svg',
  '/avatars/Group-3.svg',
  '/avatars/Group-4.svg',
  '/avatars/Group-5.svg',
  '/avatars/Group-6.svg',
  '/avatars/Group-7.svg',
  '/avatars/Group-8.svg',
  '/avatars/Group.svg',
];

const getRandomAvatar = () => {
  return AVAILABLE_AVATARS[Math.floor(Math.random() * AVAILABLE_AVATARS.length)];
};

export default function TeacherDashboard() {
  const [user, setUser] = useState<TeacherProfile | null>(null);
  const [teacherProfile, setTeacherProfile] = useState<TeacherProfile | null>(null);
  const [dashboardStats, setDashboardStats] = useState<any>(null);
  const [teacherStats, setTeacherStats] = useState<TeacherStats>({
    totalStudents: 0,
    activeStudents: 0,
    averageProgress: 0,
    totalAssignments: 0,
    averageScore: 0,
    totalXpAcrossStudents: 0
  });

  // Real data - will be populated from API
  const [students, setStudents] = useState<StudentData[]>([]);
  const [modules, setModules] = useState<ModuleData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [subjectSpecialization, setSubjectSpecialization] = useState('');
  const [experienceYears, setExperienceYears] = useState('');
  const [saving, setSaving] = useState(false);
  
  // Form states
  const [showAddStudentForm, setShowAddStudentForm] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [addStudentError, setAddStudentError] = useState<string | null>(null);
  const [showBulkImportForm, setShowBulkImportForm] = useState(false);
  const [showCreateModuleForm, setShowCreateModuleForm] = useState(false);
  const [showAssignModuleForm, setShowAssignModuleForm] = useState(false);
  const [showCreateAssignmentForm, setShowCreateAssignmentForm] = useState(false);
  const [showBulkAssignForm, setShowBulkAssignForm] = useState(false);
  const [showCredentialsModal, setShowCredentialsModal] = useState(false);
  const [newStudentCredentials, setNewStudentCredentials] = useState<StudentData | null>(null);
  const [allStudentCredentials, setAllStudentCredentials] = useState<StudentData[]>([]);
  const [selectedStudentForLearningPaths, setSelectedStudentForLearningPaths] = useState<StudentData | null>(null);
  const [showLearningPathsModal, setShowLearningPathsModal] = useState(false);
  const [selectedTestForAssignment, setSelectedTestForAssignment] = useState<string | null>(null);
  const [selectedTestForEvaluation, setSelectedTestForEvaluation] = useState<string | null>(null);
  
  // Additional state for real data
  const [assignments, setAssignments] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [language, setLanguage] = useState('English (USA)');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isRightPanelHovered, setIsRightPanelHovered] = useState(false);
  const [isRightPanelOpen, setIsRightPanelOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [userAvatar, setUserAvatar] = useState('/avatars/Group-1.svg');
  const [isAvatarSelectorOpen, setIsAvatarSelectorOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const notificationRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const logoutTriggered = useRef(false);
  const { width: windowWidth } = useWindowSize();
  const isMobile = windowWidth < 768; // Changed from 1024 to 768 to match Sidebar component

  // Teacher-specific navigation items
  const navItems = [
    { id: 'overview', label: 'Overview', icon: '/icons/overview.png' },
    { id: 'students', label: 'My Students', icon: '/icons/profile.png' },
    { id: 'modules', label: 'Learning Modules', icon: '/icons/modules.png' },
    { id: 'assignments', label: 'Assignments', icon: '/icons/report.png' },
    { id: 'tests', label: 'Tests', icon: '/icons/report.png' },
    { id: 'analytics', label: 'Analytics', icon: '/icons/rewards.png' },
    { id: 'settings', label: 'Settings', icon: '/icons/settings.png' },
  ];

  useEffect(() => {
    const savedLang = localStorage.getItem('lang')
    if (savedLang) setLanguage(savedLang)
    
    // Initialize avatar
    const savedAvatar = localStorage.getItem('teacherAvatar');
    if (savedAvatar) {
      setUserAvatar(savedAvatar);
    } else {
      setUserAvatar(getRandomAvatar());
    }
    
    // Load dashboard data
    loadDashboardData();
    
    // Initialize notifications - will be populated from real data
    setNotifications([]);
  }, [])

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      
      // Load dashboard statistics
      try {
        const statsResponse = await fetch('/api/teacher/dashboard-stats');
        if (statsResponse.ok) {
          const statsData = await statsResponse.json();
          setTeacherStats(statsData);
        } else {
          console.error('Failed to load dashboard stats:', statsResponse.status);
        }
      } catch (error) {
        console.error('Error loading dashboard stats:', error);
      }
      
      // Load students
      try {
        const studentsResponse = await fetch('/api/teacher/students');
        if (studentsResponse.ok) {
          const studentsData = await studentsResponse.json();
          setStudents(studentsData.students || []);
        } else {
          console.error('Failed to load students:', studentsResponse.status);
        }
      } catch (error) {
        console.error('Error loading students:', error);
      }
      
      // Load modules
      try {
        const modulesResponse = await fetch('/api/teacher/modules');
        if (modulesResponse.ok) {
          const modulesData = await modulesResponse.json();
          setModules(modulesData.modules || []);
        } else {
          console.error('Failed to load modules:', modulesResponse.status);
        }
      } catch (error) {
        console.error('Error loading modules:', error);
      }
      
      // Load assignments
      try {
        const assignmentsResponse = await fetch('/api/teacher/assignments');
        if (assignmentsResponse.ok) {
          const assignmentsData = await assignmentsResponse.json();
          setAssignments(assignmentsData.assignments || []);
        } else {
          console.error('Failed to load assignments:', assignmentsResponse.status);
        }
      } catch (error) {
        console.error('Error loading assignments:', error);
      }
      
      // Load analytics
      try {
        const analyticsResponse = await fetch('/api/teacher/analytics');
        if (analyticsResponse.ok) {
          const analyticsData = await analyticsResponse.json();
          setAnalytics(analyticsData);
        } else {
          console.error('Failed to load analytics:', analyticsResponse.status);
        }
      } catch (error) {
        console.error('Error loading analytics:', error);
      }

      // Load teacher profile
      try {
        const profileResponse = await fetch('/api/teacher/profile');
        if (profileResponse.ok) {
          const profileData = await profileResponse.json();
          setTeacherProfile(profileData.user);
        } else {
          console.error('Failed to load teacher profile:', profileResponse.status);
        }
      } catch (error) {
        console.error('Error loading teacher profile:', error);
      }
      
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  }

  const handleLanguageChange = (lang: string) => {
    setLanguage(lang)
    localStorage.setItem('lang', lang)
  }

  const handleSaveProfile = async () => {
    if (!teacherProfile) {
      alert('Profile data not available. Please refresh the page.');
      return;
    }
    
    try {
      const response = await fetch('/api/teacher/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: teacherProfile.name,
          profile: teacherProfile.profile
        })
      });

      if (response.ok) {
        const updatedProfile = await response.json();
        setTeacherProfile(updatedProfile.user);
        alert('Profile updated successfully!');
      } else {
        console.error('Failed to update profile:', response.status);
        alert('Failed to update profile. Please try again.');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Error updating profile. Please try again.');
    }
  }

  // Notification functions
  const unreadCount = notifications.filter(n => !n.read).length;

  const handleNotificationClick = () => {
    setIsNotificationOpen(!isNotificationOpen);
  };

  const handleAvatarSelect = (avatar: string) => {
    setUserAvatar(avatar);
    // Here you would typically save to backend
    localStorage.setItem('teacherAvatar', avatar);
  };

  const markNotificationAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  };

  const markAllNotificationsAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success': return '✓';
      case 'warning': return '⚠';
      case 'error': return '✕';
      default: return 'ℹ';
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'success': return 'text-green-600';
      case 'warning': return 'text-yellow-600';
      case 'error': return 'text-red-600';
      default: return 'text-blue-600';
    }
  };

  const formatNotificationTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  useEffect(() => {
    const fetchUserAndDashboard = async () => {
      try {
        const response = await fetch('/api/auth/me');
        if (response.ok) {
          const userData = await response.json();
          if (userData.user.role !== 'teacher') {
            router.push('/login');
            return;
          }
          setUser(userData.user);
          
          // Show onboarding if profile is incomplete
          if (!userData.user.profile?.subjectSpecialization || !userData.user.profile?.experienceYears) {
            setShowOnboarding(true);
            setSubjectSpecialization(userData.user.profile?.subjectSpecialization || '');
            setExperienceYears(userData.user.profile?.experienceYears || '');
          } else {
            // Fetch dashboard statistics
            try {
              const statsResponse = await fetch('/api/teacher/dashboard-stats');
              if (statsResponse.ok) {
                const statsData = await statsResponse.json();
                setDashboardStats(statsData);
                setTeacherStats(statsData);
              }
            } catch (error) {
              console.error('Error fetching dashboard stats:', error);
            }
            
            // Fetch students
            try {
              const studentsResponse = await fetch('/api/teacher/students');
              if (studentsResponse.ok) {
                const studentsData = await studentsResponse.json();
                setStudents(studentsData.students || []);
              }
            } catch (error) {
              console.error('Error fetching students:', error);
            }
          }
        } else {
          router.push('/login');
        }
      } catch (error) {
        console.error('Error fetching user:', error);
        router.push('/login');
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserAndDashboard();
  }, [router]);

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const response = await fetch('/api/user/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subjectSpecialization,
          experienceYears
        })
      });
      if (response.ok) {
        setShowOnboarding(false);
        window.location.reload();
      }
    } finally {
      setSaving(false);
    }
  };

  const handleAddStudent = async (studentData: any) => {
    try {
      console.log('Sending student data:', studentData);
      
      let response;
      try {
        response = await fetch('/api/teacher/students', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(studentData),
        });
      } catch (fetchError) {
        console.error('Fetch error:', fetchError);
        throw new Error(`Network error: ${fetchError instanceof Error ? fetchError.message : 'Unknown network error'}`);
      }
      
      if (!response) {
        throw new Error('No response received from server');
      }
      
      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);

      if (response.ok) {
        let result;
        try {
          result = await response.json();
        } catch (jsonError) {
          console.error('JSON parse error:', jsonError);
          throw new Error('Invalid response from server');
        }
        setStudents(prev => [...prev, result.student]);
        setShowAddStudentForm(false);
        setShowPassword(false);
        setAddStudentError(null);
        
        // Show credentials modal if password is provided
        if (result.student.password) {
          setNewStudentCredentials(result.student);
          setShowCredentialsModal(true);
        }
        
        // Add success notification
        const newNotification = {
          id: Date.now().toString(),
          title: 'Student Added Successfully',
          message: `${studentData.fullName} has been added to your class.`,
          date: new Date().toISOString(),
          read: false,
          type: 'success' as const
        };
        setNotifications(prev => [newNotification, ...prev]);
        
        // Refresh dashboard data
        loadDashboardData();
      } else {
        let error;
        try {
          error = await response.json();
        } catch (jsonError) {
          console.error('Failed to parse error response:', jsonError);
          error = { error: 'Server returned an error but response was not valid JSON' };
        }
        console.error('Error adding student:', error);
        console.error('Response status:', response.status);
        console.error('Response headers:', response.headers);
        
        // Set inline error message in the form
        const errorMessage = error.error || error.details || 'Failed to add student. Please try again.';
        setAddStudentError(errorMessage);
        
        // Add error notification with more specific error message
        const errorNotification = {
          id: Date.now().toString(),
          title: 'Error Adding Student',
          message: errorMessage,
          date: new Date().toISOString(),
          read: false,
          type: 'error' as const
        };
        setNotifications(prev => [errorNotification, ...prev]);
      }
    } catch (error) {
      console.error('Error adding student:', error);
      console.error('Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        type: typeof error
      });
      
      // Set inline error message in the form
      const errorMessage = error instanceof Error ? error.message : 'Network error. Please check your connection and try again.';
      setAddStudentError(errorMessage);
      
      // Add error notification with more specific error message
      const errorNotification = {
        id: Date.now().toString(),
        title: 'Error Adding Student',
        message: errorMessage,
        date: new Date().toISOString(),
        read: false,
        type: 'error' as const
      };
      setNotifications(prev => [errorNotification, ...prev]);
    }
  };

  const handleBulkImport = async (studentsData: any[]) => {
    try {
      const response = await fetch('/api/teacher/students/bulk-import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ students: studentsData }),
      });

      if (response.ok) {
        const result = await response.json();
        setShowBulkImportForm(false);
        
        // Add success notification
        const successNotification = {
          id: Date.now().toString(),
          title: 'Bulk Import Completed',
          message: `${result.results.success.length} students imported successfully.`,
          date: new Date().toISOString(),
          read: false,
          type: 'success' as const
        };
        setNotifications(prev => [successNotification, ...prev]);
        
        // Reload students data
        loadDashboardData();
      } else {
        const error = await response.json();
        console.error('Error bulk importing students:', error);
        
        // Add error notification
        const errorNotification = {
          id: Date.now().toString(),
          title: 'Bulk Import Failed',
          message: error.error || 'Failed to import students. Please try again.',
          date: new Date().toISOString(),
          read: false,
          type: 'error' as const
        };
        setNotifications(prev => [errorNotification, ...prev]);
      }
    } catch (error) {
      console.error('Error bulk importing students:', error);
      
      // Add error notification
      const errorNotification = {
        id: Date.now().toString(),
        title: 'Bulk Import Failed',
        message: 'Network error. Please check your connection and try again.',
        date: new Date().toISOString(),
        read: false,
        type: 'error' as const
      };
      setNotifications(prev => [errorNotification, ...prev]);
    }
  };

  const handleCreateModule = async (moduleData: any) => {
    try {
      const response = await fetch('/api/teacher/modules', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(moduleData),
      });

      if (response.ok) {
        const result = await response.json();
        setModules(prev => [...prev, result.module]);
        setShowCreateModuleForm(false);
        
        // Add success notification
        const successNotification = {
          id: Date.now().toString(),
          title: 'Module Created Successfully',
          message: `${moduleData.title} has been created and is ready for assignment.`,
          date: new Date().toISOString(),
          read: false,
          type: 'success' as const
        };
        setNotifications(prev => [successNotification, ...prev]);
        
        // Refresh modules data
        loadDashboardData();
      } else {
        const error = await response.json();
        console.error('Error creating module:', error);
        
        // Add error notification
        const errorNotification = {
          id: Date.now().toString(),
          title: 'Error Creating Module',
          message: error.error || 'Failed to create module. Please try again.',
          date: new Date().toISOString(),
          read: false,
          type: 'error' as const
        };
        setNotifications(prev => [errorNotification, ...prev]);
      }
    } catch (error) {
      console.error('Error creating module:', error);
      
      // Add error notification
      const errorNotification = {
        id: Date.now().toString(),
        title: 'Error Creating Module',
        message: 'Network error. Please check your connection and try again.',
        date: new Date().toISOString(),
        read: false,
        type: 'error' as const
      };
      setNotifications(prev => [errorNotification, ...prev]);
    }
  };

  const handleCreateAssignment = async (assignmentData: any) => {
    try {
      console.log('Creating assignment with data:', assignmentData);
      const response = await fetch('/api/teacher/assignments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(assignmentData),
      });
      
      console.log('Assignment creation response status:', response.status);

      if (response.ok) {
        const result = await response.json();
        setAssignments(prev => [...prev, result.assignment]);
        setShowCreateAssignmentForm(false);
        
        // Add success notification
        const successNotification = {
          id: Date.now().toString(),
          title: 'Assignment Created Successfully',
          message: `${assignmentData.title} has been created and is ready for students.`,
          date: new Date().toISOString(),
          read: false,
          type: 'success' as const
        };
        setNotifications(prev => [successNotification, ...prev]);
        
        // Refresh assignments data
        loadDashboardData();
      } else {
        const error = await response.json();
        console.error('Error creating assignment:', error);
        
        // Add error notification
        const errorNotification = {
          id: Date.now().toString(),
          title: 'Error Creating Assignment',
          message: error.error || 'Failed to create assignment. Please try again.',
          date: new Date().toISOString(),
          read: false,
          type: 'error' as const
        };
        setNotifications(prev => [errorNotification, ...prev]);
      }
    } catch (error) {
      console.error('Error creating assignment:', error);
      
      // Add error notification
      const errorNotification = {
        id: Date.now().toString(),
        title: 'Error Creating Assignment',
        message: 'Network error. Please check your connection and try again.',
        date: new Date().toISOString(),
        read: false,
        type: 'error' as const
      };
      setNotifications(prev => [errorNotification, ...prev]);
    }
  };

  const handleViewStudent = (student: any) => {
    // Open learning paths modal for the selected student
    setSelectedStudentForLearningPaths(student);
    setShowLearningPathsModal(true);
  };

  const handleAssignToStudent = (student: any) => {
    // For now, just show a notification - in production, this would open assignment modal
    const notification = {
      id: Date.now().toString(),
      title: 'Assign to Student',
      message: `Assigning modules/assignments to ${student.fullName}`,
      date: new Date().toISOString(),
      read: false,
      type: 'info' as const
    };
    setNotifications(prev => [notification, ...prev]);
  };

  const handleRemoveStudent = async (studentId: string) => {
    if (confirm('Are you sure you want to remove this student?')) {
      try {
        const response = await fetch(`/api/teacher/students/${studentId}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          setStudents(prev => prev.filter(s => s.id !== studentId));
          
          const notification = {
            id: Date.now().toString(),
            title: 'Student Removed',
            message: 'Student has been removed from your class.',
            date: new Date().toISOString(),
            read: false,
            type: 'success' as const
          };
          setNotifications(prev => [notification, ...prev]);
          
          // Refresh dashboard data
          loadDashboardData();
        } else {
          const error = await response.json();
          const errorNotification = {
            id: Date.now().toString(),
            title: 'Error Removing Student',
            message: error.error || 'Failed to remove student. Please try again.',
            date: new Date().toISOString(),
            read: false,
            type: 'error' as const
          };
          setNotifications(prev => [errorNotification, ...prev]);
        }
      } catch (error) {
        console.error('Error removing student:', error);
        const errorNotification = {
          id: Date.now().toString(),
          title: 'Error Removing Student',
          message: 'Network error. Please check your connection and try again.',
          date: new Date().toISOString(),
          read: false,
          type: 'error' as const
        };
        setNotifications(prev => [errorNotification, ...prev]);
      }
    }
  };

  const handleExportCredentials = async () => {
    try {
      const response = await fetch('/api/teacher/students/export-credentials');
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `student_credentials_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        // Add success notification
        const newNotification = {
          id: Date.now().toString(),
          title: 'Credentials Exported',
          message: 'Student credentials have been exported to CSV file.',
          date: new Date().toISOString(),
          read: false,
          type: 'success' as const
        };
        setNotifications(prev => [newNotification, ...prev]);
      } else {
        throw new Error('Failed to export credentials');
      }
    } catch (error) {
      console.error('Error exporting credentials:', error);
      const errorNotification = {
        id: Date.now().toString(),
        title: 'Export Failed',
        message: 'Failed to export student credentials. Please try again.',
        date: new Date().toISOString(),
        read: false,
        type: 'error' as const
      };
      setNotifications(prev => [errorNotification, ...prev]);
    }
  };

  const handleViewAllCredentials = async () => {
    try {
      const response = await fetch('/api/teacher/students/credentials');
      
      if (response.ok) {
        const result = await response.json();
        setAllStudentCredentials(result.credentials);
        setNewStudentCredentials(null); // Clear single student credentials
        setShowCredentialsModal(true);
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `HTTP ${response.status}: Failed to fetch credentials`);
      }
    } catch (error) {
      console.error('Error fetching credentials:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch student credentials. Please try again.';
      const errorNotification = {
        id: Date.now().toString(),
        title: 'Error',
        message: errorMessage,
        date: new Date().toISOString(),
        read: false,
        type: 'error' as const
      };
      setNotifications(prev => [errorNotification, ...prev]);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      const newNotification = {
        id: Date.now().toString(),
        title: 'Copied',
        message: 'Text copied to clipboard',
        date: new Date().toISOString(),
        read: false,
        type: 'success' as const
      };
      setNotifications(prev => [newNotification, ...prev]);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  };

  const handleResetPassword = async (studentId: string) => {
    if (confirm('Are you sure you want to reset this student\'s password? They will need to use the new password to log in.')) {
      try {
        const response = await fetch('/api/teacher/students/reset-password', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ studentId }),
        });

        if (response.ok) {
          const result = await response.json();
          
          // Update the student credentials in the modal
          setAllStudentCredentials(prev => 
            prev.map(student => 
              student.id === studentId 
                ? { ...student, password: result.student.newPassword }
                : student
            )
          );

          // Update the main students list
          setStudents(prev => 
            prev.map(student => 
              student.id === studentId 
                ? { ...student, password: result.student.newPassword }
                : student
            )
          );

          const newNotification = {
            id: Date.now().toString(),
            title: 'Password Reset',
            message: `Password reset for ${result.student.fullName}. New password: ${result.student.newPassword}`,
            date: new Date().toISOString(),
            read: false,
            type: 'success' as const
          };
          setNotifications(prev => [newNotification, ...prev]);
        } else {
          const error = await response.json();
          const errorNotification = {
            id: Date.now().toString(),
            title: 'Reset Failed',
            message: error.error || 'Failed to reset password. Please try again.',
            date: new Date().toISOString(),
            read: false,
            type: 'error' as const
          };
          setNotifications(prev => [errorNotification, ...prev]);
        }
      } catch (error) {
        console.error('Error resetting password:', error);
        const errorNotification = {
          id: Date.now().toString(),
          title: 'Reset Failed',
          message: 'Network error. Please check your connection and try again.',
          date: new Date().toISOString(),
          read: false,
          type: 'error' as const
        };
        setNotifications(prev => [errorNotification, ...prev]);
      }
    }
  };

  const handleViewModule = (module: any) => {
    // For now, just show a notification - in production, this would open a detailed view
    const notification = {
      id: Date.now().toString(),
      title: 'Module Details',
      message: `Viewing details for ${module.title}`,
      date: new Date().toISOString(),
      read: false,
      type: 'info' as const
    };
    setNotifications(prev => [notification, ...prev]);
  };

  const handleAssignModule = (module: any) => {
    // For now, just show a notification - in production, this would open assignment modal
    const notification = {
      id: Date.now().toString(),
      title: 'Assign Module',
      message: `Assigning ${module.title} to students`,
      date: new Date().toISOString(),
      read: false,
      type: 'info' as const
    };
    setNotifications(prev => [notification, ...prev]);
  };

  const handleViewSubmissions = (assignment: any) => {
    const notification = {
      id: Date.now().toString(),
      title: 'View Submissions',
      message: `Viewing submissions for ${assignment.title}`,
      date: new Date().toISOString(),
      read: false,
      type: 'info' as const
    };
    setNotifications(prev => [notification, ...prev]);
  };

  const handleGradeAssignment = (assignment: any) => {
    const notification = {
      id: Date.now().toString(),
      title: 'Grade Assignment',
      message: `Grading ${assignment.title} submissions`,
      date: new Date().toISOString(),
      read: false,
      type: 'info' as const
    };
    setNotifications(prev => [notification, ...prev]);
  };

  const handleEditAssignment = (assignment: any) => {
    const notification = {
      id: Date.now().toString(),
      title: 'Edit Assignment',
      message: `Editing ${assignment.title}`,
      date: new Date().toISOString(),
      read: false,
      type: 'info' as const
    };
    setNotifications(prev => [notification, ...prev]);
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
    } catch (error) {
      console.error('Logout error:', error);
      // Still redirect to login even if logout API fails
      router.push('/login');
    }
  };

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

  if (isLoading) {
    return <ConsistentLoadingPage type="dashboard" title="Loading your teacher dashboard..." />;
  }

  if (!user) {
    return null;
  }

  return (
    <div 
      className="dashboard-container min-h-screen relative"
    >
      {/* Background Elements */}
      {/* Temporarily disabled for debugging */}
      {/* <VantaBackground>
        <ScrollProgress /> */}
      
      {/* Sidebar Component - Let it handle its own responsive behavior */}
      <Sidebar 
        activeTab={activeTab} 
        onTabChange={setActiveTab}
        isOpen={isSidebarOpen}
        onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
        navItems={navItems}
        role="teacher"
      />
      
      {/* Main Content Area */}
      <div className={`dashboard-main relative min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 transition-all duration-300 ${
        isMobile ? (isSidebarOpen ? 'ml-0' : 'ml-0') : 'ml-20'
      }`}>
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%239C92AC%22%20fill-opacity%3D%220.05%22%3E%3Ccircle%20cx%3D%2230%22%20cy%3D%2230%22%20r%3D%222%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-40 pointer-events-none"></div>
        
        {/* Enhanced Top Bar */}
        <div className={`flex items-center justify-between w-full px-4 sm:px-6 py-3 sm:py-4 bg-white/80 backdrop-blur-md border-b border-gray-200/50 relative shadow-sm transition-all duration-300 ${isNotificationOpen ? 'blur-sm pointer-events-none' : ''}`}>
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 via-transparent to-blue-500/5 pointer-events-none" />
          
          {/* Animated Border */}
          <motion.div
            className="absolute bottom-0 left-4 h-0.5 bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500"
            initial={{ width: 0 }}
            animate={{ width: "calc(100% - 2rem)" }}
            transition={{ duration: 2, ease: "easeOut" }}
          />
          {/* Enhanced Search Bar - Hidden on mobile, shown on tablet+ */}
          <div className="hidden sm:flex flex-1 items-center max-w-md">
            <motion.div 
              className="relative w-full"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
              transition={{ duration: 0.2 }}
            >
              {/* Animated Background Gradient */}
              <motion.div
                className="absolute inset-0 rounded-2xl bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 opacity-20 blur-xl"
                animate={{
                  opacity: [0.15, 0.25, 0.15],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />
              
              {/* Search Icon */}
              <div className="absolute left-4 top-1/2 -translate-y-1/2 z-10 pointer-events-none">
                <svg 
                  className="w-5 h-5 text-purple-600" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && searchQuery.trim()) {
                    console.log('Searching for:', searchQuery);
                  }
                }}
                placeholder="Search students, assignments..."
                className="relative w-full pl-11 pr-16 py-4 rounded-[135px] border-2 border-purple-200 bg-white/90 backdrop-blur-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-purple-500 focus:bg-white focus:ring-4 focus:ring-purple-200/50 transition-all duration-300 text-sm font-medium shadow-lg hover:shadow-xl hover:border-purple-300"
              />
              
              {/* Fun Decorative Elements */}
              <motion.div
                className="absolute right-4 top-1/2 transform -translate-y-1/2 flex items-center gap-1"
                initial={{ opacity: 0.5 }}
                whileHover={{ opacity: 1 }}
              >
                <span className="text-xs font-semibold text-purple-600 bg-purple-100 px-2 py-1 rounded-full">
                  Press Enter
                </span>
              </motion.div>
              
              {/* Animated Glow Effect */}
              <motion.div
                className="absolute inset-0 rounded-[135px] bg-gradient-to-r from-purple-400/30 via-pink-400/30 to-purple-400/30 opacity-0 pointer-events-none blur-md"
                animate={{
                  opacity: [0, 0.3, 0],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />
            </motion.div>
          </div>
          
          {/* Mobile: Logo and User Info */}
          <div className="flex sm:hidden items-center flex-1 justify-center ml-12">
            <span className="text-lg font-bold text-gray-800">Dashboard</span>
          </div>
          
          {/* User Actions */}
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Refresh Button */}
            <motion.button
              onClick={loadDashboardData}
              className="p-2 rounded-full bg-white border border-gray-200/50 hover:bg-gray-50 transition-all duration-200 shadow-sm"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              title="Refresh Data"
            >
              <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </motion.button>

            {/* Notification Center */}
            {teacherProfile && (
              <NotificationCenter
                userId={teacherProfile._id}
                userRole={teacherProfile.role || 'teacher'}
                className="relative"
              />
            )}
           
             {/* Enhanced User Profile Section */}
             <motion.div 
               className="bg-white/80 backdrop-blur-sm rounded-xl p-1.5 sm:p-3 shadow-lg border border-gray-200/50 flex items-center gap-1.5 sm:gap-3 group hover:shadow-xl transition-all duration-300"
               whileHover={{ scale: 1.02, y: -2 }}
               whileTap={{ scale: 0.98 }}
             >
               {/* Enhanced Notification Bell */}
               <div className="relative" ref={notificationRef}>
                 <motion.button 
                  onClick={handleNotificationClick}
                   className="relative text-gray-900 hover:text-purple-600 transition-colors p-1 sm:p-2 rounded-full hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50 touch-manipulation group"
                   whileHover={{ scale: 1.1, rotate: [0, -10, 10, 0] }}
                   whileTap={{ scale: 0.95 }}
                   transition={{ duration: 0.2 }}
                >
                  <svg className="w-5 h-5 sm:w-6 sm:h-6" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect width="30.24" height="30.24" transform="translate(0.899902 1.38086)" fill="#F5F5F5"/>
                    <path d="M16.0204 3.90039C13.6812 3.90039 11.4378 4.82964 9.7837 6.48371C8.12963 8.13778 7.20039 10.3812 7.20039 12.7204V17.1657C7.20057 17.3611 7.15527 17.554 7.06809 17.7289L4.90467 22.0545C4.79899 22.2658 4.74908 22.5006 4.7597 22.7367C4.77032 22.9727 4.8411 23.2021 4.96533 23.4031C5.08956 23.6041 5.2631 23.77 5.46948 23.885C5.67586 24.0001 5.90823 24.0604 6.14451 24.0604H25.8963C26.1325 24.0604 26.3649 24.0001 26.5713 23.885C26.7777 23.77 26.9512 23.6041 27.0754 23.4031C27.1997 23.2021 27.2705 22.9727 27.2811 22.7367C27.2917 22.5006 27.2418 22.2658 27.1361 22.0545L24.9739 17.7289C24.8863 17.5541 24.8406 17.3612 24.8404 17.1657V12.7204C24.8404 10.3812 23.9111 8.13778 22.2571 6.48371C20.603 4.82964 18.3596 3.90039 16.0204 3.90039ZM16.0204 27.8404C15.2384 27.8408 14.4755 27.5987 13.8368 27.1473C13.1982 26.696 12.7153 26.0577 12.4546 25.3204H19.5862C19.3255 26.0577 18.8426 26.696 18.2039 27.1473C17.5653 27.5987 16.8024 27.8408 16.0204 27.8404Z" fill="#A5A5A5"/>
                    <circle cx="23.58" cy="6.27336" r="5.78118" fill="#FDBB30"/>
                    <path d="M21.8094 7.82227V7.15526L23.579 5.42054C23.7482 5.24964 23.8893 5.09782 24.0021 4.96508C24.1149 4.83234 24.1995 4.70375 24.2559 4.57931C24.3124 4.45487 24.3406 4.32213 24.3406 4.1811C24.3406 4.02015 24.3041 3.88244 24.2311 3.76795C24.158 3.6518 24.0577 3.56221 23.9299 3.49916C23.8021 3.43611 23.657 3.40458 23.4944 3.40458C23.3268 3.40458 23.1799 3.43942 23.0538 3.50911C22.9277 3.57714 22.8298 3.6742 22.7601 3.80031C22.6921 3.92641 22.6581 4.07657 22.6581 4.25078H21.7795C21.7795 3.92724 21.8534 3.646 22.0011 3.40707C22.1487 3.16814 22.352 2.98314 22.6108 2.85206C22.8713 2.72098 23.17 2.65544 23.5068 2.65544C23.8486 2.65544 24.1489 2.71932 24.4078 2.84708C24.6666 2.97484 24.8674 3.14989 25.0101 3.37223C25.1544 3.59456 25.2266 3.84842 25.2266 4.13381C25.2266 4.32462 25.1901 4.51211 25.1171 4.69629C25.0441 4.88046 24.9155 5.08454 24.7313 5.30854C24.5488 5.53254 24.2924 5.80382 23.9623 6.12239L23.0837 7.01588V7.05073H25.3037V7.82227H21.8094Z" fill="white"/>
                  </svg>
                   {/* Enhanced Notification count */}
                  {unreadCount > 0 && (
                     <motion.span 
                       className="absolute -top-1 -right-1 w-3.5 h-3.5 sm:w-5 sm:h-5 bg-gradient-to-r from-orange-500 to-red-500 text-white text-[10px] sm:text-xs rounded-full flex items-center justify-center font-medium shadow-lg"
                       animate={{ 
                         scale: [1, 1.2, 1],
                         rotate: [0, 5, -5, 0]
                       }}
                       transition={{ 
                         duration: 2, 
                         repeat: Infinity, 
                         ease: "easeInOut" 
                       }}
                     >
                      {unreadCount > 9 ? '9+' : unreadCount}
                     </motion.span>
                   )}
                   
                   {/* Pulsing Ring Effect */}
                   {unreadCount > 0 && (
                     <motion.div
                       className="absolute inset-0 rounded-full border-2 border-orange-400/50"
                       animate={{
                         scale: [1, 1.3, 1],
                         opacity: [0.8, 0, 0.8],
                       }}
                       transition={{
                         duration: 2,
                         repeat: Infinity,
                         ease: "easeInOut",
                       }}
                     />
                   )}
                 </motion.button>
               </div>
               {/* Enhanced Circular Avatar */}
               <div 
                 className="relative w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center shadow-lg transition-all duration-300"
               >
                <Image src={userAvatar} alt="User Avatar" width={36} height={36} className="w-7 h-7 sm:w-9 sm:h-9 rounded-full object-cover" />
                 
                 {/* Online Status Indicator */}
                 <motion.div
                   className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 sm:w-3 sm:h-3 bg-green-500 rounded-full border-2 border-white"
                   animate={{ scale: [1, 1.2, 1] }}
                   transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                 />
               </div>
               
               {/* Enhanced User Info */}
              <div className="hidden sm:flex flex-col">
                 <motion.span 
                   className="font-bold text-gray-900 text-sm group-hover:text-purple-600 transition-colors duration-300"
                   whileHover={{ x: 2 }}
                 >
                  {user.name}
                 </motion.span>
                 <motion.span 
                   className="text-xs text-gray-600 group-hover:text-purple-500 transition-colors duration-300"
                   whileHover={{ x: 2 }}
                 >
                  Teacher
                 </motion.span>
              </div>
               
               {/* Hover Arrow */}
               <motion.div
                 className="hidden sm:block ml-auto opacity-0 group-hover:opacity-100 transition-opacity duration-300 cursor-pointer"
                 animate={{ x: [0, 3, 0] }}
                 transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                 onClick={() => setActiveTab('settings')}
               >
                 <svg className="w-4 h-4 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                 </svg>
               </motion.div>
             </motion.div>
          </div>
        </div>
                
        {/* Main Content with Responsive Layout */}
        <div className="dashboard-content">
          {/* Main Panel */}
          <main className="flex-1 overflow-y-auto">
            {/* Tab Content */}
            <div className="space-y-6">
              {activeTab === 'overview' && (
                <>
                  {/* Welcome Section */}
                  <div className="mb-6">
                    <div className="flex items-center justify-between">
                      {/* Left side: Avatar and welcome text */}
                      <div className="flex items-center gap-4">
                        <motion.div 
                          className="relative w-16 h-16 sm:w-20 sm:h-20"
                          whileHover={{ scale: 1.05, rotate: 5 }}
                          transition={{ duration: 0.2 }}
                        >
                          <div className="w-full h-full bg-gradient-to-br from-purple-600 to-pink-600 rounded-full flex items-center justify-center shadow-lg">
                            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                            </svg>
                          </div>
                          {/* Glow Effect */}
                          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-purple-500/30 to-pink-500/30 blur-lg pointer-events-none"></div>
                        </motion.div>
                        
                        <div>
                          <StaggeredText
                            text={`Welcome back, ${user.name}!`}
                            className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-1"
                            delay={0.1}
                          />
                      
                        </div>
                      </div>
                
                      {/* Right side: Stats cards */}
                      <div className="flex gap-4">
                        {/* Students Card */}
                        <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 shadow-sm border border-purple-200/50 min-w-[140px] min-h-[100px] flex flex-col justify-center">
                        <ScrollCounter
                          from={0}
                          to={teacherStats.totalStudents || 0}
                          duration={2}
                          className="text-3xl font-bold text-purple-600"
                        />
                          <div className="text-sm text-gray-900 font-medium">Total Students</div>
                        </div>
                        
                        {/* Active Students Card */}
                        <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-6 shadow-sm border border-blue-200/50 min-w-[140px] min-h-[100px] flex flex-col justify-center">
                        <ScrollCounter
                          from={0}
                          to={teacherStats.activeStudents || 0}
                          duration={2}
                          className="text-3xl font-bold text-blue-600"
                        />
                          <div className="text-sm text-gray-900 font-medium">Active Students</div>
                        </div>
                
                        {/* Average Progress Card */}
                        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 shadow-sm border border-green-200/50 min-w-[140px] min-h-[100px] flex flex-col justify-center">
                        <ScrollCounter
                          from={0}
                          to={teacherStats.averageProgress || 0}
                          duration={2}
                          className="text-3xl font-bold text-green-600"
                        />
                          <div className="text-sm text-gray-900 font-medium">Avg Progress</div>
                        </div>
                        
                        {/* Total XP Card */}
                        <div className="bg-gradient-to-br from-purple-50 to-violet-50 rounded-xl p-6 shadow-sm border border-purple-200/50 min-w-[140px] min-h-[100px] flex flex-col justify-center">
                        <ScrollCounter
                          from={0}
                          to={teacherStats.totalXpAcrossStudents || 0}
                          duration={2}
                          className="text-3xl font-bold text-purple-600"
                        />
                          <div className="text-sm text-gray-900 font-medium">Total XP</div>
                        </div>
                      </div>
                </div>
              </div>

                  {/* Dashboard Stats Grid */}
                  <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Quick Actions */}
                    <StaggerItem>
                      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200/50">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
                        <div className="space-y-3">
                          <button 
                            onClick={() => setShowAddStudentForm(true)}
                            className="w-full px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg text-sm font-medium shadow-lg"
                          >
                            Add New Student
                          </button>
                          <button 
                            onClick={() => setShowCreateAssignmentForm(true)}
                            className="w-full px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg text-sm font-medium shadow-lg"
                          >
                            Create Assignment
                          </button>
                          <button 
                            onClick={() => setActiveTab('analytics')}
                            className="w-full px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg text-sm font-medium shadow-lg"
                          >
                            View Reports
                          </button>
                        </div>
                      </div>
                    </StaggerItem>

                    {/* Class Overview */}
                    <StaggerItem>
                      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200/50">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Class Overview</h3>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Total Assignments</span>
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full font-medium">{teacherStats.totalAssignments || 0}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Average Score</span>
                            <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full font-medium">{teacherStats.averageScore || 0}%</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Active Modules</span>
                            <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full font-medium">{modules.length || 0}</span>
                          </div>
                        </div>
                      </div>
                    </StaggerItem>

                    {/* Recent Activity */}
                    <StaggerItem>
                      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200/50">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
                        <div className="space-y-3">
                          <div className="text-sm text-gray-600">
                            <div className="font-medium">New student joined</div>
                            <div className="text-xs text-gray-500">2 minutes ago</div>
                          </div>
                          <div className="text-sm text-gray-600">
                            <div className="font-medium">Assignment submitted</div>
                            <div className="text-xs text-gray-500">1 hour ago</div>
                          </div>
                          <div className="text-sm text-gray-600">
                            <div className="font-medium">Progress report generated</div>
                            <div className="text-xs text-gray-500">6 hours ago</div>
                          </div>
                        </div>
                      </div>
                    </StaggerItem>
                  </StaggerContainer>
                </>
          )}

          {activeTab === 'students' && (
            <div className="space-y-6">
                <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">My Students</h2>
                  <div className="flex space-x-3">
                    <button
                      type="button"
                      onClick={() => setShowAddStudentForm(true)}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      <span>Add Student</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowBulkImportForm(true)}
                      className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                      </svg>
                      <span>Bulk Import</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleViewAllCredentials}
                      className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center space-x-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                      </svg>
                      <span>View Credentials</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleExportCredentials}
                      className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors flex items-center space-x-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span>Export CSV</span>
                    </button>
                  </div>
                </div>

                {/* Students Table */}
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Class</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Progress</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">XP</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {students.map((student) => (
                        <tr key={student.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10">
                                <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold">
                                  {student.fullName.charAt(0)}
                                </div>
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">{student.fullName}</div>
                                <div className="text-sm text-gray-500">{student.email}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{student.classGrade}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                                <div 
                                  className="bg-blue-600 h-2 rounded-full" 
                                  style={{ width: `${(student.totalModulesCompleted / 10) * 100}%` }}
                                ></div>
                              </div>
                              <span className="text-sm text-gray-600">{student.totalModulesCompleted}/10</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{student.totalXpEarned}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              student.onboardingCompleted 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {student.onboardingCompleted ? 'Active' : 'Pending'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex space-x-2">
                              <button 
                                type="button"
                                onClick={() => handleViewStudent(student)}
                                className="text-blue-600 hover:text-blue-900 hover:underline"
                              >
                                View
                              </button>
                              <button 
                                type="button"
                                onClick={() => handleAssignToStudent(student)}
                                className="text-green-600 hover:text-green-900 hover:underline"
                              >
                                Assign
                              </button>
                              <button 
                                type="button"
                                onClick={() => handleRemoveStudent(student.id)}
                                className="text-red-600 hover:text-red-900 hover:underline"
                              >
                                Remove
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {students.length === 0 && (
                  <div className="text-center py-12">
                    <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                    </svg>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No students yet</h3>
                    <p className="text-gray-500 mb-4">Add your first student to get started</p>
                    <button
                      type="button"
                      onClick={() => setShowAddStudentForm(true)}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Add Student
                    </button>
                  </div>
                )}
                              </div>
                            </div>
              )}
              
              {activeTab === 'modules' && (
            <div className="space-y-6">
                <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">Learning Modules</h2>
                  <div className="flex space-x-3">
                    <button
                      type="button"
                      onClick={() => setShowCreateModuleForm(true)}
                      className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center space-x-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      <span>Create Module</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowAssignModuleForm(true)}
                      className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span>Assign Module</span>
                    </button>
                  </div>
                </div>

                {/* Module Filters */}
                <div className="mb-6 flex flex-wrap gap-4">
                  <select className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white text-gray-900" style={{ backgroundColor: 'white', color: '#111827' }}>
                    <option value="" style={{ backgroundColor: 'white', color: '#111827' }}>All Subjects</option>
                    <option value="mathematics" style={{ backgroundColor: 'white', color: '#111827' }}>Mathematics</option>
                    <option value="science" style={{ backgroundColor: 'white', color: '#111827' }}>Science</option>
                    <option value="english" style={{ backgroundColor: 'white', color: '#111827' }}>English</option>
                    <option value="history" style={{ backgroundColor: 'white', color: '#111827' }}>History</option>
                  </select>
                  <select className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white text-gray-900" style={{ backgroundColor: 'white', color: '#111827' }}>
                    <option value="" style={{ backgroundColor: 'white', color: '#111827' }}>All Grades</option>
                    <option value="Pre-K" style={{ backgroundColor: 'white', color: '#111827' }}>Pre-K</option>
                    <option value="Kindergarten" style={{ backgroundColor: 'white', color: '#111827' }}>Kindergarten</option>
                    <option value="1" style={{ backgroundColor: 'white', color: '#111827' }}>Grade 1</option>
                    <option value="2" style={{ backgroundColor: 'white', color: '#111827' }}>Grade 2</option>
                    <option value="3" style={{ backgroundColor: 'white', color: '#111827' }}>Grade 3</option>
                    <option value="4" style={{ backgroundColor: 'white', color: '#111827' }}>Grade 4</option>
                    <option value="5" style={{ backgroundColor: 'white', color: '#111827' }}>Grade 5</option>
                    <option value="6" style={{ backgroundColor: 'white', color: '#111827' }}>Grade 6</option>
                    <option value="7" style={{ backgroundColor: 'white', color: '#111827' }}>Grade 7</option>
                    <option value="8" style={{ backgroundColor: 'white', color: '#111827' }}>Grade 8</option>
                    <option value="9" style={{ backgroundColor: 'white', color: '#111827' }}>Grade 9</option>
                    <option value="10" style={{ backgroundColor: 'white', color: '#111827' }}>Grade 10</option>
                    <option value="11" style={{ backgroundColor: 'white', color: '#111827' }}>Grade 11</option>
                    <option value="12" style={{ backgroundColor: 'white', color: '#111827' }}>Grade 12</option>
                  </select>
                  <select className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white text-gray-900" style={{ backgroundColor: 'white', color: '#111827' }}>
                    <option value="" style={{ backgroundColor: 'white', color: '#111827' }}>All Difficulty</option>
                    <option value="beginner" style={{ backgroundColor: 'white', color: '#111827' }}>Beginner</option>
                    <option value="intermediate" style={{ backgroundColor: 'white', color: '#111827' }}>Intermediate</option>
                    <option value="advanced" style={{ backgroundColor: 'white', color: '#111827' }}>Advanced</option>
                  </select>
                </div>

                {/* Modules Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {modules.map((module) => (
                    <div key={module.id} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">{module.title}</h3>
                          <p className="text-sm text-gray-500">{module.subject} • {module.grade}</p>
                        </div>
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          module.difficulty === 'beginner' ? 'bg-green-100 text-green-800' :
                          module.difficulty === 'intermediate' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {module.difficulty}
                        </span>
                      </div>
                      
                      <div className="space-y-2 mb-4">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Duration:</span>
                          <span className="text-gray-900">{module.duration} min</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Points:</span>
                          <span className="text-gray-900">{module.points} XP</span>
                        </div>
                      </div>

                      <div className="flex space-x-2">
                        <button 
                          type="button"
                          onClick={() => handleViewModule(module)}
                          className="flex-1 bg-blue-600 text-white px-3 py-2 rounded-md text-sm hover:bg-blue-700 transition-colors"
                        >
                          View Details
                        </button>
                        <button 
                          type="button"
                          onClick={() => handleAssignModule(module)}
                          className="flex-1 bg-green-600 text-white px-3 py-2 rounded-md text-sm hover:bg-green-700 transition-colors"
                        >
                          Assign
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {modules.length === 0 && (
                  <div className="text-center py-12">
                    <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No modules available</h3>
                    <p className="text-gray-500 mb-4">Create your first learning module</p>
                    <button
                      type="button"
                      onClick={() => setShowCreateModuleForm(true)}
                      className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
                    >
                      Create Module
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'assignments' && (
            <div className="space-y-6">
                <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">Assignments</h2>
                  <div className="flex space-x-3">
                    <button
                      onClick={() => setShowCreateAssignmentForm(true)}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      <span>Create Assignment</span>
                    </button>
                    <button
                      onClick={() => setShowBulkAssignForm(true)}
                      className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                      </svg>
                      <span>Bulk Assign</span>
                    </button>
                  </div>
                </div>

                {/* Assignment Tabs */}
                <div className="mb-6">
                  <div className="border-b border-gray-200">
                    <nav className="-mb-px flex space-x-8">
                      <button className="border-b-2 border-blue-500 py-2 px-1 text-sm font-medium text-blue-600">
                        Active Assignments
                      </button>
                      <button className="border-b-2 border-transparent py-2 px-1 text-sm font-medium text-gray-500 hover:text-gray-700">
                        Completed
                      </button>
                      <button className="border-b-2 border-transparent py-2 px-1 text-sm font-medium text-gray-500 hover:text-gray-700">
                        Drafts
                      </button>
                    </nav>
                  </div>
                </div>

                {/* Assignments List */}
                <div className="space-y-4">
                  {assignments.map((assignment) => (
                    <div key={assignment.id} className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">{assignment.title}</h3>
                          <p className="text-sm text-gray-500">{assignment.subject} • {assignment.grade}</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                            assignment.status === 'active' ? 'bg-green-100 text-green-800' :
                            assignment.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {assignment.status}
                          </span>
                          <button className="text-gray-400 hover:text-gray-600">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                            </svg>
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-gray-900">{assignment.assignedTo}</div>
                          <div className="text-sm text-gray-500">Assigned</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-green-600">{assignment.submitted}</div>
                          <div className="text-sm text-gray-500">Submitted</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-blue-600">{assignment.assignedTo - assignment.submitted}</div>
                          <div className="text-sm text-gray-500">Pending</div>
                        </div>
                      </div>

                      <div className="flex justify-between items-center">
                        <div className="text-sm text-gray-500">
                          Due: {new Date(assignment.dueDate).toLocaleDateString()}
                        </div>
                        <div className="flex space-x-2">
                          <button 
                            onClick={() => handleViewSubmissions(assignment)}
                            className="text-blue-600 hover:text-blue-800 text-sm font-medium hover:underline"
                          >
                            View Submissions
                          </button>
                          <button 
                            onClick={() => handleGradeAssignment(assignment)}
                            className="text-green-600 hover:text-green-800 text-sm font-medium hover:underline"
                          >
                            Grade
                          </button>
                          <button 
                            onClick={() => handleEditAssignment(assignment)}
                            className="text-gray-600 hover:text-gray-800 text-sm font-medium hover:underline"
                          >
                            Edit
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {students.length === 0 && (
                  <div className="text-center py-12">
                    <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No assignments yet</h3>
                    <p className="text-gray-500 mb-4">Create your first assignment for your students</p>
                    <button
                      onClick={() => setShowCreateAssignmentForm(true)}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Create Assignment
                    </button>
                  </div>
                )}
                  </div>
            </div>
          )}

            {activeTab === 'tests' && (
              <div className="space-y-6">
                <TestManagement
                  onTestSelect={(testId) => {
                    // Could open a detail view or assignment modal
                  }}
                />
              </div>
            )}

            {activeTab === 'analytics' && (
            <div className="space-y-6">
              {/* Analytics Overview Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                        </svg>
                      </div>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-500">Total Students</p>
                      <p className="text-2xl font-semibold text-gray-900">{analytics?.overview?.totalStudents || teacherStats.totalStudents}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                        <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-500">Active Students</p>
                      <p className="text-2xl font-semibold text-gray-900">{analytics?.overview?.activeStudents || teacherStats.activeStudents}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                        <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
            </div>
            </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-500">Avg Progress</p>
                      <p className="text-2xl font-semibold text-gray-900">{analytics?.overview?.averageProgress || teacherStats.averageProgress}%</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                        <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-500">Assignments</p>
                      <p className="text-2xl font-semibold text-gray-900">{analytics?.overview?.totalModules || teacherStats.totalAssignments}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Charts Section */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Student Progress Chart */}
                <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Student Progress</h3>
                  <div className="h-64 flex items-center justify-center">
                    <div className="text-center">
                      <div className="space-y-2">
                        <div className="text-2xl font-bold text-blue-600">{analytics?.overview?.averageProgress || 0}%</div>
                        <div className="text-sm text-gray-500">Average Student Progress</div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full transition-all duration-1000" 
                            style={{ width: `${analytics?.overview?.averageProgress || 0}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Assignment Completion Chart */}
                <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Assignment Completion</h3>
                  <div className="h-64 flex items-center justify-center">
                    <div className="text-center">
                      <div className="space-y-4">
                        <div className="text-2xl font-bold text-green-600">{analytics?.overview?.averageScore || 0}%</div>
                        <div className="text-sm text-gray-500">Average Assignment Score</div>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div className="bg-green-50 p-3 rounded-lg">
                            <div className="font-semibold text-green-800">Completed</div>
                            <div className="text-green-600">{analytics?.overview?.totalStudents || 0}</div>
                          </div>
                          <div className="bg-blue-50 p-3 rounded-lg">
                            <div className="font-semibold text-blue-800">Total XP</div>
                            <div className="text-blue-600">{analytics?.overview?.totalXp || 0}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Top Performing Students */}
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Performing Students</h3>
                <div className="space-y-4">
                  {analytics?.topStudents?.slice(0, 5).map((student: any, index: number) => (
                    <div key={student.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold">
                            {student.name.charAt(0)}
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{student.name}</div>
                          <div className="text-sm text-gray-500">{student.classGrade}</div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <div className="text-sm font-medium text-gray-900">{student.xp} XP</div>
                          <div className="text-sm text-gray-500">{student.modulesCompleted} modules</div>
                        </div>
                        <div className="w-8 h-8 rounded-full bg-yellow-100 flex items-center justify-center">
                          <span className="text-sm font-semibold text-yellow-800">#{index + 1}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent Activity */}
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
                <div className="space-y-4">
                  {analytics?.recentActivity?.map((activity: any) => (
                    <div key={activity.id} className="flex items-center p-4 bg-gray-50 rounded-lg">
                      <div className="flex-shrink-0">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          activity.type === 'completion' ? 'bg-green-100' :
                          activity.type === 'submission' ? 'bg-blue-100' :
                          'bg-purple-100'
                        }`}>
                          <svg className={`w-4 h-4 ${
                            activity.type === 'completion' ? 'text-green-600' :
                            activity.type === 'submission' ? 'text-blue-600' :
                            'text-purple-600'
                          }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                      </div>
                      <div className="ml-4 flex-1">
                        <div className="text-sm font-medium text-gray-900">{activity.action}</div>
                        <div className="text-sm text-gray-500">{activity.student} • {activity.module}</div>
                      </div>
                      <div className="text-sm text-gray-500">{activity.time}</div>
                    </div>
                  ))}
                </div>
            </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="space-y-6">
              {!teacherProfile ? (
                <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                  <p className="text-gray-500">Loading profile data...</p>
                </div>
              ) : (
                <>
                  {/* Profile Settings */}
                  <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Profile Settings</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                        <input
                          type="text"
                          value={teacherProfile.name || ''}
                          onChange={(e) => setTeacherProfile(prev => prev ? ({ ...prev, name: e.target.value }) : null)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                        <input
                          type="email"
                          value={teacherProfile.email || ''}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                      readOnly
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Subject Specialization</label>
                    <input
                      type="text"
                      value={teacherProfile.profile?.subjectSpecialization || ''}
                      onChange={(e) => setTeacherProfile(prev => prev ? ({ 
                        ...prev, 
                        profile: { ...(prev.profile || {}), subjectSpecialization: e.target.value }
                      }) : null)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                      placeholder="Enter your subject specialization"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Experience (Years)</label>
                    <input
                      type="number"
                      value={teacherProfile.profile?.experienceYears || ''}
                      onChange={(e) => setTeacherProfile(prev => prev ? ({ 
                        ...prev, 
                        profile: { ...(prev.profile || {}), experienceYears: parseInt(e.target.value) || 0 }
                      }) : null)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                      placeholder="Enter years of experience"
                      min="0"
                    />
                  </div>
                </div>
                <div className="mt-6">
                  <button 
                    onClick={handleSaveProfile}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                  >
                    Save Profile
                  </button>
                </div>
              </div>

              {/* Notification Settings */}
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Notification Settings</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium text-gray-900">Email Notifications</div>
                      <div className="text-sm text-gray-500">Receive notifications via email</div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" defaultChecked />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium text-gray-900">Student Progress Updates</div>
                      <div className="text-sm text-gray-500">Get notified when students complete modules</div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" defaultChecked />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium text-gray-900">Assignment Submissions</div>
                      <div className="text-sm text-gray-500">Get notified when students submit assignments</div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" defaultChecked />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                </div>
              </div>

              {/* Class Settings */}
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Class Settings</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Default Grade Level</label>
                    <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900">
                      <option value="Pre-K">Pre-K</option>
                      <option value="Kindergarten">Kindergarten</option>
                      <option value="1">Grade 1</option>
                      <option value="2">Grade 2</option>
                      <option value="3">Grade 3</option>
                      <option value="4">Grade 4</option>
                      <option value="5">Grade 5</option>
                      <option value="6">Grade 6</option>
                      <option value="7">Grade 7</option>
                      <option value="8">Grade 8</option>
                      <option value="9">Grade 9</option>
                      <option value="10">Grade 10</option>
                      <option value="11">Grade 11</option>
                      <option value="12">Grade 12</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Default Subject</label>
                    <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900">
                      <option value="mathematics">Mathematics</option>
                      <option value="science">Science</option>
                      <option value="english">English</option>
                      <option value="history">History</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Privacy Settings */}
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Privacy Settings</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium text-gray-900">Profile Visibility</div>
                      <div className="text-sm text-gray-500">Allow other teachers to see your profile</div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium text-gray-900">Student Data Sharing</div>
                      <div className="text-sm text-gray-500">Share anonymous student progress with organization</div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" defaultChecked />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                </div>
              </div>

              {/* Account Actions */}
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Actions</h3>
                <div className="space-y-4">
                  <button className="w-full text-left px-4 py-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="text-sm font-medium text-gray-900">Change Password</div>
                    <div className="text-sm text-gray-500">Update your account password</div>
                  </button>
                  <button className="w-full text-left px-4 py-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="text-sm font-medium text-gray-900">Download Data</div>
                    <div className="text-sm text-gray-500">Export your account data</div>
                  </button>
                  <button className="w-full text-left px-4 py-3 border border-red-200 rounded-lg hover:bg-red-50 transition-colors text-red-600">
                    <div className="text-sm font-medium">Delete Account</div>
                    <div className="text-sm text-red-500">Permanently delete your account</div>
                  </button>
                </div>
              </div>
                </>
              )}
            </div>
          )}
            </div>
        </main>
        
        </div>
      </div>

      {/* Onboarding Modal */}
      <Dialog
        open={showOnboarding}
        onClose={() => {}}
        className="relative z-50"
      >
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="mx-auto max-w-md rounded-2xl bg-white p-6">
            <Dialog.Title className="text-lg font-semibold text-gray-900 mb-4">
              Complete Your Profile
            </Dialog.Title>
            
            <form onSubmit={handleProfileSave} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Subject Specialization
                </label>
                <select
                  value={subjectSpecialization}
                  onChange={(e) => setSubjectSpecialization(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white text-gray-900"
                  required
                >
                  <option value="">Select Subject</option>
                  <option value="Mathematics">Mathematics</option>
                  <option value="Science">Science</option>
                  <option value="English">English</option>
                  <option value="History">History</option>
                  <option value="Geography">Geography</option>
                  <option value="Computer Science">Computer Science</option>
                  <option value="Arts">Arts</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Years of Experience
                </label>
                <select
                  value={experienceYears}
                  onChange={(e) => setExperienceYears(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white text-gray-900"
                  required
                >
                  <option value="">Select Experience</option>
                  <option value="0-2">0-2 years</option>
                  <option value="3-5">3-5 years</option>
                  <option value="6-10">6-10 years</option>
                  <option value="10+">10+ years</option>
                </select>
      </div>

              <div className="flex gap-3 pt-4">
        <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? 'Saving...' : 'Save Profile'}
        </button>
              </div>
            </form>
          </Dialog.Panel>
        </div>
      </Dialog>

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
            className="fixed right-4 top-20 w-80 bg-white rounded-xl shadow-2xl border border-gray-200 z-[10001]"
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
            {/* User Profile Header */}
            <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between bg-white">
              <div className="flex items-center gap-3">
                {/* Purple Notification Bell */}
                <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center">
                  <svg width="20" height="20" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect width="30.24" height="30.24" transform="translate(0.899902 1.38086)" fill="#F5F5F5"/>
                    <path d="M16.0204 3.90039C13.6812 3.90039 11.4378 4.82964 9.7837 6.48371C8.12963 8.13778 7.20039 10.3812 7.20039 12.7204V17.1657C7.20057 17.3611 7.15527 17.554 7.06809 17.7289L4.90467 22.0545C4.79899 22.2658 4.74908 22.5006 4.7597 22.7367C4.77032 22.9727 4.8411 23.2021 4.96533 23.4031C5.08956 23.6041 5.2631 23.77 5.46948 23.885C5.67586 24.0001 5.90823 24.0604 6.14451 24.0604H25.8963C26.1325 24.0604 26.3649 24.0001 26.5713 23.885C26.7777 23.77 26.9512 23.6041 27.0754 23.4031C27.1997 23.2021 27.2705 22.9727 27.2811 22.7367C27.2917 22.5006 27.2418 22.2658 27.1361 22.0545L24.9739 17.7289C24.8863 17.5541 24.8406 17.3612 24.8404 17.1657V12.7204C24.8404 10.3812 23.9111 8.13778 22.2571 6.48371C20.603 4.82964 18.3596 3.90039 16.0204 3.90039ZM16.0204 27.8404C15.2384 27.8408 14.4755 27.5987 13.8368 27.1473C13.1982 26.696 12.7153 26.0577 12.4546 25.3204H19.5862C19.3255 26.0577 18.8426 26.696 18.2039 27.1473C17.5653 27.5987 16.8024 27.8408 16.0204 27.8404Z" fill="#A5A5A5"/>
                    <circle cx="23.58" cy="6.27336" r="5.78118" fill="#FDBB30"/>
                    <path d="M21.8094 7.82227V7.15526L23.579 5.42054C23.7482 5.24964 23.8893 5.09782 24.0021 4.96508C24.1149 4.83234 24.1995 4.70375 24.2559 4.57931C24.3124 4.45487 24.3406 4.32213 24.3406 4.1811C24.3406 4.02015 24.3041 3.88244 24.2311 3.76795C24.158 3.6518 24.0577 3.56221 23.9299 3.49916C23.8021 3.43611 23.657 3.40458 23.4944 3.40458C23.3268 3.40458 23.1799 3.43942 23.0538 3.50911C22.9277 3.57714 22.8298 3.6742 22.7601 3.80031C22.6921 3.92641 22.6581 4.07657 22.6581 4.25078H21.7795C21.7795 3.92724 21.8534 3.646 22.0011 3.40707C22.1487 3.16814 22.352 2.98314 22.6108 2.85206C22.8713 2.72098 23.17 2.65544 23.5068 2.65544C23.8486 2.65544 24.1489 2.71932 24.4078 2.84708C24.6666 2.97484 24.8674 3.14989 25.0101 3.37223C25.1544 3.59456 25.2266 3.84842 25.2266 4.13381C25.2266 4.32462 25.1901 4.51211 25.1171 4.69629C25.0441 4.88046 24.9155 5.08454 24.7313 5.30854C24.5488 5.53254 24.2924 5.80382 23.9623 6.12239L23.0837 7.01588V7.05073H25.3037V7.82227H21.8094Z" fill="white"/>
                  </svg>
                </div>
                
                {/* User Avatar and Info */}
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center">
                    <Image src={userAvatar} alt="User Avatar" width={36} height={36} className="w-9 h-9 rounded-full object-cover" />
                  </div>
                  <div className="flex flex-col">
                    <span className="font-bold text-gray-900 text-sm">
                      {user?.name || 'Teacher'}
                    </span>
                    <span className="text-xs text-gray-600">
                      Teacher
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Notifications List */}
            <div className="max-h-80 overflow-y-auto bg-gray-50">
              {notifications.length > 0 ? (
                notifications.map((notification, index) => (
                  <div
                    key={notification.id}
                    className="bg-white mx-3 my-2 rounded-lg shadow-sm border border-gray-100 p-3 cursor-pointer hover:shadow-md transition-all duration-200"
                    onClick={() => markNotificationAsRead(notification.id)}
                  >
                    <div className="flex items-start gap-3">
                      {/* Purple Circle Icon */}
                      <div className="w-3 h-3 bg-purple-600 rounded-full flex-shrink-0 mt-1"></div>
                      
                      <div className="flex-1 min-w-0">
                        {/* Notification Header */}
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-900">
                              {notification.title}
                            </span>
                            <span className="text-xs text-gray-500">
                              {formatNotificationTime(notification.date)}
                            </span>
                          </div>
                          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                          </svg>
                        </div>
                        
                        {/* Notification Content */}
                        <div className="text-sm text-gray-700">
                          <span className="font-medium">Hi {user?.name || 'Teacher'}!</span> {notification.message}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="px-4 py-8 text-center text-gray-500">
                  <svg className="w-12 h-12 mx-auto mb-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                  <p className="text-sm">No notifications yet</p>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            {notifications.length > 0 && (
              <div className="px-4 py-3 border-t border-gray-200 bg-white">
                <div className="flex items-center justify-between">
                  <button className="text-sm text-purple-600 hover:text-purple-700 font-medium">
                    Share
                  </button>
                  <div className="w-px h-4 bg-gray-300"></div>
                  <button className="text-sm text-red-600 hover:text-red-700 font-medium">
                    Delete
                  </button>
                </div>
              </div>
            )}
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

      {/* Add Student Modal */}
      <Dialog
        open={showAddStudentForm}
        onClose={() => {
          setShowAddStudentForm(false);
          setShowPassword(false);
          setAddStudentError(null);
        }}
        className="relative z-50"
      >
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="mx-auto max-w-md rounded-2xl bg-white p-6">
            <Dialog.Title className="text-lg font-semibold text-gray-900 mb-4">
              Add New Student
            </Dialog.Title>
            {addStudentError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-red-800">{addStudentError}</p>
                  </div>
                </div>
              </div>
            )}
            <form onSubmit={(e) => {
              e.preventDefault();
              setAddStudentError(null); // Clear previous errors
              const formData = new FormData(e.currentTarget);
              const studentData = {
                fullName: formData.get('fullName'),
                email: formData.get('email'),
                password: formData.get('password'),
                classGrade: formData.get('classGrade'),
                schoolName: formData.get('schoolName')
              };
              handleAddStudent(studentData);
            }} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name
                </label>
                <input
                  name="fullName"
                  type="text"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  name="email"
                  type="email"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <div className="relative">
                  <input
                    name="password"
                    type={showPassword ? "text" : "password"}
                    required
                    minLength={6}
                    className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                    placeholder="Set password for student"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-gray-700 focus:outline-none"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <svg
                        className="h-5 w-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                        />
                      </svg>
                    ) : (
                      <svg
                        className="h-5 w-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                        />
                      </svg>
                    )}
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">Minimum 6 characters</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Class Grade
                </label>
                <select
                  name="classGrade"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                >
                  <option value="">Select Grade</option>
                  <option value="Pre-K">Pre-K</option>
                  <option value="Kindergarten">Kindergarten</option>
                  <option value="Grade 1">Grade 1</option>
                  <option value="Grade 2">Grade 2</option>
                  <option value="Grade 3">Grade 3</option>
                  <option value="Grade 4">Grade 4</option>
                  <option value="Grade 5">Grade 5</option>
                  <option value="Grade 6">Grade 6</option>
                  <option value="Grade 7">Grade 7</option>
                  <option value="Grade 8">Grade 8</option>
                  <option value="Grade 9">Grade 9</option>
                  <option value="Grade 10">Grade 10</option>
                  <option value="Grade 11">Grade 11</option>
                  <option value="Grade 12">Grade 12</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  School Name
                </label>
                <input
                  name="schoolName"
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddStudentForm(false);
                    setShowPassword(false);
                    setAddStudentError(null);
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Add Student
                </button>
              </div>
            </form>
          </Dialog.Panel>
        </div>
      </Dialog>

      {/* Bulk Import Modal */}
      <Dialog
        open={showBulkImportForm}
        onClose={() => setShowBulkImportForm(false)}
        className="relative z-50"
      >
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="mx-auto max-w-md rounded-2xl bg-white p-6">
            <Dialog.Title className="text-lg font-semibold text-gray-900 mb-4">
              Bulk Import Students
            </Dialog.Title>
            <div className="space-y-4">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <svg className="w-12 h-12 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                </svg>
                <p className="text-sm text-gray-500 mb-2">Upload CSV or Excel file</p>
                <input
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  className="hidden"
                  id="bulk-import-file"
                />
                <label
                  htmlFor="bulk-import-file"
                  className="inline-block px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 cursor-pointer"
                >
                  Choose File
                </label>
              </div>
              <div className="text-sm text-gray-500">
                <p>File should contain columns: fullName, email, classGrade, schoolName</p>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowBulkImportForm(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    // Handle bulk import logic here
                    setShowBulkImportForm(false);
                  }}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                >
                  Import Students
                </button>
              </div>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>

      {/* Create Module Modal */}
      <Dialog
        open={showCreateModuleForm}
        onClose={() => setShowCreateModuleForm(false)}
        className="relative z-50"
      >
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="mx-auto max-w-md rounded-2xl bg-white p-6">
            <Dialog.Title className="text-lg font-semibold text-gray-900 mb-4">
              Create Learning Module
            </Dialog.Title>
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              const moduleData = {
                title: formData.get('title'),
                subject: formData.get('subject'),
                grade: formData.get('grade'),
                difficulty: formData.get('difficulty'),
                duration: parseInt(formData.get('duration') as string),
                points: parseInt(formData.get('points') as string),
                description: formData.get('description')
              };
              handleCreateModule(moduleData);
            }} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Module Title
                </label>
                <input
                  name="title"
                  type="text"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white text-gray-900"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Subject
                  </label>
                  <select
                    name="subject"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white text-gray-900"
                  >
                    <option value="">Select Subject</option>
                    <option value="Mathematics">Mathematics</option>
                    <option value="Science">Science</option>
                    <option value="English">English</option>
                    <option value="History">History</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Grade
                  </label>
                  <select
                    name="grade"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white text-gray-900"
                  >
                    <option value="">Select Grade</option>
                    <option value="Pre-K">Pre-K</option>
                    <option value="Kindergarten">Kindergarten</option>
                    <option value="Grade 1">Grade 1</option>
                    <option value="Grade 2">Grade 2</option>
                    <option value="Grade 3">Grade 3</option>
                    <option value="Grade 4">Grade 4</option>
                    <option value="Grade 5">Grade 5</option>
                    <option value="Grade 6">Grade 6</option>
                    <option value="Grade 7">Grade 7</option>
                    <option value="Grade 8">Grade 8</option>
                    <option value="Grade 9">Grade 9</option>
                    <option value="Grade 10">Grade 10</option>
                    <option value="Grade 11">Grade 11</option>
                    <option value="Grade 12">Grade 12</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Difficulty
                  </label>
                  <select
                    name="difficulty"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white text-gray-900"
                  >
                    <option value="">Select Difficulty</option>
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Duration (minutes)
                  </label>
                  <input
                    name="duration"
                    type="number"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white text-gray-900"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Points
                </label>
                <input
                  name="points"
                  type="number"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white text-gray-900"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  name="description"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white text-gray-900"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModuleForm(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
                >
                  Create Module
                </button>
              </div>
            </form>
          </Dialog.Panel>
        </div>
      </Dialog>

      {/* Create Assignment Modal */}
      <Dialog
        open={showCreateAssignmentForm}
        onClose={() => setShowCreateAssignmentForm(false)}
        className="relative z-50"
      >
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="mx-auto max-w-md rounded-2xl bg-white p-6">
            <Dialog.Title className="text-lg font-semibold text-gray-900 mb-4">
              Create Assignment
            </Dialog.Title>
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              const assignmentData = {
                title: formData.get('title'),
                subject: formData.get('subject'),
                grade: formData.get('grade'),
                dueDate: formData.get('dueDate'),
                description: formData.get('description'),
                instructions: formData.get('instructions'),
                points: parseInt(formData.get('points') as string)
              };
              handleCreateAssignment(assignmentData);
            }} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Assignment Title
                </label>
                <input
                  name="title"
                  type="text"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Subject
                  </label>
                  <select
                    name="subject"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                  >
                    <option value="">Select Subject</option>
                    <option value="Mathematics">Mathematics</option>
                    <option value="Science">Science</option>
                    <option value="English">English</option>
                    <option value="History">History</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Grade
                  </label>
                  <select
                    name="grade"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                  >
                    <option value="">Select Grade</option>
                    <option value="Pre-K">Pre-K</option>
                    <option value="Kindergarten">Kindergarten</option>
                    <option value="Grade 1">Grade 1</option>
                    <option value="Grade 2">Grade 2</option>
                    <option value="Grade 3">Grade 3</option>
                    <option value="Grade 4">Grade 4</option>
                    <option value="Grade 5">Grade 5</option>
                    <option value="Grade 6">Grade 6</option>
                    <option value="Grade 7">Grade 7</option>
                    <option value="Grade 8">Grade 8</option>
                    <option value="Grade 9">Grade 9</option>
                    <option value="Grade 10">Grade 10</option>
                    <option value="Grade 11">Grade 11</option>
                    <option value="Grade 12">Grade 12</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Due Date
                  </label>
                  <input
                    name="dueDate"
                    type="date"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Points
                  </label>
                  <input
                    name="points"
                    type="number"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  name="description"
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Instructions
                </label>
                <textarea
                  name="instructions"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateAssignmentForm(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Create Assignment
                </button>
              </div>
            </form>
          </Dialog.Panel>
        </div>
      </Dialog>

      {/* Student Credentials Modal */}
      <Dialog
        open={showCredentialsModal}
        onClose={() => {
          setShowCredentialsModal(false);
          setNewStudentCredentials(null);
          setAllStudentCredentials([]);
        }}
        className="relative z-50"
      >
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="mx-auto max-w-4xl w-full rounded-2xl bg-white p-6 max-h-[90vh] overflow-y-auto">
            <Dialog.Title className="text-lg font-semibold text-gray-900 mb-4">
              {newStudentCredentials ? 'New Student Credentials' : 'All Student Credentials'}
            </Dialog.Title>
            
            {newStudentCredentials ? (
              <div className="space-y-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h3 className="text-lg font-medium text-green-800 mb-3">Student Added Successfully!</h3>
                  <p className="text-green-700 mb-4">Please share these credentials with the student:</p>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between bg-white rounded-lg p-3 border">
                      <div>
                        <label className="text-sm font-medium text-gray-600">Name:</label>
                        <p className="text-gray-900">{newStudentCredentials.fullName}</p>
                      </div>
                      <button
                        onClick={() => copyToClipboard(newStudentCredentials.fullName)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        Copy
                      </button>
                    </div>
                    
                    <div className="flex items-center justify-between bg-white rounded-lg p-3 border">
                      <div>
                        <label className="text-sm font-medium text-gray-600">Email:</label>
                        <p className="text-gray-900">{newStudentCredentials.email}</p>
                      </div>
                      <button
                        onClick={() => copyToClipboard(newStudentCredentials.email)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        Copy
                      </button>
                    </div>
                    
                    <div className="flex items-center justify-between bg-white rounded-lg p-3 border">
                      <div>
                        <label className="text-sm font-medium text-gray-600">Password:</label>
                        <p className="text-gray-900 font-mono">{newStudentCredentials.password}</p>
                      </div>
                      <button
                        onClick={() => copyToClipboard(newStudentCredentials.password || '')}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        Copy
                      </button>
                    </div>
                    
                    <div className="flex items-center justify-between bg-white rounded-lg p-3 border">
                      <div>
                        <label className="text-sm font-medium text-gray-600">Student ID:</label>
                        <p className="text-gray-900">{newStudentCredentials.uniqueId}</p>
                      </div>
                      <button
                        onClick={() => copyToClipboard(newStudentCredentials.uniqueId)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        Copy
                      </button>
                    </div>
                  </div>
                  
                  <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-yellow-800 text-sm">
                      <strong>Important:</strong> The student should change their password on first login. 
                      They can access the platform at the login page using these credentials.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <p className="text-gray-600">All student login credentials for your class</p>
                  <button
                    onClick={handleExportCredentials}
                    className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors flex items-center space-x-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span>Export CSV</span>
                  </button>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Password</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Class</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {allStudentCredentials.map((student) => (
                        <tr key={student.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {student.fullName}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {student.email}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-mono">
                            {student.password}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {student.classGrade}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              student.onboardingCompleted 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {student.onboardingCompleted ? 'Active' : 'Pending'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex space-x-2">
                              <button
                                onClick={() => copyToClipboard(`${student.email}\n${student.password}`)}
                                className="text-blue-600 hover:text-blue-900 hover:underline"
                              >
                                Copy
                              </button>
                              <button
                                onClick={() => handleResetPassword(student.id)}
                                className="text-red-600 hover:text-red-900 hover:underline"
                              >
                                Reset Password
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            
            <div className="flex justify-end pt-4">
              <button
                onClick={() => {
                  setShowCredentialsModal(false);
                  setNewStudentCredentials(null);
                  setAllStudentCredentials([]);
                }}
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
              >
                Close
              </button>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>

      {/* Learning Paths Modal */}
      <Dialog open={showLearningPathsModal} onClose={() => setShowLearningPathsModal(false)} className="relative z-50">
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="mx-auto max-w-6xl w-full bg-white rounded-2xl shadow-xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <Dialog.Title className="text-2xl font-bold text-gray-900">
                Learning Paths - {selectedStudentForLearningPaths?.fullName}
              </Dialog.Title>
              <button
                onClick={() => setShowLearningPathsModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              {selectedStudentForLearningPaths?.uniqueId ? (
                <LearningPathTab 
                  user={{ 
                    uniqueId: selectedStudentForLearningPaths.uniqueId,
                    name: selectedStudentForLearningPaths.fullName
                  }} 
                  onTabChange={() => {}} 
                />
              ) : (
                <div className="text-center py-12">
                  <p className="text-gray-500">Student information not available</p>
                </div>
              )}
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>
      
      {/* </VantaBackground> */}
    </div>
  );
} 
