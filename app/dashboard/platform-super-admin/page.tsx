'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useWindowSize } from '@/lib/hooks/useWindowSize';
import Sidebar from '../student/components/Sidebar';
import Link from 'next/link';
import Image from 'next/image';
import { Dialog } from '@headlessui/react';
import { saveAs } from 'file-saver';
import { motion, AnimatePresence } from 'framer-motion';
import { TypewriterText, StaggeredText, GradientText, CharacterAnimation } from '../../components/TextAnimations';
import { TiltCard, MagneticButton } from '../../components/InteractiveElements';
import { StaggerContainer, StaggerItem } from '../../components/PageTransitions';
import { ScrollFade, ScrollCounter, ParallaxScroll, ScrollProgress } from '../../components/ScrollAnimations';
import VantaBackground from '../../components/VantaBackground';
import ConsistentLoadingPage from '../../components/ConsistentLoadingPage';

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  organizationId?: string;
  isIndependent?: boolean;
  createdAt: string;
  isActive?: boolean;
  studentProfile?: {
    fullName: string;
    classGrade: string;
    schoolName: string;
    uniqueId: string;
    onboardingCompleted: boolean;
  };
  parentProfile?: {
    fullName: string;
    linkedStudentId: string;
    onboardingCompleted: boolean;
  };
  progress?: {
    totalModulesCompleted: number;
    totalXpEarned: number;
    learningStreak: number;
    badgesEarned: number;
  };
}

interface Organization {
  _id: string;
  organizationName: string;
  organizationType: string;
  industry: string;
  city: string;
  state: string;
  approvalStatus: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  userId: {
    name: string;
    email: string;
    createdAt: string;
  };
}

interface AuditLog {
  _id: string;
  action: string;
  resource: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'success' | 'failure' | 'pending';
  createdAt: string;
  userId: {
    name: string;
    email: string;
    role: string;
  };
  details: {
    oldValues?: any;
    newValues?: any;
  };
}

interface DashboardStats {
  totalOrganizations: number;
  pendingApprovals: number;
  approvedOrganizations: number;
  rejectedOrganizations: number;
  totalAuditLogs: number;
  criticalAlerts: number;
  totalUsers: number;
  totalStudents: number;
  totalTeachers: number;
  totalParents: number;
  totalAdmins: number;
  recentActivity: number;
}

interface UserManagementState {
  users: User[];
  loading: boolean;
  error: string | null;
  selectedRole: string;
  searchTerm: string;
  currentPage: number;
  totalPages: number;
  totalUsers: number;
}

