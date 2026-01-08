'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { motion } from 'framer-motion';

interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  role: string;
  uniqueId?: string;
  avatar?: string;
  age?: number;
  classGrade?: string;
}

interface Subject {
  id: string;
  name: string;
  icon: string;
  color: string;
  description: string;
}

const subjects: Subject[] = [
  {
    id: 'science',
    name: 'Science fun',
    icon: '🔬',
    color: 'bg-gray-100',
    description: 'Explore the wonders of science through experiments and discoveries'
  },
  {
    id: 'math',
    name: 'Magic Math',
    icon: '🧮',
    color: 'bg-red-100',
    description: 'Make math magical with fun games and interactive learning'
  },
  {
    id: 'art',
    name: 'Art & Craft',
    icon: '🎭',
    color: 'bg-blue-100',
    description: 'Express your creativity through art, crafts, and design'
  }
];

export default function SubjectSelection() {
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const router = useRouter();

  // Fetch user profile data
  const fetchUserProfile = async () => {
    try {
      const response = await fetch('/api/user/profile');
      const data = await response.json();

      if (response.ok) {
        setUserProfile(data.user);
      } else {
        console.error('Failed to fetch user profile:', data.error);
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };

  // Load user profile on component mount
  useEffect(() => {
    fetchUserProfile();
  }, []);

  const handleSubjectSelect = (subjectId: string) => {
    setSelectedSubject(subjectId);
  };

  const handlePrevious = () => {
    router.back();
  };

  const handleContinue = async () => {
    if (!selectedSubject) return;
    
    setIsLoading(true);
    
    try {
      const selectedSubjectData = subjects.find(s => s.id === selectedSubject);
      
      // Save subject preference
      const response = await fetch('/api/student/subject-preference', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subjectId: selectedSubject,
          subjectName: selectedSubjectData?.name || ''
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save subject preference');
      }
      
      // Redirect to dashboard
      router.push('/dashboard/student');
    } catch (error) {
      console.error('Error saving subject preference:', error);
      alert('Failed to save subject preference. Please try again.');
    } finally {
      setIsLoading(false);
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

  return (
    <motion.main 
      className="min-h-screen bg-gradient-to-br from-purple-50 to-purple-100 flex flex-col"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Header */}
      <header className="bg-white shadow-sm px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Image src="/icons/logo.svg" alt="Logo" width={40} height={40} className="rounded-full" />
          <span className="font-semibold text-gray-800">Taru Learning</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-gray-400">🔍</span>
            <input 
              type="text" 
              placeholder="Search" 
              className="border border-gray-200 rounded-lg px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-gray-400">🔔</span>
            <span className="text-gray-600">
              {userProfile ? userProfile.fullName : 'Loading...'}
            </span>
            <span className="text-gray-400">
              {userProfile && userProfile.uniqueId ? `#${userProfile.uniqueId}` : ''}
            </span>
            <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
              {userProfile ? userProfile.fullName.charAt(0).toUpperCase() : 'U'}
            </div>
          </div>
        </div>
      </header>

      {/* Sidebar */}
      <div className="flex flex-1">
        <aside className="w-64 bg-white shadow-sm p-6">
          <nav className="space-y-2">
            <div className="flex items-center gap-3 text-gray-600 p-2 rounded-lg">
              <span>📊</span>
              <span>Overview</span>
            </div>
            <div className="flex items-center gap-3 text-gray-600 p-2 rounded-lg">
              <span>📚</span>
              <span>My Learning Modules</span>
            </div>
            <div className="flex items-center gap-3 bg-purple-600 text-white p-2 rounded-lg">
              <span>📝</span>
              <span>Take Diagnostic Test</span>
            </div>
            <div className="flex items-center gap-3 text-gray-600 p-2 rounded-lg">
              <span>📈</span>
              <span>My Progress Report</span>
            </div>
            <div className="flex items-center gap-3 text-gray-600 p-2 rounded-lg">
              <span>🏆</span>
              <span>My Rewards & Badges</span>
            </div>
            <div className="flex items-center gap-3 text-gray-600 p-2 rounded-lg mt-8">
              <span>⚙️</span>
              <span>Profile & Settings</span>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 text-gray-600 p-2 rounded-lg hover:bg-gray-100 transition-colors w-full text-left"
            >
              <span>🚪</span>
              <span>Logout</span>
            </button>
          </nav>

          {/* AI Buddy */}
          <div className="mt-8">
            <div className="text-sm font-medium text-gray-800 mb-2">Ask AI Buddy</div>
            <div className="w-24 h-24 mx-auto">
              <Image 
                src="/landingPage.png" 
                alt="AI Buddy" 
                width={96} 
                height={96} 
                className="rounded-lg"
              />
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-8">
          {/* Progress Steps */}
          <div className="mb-8">
            <div className="flex justify-center items-center gap-4 max-w-6xl mx-auto">
              {Array.from({ length: 7 }, (_, i) => (
                <div key={i} className="flex items-center">
                  <div className="flex flex-col items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm ${
                      i < 6 ? 'bg-green-500' : 'bg-gray-300'
                    }`}>
                      {i < 6 ? '✓' : i + 1}
                    </div>
                    <div className={`text-xs mt-1 ${i < 6 ? 'text-green-600' : 'text-gray-500'}`}>
                      Step {i + 1} of 7
                    </div>
                    <div className={`text-xs ${i < 6 ? 'text-green-600' : 'text-gray-500'}`}>
                      {i < 6 ? 'Completed' : i === 6 ? 'Pending' : 'Pending'}
                    </div>
                  </div>
                  {i < 6 && (
                    <div className={`w-16 h-0.5 mx-2 ${i < 5 ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                  )}
                </div>
              ))}
              <div className="flex flex-col items-center ml-4">
                <div className="w-8 h-8 bg-gray-300 rounded-lg flex items-center justify-center">
                  <span className="text-xs">⋯</span>
                </div>
                <div className="text-xs text-gray-500 mt-1">Final Step</div>
              </div>
            </div>
          </div>

          {/* Robot Icon */}
          <motion.div 
            className="flex justify-center mb-8"
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.6 }}
          >
            <div className="w-24 h-24 bg-purple-600 rounded-2xl flex items-center justify-center text-4xl relative">
              🤖
              <div className="absolute -top-2 -right-2 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center text-lg">⭐</div>
            </div>
          </motion.div>

          {/* Title */}
          <motion.h1 
            className="text-4xl font-bold text-center text-gray-800 mb-12"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.6 }}
          >
            Choose your favorite subject!
          </motion.h1>

          {/* Subject Cards */}
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto mb-12"
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.6 }}
          >
            {subjects.map((subject, index) => (
              <motion.div
                key={subject.id}
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5 + index * 0.1, duration: 0.6 }}
                className={`${subject.color} rounded-2xl p-8 cursor-pointer transition-all duration-300 hover:scale-105 ${
                  selectedSubject === subject.id ? 'ring-4 ring-purple-500 ring-offset-2' : ''
                }`}
                onClick={() => handleSubjectSelect(subject.id)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="text-center">
                  <div className="text-6xl mb-4">{subject.icon}</div>
                  <h3 className="text-xl font-bold text-gray-800 mb-2">{subject.name}</h3>
                  <p className="text-sm text-gray-600">{subject.description}</p>
                </div>
                <div className="absolute top-4 left-4">
                  ⭐
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* Navigation Buttons */}
          <motion.div 
            className="flex justify-center gap-4"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.8, duration: 0.6 }}
          >
            <button
              onClick={handlePrevious}
              className="px-8 py-3 border-2 border-gray-300 text-gray-600 rounded-full font-semibold hover:bg-gray-50 transition-colors"
            >
              Previous
            </button>
            <button
              onClick={handleContinue}
              disabled={!selectedSubject || isLoading}
              className="px-8 py-3 bg-purple-600 text-white rounded-full font-semibold hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Processing...
                </>
              ) : (
                'Continue'
              )}
            </button>
          </motion.div>

          {/* Decorative Elements */}
          <div className="absolute top-20 right-20 text-2xl">⭐</div>
          <div className="absolute bottom-20 left-20 text-xl">☁️</div>
          <div className="absolute top-40 left-40 text-lg">✨</div>
        </main>
      </div>
    </motion.main>
  );
}