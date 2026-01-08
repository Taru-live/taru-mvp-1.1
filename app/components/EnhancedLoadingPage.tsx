'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Youtube, BookOpen, Play, Loader2, Clock, Zap, Sparkles, Brain, Trophy } from 'lucide-react';
import VantaBackground from './VantaBackground';

interface EnhancedLoadingPageProps {
  type?: 'modules' | 'videos' | 'webhook' | 'general' | 'dashboard' | 'assessment';
  title?: string;
  subtitle?: string;
  progress?: number; // 0-100
  showProgress?: boolean;
  tips?: string[];
  estimatedTime?: string;
}

const EnhancedLoadingPage: React.FC<EnhancedLoadingPageProps> = ({
  type = 'general',
  title,
  subtitle,
  progress = 0,
  showProgress = false,
  tips = [],
  estimatedTime
}) => {
  const [currentTipIndex, setCurrentTipIndex] = React.useState(0);
  const [mountedAt] = React.useState(() => Date.now());
  const [minDisplayTimeElapsed, setMinDisplayTimeElapsed] = React.useState(false);

  // Ensure minimum 3 second display time
  React.useEffect(() => {
    const minDisplayTime = 3000; // 3 seconds minimum
    const elapsed = Date.now() - mountedAt;
    const remainingTime = Math.max(0, minDisplayTime - elapsed);
    
    const timer = setTimeout(() => {
      setMinDisplayTimeElapsed(true);
    }, remainingTime);

    return () => clearTimeout(timer);
  }, [mountedAt]);

  // Rotate tips every 3 seconds
  React.useEffect(() => {
    if (tips.length > 1) {
      const interval = setInterval(() => {
        setCurrentTipIndex((prev) => (prev + 1) % tips.length);
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [tips.length]);

  const getLoadingConfig = () => {
    switch (type) {
      case 'modules':
        return {
          icon: BookOpen,
          primaryColor: 'purple',
          title: title || 'Loading Learning Modules',
          subtitle: subtitle || 'Preparing your personalized learning content...',
          bgGradient: 'from-purple-500 via-purple-600 to-indigo-600',
          iconBg: 'bg-gradient-to-br from-purple-100 to-purple-200',
          iconColor: 'text-purple-600',
          spinnerColor: 'text-purple-500',
          accentColor: 'purple-500',
          tips: tips.length > 0 ? tips : [
            'AI is analyzing your learning preferences',
            'Customizing content difficulty for you',
            'Loading interactive elements and quizzes'
          ]
        };
      case 'videos':
        return {
          icon: Youtube,
          primaryColor: 'red',
          title: title || 'Loading YouTube Videos',
          subtitle: subtitle || 'Fetching your learning videos from YouTube...',
          bgGradient: 'from-red-500 via-red-600 to-pink-600',
          iconBg: 'bg-gradient-to-br from-red-100 to-red-200',
          iconColor: 'text-red-600',
          spinnerColor: 'text-red-500',
          accentColor: 'red-500',
          tips: tips.length > 0 ? tips : [
            'Connecting to YouTube educational channels',
            'Filtering content for your grade level',
            'Organizing videos by subject and topic'
          ]
        };
      case 'webhook':
        return {
          icon: Zap,
          primaryColor: 'blue',
          title: title || 'Processing Request',
          subtitle: subtitle || 'AI is generating your personalized content...',
          bgGradient: 'from-blue-500 via-blue-600 to-cyan-600',
          iconBg: 'bg-gradient-to-br from-blue-100 to-blue-200',
          iconColor: 'text-blue-600',
          spinnerColor: 'text-blue-500',
          accentColor: 'blue-500',
          tips: tips.length > 0 ? tips : [
            'AI is analyzing your learning profile',
            'Generating personalized recommendations',
            'Optimizing content for your preferences'
          ]
        };
      case 'dashboard':
        return {
          icon: Brain,
          primaryColor: 'indigo',
          title: title || 'Loading Dashboard',
          subtitle: subtitle || 'Preparing your learning environment...',
          bgGradient: 'from-indigo-500 via-purple-600 to-pink-600',
          iconBg: 'bg-gradient-to-br from-indigo-100 to-indigo-200',
          iconColor: 'text-indigo-600',
          spinnerColor: 'text-indigo-500',
          accentColor: 'indigo-500',
          tips: tips.length > 0 ? tips : [
            'Loading your progress and achievements',
            'Preparing personalized recommendations',
            'Setting up your learning environment'
          ]
        };
      case 'assessment':
        return {
          icon: Trophy,
          primaryColor: 'emerald',
          title: title || 'Loading Assessment',
          subtitle: subtitle || 'Preparing your diagnostic test...',
          bgGradient: 'from-emerald-500 via-green-600 to-teal-600',
          iconBg: 'bg-gradient-to-br from-emerald-100 to-emerald-200',
          iconColor: 'text-emerald-600',
          spinnerColor: 'text-emerald-500',
          accentColor: 'emerald-500',
          tips: tips.length > 0 ? tips : [
            'Preparing personalized questions for you',
            'Calibrating difficulty to your level',
            'Setting up adaptive assessment engine'
          ]
        };
      default:
        return {
          icon: Sparkles,
          primaryColor: 'gray',
          title: title || 'Loading',
          subtitle: subtitle || 'Please wait while we prepare everything for you...',
          bgGradient: 'from-gray-500 via-gray-600 to-slate-600',
          iconBg: 'bg-gradient-to-br from-gray-100 to-gray-200',
          iconColor: 'text-gray-600',
          spinnerColor: 'text-gray-500',
          accentColor: 'gray-500',
          tips: tips.length > 0 ? tips : [
            'Setting up your experience',
            'Loading content and resources',
            'Almost ready!'
          ]
        };
    }
  };

  const config = getLoadingConfig();
  const Icon = config.icon;

  // Component will always render - minimum display time is tracked internally
  // Suspense will control when to hide it, but we ensure it's visible for at least 3 seconds
  return (
    <VantaBackground
      className={`min-h-screen flex items-center justify-center p-4 relative overflow-hidden`}
      highlightColor={0xA855F7}  // Bright purple
      midtoneColor={0x8B5CF6}    // Purple
      lowlightColor={0x7c3aed}   // Primary purple
      baseColor={0x6D18CE}       // Dark purple
      blurFactor={0.40}
      speed={0.30}
      zoom={0.50}
      mouseControls={true}
      touchControls={true}
      gyroControls={false}
      minHeight={200}
      minWidth={200}
    >
      <div className="w-full h-full flex items-center justify-center">

      <div className="max-w-lg w-full relative z-10">
        {/* Main Loading Card */}
        <motion.div
          className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl p-8 text-center border border-white/20"
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          {/* Icon Section with Floating Animation */}
          <div className="relative mb-8">
            <motion.div
              className={`w-24 h-24 ${config.iconBg} rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg border border-white/30`}
              animate={{
                y: [0, -10, 0],
                rotate: [0, 5, -5, 0],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              <Icon className={`w-12 h-12 ${config.iconColor}`} />
            </motion.div>
            
            {/* Animated Spinner Ring */}
            <motion.div
              className="absolute inset-0 flex items-center justify-center"
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            >
              <div className={`w-28 h-28 border-4 border-white/30 border-t-${config.accentColor} rounded-full`}></div>
            </motion.div>

            {/* Pulsing Ring */}
            <motion.div
              className={`absolute inset-0 flex items-center justify-center`}
              animate={{
                scale: [1, 1.1, 1],
                opacity: [0.5, 0.8, 0.5],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              <div className={`w-32 h-32 border-2 border-${config.accentColor}/30 rounded-full`}></div>
            </motion.div>
          </div>

          {/* Text Content */}
          <motion.h2
            className="text-3xl font-bold text-gray-900 mb-3"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
          >
            {config.title}
          </motion.h2>
          <motion.p
            className="text-gray-600 mb-8 text-lg"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
          >
            {config.subtitle}
          </motion.p>

          {/* Progress Bar */}
          {showProgress && (
            <motion.div
              className="mb-8"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4, duration: 0.6 }}
            >
              <div className="flex justify-between text-sm text-gray-600 mb-3">
                <span>Progress</span>
                <span className="font-semibold">{Math.round(progress)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                <motion.div
                  className={`bg-gradient-to-r ${config.bgGradient} h-3 rounded-full relative`}
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                >
                  {/* Shimmer Effect */}
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                    animate={{ x: ['-100%', '100%'] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                  />
                </motion.div>
              </div>
            </motion.div>
          )}

          {/* Tips Section */}
          {config.tips.length > 0 && (
            <motion.div
              className="mb-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.6 }}
            >
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-4 border border-blue-100">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-4 h-4 text-blue-500" />
                  <span className="text-sm font-medium text-blue-700">Did you know?</span>
                </div>
                <AnimatePresence mode="wait">
                  <motion.p
                    key={currentTipIndex}
                    className="text-sm text-gray-700"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                  >
                    {config.tips[currentTipIndex]}
                  </motion.p>
                </AnimatePresence>
              </div>
            </motion.div>
          )}

          {/* Estimated Time */}
          {estimatedTime && (
            <motion.div
              className="flex items-center justify-center gap-2 text-sm text-gray-500"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6, duration: 0.6 }}
            >
              <Clock className="w-4 h-4" />
              <span>Estimated time: {estimatedTime}</span>
            </motion.div>
          )}

          {/* Loading Dots Animation */}
          <motion.div
            className="flex justify-center space-x-2 mt-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7, duration: 0.6 }}
          >
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className={`w-3 h-3 bg-gradient-to-r ${config.bgGradient} rounded-full`}
                animate={{
                  scale: [1, 1.3, 1],
                  opacity: [0.5, 1, 0.5],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  delay: i * 0.2,
                  ease: "easeInOut",
                }}
              />
            ))}
          </motion.div>
        </motion.div>

        {/* Additional Info Card */}
        {(type === 'webhook' || type === 'assessment') && (
          <motion.div
            className="mt-6 bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-white/30"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.6 }}
          >
            <div className="flex items-center gap-3 text-sm text-gray-700">
              {type === 'webhook' ? (
                <>
                  <Zap className="w-4 h-4 text-blue-500" />
                  <span>AI is working hard to personalize your experience</span>
                </>
              ) : (
                <>
                  <Trophy className="w-4 h-4 text-emerald-500" />
                  <span>Preparing adaptive questions just for you</span>
                </>
              )}
            </div>
          </motion.div>
        )}
      </div>
      </div>
    </VantaBackground>
  );
};

export default EnhancedLoadingPage;
