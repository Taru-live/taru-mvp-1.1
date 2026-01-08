'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Dialog } from '@headlessui/react';
import { motion } from 'framer-motion';

interface ParentOrgProfile {
  name: string;
  email: string;
  role: string;
  profile: {
    organizationType?: string;
    industry?: string;
  };
}

export default function ParentOrgDashboard() {
  const [user, setUser] = useState<ParentOrgProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [organizationType, setOrganizationType] = useState('');
  const [industry, setIndustry] = useState('');
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetch('/api/auth/me');
        if (response.ok) {
          const userData = await response.json();
          if (userData.user.role !== 'organization') {
            router.push('/login');
            return;
          }
          setUser(userData.user);
          // Show onboarding if profile is incomplete
          if (!userData.user.profile?.organizationType || !userData.user.profile?.industry) {
            setShowOnboarding(true);
            setOrganizationType(userData.user.profile?.organizationType || '');
            setIndustry(userData.user.profile?.industry || '');
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
    fetchUser();
  }, [router]);

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const response = await fetch('/api/user/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationType,
          industry
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

  if (isLoading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-[#6D18CE]">
        <motion.div
          className="flex flex-col items-center justify-center text-white"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <motion.div
            className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin"
            style={{ borderTopColor: '#FFFFFF' }}
          />
          <p className="mt-4 text-lg font-semibold">Loading your organization dashboard...</p>
        </motion.div>
      </main>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Bar */}
      <div className="bg-white border-b border-gray-200">
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4">
          {/* Logo and Title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <h1 className="text-xl font-bold text-gray-900">Organization Dashboard</h1>
          </div>
          
          {/* User Actions */}
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Language Selector */}
            <div className="hidden sm:block">
            </div>
            
            {/* User Profile Section */}
            <div className="bg-white rounded-xl p-3 shadow-sm border border-gray-200 flex items-center gap-3">
              {/* Circular Avatar */}
              <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              
              {/* User Info */}
              <div className="flex flex-col">
                <span className="font-bold text-gray-900 text-sm">
                  {user.name}
                </span>
                <span className="text-xs text-gray-600">
                  Organization
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {/* Left side: Avatar and welcome text */}
            <div className="flex items-center gap-4">
              <div className="relative w-16 h-16 sm:w-20 sm:h-20">
                <div className="w-full h-full bg-purple-600 rounded-full flex items-center justify-center">
                  <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
              </div>
              <div>
                <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-1">
                  Welcome back, {user.name}!
                </h2>
                <p className="text-gray-600 text-lg sm:text-xl font-medium">
                  Organization management dashboard
                </p>
              </div>
            </div>
            
            {/* Right side: Stats cards */}
            <div className="flex gap-4">
              {/* Organizations Card */}
              <div className="bg-gray-100 rounded-xl p-6 shadow-sm border border-gray-100 min-w-[140px] min-h-[100px] hover:bg-purple-50 transition-colors flex flex-col justify-center">
                <div className="text-3xl font-bold text-purple-600">
                  0
                </div>
                <div className="text-sm text-gray-900">Organizations</div>
              </div>
              
              {/* Users Card */}
              <div className="bg-gray-100 rounded-xl p-6 shadow-sm border border-gray-100 min-w-[140px] min-h-[100px] hover:bg-purple-50 transition-colors flex flex-col justify-center">
                <div className="text-3xl font-bold text-purple-600">
                  0
                </div>
                <div className="text-sm text-gray-900">Total Users</div>
              </div>
              
              {/* Modules Card */}
              <div className="bg-gray-100 rounded-xl p-6 shadow-sm border border-gray-100 min-w-[140px] min-h-[100px] hover:bg-purple-50 transition-colors flex flex-col justify-center">
                <div className="text-3xl font-bold text-gray-900">
                  0
                </div>
                <div className="text-sm text-gray-900">Modules</div>
              </div>
            </div>
          </div>
        </div>

        {/* Dashboard Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Quick Actions */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <button className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium">
                Add Organization
              </button>
              <button className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium">
                Manage Users
              </button>
              <button className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium">
                View Reports
              </button>
            </div>
          </div>

          {/* Organization Status */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Organization Status</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Active Organizations</span>
                <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">0</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Pending Approvals</span>
                <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">0</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Total Revenue</span>
                <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">$0</span>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
            <div className="space-y-3">
              <div className="text-sm text-gray-600">
                <div className="font-medium">No recent activity</div>
                <div className="text-xs text-gray-500">Get started by adding organizations</div>
              </div>
            </div>
          </div>
        </div>

        {/* Organization Management Section */}
        <div className="mt-8">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Organization Management</h3>
            <div className="text-center text-gray-500 py-8">
              <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              <p>Organization management interface coming soon...</p>
            </div>
          </div>
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
                  Organization Type
                </label>
                <select
                  value={organizationType}
                  onChange={(e) => setOrganizationType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  required
                >
                  <option value="">Select Organization Type</option>
                  <option value="school">School</option>
                  <option value="college">College</option>
                  <option value="university">University</option>
                  <option value="training">Training Institute</option>
                  <option value="corporate">Corporate</option>
                  <option value="other">Other</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Industry
                </label>
                <select
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  required
                >
                  <option value="">Select Industry</option>
                  <option value="education">Education</option>
                  <option value="technology">Technology</option>
                  <option value="healthcare">Healthcare</option>
                  <option value="finance">Finance</option>
                  <option value="manufacturing">Manufacturing</option>
                  <option value="retail">Retail</option>
                  <option value="other">Other</option>
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
    </div>
  );
} 