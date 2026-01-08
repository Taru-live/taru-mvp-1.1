'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, BookOpen, Youtube, Zap, Trophy, Sparkles, Clock, Loader2 } from 'lucide-react';
import Image from 'next/image';
import VantaBackground from './VantaBackground';

interface ConsistentLoadingPageProps {
  type?: 'dashboard' | 'modules' | 'videos' | 'assessment' | 'general' | 'auth' | 'webhook' | 'onboarding' | 'registration' | 'interest-assessment' | 'skill-assessment' | 'diagnostic-assessment' | 'career-exploration' | 'result-summary';
  title?: string;
  subtitle?: string;
  progress?: number; // 0-100
  showProgress?: boolean;
  tips?: string[];
  estimatedTime?: string;
  className?: string;
  extendedLoading?: boolean;
  pageContext?: string; // Additional context for more specific tips
}

const ConsistentLoadingPage: React.FC<ConsistentLoadingPageProps> = ({
  type = 'general',
  title,
  subtitle,
  progress = 0,
  showProgress = false,
  tips = [],
  estimatedTime,
  className = '',
  extendedLoading = false,
  pageContext
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

  // Rotate tips every 3 seconds (or 5 seconds for extended loading)
  React.useEffect(() => {
    if (tips.length > 1) {
      const interval = setInterval(() => {
        setCurrentTipIndex((prev) => (prev + 1) % tips.length);
      }, extendedLoading ? 5000 : 3000);
      return () => clearInterval(interval);
    }
  }, [tips.length, extendedLoading]);

  const getLoadingConfig = () => {
    switch (type) {
      case 'dashboard':
        return {
          icon: Brain,
          primaryColor: 'purple',
          title: title || 'Loading Dashboard',
          subtitle: subtitle || 'Preparing your personalized learning environment...',
          bgGradient: 'from-purple-600 via-purple-700 to-indigo-800',
          iconBg: 'bg-gradient-to-br from-purple-100 to-purple-200',
          iconColor: 'text-purple-600',
          spinnerColor: 'text-purple-500',
          accentColor: 'purple-500',
          tips: tips.length > 0 ? tips : [
            'Analyzing your learning progress and achievements',
            'Generating personalized module recommendations',
            'Setting up your interactive learning dashboard',
            'Preparing your next learning goals'
          ]
        };
      case 'modules':
        return {
          icon: BookOpen,
          primaryColor: 'purple',
          title: title || 'Loading Learning Modules',
          subtitle: subtitle || 'Preparing your personalized learning content...',
          bgGradient: 'from-purple-600 via-purple-700 to-indigo-800',
          iconBg: 'bg-gradient-to-br from-purple-100 to-purple-200',
          iconColor: 'text-purple-600',
          spinnerColor: 'text-purple-500',
          accentColor: 'purple-500',
          tips: tips.length > 0 ? tips : [
            'AI is analyzing your learning preferences and grade level',
            'Customizing content difficulty based on your skills',
            'Loading interactive elements, videos, and quizzes',
            'Preparing personalized learning paths for you'
          ]
        };
      case 'videos':
        return {
          icon: Youtube,
          primaryColor: 'red',
          title: title || 'Loading YouTube Videos',
          subtitle: subtitle || 'Fetching your learning videos from YouTube...',
          bgGradient: 'from-red-600 via-red-700 to-pink-800',
          iconBg: 'bg-gradient-to-br from-red-100 to-red-200',
          iconColor: 'text-red-600',
          spinnerColor: 'text-red-500',
          accentColor: 'red-500',
          tips: tips.length > 0 ? tips : [
            'Connecting to verified educational YouTube channels',
            'Filtering content for your grade level and interests',
            'Organizing videos by subject, topic, and difficulty',
            'Preparing interactive video learning experience'
          ]
        };
      case 'assessment':
        return {
          icon: Trophy,
          primaryColor: 'emerald',
          title: title || 'Loading Assessment',
          subtitle: subtitle || 'Preparing your diagnostic test...',
          bgGradient: 'from-emerald-600 via-green-700 to-teal-800',
          iconBg: 'bg-gradient-to-br from-emerald-100 to-emerald-200',
          iconColor: 'text-emerald-600',
          spinnerColor: 'text-emerald-500',
          accentColor: 'emerald-500',
          tips: tips.length > 0 ? tips : [
            'Preparing personalized questions based on your profile',
            'Calibrating difficulty to match your learning level',
            'Setting up adaptive assessment engine for optimal experience',
            'Loading progress tracking and analytics system'
          ]
        };
      case 'auth':
        return {
          icon: Sparkles,
          primaryColor: 'purple',
          title: title || 'Authenticating',
          subtitle: subtitle || 'Verifying your credentials...',
          bgGradient: 'from-purple-600 via-purple-700 to-indigo-800',
          iconBg: 'bg-gradient-to-br from-purple-100 to-purple-200',
          iconColor: 'text-purple-600',
          spinnerColor: 'text-purple-500',
          accentColor: 'purple-500',
          tips: tips.length > 0 ? tips : [
            'Verifying your account credentials',
            'Setting up your personalized experience',
            'Almost ready!'
          ]
        };
      case 'webhook':
        return {
          icon: Zap,
          primaryColor: 'blue',
          title: title || 'Processing Request',
          subtitle: subtitle || 'AI is generating your personalized content...',
          bgGradient: 'from-blue-600 via-blue-700 to-cyan-800',
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
      case 'onboarding':
        return {
          icon: Sparkles,
          primaryColor: 'purple',
          title: title || 'Setting Up Your Profile',
          subtitle: subtitle || 'Personalizing your learning experience...',
          bgGradient: 'from-purple-600 via-purple-700 to-indigo-800',
          iconBg: 'bg-gradient-to-br from-purple-100 to-purple-200',
          iconColor: 'text-purple-600',
          spinnerColor: 'text-purple-500',
          accentColor: 'purple-500',
          tips: tips.length > 0 ? tips : [
            'Creating your personalized student profile',
            'Setting up your learning preferences',
            'Preparing your unique student ID',
            'Configuring your guardian information'
          ]
        };
      case 'registration':
        return {
          icon: Sparkles,
          primaryColor: 'purple',
          title: title || 'Creating Your Account',
          subtitle: subtitle || 'Setting up your personalized learning journey...',
          bgGradient: 'from-purple-600 via-purple-700 to-indigo-800',
          iconBg: 'bg-gradient-to-br from-purple-100 to-purple-200',
          iconColor: 'text-purple-600',
          spinnerColor: 'text-purple-500',
          accentColor: 'purple-500',
          tips: tips.length > 0 ? tips : [
            'Verifying your account credentials',
            'Setting up your role-based profile',
            'Preparing your personalized dashboard',
            'Almost ready to start learning!'
          ]
        };
      case 'interest-assessment':
        return {
          icon: Trophy,
          primaryColor: 'emerald',
          title: title || 'Loading Interest Assessment',
          subtitle: subtitle || 'Preparing questions to discover your interests...',
          bgGradient: 'from-emerald-600 via-green-700 to-teal-800',
          iconBg: 'bg-gradient-to-br from-emerald-100 to-emerald-200',
          iconColor: 'text-emerald-600',
          spinnerColor: 'text-emerald-500',
          accentColor: 'emerald-500',
          tips: tips.length > 0 ? tips : [
            'Preparing personalized interest questions',
            'Setting up interactive assessment interface',
            'Loading your progress tracking system',
            'Ready to discover your passions!'
          ]
        };
      case 'skill-assessment':
        return {
          icon: Trophy,
          primaryColor: 'blue',
          title: title || 'Loading Skill Assessment',
          subtitle: subtitle || 'Preparing tests to evaluate your skills...',
          bgGradient: 'from-blue-600 via-blue-700 to-cyan-800',
          iconBg: 'bg-gradient-to-br from-blue-100 to-blue-200',
          iconColor: 'text-blue-600',
          spinnerColor: 'text-blue-500',
          accentColor: 'blue-500',
          tips: tips.length > 0 ? tips : [
            'Preparing skill-based test questions',
            'Setting up adaptive assessment engine',
            'Loading your performance analytics',
            'Ready to test your abilities!'
          ]
        };
      case 'diagnostic-assessment':
        return {
          icon: Trophy,
          primaryColor: 'orange',
          title: title || 'Loading Diagnostic Assessment',
          subtitle: subtitle || 'Preparing comprehensive learning evaluation...',
          bgGradient: 'from-orange-600 via-red-700 to-pink-800',
          iconBg: 'bg-gradient-to-br from-orange-100 to-orange-200',
          iconColor: 'text-orange-600',
          spinnerColor: 'text-orange-500',
          accentColor: 'orange-500',
          tips: tips.length > 0 ? tips : [
            'Preparing comprehensive diagnostic questions',
            'Setting up multi-subject assessment',
            'Loading adaptive difficulty system',
            'Ready to evaluate your learning level!'
          ]
        };
      case 'career-exploration':
        return {
          icon: Brain,
          primaryColor: 'indigo',
          title: title || 'Loading Career Explorer',
          subtitle: subtitle || 'Preparing career insights and recommendations...',
          bgGradient: 'from-indigo-600 via-purple-700 to-pink-800',
          iconBg: 'bg-gradient-to-br from-indigo-100 to-indigo-200',
          iconColor: 'text-indigo-600',
          spinnerColor: 'text-indigo-500',
          accentColor: 'indigo-500',
          tips: tips.length > 0 ? tips : [
            'Analyzing your interests and skills',
            'Generating career recommendations',
            'Loading industry insights and trends',
            'Preparing your career roadmap!'
          ]
        };
      case 'result-summary':
        return {
          icon: Trophy,
          primaryColor: 'green',
          title: title || 'Generating Results',
          subtitle: subtitle || 'Analyzing your responses and creating insights...',
          bgGradient: 'from-green-600 via-emerald-700 to-teal-800',
          iconBg: 'bg-gradient-to-br from-green-100 to-green-200',
          iconColor: 'text-green-600',
          spinnerColor: 'text-green-500',
          accentColor: 'green-500',
          tips: tips.length > 0 ? tips : [
            'Analyzing your assessment responses',
            'Generating personalized insights',
            'Creating your learning recommendations',
            'Preparing your detailed results!'
          ]
        };
      default:
        return {
          icon: Sparkles,
          primaryColor: 'gray',
          title: title || 'Loading',
          subtitle: subtitle || 'Please wait while we prepare everything for you...',
          bgGradient: 'from-gray-600 via-gray-700 to-slate-800',
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
      className={`min-h-screen flex items-center justify-center p-4 relative overflow-hidden ${className}`}
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
      <motion.main 
        className="w-full h-full flex items-center justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
      >

      <div className="max-w-md w-full relative z-10">
        <motion.div
          className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl p-8 text-center border border-white/20"
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          {/* Taru Logo Section */}
          <div className="relative mb-6">
            <motion.div
              className="w-20 h-20 bg-gradient-to-br from-purple-100 to-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg border border-white/30"
              animate={{
                y: [0, -8, 0],
                rotate: [0, 3, -3, 0],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              whileHover={{ scale: 1.1, rotate: 360 }}
            >
              <Image 
                src="/icons/logo.svg" 
                alt="Taru Logo" 
                width={40} 
                height={40} 
                className="w-10 h-10"
              />
            </motion.div>
            
            {/* Animated Spinner Ring */}
            <motion.div
              className="absolute inset-0 flex items-center justify-center"
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            >
              <div className={`w-24 h-24 border-4 border-white/30 border-t-${config.accentColor} rounded-full`}></div>
            </motion.div>

            {/* Pulsing Ring */}
            <motion.div
              className="absolute inset-0 flex items-center justify-center"
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
              <div className={`w-28 h-28 border-2 border-${config.accentColor}/30 rounded-full`}></div>
            </motion.div>
          </div>

          {/* Text Content */}
          <motion.h2
            className="text-2xl font-bold text-gray-900 mb-3"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
          >
            {config.title}
          </motion.h2>
          <motion.p
            className="text-gray-600 mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
          >
            {config.subtitle}
          </motion.p>

          {/* Progress Bar */}
          {showProgress && (
            <motion.div
              className="mb-6"
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
              className="mb-6"
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
              className="flex items-center justify-center gap-2 text-sm text-gray-500 mb-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6, duration: 0.6 }}
            >
              <Clock className="w-4 h-4" />
              <span>Estimated time: {estimatedTime}</span>
            </motion.div>
          )}

          {/* Extended Loading Message */}
          {extendedLoading && (
            <motion.div
              className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl p-4 border border-amber-200 mb-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7, duration: 0.6 }}
            >
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-4 h-4 text-amber-600" />
                <span className="text-sm font-medium text-amber-700">AI Processing</span>
              </div>
              <p className="text-sm text-amber-600">
                This may take a few minutes as our AI analyzes your responses and generates personalized career recommendations. Please be patient!
              </p>
            </motion.div>
          )}

          {/* Loading Steps - Dynamic based on page type */}
          <motion.div
            className="space-y-3 mb-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.6 }}
          >
            {config.tips.slice(0, 3).map((tip, index) => (
              <motion.div
                key={index}
                className="flex items-center gap-3"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.5, duration: 0.5 }}
              >
                <motion.div
                  className={`w-2 h-2 bg-${config.accentColor} rounded-full`}
                  animate={{
                    scale: [1, 1.3, 1],
                    opacity: [0.5, 1, 0.5],
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    delay: index * 0.5,
                  }}
                />
                <span className="text-sm text-gray-600">{tip}</span>
              </motion.div>
            ))}
          </motion.div>

          {/* Loading Dots */}
          <motion.div
            className="flex justify-center space-x-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.6 }}
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
      </div>
      </motion.main>
    </VantaBackground>
  );
};

export default ConsistentLoadingPage;
