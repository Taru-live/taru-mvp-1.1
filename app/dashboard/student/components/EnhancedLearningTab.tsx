'use client';

import React, { useState } from 'react';
import { Brain, BookOpen, Video, Mic, Sparkles, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import AIBuddyTab from './AIBuddyTab';

interface LearningApp {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  gradient: string;
  component?: React.ReactNode;
}

const learningApps: LearningApp[] = [
  {
    id: 'ai-buddy',
    name: 'AI Buddy',
    description: 'AI-powered reading assistant with PDF support, explanations, and text-to-speech',
    icon: <Brain className="w-8 h-8" />,
    color: 'from-purple-500 to-pink-500',
    gradient: 'bg-gradient-to-br from-purple-500 to-pink-500',
  },
  {
    id: 'coming-soon-1',
    name: 'Video Tutor',
    description: 'Interactive video learning with AI explanations and quizzes',
    icon: <Video className="w-8 h-8" />,
    color: 'from-blue-500 to-cyan-500',
    gradient: 'bg-gradient-to-br from-blue-500 to-cyan-500',
  },
  {
    id: 'coming-soon-2',
    name: 'Voice Practice',
    description: 'Practice pronunciation and speaking with AI feedback',
    icon: <Mic className="w-8 h-8" />,
    color: 'from-green-500 to-emerald-500',
    gradient: 'bg-gradient-to-br from-green-500 to-emerald-500',
  },
  {
    id: 'coming-soon-3',
    name: 'Flashcards',
    description: 'AI-generated flashcards for efficient memorization',
    icon: <Sparkles className="w-8 h-8" />,
    color: 'from-orange-500 to-red-500',
    gradient: 'bg-gradient-to-br from-orange-500 to-red-500',
  },
];

export default function EnhancedLearningTab() {
  const [selectedApp, setSelectedApp] = useState<string | null>(null);

  const handleAppSelect = (appId: string) => {
    if (appId.startsWith('coming-soon')) {
      return; // Don't navigate to coming soon apps
    }
    setSelectedApp(appId);
  };

  const handleBack = () => {
    setSelectedApp(null);
  };

  // If an app is selected, show that app
  if (selectedApp === 'ai-buddy') {
    return (
      <div className="h-full flex flex-col">
        <div className="flex-shrink-0 bg-white border-b px-6 py-4">
          <button
            onClick={handleBack}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Enhanced Learning
          </button>
        </div>
        <div className="flex-1 min-h-0">
          <AIBuddyTab />
        </div>
      </div>
    );
  }

  // Show app selection grid
  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-gray-50 via-purple-50/30 to-blue-50/30">
      {/* Header */}
      <div className="flex-shrink-0 bg-white/80 backdrop-blur-md border-b px-6 py-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl flex items-center justify-center">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Enhanced Learning</h1>
              <p className="text-sm text-gray-600">Access powerful AI-powered learning tools</p>
            </div>
          </div>
        </div>
      </div>

      {/* Apps Grid */}
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {learningApps.map((app, index) => {
              const isComingSoon = app.id.startsWith('coming-soon');
              
              return (
                <motion.div
                  key={app.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  onClick={() => !isComingSoon && handleAppSelect(app.id)}
                  className={`
                    relative group cursor-pointer
                    ${isComingSoon ? 'cursor-not-allowed opacity-60' : 'cursor-pointer hover:scale-105'}
                    transition-all duration-300
                  `}
                >
                  <div className="h-full bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-xl transition-shadow duration-300 overflow-hidden">
                    {/* Icon Header */}
                    <div className={`${app.gradient} p-6 flex items-center justify-center`}>
                      <div className="text-white">
                        {app.icon}
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-6">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-xl font-semibold text-gray-900">{app.name}</h3>
                        {isComingSoon && (
                          <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-600 rounded-full">
                            Coming Soon
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mb-4">{app.description}</p>
                      
                      {!isComingSoon && (
                        <div className="flex items-center text-sm font-medium text-purple-600 group-hover:text-purple-700">
                          Open App
                          <svg className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      )}
                    </div>

                    {/* Hover Effect */}
                    {!isComingSoon && (
                      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/0 to-pink-500/0 group-hover:from-purple-500/5 group-hover:to-pink-500/5 transition-all duration-300 rounded-2xl pointer-events-none" />
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Info Section */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-12 bg-white rounded-2xl border border-gray-200 p-6 shadow-sm"
          >
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center shrink-0">
                <BookOpen className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">About Enhanced Learning</h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Enhanced Learning provides access to cutting-edge AI-powered educational tools designed to make your learning journey more effective and engaging. 
                  Each app is carefully crafted to help you understand concepts better, practice skills, and achieve your learning goals.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
