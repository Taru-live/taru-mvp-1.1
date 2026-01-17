'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  TrendingUp, 
  Clock, 
  Target, 
  Award, 
  Download, 
  BarChart3, 
  PieChart, 
  Activity,
  Calendar,
  Star,
  Zap,
  Trophy,
  CheckCircle,
  ArrowUp,
  ArrowDown,
  Sparkles
} from 'lucide-react';

interface Progress {
  completedModules: number;
  totalModules: number;
  progressHistory: number[];
  recentScores: number[];
  totalTimeSpent: number;
  totalXp: number;
  badgesEarned?: Array<{
    name: string;
    description: string;
    earnedAt: string;
  }>;
}

interface ProgressTabProps {
  progress: Progress;
  onTabChange?: (tab: string) => void;
  onRefresh?: () => void;
}

export default function ProgressTab({ progress, onTabChange, onRefresh }: ProgressTabProps) {
  const [animatedPercent, setAnimatedPercent] = useState(0);
  const [animatedWeeklyProgress, setAnimatedWeeklyProgress] = useState(0);
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  
  
  const percent = progress.totalModules > 0 
    ? Math.round((progress.completedModules / progress.totalModules) * 100) 
    : 0;

  // Real data from progress - use actual XP from dashboard data
  const weeklyGoal = 1000; // Weekly XP goal
  const weeklyXP = progress.totalXp || 0; // Use real XP from dashboard
  const weeklyProgress = Math.round((weeklyXP / weeklyGoal) * 100);

  // Animate progress bars on mount
  useEffect(() => {
    const timer1 = setTimeout(() => setAnimatedPercent(percent), 500);
    const timer2 = setTimeout(() => setAnimatedWeeklyProgress(weeklyProgress), 800);
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [percent, weeklyProgress]);

  const handleDownloadCSV = () => {
    const csvContent = [
      ['Metric', 'Value'],
      ['Modules Completed', progress.completedModules],
      ['Total Modules', progress.totalModules],
      ['Completion Percentage', `${percent}%`],
      ['Total XP Earned', progress.totalXp],
      ['Average Recent Score', progress.recentScores.length > 0 ? Math.round(progress.recentScores.reduce((a, b) => a + b, 0) / progress.recentScores.length) : 0]
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `learning_progress_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const hasData = progress.completedModules > 0 || progress.totalXp > 0 || progress.recentScores.length > 0;

  return (
    <motion.div 
      className="space-y-4 sm:space-y-6 md:space-y-8"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      {/* Header */}
      <motion.div 
        className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-0"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.6 }}
      >
        <div className="flex items-center gap-2 sm:gap-4">
          <motion.div
            className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-purple-100 to-purple-200 rounded-xl flex items-center justify-center flex-shrink-0"
          >
            <Trophy className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" />
          </motion.div>
          <div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
              <span className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 text-yellow-500" />
                My Magical Progress!
              </span>
            </h2>
            <p className="text-gray-600 text-sm sm:text-base md:text-lg">Track your learning journey and achievements</p>
          </div>
        </div>
      </motion.div>

      {/* Weekly Goal & XP Progress */}
      <motion.div 
        className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 md:p-8 border border-gray-200"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1, duration: 0.6 }}
        whileHover={{ scale: 1.02 }}
      >
        <div className="text-center mb-6 sm:mb-8">
          <motion.h3 
            className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 sm:mb-4 flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-3"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <span className="flex items-center gap-2">
              <Target className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 text-purple-600" />
              Weekly Goal: {weeklyGoal.toLocaleString()} XP
            </span>
          </motion.h3>
          <motion.p 
            className="text-base sm:text-lg text-gray-600 mb-4 sm:mb-6"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            You've earned <span className="font-bold text-green-600">{weeklyXP.toLocaleString()}</span> XP this week!
          </motion.p>
          
          {/* Animated Progress Bar */}
          <div className="relative w-full max-w-2xl mx-auto">
            <div className="w-full bg-gray-200 rounded-full h-4 mb-4">
              <motion.div
                className="bg-gradient-to-r from-green-500 to-blue-500 h-4 rounded-full relative overflow-hidden"
                initial={{ width: 0 }}
                animate={{ width: `${animatedWeeklyProgress}%` }}
                transition={{ duration: 1.5, ease: "easeOut" }}
              >
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                  animate={{ x: ['-100%', '100%'] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                />
              </motion.div>
            </div>
            <motion.div 
              className="text-center text-sm text-gray-600"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.5 }}
            >
              {animatedWeeklyProgress}% Complete
            </motion.div>
          </div>
        </div>
        
        {/* Progress Train */}
        <motion.div 
          className="flex justify-center items-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <div className="w-full max-w-4xl">
            <img 
              src="/studentDashboard/train.png" 
              alt="Progress Train" 
              className="w-full h-auto"
            />
          </div>
        </motion.div>
      </motion.div>

      {/* Progress Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
        {/* Time Spent Card */}
        <motion.div 
          className="group bg-white rounded-2xl shadow-lg p-4 sm:p-6 md:p-8 border border-gray-200 hover:shadow-xl transition-all duration-300"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          whileHover={{ scale: 1.05, y: -5 }}
          onHoverStart={() => setHoveredCard('time')}
          onHoverEnd={() => setHoveredCard(null)}
        >
          <div className="text-center">
            <motion.div
              className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 bg-gradient-to-br from-purple-100 to-purple-200 rounded-xl flex items-center justify-center mx-auto mb-4 sm:mb-6"
              whileHover={{ rotate: 10, scale: 1.1 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <Clock className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-purple-600" />
            </motion.div>
            
            <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-4 sm:mb-6">Time Spent</h3>
            
            <div className="relative w-32 h-32 sm:w-36 sm:h-36 md:w-40 md:h-40 mx-auto mb-4 sm:mb-6">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="#E5E7EB"
                  strokeWidth="3"
                />
                <motion.path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="#8B5CF6"
                  strokeWidth="3"
                  strokeLinecap="round"
                  initial={{ strokeDasharray: "0, 100" }}
                  animate={{ strokeDasharray: `${Math.min((progress.totalTimeSpent / 60) / 6 * 100, 100)}, 100` }}
                  transition={{ duration: 2, ease: "easeOut" }}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <motion.div 
                  className="text-center"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 1, type: "spring", stiffness: 200 }}
                >
                  <div className="text-2xl sm:text-3xl font-bold text-gray-900">
                    {Math.floor(progress.totalTimeSpent / 60)}h
                  </div>
                  <div className="text-xs sm:text-sm text-gray-500">
                    {Math.max(6, Math.floor(progress.totalTimeSpent / 60) + 2)}h goal
                  </div>
                </motion.div>
              </div>
            </div>
            
            <motion.p 
              className="text-base sm:text-lg text-gray-600 font-medium"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.5 }}
            >
              {Math.floor(progress.totalTimeSpent / 60)} hours of learning
            </motion.p>
          </div>
        </motion.div>

        {/* Modules Completed Card */}
        <motion.div 
          className="group bg-white rounded-2xl shadow-lg p-4 sm:p-6 md:p-8 border border-gray-200 hover:shadow-xl transition-all duration-300"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          whileHover={{ scale: 1.05, y: -5 }}
          onHoverStart={() => setHoveredCard('modules')}
          onHoverEnd={() => setHoveredCard(null)}
        >
          <div className="text-center">
            <motion.div
              className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 bg-gradient-to-br from-green-100 to-green-200 rounded-xl flex items-center justify-center mx-auto mb-4 sm:mb-6"
              whileHover={{ rotate: 10, scale: 1.1 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <CheckCircle className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-green-600" />
            </motion.div>
            
            <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-4 sm:mb-6">Modules Completed</h3>
            
            <div className="relative w-32 h-32 sm:w-36 sm:h-36 md:w-40 md:h-40 mx-auto mb-4 sm:mb-6">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="#E5E7EB"
                  strokeWidth="3"
                />
                <motion.path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="#10B981"
                  strokeWidth="3"
                  strokeLinecap="round"
                  initial={{ strokeDasharray: "0, 100" }}
                  animate={{ strokeDasharray: `${Math.min(percent, 100)} 100` }}
                  transition={{ duration: 2, ease: "easeOut" }}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <motion.div 
                  className="text-center"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 1, type: "spring", stiffness: 200 }}
                >
                  <div className="text-3xl sm:text-4xl font-bold text-gray-900">
                    {progress.completedModules}
                  </div>
                  <div className="text-xs sm:text-sm text-gray-500">
                    of {progress.totalModules}
                  </div>
                </motion.div>
              </div>
            </div>
            
            <motion.div 
              className="space-y-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.5 }}
            >
              <div className="text-xl sm:text-2xl font-bold text-green-600">
                {percent}% Complete
              </div>
              <div className="text-xs sm:text-sm text-gray-600">
                {progress.totalModules - progress.completedModules} modules remaining
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* Badges Earned Card */}
        <motion.div 
          className="group bg-white rounded-2xl shadow-lg p-4 sm:p-6 md:p-8 border border-gray-200 hover:shadow-xl transition-all duration-300"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          whileHover={{ scale: 1.05, y: -5 }}
          onHoverStart={() => setHoveredCard('badges')}
          onHoverEnd={() => setHoveredCard(null)}
        >
          <div className="text-center">
            <motion.div
              className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 bg-gradient-to-br from-yellow-100 to-yellow-200 rounded-xl flex items-center justify-center mx-auto mb-4 sm:mb-6"
              whileHover={{ rotate: 10, scale: 1.1 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <Award className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-yellow-600" />
            </motion.div>
            
            <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-4 sm:mb-6">Badges Earned</h3>
            
            <div className="space-y-3">
              {progress.badgesEarned && progress.badgesEarned.length > 0 ? (
                progress.badgesEarned.map((badge, index) => (
                  <motion.div
                    key={index}
                    className="bg-gradient-to-r from-yellow-100 to-orange-100 text-yellow-800 px-4 py-3 rounded-full text-sm font-medium text-center border border-yellow-200"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.7 + index * 0.1 }}
                    whileHover={{ scale: 1.05 }}
                  >
                    <div className="flex items-center justify-center gap-2">
                      <Trophy className="w-4 h-4" />
                      {badge.name}
                    </div>
                  </motion.div>
                ))
              ) : (
                <motion.div
                  className="text-gray-500 text-center py-4"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.7 }}
                >
                  <Trophy className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                  <p>No badges earned yet</p>
                  <p className="text-sm">Complete modules to earn badges!</p>
                </motion.div>
              )}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Recent Scores Section */}
      {progress.recentScores && progress.recentScores.length > 0 && (
        <motion.div 
          className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 md:p-8 border border-gray-200"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          <div className="text-center mb-4 sm:mb-6">
            <motion.h3 
              className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 sm:mb-4 flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-3"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9 }}
            >
              <span className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 text-green-600" />
                Recent Quiz Scores
              </span>
            </motion.h3>
            <p className="text-sm sm:text-base text-gray-600">Your latest quiz performance</p>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
            {progress.recentScores.slice(0, 6).map((score, index) => (
              <motion.div
                key={index}
                className={`p-3 sm:p-4 rounded-xl text-center font-bold text-base sm:text-lg ${
                  score >= 75 
                    ? 'bg-green-100 text-green-800 border border-green-200' 
                    : score >= 50 
                    ? 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                    : 'bg-red-100 text-red-800 border border-red-200'
                }`}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1 + index * 0.1 }}
                whileHover={{ scale: 1.05 }}
              >
                <div className="flex items-center justify-center gap-1 sm:gap-2">
                  {score >= 75 ? (
                    <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                  ) : (
                    <Target className="w-4 h-4 sm:w-5 sm:h-5" />
                  )}
                  {score}%
                </div>
                <div className="text-xs sm:text-sm font-normal mt-1">
                  {score >= 75 ? 'Excellent!' : score >= 50 ? 'Good!' : 'Keep practicing!'}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Additional Progress Details */}
      {hasData && (
        <motion.div 
          className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 md:p-8 border border-gray-200"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.3 }}
        >
          <div className="text-center mb-4 sm:mb-6">
            <motion.h3 
              className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 sm:mb-4 flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-3"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.4 }}
            >
              <span className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 text-blue-600" />
                Detailed Progress
              </span>
            </motion.h3>
            <p className="text-sm sm:text-base text-gray-600">Your learning journey in numbers</p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
            <motion.div 
              className="text-center p-4 sm:p-5 md:p-6 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl border border-purple-200"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 1.5 }}
              whileHover={{ scale: 1.05 }}
            >
              <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-purple-600 mb-1 sm:mb-2">{progress.completedModules}</div>
              <div className="text-xs sm:text-sm text-gray-600 font-medium">Modules Completed</div>
              <div className="text-xs text-gray-500 mt-1">Quiz score ≥ 75%</div>
            </motion.div>
            
            <motion.div 
              className="text-center p-4 sm:p-5 md:p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-200"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 1.6 }}
              whileHover={{ scale: 1.05 }}
            >
              <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-blue-600 mb-1 sm:mb-2">{progress.totalModules}</div>
              <div className="text-xs sm:text-sm text-gray-600 font-medium">Total Modules</div>
              <div className="text-xs text-gray-500 mt-1">Available chapters</div>
            </motion.div>
            
            <motion.div 
              className="text-center p-4 sm:p-5 md:p-6 bg-gradient-to-br from-green-50 to-green-100 rounded-xl border border-green-200"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 1.7 }}
              whileHover={{ scale: 1.05 }}
            >
              <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-green-600 mb-1 sm:mb-2">{percent}%</div>
              <div className="text-xs sm:text-sm text-gray-600 font-medium">Completion Rate</div>
              <div className="text-xs text-gray-500 mt-1">Overall progress</div>
            </motion.div>
            
            <motion.div 
              className="text-center p-4 sm:p-5 md:p-6 bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl border border-orange-200"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 1.8 }}
              whileHover={{ scale: 1.05 }}
            >
              <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-orange-600 mb-1 sm:mb-2">{Math.floor(progress.totalTimeSpent / 60)}h</div>
              <div className="text-xs sm:text-sm text-gray-600 font-medium">Time Spent</div>
              <div className="text-xs text-gray-500 mt-1">Learning hours</div>
            </motion.div>
          </div>
        </motion.div>
      )}

      {/* Action Buttons at Bottom */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-6">
        {hasData && (
          <motion.button
            className="group bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold px-6 py-3 sm:px-8 sm:py-4 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl flex items-center gap-2 text-base sm:text-lg w-full sm:w-auto justify-center"
            onClick={handleDownloadCSV}
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.9 }}
          >
            <Download className="w-5 h-5 sm:w-6 sm:h-6" />
            <span>Download Report</span>
          </motion.button>
        )}
        
        <motion.button 
          className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-6 py-3 sm:px-8 sm:py-4 rounded-xl font-medium text-base sm:text-lg shadow-lg hover:shadow-xl transition-all duration-300 w-full sm:w-auto"
          onClick={() => onTabChange?.('modules')}
          whileHover={{ scale: 1.05, y: -2 }}
          whileTap={{ scale: 0.95 }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 2.0 }}
        >
          Continue Learning
        </motion.button>
      </div>
    </motion.div>
  );
} 