export default function PlatformSuperAdminDashboard() {
  const [user, setUser] = useState<any>(null);
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [userManagement, setUserManagement] = useState<UserManagementState>({
    users: [],
    loading: false,
    error: null,
    selectedRole: 'all',
    searchTerm: '',
    currentPage: 1,
    totalPages: 1,
    totalUsers: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [language, setLanguage] = useState('English (USA)');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isRightPanelHovered, setIsRightPanelHovered] = useState(false);
  const [isRightPanelOpen, setIsRightPanelOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [userAvatar, setUserAvatar] = useState<string>('/avatars/Group.svg');
  const [isAvatarSelectorOpen, setIsAvatarSelectorOpen] = useState(false);
  const [showUserForm, setShowUserForm] = useState(false);
  const [showOrgForm, setShowOrgForm] = useState(false);
  const [userFormData, setUserFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'student',
    organizationId: ''
  });
  const [orgFormData, setOrgFormData] = useState({
    organizationName: '',
    organizationType: 'school',
    industry: '',
    address: '',
    city: '',
    state: '',
    country: 'India',
    phoneNumber: '',
    website: '',
    description: '',
    employeeCount: '1-10'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const logoutTriggered = useRef(false);
  const { width: windowWidth } = useWindowSize();
  const isMobile = windowWidth < 1024;

  // Handle logout
  const handleLogout = () => {
    document.cookie = 'auth-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    router.push('/login');
  };

  // Super Admin navigation items
  const navItems = [
    { id: 'overview', label: 'Overview', icon: '/icons/overview.png' },
    { id: 'users', label: 'Manage Users', icon: '/icons/profile.png' },
    { id: 'organizations', label: 'Organizations', icon: '/icons/rewards.png' },
    { id: 'reports', label: 'Reports', icon: 'reports' },
    { id: 'audit-logs', label: 'Audit Logs', icon: '/icons/settings.png' },
    { id: 'system', label: 'System Settings', icon: '/icons/settings.png' },
  ];

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
    if (!userId) return AVAILABLE_AVATARS[0];
    
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      const char = userId.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    const randomIndex = Math.abs(hash) % AVAILABLE_AVATARS.length;
    return AVAILABLE_AVATARS[randomIndex];
  }

  useEffect(() => {
    const savedLang = localStorage.getItem('lang');
    if (savedLang) setLanguage(savedLang);
  }, []);

  const handleLanguageChange = (lang: string) => {
    setLanguage(lang);
    localStorage.setItem('lang', lang);
  };

  useEffect(() => {
    const fetchUserAndDashboard = async () => {
      try {
        const response = await fetch('/api/auth/me');
        if (response.ok) {
          const userData = await response.json();
          if (userData.user.role !== 'platform_super_admin') {
            router.push('/login');
            return;
          }
          setUser(userData.user);
          
          // Fetch dashboard statistics
          try {
            const statsResponse = await fetch('/api/platform-super-admin/dashboard-stats');
            if (statsResponse.ok) {
              const statsData = await statsResponse.json();
              setDashboardStats(statsData);
            }
          } catch (error) {
            console.error('Error fetching dashboard stats:', error);
          }

          // Fetch organizations
          try {
            const orgsResponse = await fetch('/api/platform-super-admin/organizations?limit=10');
            if (orgsResponse.ok) {
              const orgsData = await orgsResponse.json();
              setOrganizations(orgsData.organizations || []);
            }
          } catch (error) {
            console.error('Error fetching organizations:', error);
          }

          // Fetch recent audit logs
          try {
            const auditResponse = await fetch('/api/platform-super-admin/audit-logs?limit=10');
            if (auditResponse.ok) {
              const auditData = await auditResponse.json();
              setAuditLogs(auditData.auditLogs || []);
            }
          } catch (error) {
            console.error('Error fetching audit logs:', error);
          }

          // Fetch users for management
          try {
            const usersResponse = await fetch('/api/admin/users?limit=10');
            if (usersResponse.ok) {
              const usersData = await usersResponse.json();
              setUserManagement(prev => ({
                ...prev,
                users: usersData.users || [],
                totalUsers: usersData.totalUsers || 0,
                totalPages: usersData.totalPages || 1
              }));
            }
          } catch (error) {
            console.error('Error fetching users:', error);
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

  const handleApproveOrganization = async (organizationId: string) => {
    try {
      const response = await fetch(`/api/platform-super-admin/organizations/${organizationId}/approve`, {
        method: 'POST',
        credentials: 'include'
      });

      if (response.ok) {
        // Refresh organizations list
        const orgsResponse = await fetch('/api/platform-super-admin/organizations?limit=10');
        if (orgsResponse.ok) {
          const orgsData = await orgsResponse.json();
          setOrganizations(orgsData.organizations || []);
        }
        alert('Organization approved successfully');
      } else {
        const errorData = await response.json();
        alert(`Error: ${errorData.error}`);
      }
    } catch (error) {
      console.error('Error approving organization:', error);
      alert('Error approving organization');
    }
  };

  const handleRejectOrganization = async (organizationId: string) => {
    const reason = prompt('Please provide a reason for rejection:');
    if (!reason) return;

    try {
      const response = await fetch(`/api/platform-super-admin/organizations/${organizationId}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ rejectionReason: reason }),
        credentials: 'include'
      });

      if (response.ok) {
        // Refresh organizations list
        const orgsResponse = await fetch('/api/platform-super-admin/organizations?limit=10');
        if (orgsResponse.ok) {
          const orgsData = await orgsResponse.json();
          setOrganizations(orgsData.organizations || []);
        }
        alert('Organization rejected successfully');
      } else {
        const errorData = await response.json();
        alert(`Error: ${errorData.error}`);
      }
    } catch (error) {
      console.error('Error rejecting organization:', error);
      alert('Error rejecting organization');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'text-green-600 bg-green-100';
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      case 'rejected': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-600 bg-red-100';
      case 'high': return 'text-orange-600 bg-orange-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const handleUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(userFormData),
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setUserManagement(prev => ({
          ...prev,
          users: [data.user, ...prev.users]
        }));
        setShowUserForm(false);
        setUserFormData({
          name: '',
          email: '',
          password: '',
          role: 'student',
          organizationId: ''
        });
        alert('User created successfully!');
      } else {
        const errorData = await response.json();
        alert(`Error: ${errorData.error}`);
      }
    } catch (error) {
      console.error('Error creating user:', error);
      alert('Error creating user');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOrgSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/admin/organizations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(orgFormData),
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setOrganizations(prev => [data.organization, ...prev]);
        setShowOrgForm(false);
        setOrgFormData({
          organizationName: '',
          organizationType: 'school',
          industry: '',
          address: '',
          city: '',
          state: '',
          country: 'India',
          phoneNumber: '',
          website: '',
          description: '',
          employeeCount: '1-10'
        });
        alert('Organization created successfully!');
      } else {
        const errorData = await response.json();
        alert(`Error: ${errorData.error}`);
      }
    } catch (error) {
      console.error('Error creating organization:', error);
      alert('Error creating organization');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUserAction = async (userId: string, action: string) => {
    try {
      const response = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ userId, action }),
        credentials: 'include'
      });

      if (response.ok) {
        // Refresh users list
        const usersResponse = await fetch('/api/admin/users?limit=10');
        if (usersResponse.ok) {
          const usersData = await usersResponse.json();
          setUserManagement(prev => ({
            ...prev,
            users: usersData.users || []
          }));
        }
        alert(`User ${action} successfully!`);
      } else {
        const errorData = await response.json();
        alert(`Error: ${errorData.error}`);
      }
    } catch (error) {
      console.error(`Error ${action} user:`, error);
      alert(`Error ${action} user`);
    }
  };

  if (isLoading) {
    return (
      <ConsistentLoadingPage
        type="dashboard"
        title="Loading Super Admin Dashboard"
        subtitle="Setting up your administrative interface..."
        tips={[
          'Loading user management tools',
          'Preparing organization controls',
          'Setting up system analytics'
        ]}
      />
    );
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
        role="admin"
      />
      
      {/* Main Content Area */}
      <div className={`dashboard-main relative min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 transition-all duration-300 ${
        isMobile ? (isSidebarOpen ? 'ml-0' : 'ml-0') : 'ml-20'
      }`}>
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%239C92AC%22%20fill-opacity%3D%220.05%22%3E%3Ccircle%20cx%3D%2230%22%20cy%3D%2230%22%20r%3D%222%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-40 pointer-events-none"></div>
        
        {/* Top Bar */}
        <div className="relative z-10 flex items-center justify-between w-full px-4 sm:px-6 py-3 sm:py-4 bg-white border-b border-gray-200/50 shadow-sm">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                Platform Super Admin
              </h1>
              <p className="text-sm text-gray-600 hidden sm:block">
                Manage platform-wide operations and organizations
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            {/* Notifications */}
            <div className="relative">
              <button
                onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors relative"
              >
                <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM4.5 19.5L9 15l4.5 4.5" />
                </svg>
                {notifications.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {notifications.length}
                  </span>
                )}
              </button>
              
              {/* Notification Dropdown */}
              <AnimatePresence>
                {isNotificationOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50"
                    ref={notificationRef}
                  >
                    <div className="p-4 border-b border-gray-200">
                      <h3 className="font-semibold text-gray-900">Notifications</h3>
                    </div>
                    <div className="max-h-64 overflow-y-auto">
                      {notifications.length > 0 ? (
                        notifications.map((notification, index) => (
                          <div key={index} className="p-3 border-b border-gray-100 hover:bg-gray-50">
                            <p className="text-sm text-gray-900">{notification.message}</p>
                            <p className="text-xs text-gray-500 mt-1">{notification.timestamp}</p>
                          </div>
                        ))
                      ) : (
                        <div className="p-4 text-center text-gray-500">
                          <p className="text-sm">No notifications</p>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* User Profile */}
            <div className="relative">
              <button
                onClick={() => setIsAvatarSelectorOpen(!isAvatarSelectorOpen)}
                className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <Image
                  src={userAvatar}
                  alt="User Avatar"
                  width={32}
                  height={32}
                  className="rounded-full"
                />
                <span className="hidden sm:block text-sm font-medium text-gray-700">
                  {user?.name || 'Super Admin'}
                </span>
                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              {/* Avatar Selector Dropdown */}
              <AnimatePresence>
                {isAvatarSelectorOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50"
                  >
                    <div className="p-2">
                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md transition-colors"
                      >
                        Logout
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="relative z-10 p-4 sm:p-6">
          {activeTab === 'overview' && (
            <StaggerContainer className="space-y-6">
              <StaggerItem>
                <div className="flex items-center justify-between">
                  <h2 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                    Platform Overview
                  </h2>
                  <div className="text-sm text-gray-500">
                    Last updated: {new Date().toLocaleString()}
                  </div>
                </div>
              </StaggerItem>
              
              {/* Enhanced Stats Cards */}
              {dashboardStats && (
                <StaggerItem>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <TiltCard className="bg-white/80 backdrop-blur-sm p-6 rounded-xl shadow-lg border border-white/20">
                    <div className="flex items-center">
                        <div className="p-3 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl">
                        <Image src="/icons/rewards.png" width={24} height={24} alt="Organizations" className="w-6 h-6" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">Total Organizations</p>
                        <p className="text-2xl font-bold text-gray-900">{dashboardStats.totalOrganizations}</p>
                      </div>
                    </div>
                    </TiltCard>

                    <TiltCard className="bg-white/80 backdrop-blur-sm p-6 rounded-xl shadow-lg border border-white/20">
                    <div className="flex items-center">
                        <div className="p-3 bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-xl">
                        <Image src="/icons/report.png" width={24} height={24} alt="Pending" className="w-6 h-6" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">Pending Approvals</p>
                        <p className="text-2xl font-bold text-gray-900">{dashboardStats.pendingApprovals}</p>
                      </div>
                    </div>
                    </TiltCard>

                    <TiltCard className="bg-white/80 backdrop-blur-sm p-6 rounded-xl shadow-lg border border-white/20">
                    <div className="flex items-center">
                        <div className="p-3 bg-gradient-to-r from-green-500 to-green-600 rounded-xl">
                        <Image src="/icons/overview.png" width={24} height={24} alt="Approved" className="w-6 h-6" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">Approved</p>
                        <p className="text-2xl font-bold text-gray-900">{dashboardStats.approvedOrganizations}</p>
                      </div>
                    </div>
                    </TiltCard>

                    <TiltCard className="bg-white/80 backdrop-blur-sm p-6 rounded-xl shadow-lg border border-white/20">
                    <div className="flex items-center">
                        <div className="p-3 bg-gradient-to-r from-red-500 to-red-600 rounded-xl">
                        <Image src="/icons/settings.png" width={24} height={24} alt="Critical" className="w-6 h-6" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">Critical Alerts</p>
                        <p className="text-2xl font-bold text-gray-900">{dashboardStats.criticalAlerts}</p>
                      </div>
                    </div>
                    </TiltCard>
                  </div>
                </StaggerItem>
              )}

              {/* Recent Organizations */}
              <StaggerItem>
                <TiltCard className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-white/20">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900">Recent Organizations</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Organization</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {organizations.map((org) => (
                        <tr key={org._id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">{org.organizationName}</div>
                              <div className="text-sm text-gray-500">{org.userId.email}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{org.organizationType}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(org.approvalStatus)}`}>
                              {org.approvalStatus}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(org.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            {org.approvalStatus === 'pending' && (
                              <div className="flex space-x-2">
                                <button
                                  onClick={() => handleApproveOrganization(org._id)}
                                  className="text-green-600 hover:text-green-900"
                                >
                                  Approve
                                </button>
                                <button
                                  onClick={() => handleRejectOrganization(org._id)}
                                  className="text-red-600 hover:text-red-900"
                                >
                                  Reject
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                </TiltCard>
              </StaggerItem>
            </StaggerContainer>
          )}

          {activeTab === 'users' && (
            <StaggerContainer className="space-y-6">
              <StaggerItem>
                <div className="flex justify-between items-center">
                  <h2 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                    User Management
                  </h2>
                  <MagneticButton
                    onClick={() => setShowUserForm(true)}
                    className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-300"
                  >
                    + Add User
                  </MagneticButton>
              </div>
              </StaggerItem>

              {/* User Form Modal */}
              {showUserForm && (
                <Dialog open={showUserForm} onClose={() => setShowUserForm(false)} className="relative z-50">
                  <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
                  <div className="fixed inset-0 flex items-center justify-center p-4">
                    <Dialog.Panel className="mx-auto max-w-md rounded-xl bg-white p-6 shadow-2xl">
                      <Dialog.Title className="text-lg font-semibold text-gray-900 mb-4">Add New User</Dialog.Title>
                      <form onSubmit={handleUserSubmit} className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                          <input
                            type="text"
                            required
                            value={userFormData.name}
                            onChange={(e) => setUserFormData(prev => ({ ...prev, name: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
            </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                          <input
                            type="email"
                            required
                            value={userFormData.email}
                            onChange={(e) => setUserFormData(prev => ({ ...prev, email: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                          <input
                            type="password"
                            required
                            value={userFormData.password}
                            onChange={(e) => setUserFormData(prev => ({ ...prev, password: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                          <select
                            value={userFormData.role}
                            onChange={(e) => setUserFormData(prev => ({ ...prev, role: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          >
                            <option value="student">Student</option>
                            <option value="teacher">Teacher</option>
                            <option value="parent">Parent</option>
                            <option value="organization">Organization</option>
                            <option value="admin">Admin</option>
                          </select>
                        </div>
                        <div className="flex justify-end space-x-3 pt-4">
                          <button
                            type="button"
                            onClick={() => setShowUserForm(false)}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            disabled={isSubmitting}
                            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                          >
                            {isSubmitting ? 'Creating...' : 'Create User'}
                          </button>
                        </div>
                      </form>
                    </Dialog.Panel>
                  </div>
                </Dialog>
              )}

              {/* Users List */}
              <StaggerItem>
                <TiltCard className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-white/20">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-medium text-gray-900">All Users</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {userManagement.users.map((user) => (
                          <tr key={user._id}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <Image
                                  src={getRandomAvatar(user._id)}
                                  alt={user.name}
                                  width={32}
                                  height={32}
                                  className="w-8 h-8 rounded-full mr-3"
                                />
                                <div>
                                  <div className="text-sm font-medium text-gray-900">{user.name}</div>
                                  <div className="text-sm text-gray-500">{user.email}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                                {user.role}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                user.isActive ? 'text-green-600 bg-green-100' : 'text-red-600 bg-red-100'
                              }`}>
                                {user.isActive ? 'Active' : 'Inactive'}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {new Date(user.createdAt).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <div className="flex space-x-2">
                                <button
                                  onClick={() => handleUserAction(user._id, 'activate')}
                                  className="text-green-600 hover:text-green-900"
                                >
                                  Activate
                                </button>
                                <button
                                  onClick={() => handleUserAction(user._id, 'deactivate')}
                                  className="text-red-600 hover:text-red-900"
                                >
                                  Deactivate
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </TiltCard>
              </StaggerItem>
            </StaggerContainer>
          )}

          {activeTab === 'organizations' && (
            <StaggerContainer className="space-y-6">
              <StaggerItem>
                <div className="flex justify-between items-center">
                  <h2 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                    Organizations
                  </h2>
                  <MagneticButton
                    onClick={() => setShowOrgForm(true)}
                    className="px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-300"
                  >
                    + Add Organization
                  </MagneticButton>
                </div>
              </StaggerItem>

              {/* Organization Form Modal */}
              {showOrgForm && (
                <Dialog open={showOrgForm} onClose={() => setShowOrgForm(false)} className="relative z-50">
                  <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
                  <div className="fixed inset-0 flex items-center justify-center p-4">
                    <Dialog.Panel className="mx-auto max-w-2xl rounded-xl bg-white p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
                      <Dialog.Title className="text-lg font-semibold text-gray-900 mb-4">Add New Organization</Dialog.Title>
                      <form onSubmit={handleOrgSubmit} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Organization Name</label>
                            <input
                              type="text"
                              required
                              value={orgFormData.organizationName}
                              onChange={(e) => setOrgFormData(prev => ({ ...prev, organizationName: e.target.value }))}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                            <select
                              value={orgFormData.organizationType}
                              onChange={(e) => setOrgFormData(prev => ({ ...prev, organizationType: e.target.value }))}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                            >
                              <option value="school">School</option>
                              <option value="college">College</option>
                              <option value="university">University</option>
                              <option value="training_center">Training Center</option>
                              <option value="edtech_company">EdTech Company</option>
                              <option value="ngo">NGO</option>
                              <option value="government">Government</option>
                              <option value="corporate">Corporate</option>
                              <option value="other">Other</option>
                            </select>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Industry</label>
                            <input
                              type="text"
                              required
                              value={orgFormData.industry}
                              onChange={(e) => setOrgFormData(prev => ({ ...prev, industry: e.target.value }))}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Employee Count</label>
                            <select
                              value={orgFormData.employeeCount}
                              onChange={(e) => setOrgFormData(prev => ({ ...prev, employeeCount: e.target.value }))}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                            >
                              <option value="1-10">1-10</option>
                              <option value="11-50">11-50</option>
                              <option value="51-200">51-200</option>
                              <option value="201-500">201-500</option>
                              <option value="501-1000">501-1000</option>
                              <option value="1000+">1000+</option>
                            </select>
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                          <input
                            type="text"
                            required
                            value={orgFormData.address}
                            onChange={(e) => setOrgFormData(prev => ({ ...prev, address: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                          />
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                            <input
                              type="text"
                              required
                              value={orgFormData.city}
                              onChange={(e) => setOrgFormData(prev => ({ ...prev, city: e.target.value }))}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                            <input
                              type="text"
                              required
                              value={orgFormData.state}
                              onChange={(e) => setOrgFormData(prev => ({ ...prev, state: e.target.value }))}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                            <input
                              type="text"
                              required
                              value={orgFormData.country}
                              onChange={(e) => setOrgFormData(prev => ({ ...prev, country: e.target.value }))}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                            <input
                              type="tel"
                              required
                              value={orgFormData.phoneNumber}
                              onChange={(e) => setOrgFormData(prev => ({ ...prev, phoneNumber: e.target.value }))}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
                            <input
                              type="url"
                              value={orgFormData.website}
                              onChange={(e) => setOrgFormData(prev => ({ ...prev, website: e.target.value }))}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                          <textarea
                            value={orgFormData.description}
                            onChange={(e) => setOrgFormData(prev => ({ ...prev, description: e.target.value }))}
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                          />
                        </div>
                        <div className="flex justify-end space-x-3 pt-4">
                          <button
                            type="button"
                            onClick={() => setShowOrgForm(false)}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            disabled={isSubmitting}
                            className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50"
                          >
                            {isSubmitting ? 'Creating...' : 'Create Organization'}
                          </button>
                        </div>
                      </form>
                    </Dialog.Panel>
                  </div>
                </Dialog>
              )}

              {/* Organizations List */}
              <StaggerItem>
                <TiltCard className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-white/20">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900">All Organizations</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Organization</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {organizations.map((org) => (
                        <tr key={org._id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">{org.organizationName}</div>
                              <div className="text-sm text-gray-500">{org.userId.email}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{org.organizationType}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(org.approvalStatus)}`}>
                              {org.approvalStatus}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(org.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            {org.approvalStatus === 'pending' && (
                              <div className="flex space-x-2">
                                <button
                                  onClick={() => handleApproveOrganization(org._id)}
                                  className="text-green-600 hover:text-green-900"
                                >
                                  Approve
                                </button>
                                <button
                                  onClick={() => handleRejectOrganization(org._id)}
                                  className="text-red-600 hover:text-red-900"
                                >
                                  Reject
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                </TiltCard>
              </StaggerItem>
            </StaggerContainer>
          )}

          {activeTab === 'reports' && (
            <StaggerContainer className="space-y-6">
              <StaggerItem>
                <h2 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                  System Reports
                </h2>
              </StaggerItem>
              <StaggerItem>
                <TiltCard className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-white/20 p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Analytics & Reports</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <h4 className="font-medium text-blue-900 mb-2">User Analytics</h4>
                      <p className="text-sm text-blue-700">View detailed user engagement metrics, login patterns, and activity reports.</p>
              </div>
                    <div className="p-4 bg-green-50 rounded-lg">
                      <h4 className="font-medium text-green-900 mb-2">Organization Reports</h4>
                      <p className="text-sm text-green-700">Track organization growth, approval rates, and performance metrics.</p>
            </div>
                    <div className="p-4 bg-purple-50 rounded-lg">
                      <h4 className="font-medium text-purple-900 mb-2">System Performance</h4>
                      <p className="text-sm text-purple-700">Monitor system health, response times, and resource utilization.</p>
                    </div>
                    <div className="p-4 bg-orange-50 rounded-lg">
                      <h4 className="font-medium text-orange-900 mb-2">Security Reports</h4>
                      <p className="text-sm text-orange-700">Review security events, failed login attempts, and access patterns.</p>
                    </div>
                  </div>
                </TiltCard>
              </StaggerItem>
            </StaggerContainer>
          )}

          {activeTab === 'audit-logs' && (
            <StaggerContainer className="space-y-6">
              <StaggerItem>
                <h2 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                  Audit Logs
                </h2>
              </StaggerItem>
              <StaggerItem>
                <TiltCard className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-white/20">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900">Recent Activity</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Resource</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Severity</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {auditLogs.map((log) => (
                        <tr key={log._id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <Image
                                  src={getRandomAvatar(log.userId.email)}
                                  alt={log.userId.name}
                                  width={32}
                                  height={32}
                                  className="w-8 h-8 rounded-full mr-3"
                                />
                            <div>
                              <div className="text-sm font-medium text-gray-900">{log.userId.name}</div>
                              <div className="text-sm text-gray-500">{log.userId.email}</div>
                                </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{log.action}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{log.resource}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getSeverityColor(log.severity)}`}>
                              {log.severity}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(log.createdAt).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                </TiltCard>
              </StaggerItem>
            </StaggerContainer>
          )}

          {activeTab === 'system' && (
            <StaggerContainer className="space-y-6">
              <StaggerItem>
                <h2 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                  System Settings
                </h2>
              </StaggerItem>
              <StaggerItem>
                <TiltCard className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-white/20 p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Platform Configuration</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <h4 className="font-medium text-gray-900 mb-2">Security Settings</h4>
                      <p className="text-sm text-gray-600">Configure authentication, password policies, and access controls.</p>
              </div>
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <h4 className="font-medium text-gray-900 mb-2">Email Configuration</h4>
                      <p className="text-sm text-gray-600">Set up email templates, SMTP settings, and notification preferences.</p>
            </div>
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <h4 className="font-medium text-gray-900 mb-2">Backup & Recovery</h4>
                      <p className="text-sm text-gray-600">Manage data backups, recovery procedures, and system maintenance.</p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <h4 className="font-medium text-gray-900 mb-2">API Management</h4>
                      <p className="text-sm text-gray-600">Configure API endpoints, rate limiting, and third-party integrations.</p>
                    </div>
                  </div>
                </TiltCard>
              </StaggerItem>
            </StaggerContainer>
          )}
        </div>
      </div>
    </div>
  );
}
