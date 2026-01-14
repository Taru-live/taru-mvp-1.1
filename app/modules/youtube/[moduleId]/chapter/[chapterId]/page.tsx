'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft,
  Play,
  Clock,
  BookOpen,
  Send,
  Bot,
  Sparkles,
  Star,
  Heart,
  Brain,
  MessageCircle,
  Loader2,
  CheckCircle,
  X,
  Trophy,
  Target,
  TrendingUp,
  Lock
} from 'lucide-react';

interface Chapter {
  chapterId: number;
  chapterTitle: string;
  chapterDescription: string;
  youtubeUrl: string;
  duration?: string;
}

interface Submodule {
  submoduleId: number;
  submoduleTitle: string;
  submoduleDescription: string;
  chapters: Chapter[];
}

interface Module {
  moduleId: number;
  moduleTitle: string;
  moduleDescription: string;
  submodules: Submodule[];
}

interface Message {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
}

interface MCQQuestion {
  Q: string;
  level: string;
  question: string;
  options: string[];
  answer: string;
}

export default function ChapterPage() {
  const router = useRouter();
  const params = useParams();
  const moduleId = params?.moduleId as string;
  const chapterId = params?.chapterId as string;
  
  const [module, setModule] = useState<Module | null>(null);
  const [chapter, setChapter] = useState<Chapter | null>(null);
  const [loading, setLoading] = useState(true);
  const [uniqueId, setUniqueId] = useState<string | null>(null);
  const [learningPathId, setLearningPathId] = useState<string | null>(null);
  const [moduleAccess, setModuleAccess] = useState<{
    hasAccess: boolean;
    isLocked: boolean;
    unlockedModulesCount: number;
    reason?: string;
  } | null>(null);
  
  // Chat state
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [studentUniqueId, setStudentUniqueId] = useState<string>('');
  const [sessionId, setSessionId] = useState<string>('');
  const [studentName, setStudentName] = useState<string>('Student');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Quiz state
  const [mcqQuestions, setMcqQuestions] = useState<MCQQuestion[]>([]);
  const [mcqLoading, setMcqLoading] = useState(false);
  const [mcqAnswers, setMcqAnswers] = useState<Record<string, string>>({});
  const [mcqSubmitted, setMcqSubmitted] = useState(false);
  const [mcqScore, setMcqScore] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'chat' | 'quiz'>('chat'); // Tab state
  const [showQuizConfirmModal, setShowQuizConfirmModal] = useState(false);
  const [mcqError, setMcqError] = useState<string | null>(null);

  // Progress state
  const [chapterProgress, setChapterProgress] = useState<number>(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [videoWatchTime, setVideoWatchTime] = useState(0);
  const [videoDuration, setVideoDuration] = useState(0);
  const videoWatchIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Subscription and usage state (per-chapter)
  const [subscriptionStatus, setSubscriptionStatus] = useState<{
    hasSubscription: boolean;
    subscription?: {
      planType: string;
      planAmount: number;
      dailyChatLimit: number;
      monthlyMcqLimit: number;
    };
    usage?: {
      dailyChatsRemaining: number;
      monthlyMcqsRemaining: number;
      dailyChatsUsed: number;
      monthlyMcqsUsed: number;
    };
  } | null>(null);

  useEffect(() => {
    fetchUserData();
  }, []);

  useEffect(() => {
    if (chapterId && learningPathId) {
      fetchSubscriptionStatus();
      checkModuleAccess();
    }
  }, [chapterId, learningPathId, moduleId]);

  // Check module/chapter access
  const checkModuleAccess = async () => {
    if (!learningPathId || !moduleId) return;
    
    try {
      const moduleIndex = parseInt(moduleId) - 1; // Convert to 0-based index
      const response = await fetch(
        `/api/modules/check-access?learningPathId=${learningPathId}&moduleIndex=${moduleIndex}&chapterId=${chapterId}`,
        { credentials: 'include' }
      );
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setModuleAccess(data.moduleAccess);
          
          // If module is locked, prevent access
          if (data.moduleAccess.isLocked) {
            setLoading(false);
            return;
          }
        }
      }
    } catch (error) {
      console.error('Error checking module access:', error);
    }
  };

  // Fetch subscription status and per-chapter usage
  const fetchSubscriptionStatus = async () => {
    if (!chapterId || !learningPathId) return;
    
    try {
      // Fetch per-chapter usage status with learningPathId
      const usageResponse = await fetch(
        `/api/usage/chapter-status?chapterId=${chapterId}&learningPathId=${learningPathId}`,
        { credentials: 'include' }
      );
      
      if (usageResponse.ok) {
        const usageData = await usageResponse.json();
        if (usageData.success && usageData.usage) {
          setSubscriptionStatus({
            hasSubscription: usageData.usage.hasSubscription,
            subscription: usageData.usage.hasSubscription ? {
              planType: usageData.usage.planType || 'basic',
              planAmount: 0, // Will be filled from subscription-status if needed
              dailyChatLimit: usageData.usage.chatUsage.limit,
              monthlyMcqLimit: usageData.usage.mcqUsage.limit
            } : undefined,
            usage: {
              dailyChatsRemaining: usageData.usage.chatUsage.remaining,
              monthlyMcqsRemaining: usageData.usage.mcqUsage.remaining,
              dailyChatsUsed: usageData.usage.chatUsage.used,
              monthlyMcqsUsed: usageData.usage.mcqUsage.used
            }
          });
          return;
        }
      }
      
      // Fallback to learning-path-specific subscription status
      const response = await fetch(
        `/api/payments/subscription-status?learningPathId=${learningPathId}`,
        { credentials: 'include' }
      );
      
      if (response.ok) {
        const data = await response.json();
        setSubscriptionStatus(data);
      } else {
        // No subscription or error
        setSubscriptionStatus({ hasSubscription: false });
      }
    } catch (error) {
      console.error('Error fetching subscription status:', error);
      setSubscriptionStatus({ hasSubscription: false });
    }
  };

  useEffect(() => {
    if (uniqueId) {
      fetchChapterData();
      fetchChapterProgress();
    }
  }, [moduleId, chapterId, uniqueId]);

  useEffect(() => {
    // Cleanup video watch time interval on unmount
    return () => {
      if (videoWatchIntervalRef.current) {
        clearInterval(videoWatchIntervalRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (chapter && studentUniqueId) {
      // Initialize chat with welcome message
      const newSessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      setSessionId(newSessionId);
      
      setMessages([
        {
          id: '1',
          content: `Hi ${studentName}! 👋 I'm your friendly AI learning buddy! 🤖✨ I'm here to help you understand "${chapter.chapterTitle}". Ask me anything about this lesson, and I'll make learning fun! 🎉`,
          isUser: false,
          timestamp: new Date(),
        }
      ]);
    }
  }, [chapter, studentUniqueId, studentName]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchUserData = async () => {
    try {
      const response = await fetch('/api/student/profile');
      if (response.ok) {
        const data = await response.json();
        if (data.uniqueId) {
          setUniqueId(data.uniqueId);
          setStudentUniqueId(data.uniqueId);
        }
        if (data.fullName || data.name) {
          setStudentName(data.fullName || data.name);
        }
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  const transformToHierarchicalFormat = (data: any): any => {
    try {
      if (data.modules && Array.isArray(data.modules) && data.modules.length > 0) {
        const firstModule = data.modules[0];
        if (firstModule.submodules && Array.isArray(firstModule.submodules)) {
          return {
            uniqueid: data.uniqueid || data.uniqueId || uniqueId || '',
            modules: data.modules,
            _id: data._id,
            createdAt: data.createdAt,
            updatedAt: data.updatedAt
          };
        }
      }

      if (data.chapters && Array.isArray(data.chapters)) {
        const modules: Module[] = [];
        let currentModuleId = 1;
        let currentSubmoduleId = 1;
        let chapterCounter = 1;
        
        const chaptersPerSubmodule = 2;
        const submodulesPerModule = 2;
        
        for (let i = 0; i < data.chapters.length; i += chaptersPerSubmodule * submodulesPerModule) {
          const moduleChapters = data.chapters.slice(i, i + chaptersPerSubmodule * submodulesPerModule);
          const submodules: Submodule[] = [];
          
          for (let j = 0; j < moduleChapters.length; j += chaptersPerSubmodule) {
            const submoduleChapters = moduleChapters.slice(j, j + chaptersPerSubmodule);
            const chapters: Chapter[] = submoduleChapters.map((ch: any, idx: number) => ({
              chapterId: chapterCounter++,
              chapterTitle: ch.videoTitle || ch.chapterTitle || `Chapter ${chapterCounter - 1}`,
              chapterDescription: ch.chapterDescription || `Learn about ${ch.videoTitle || 'this topic'}`,
              youtubeUrl: ch.videoUrl || ch.youtubeUrl || '',
              duration: ch.duration
            }));
            
            submodules.push({
              submoduleId: currentSubmoduleId++,
              submoduleTitle: `Submodule ${currentSubmoduleId - 1}`,
              submoduleDescription: `Explore these topics in detail`,
              chapters
            });
          }
          
          modules.push({
            moduleId: currentModuleId++,
            moduleTitle: `Module ${currentModuleId - 1}`,
            moduleDescription: `Comprehensive learning module covering essential topics`,
            submodules
          });
        }
        
        return {
          uniqueid: data.uniqueid || data.uniqueId || uniqueId || '',
          modules,
          _id: data._id,
          createdAt: data.createdAt,
          updatedAt: data.updatedAt
        };
      }

      if (Array.isArray(data) && data.length > 0) {
        const studentData = data[0];
        if (studentData.modules && Array.isArray(studentData.modules)) {
          return {
            uniqueid: studentData.uniqueid,
            modules: studentData.modules
          };
        }
      }

      return null;
    } catch (error) {
      console.error('Error transforming data:', error);
      return null;
    }
  };

  const fetchChapterData = async () => {
    if (!uniqueId) return;
    
    try {
      const response = await fetch(`/api/youtube-urls?uniqueid=${encodeURIComponent(uniqueId)}`);
      if (response.ok) {
        const result = await response.json();
        
        if (result.data) {
          // Extract learning path ID from response
          if (result.data._id) {
            setLearningPathId(result.data._id.toString());
          }
          
          const transformedData = transformToHierarchicalFormat(result.data);
          
          if (transformedData && transformedData.modules && transformedData.modules.length > 0) {
            const modules = transformedData.modules;
            const foundModule = modules.find((m: Module) => m.moduleId.toString() === moduleId);
            if (foundModule) {
              setModule(foundModule);
              for (const submodule of foundModule.submodules) {
                const foundChapter = submodule.chapters.find(
                  (c: Chapter) => c.chapterId.toString() === chapterId
                );
                if (foundChapter) {
                  setChapter(foundChapter);
                  break;
                }
              }
            }
          } else {
            const modules = result.data?.modules || result.modules || [];
            if (modules.length > 0) {
              const foundModule = modules.find((m: Module) => m.moduleId.toString() === moduleId);
              if (foundModule) {
                setModule(foundModule);
                for (const submodule of foundModule.submodules) {
                  const foundChapter = submodule.chapters.find(
                    (c: Chapter) => c.chapterId.toString() === chapterId
                  );
                  if (foundChapter) {
                    setChapter(foundChapter);
                    break;
                  }
                }
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('Error fetching chapter data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getVideoId = (url: string) => {
    const match = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
    return match ? match[1] : null;
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputMessage,
      isUser: true,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    const currentMessage = inputMessage;
    setInputMessage('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: currentMessage,
          studentUniqueId: studentUniqueId,
          sessionId: sessionId,
          chapterId: chapterId, // Include chapterId for per-chapter usage tracking
          learningPathId: learningPathId, // Include learningPathId to scope subscription check
          studentData: {
            name: studentName,
            uniqueId: studentUniqueId,
            timestamp: new Date().toISOString()
          },
          context: {
            chapterTitle: chapter?.chapterTitle,
            chapterDescription: chapter?.chapterDescription,
            moduleTitle: module?.moduleTitle
          }
        }),
      });

      const data = await response.json();

      if (data.success) {
        const aiResponse: Message = {
          id: (Date.now() + 1).toString(),
          content: data.response || "I'm here to help! 😊",
          isUser: false,
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, aiResponse]);
        // Refresh subscription status after using chat
        fetchSubscriptionStatus();
      } else {
        const errorResponse: Message = {
          id: (Date.now() + 1).toString(),
          content: "Oops! I'm having a little trouble right now. But don't worry, I'm still here to help! 😊 Try asking me again!",
          isUser: false,
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, errorResponse]);
      }
    } catch (error) {
      console.error('Chat API Error:', error);
      const fallbackResponse: Message = {
        id: (Date.now() + 1).toString(),
        content: `Hi ${studentName}! I'm having trouble connecting right now, but I'm still here for you! 💪 Ask me anything about this lesson!`,
        isUser: false,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, fallbackResponse]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Fetch chapter progress
  const fetchChapterProgress = async () => {
    if (!studentUniqueId || !chapterId) return;

    try {
      const response = await fetch(`/api/modules/progress?studentId=${studentUniqueId}`);
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.progress) {
          const chapterProgressData = data.progress.find(
            (p: any) => p.moduleId === chapterId
          );
          if (chapterProgressData) {
            setChapterProgress(chapterProgressData.quizScore || 0);
            setIsCompleted(chapterProgressData.quizScore >= 75 || !!chapterProgressData.completedAt);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching chapter progress:', error);
    }
  };

  // Generate MCQ quiz (always generates fresh, no caching)
  const generateMCQ = async () => {
    if (!chapterId) return;

    // Clear existing questions and reset state for fresh generation
    setMcqQuestions([]);
    setMcqAnswers({});
    setMcqSubmitted(false);
    setMcqScore(null);
    setMcqError(null);
    setMcqLoading(true);
    setActiveTab('quiz');
    setShowQuizConfirmModal(false);

    try {
      const response = await fetch('/api/webhook/generate-mcq', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ 
          chapterId: chapterId,
          learningPathId: learningPathId // Include learningPathId to scope subscription check
        }),
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.questions && Array.isArray(result.questions) && result.questions.length > 0) {
          setMcqQuestions(result.questions);
          // Refresh subscription status after generating MCQ
          fetchSubscriptionStatus();
        } else {
          setMcqError('No quiz questions were generated. Please try again.');
        }
      } else {
        const errorData = await response.json();
        const errorMessage = errorData.message || errorData.error || 'Failed to generate quiz. Please try again.';
        setMcqError(errorMessage);
        
        // If it's a limit reached error, show specific message
        if (errorData.limitReached) {
          setMcqError(errorData.message || `You have used all ${errorData.limit} MCQ generations for this chapter this month. You can still generate MCQs for other chapters.`);
        }
      }
    } catch (error) {
      console.error('Error generating MCQ:', error);
      setMcqError('Network error. Please check your connection and try again.');
    } finally {
      setMcqLoading(false);
    }
  };

  // Handle quiz tab click - show confirmation modal
  const handleQuizTabClick = () => {
    setActiveTab('quiz');
    setMcqError(null);
    // Always show confirmation modal, even if questions exist
    setShowQuizConfirmModal(true);
  };

  // Handle MCQ answer selection
  const handleMCQAnswer = (questionId: string, answer: string) => {
    setMcqAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
  };

  // Submit MCQ quiz
  const submitMCQ = async () => {
    if (!chapterId || !studentUniqueId || mcqQuestions.length === 0) return;

    let correctAnswers = 0;
    mcqQuestions.forEach(question => {
      if (mcqAnswers[question.Q] === question.answer) {
        correctAnswers++;
      }
    });

    const score = Math.round((correctAnswers / mcqQuestions.length) * 100);
    setMcqScore(score);
    setMcqSubmitted(true);

    // Save quiz score and sync progress
    try {
      const response = await fetch(`/api/modules/quiz-score`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chapterId: chapterId,
          studentId: studentUniqueId,
          score: score,
          totalQuestions: mcqQuestions.length,
          correctAnswers: correctAnswers,
          quizAttempts: mcqQuestions.map((question, index) => {
            const selectedAnswer = mcqAnswers[question.Q] || '';
            const answerIndex = question.options.findIndex(opt => opt === selectedAnswer);
            return {
              questionIndex: index,
              selectedAnswer: answerIndex >= 0 ? answerIndex : 0,
              isCorrect: selectedAnswer === question.answer,
              timeSpent: 0,
              difficulty: 'medium',
              skillTags: []
            };
          })
        })
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Quiz score saved:', result);
        
        // Update local progress
        setChapterProgress(score);
        if (score >= 75) {
          setIsCompleted(true);
        }

        // Refresh progress from server
        fetchChapterProgress();
      }
    } catch (error) {
      console.error('Error submitting quiz:', error);
    }
  };

  // Track video watch time
  const startVideoTracking = () => {
    if (videoWatchIntervalRef.current) {
      clearInterval(videoWatchIntervalRef.current);
    }

    // Track every 10 seconds
    videoWatchIntervalRef.current = setInterval(() => {
      setVideoWatchTime(prev => {
        const newTime = prev + 10;
        // Sync video progress if significant time has passed
        if (newTime % 30 === 0) {
          syncVideoProgress(newTime);
        }
        return newTime;
      });
    }, 10000);
  };

  const stopVideoTracking = () => {
    if (videoWatchIntervalRef.current) {
      clearInterval(videoWatchIntervalRef.current);
      videoWatchIntervalRef.current = null;
    }
    // Final sync when stopping
    if (videoWatchTime > 0) {
      syncVideoProgress(videoWatchTime);
    }
  };

  // Sync video progress to backend
  const syncVideoProgress = async (watchTime: number) => {
    if (!chapterId || !studentUniqueId) return;

    try {
      // Update progress via quiz-score API (it handles video progress too)
      await fetch(`/api/modules/quiz-score`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chapterId: chapterId,
          studentId: studentUniqueId,
          score: chapterProgress, // Keep existing quiz score
          totalQuestions: 0,
          correctAnswers: 0,
          quizAttempts: [],
          videoWatchTime: watchTime,
          videoDuration: videoDuration
        })
      });
    } catch (error) {
      console.error('Error syncing video progress:', error);
    }
  };

  // Reset MCQ
  const resetMCQ = () => {
    setMcqAnswers({});
    setMcqSubmitted(false);
    setMcqScore(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
        <div className="text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-16 h-16 border-4 border-purple-200 border-t-purple-600 rounded-full mx-auto mb-4"
          />
          <p className="text-gray-600 text-lg">Loading your lesson...</p>
        </div>
      </div>
    );
  }

  if (!module || !chapter) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
        <div className="text-center">
          <p className="text-gray-600 mb-4 text-lg">Chapter not found</p>
          <button
            onClick={() => router.push(`/modules/youtube/${moduleId}`)}
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all shadow-lg"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const videoId = getVideoId(chapter.youtubeUrl);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
      {/* Header */}
      <div className="bg-white border-b border-purple-200 shadow-sm sticky top-0 z-10">
        <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <button
            onClick={() => router.push(`/modules/youtube/${moduleId}`)}
            className="flex items-center gap-2 text-purple-600 hover:text-purple-700 mb-3 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Back to Module</span>
          </button>
          
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl">
              <Play className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                {chapter.chapterTitle}
              </h1>
              <div className="flex items-center gap-4 text-sm text-gray-500 mt-1 flex-wrap">
                <div className="flex items-center gap-1">
                  <BookOpen className="w-4 h-4" />
                  <span>{module.moduleTitle}</span>
                </div>
                {chapter.duration && (
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    <span>{chapter.duration}</span>
                  </div>
                )}
                {isCompleted && (
                  <div className="flex items-center gap-1 text-green-600">
                    <CheckCircle className="w-4 h-4" />
                    <span>Completed</span>
                  </div>
                )}
                {/* Subscription Credits Display */}
                {subscriptionStatus?.hasSubscription && subscriptionStatus.usage ? (
                  <>
                    <div className={`flex items-center gap-1 px-2 py-1 rounded-full ${
                      subscriptionStatus.usage.dailyChatsRemaining === 0 
                        ? 'text-red-600 bg-red-50' 
                        : subscriptionStatus.usage.dailyChatsRemaining <= 1
                        ? 'text-orange-600 bg-orange-50'
                        : 'text-blue-600 bg-blue-50'
                    }`}>
                      <MessageCircle className="w-3 h-3" />
                      <span className="text-xs font-medium" title="Daily chat credits for this chapter">
                        {subscriptionStatus.usage.dailyChatsRemaining}/{subscriptionStatus.subscription?.dailyChatLimit || 0} chats/day
                      </span>
                    </div>
                    <div className={`flex items-center gap-1 px-2 py-1 rounded-full ${
                      subscriptionStatus.usage.monthlyMcqsRemaining === 0 
                        ? 'text-red-600 bg-red-50' 
                        : subscriptionStatus.usage.monthlyMcqsRemaining <= 1
                        ? 'text-orange-600 bg-orange-50'
                        : 'text-purple-600 bg-purple-50'
                    }`}>
                      <Brain className="w-3 h-3" />
                      <span className="text-xs font-medium" title="Monthly MCQ credits for this chapter">
                        {subscriptionStatus.usage.monthlyMcqsRemaining}/{subscriptionStatus.subscription?.monthlyMcqLimit || 0} MCQs/month
                      </span>
                    </div>
                  </>
                ) : subscriptionStatus?.hasSubscription === false && (
                  <div className="flex items-center gap-1 text-gray-500 bg-gray-50 px-2 py-1 rounded-full">
                    <span className="text-xs">No active subscription</span>
                  </div>
                )}
              </div>
              
              {/* Progress Bar */}
              {chapterProgress > 0 && (
                <div className="mt-3 max-w-md">
                  <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                    <span>Chapter Progress</span>
                    <span>{chapterProgress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-300 ${
                        isCompleted 
                          ? 'bg-gradient-to-r from-green-500 to-emerald-500' 
                          : chapterProgress >= 75 
                            ? 'bg-gradient-to-r from-orange-500 to-yellow-500'
                            : 'bg-gradient-to-r from-blue-500 to-purple-600'
                      }`}
                      style={{ width: `${chapterProgress}%` }}
                    ></div>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Action Buttons */}
            <div className="flex gap-2">
              <motion.button
                onClick={() => {
                  setShowQuizConfirmModal(true);
                  setActiveTab('quiz');
                }}
                disabled={mcqLoading}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl hover:from-purple-700 hover:to-blue-700 transition-all duration-200 disabled:opacity-50 font-medium shadow-lg"
              >
                <Brain className="w-4 h-4" />
                <span className="hidden sm:inline">Start Quiz</span>
              </motion.button>
            </div>
          </div>
        </div>
      </div>

      {/* Module Locked Warning */}
      {moduleAccess && moduleAccess.isLocked && (
        <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-orange-50 to-red-50 border-2 border-orange-300 rounded-2xl p-6 shadow-xl"
          >
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                <Lock className="w-6 h-6 text-orange-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-orange-900 mb-2">Module Locked</h3>
                <p className="text-orange-800 mb-4">{moduleAccess.reason}</p>
                <div className="bg-white/80 rounded-lg p-4 mb-4">
                  <p className="text-sm text-gray-700">
                    <strong>Unlocked Modules:</strong> {moduleAccess.unlockedModulesCount} of {module?.moduleId || '?'}
                  </p>
                  <p className="text-sm text-gray-600 mt-2">
                    Complete the unlocked modules and renew your subscription to access more content.
                  </p>
                </div>
                <button
                  onClick={() => router.push('/dashboard/student')}
                  className="px-6 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all font-medium"
                >
                  Go to Dashboard
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Two Column Layout - Only show if module is unlocked */}
      {(!moduleAccess || moduleAccess.hasAccess) && (
        <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100vh-180px)]">
            {/* Left Section - Video Player */}
            <div className="bg-white rounded-2xl shadow-xl border-2 border-purple-200 overflow-hidden flex flex-col">
              <div className="p-4 bg-gradient-to-r from-purple-500 to-pink-600">
                <h2 className="text-white font-bold text-lg flex items-center gap-2">
                  <Play className="w-5 h-5" />
                  Video Lesson
                </h2>
              </div>
              <div className="flex-1 p-4 flex items-center justify-center bg-gray-900">
                {videoId ? (
                  <div 
                    className="w-full aspect-video rounded-lg overflow-hidden shadow-2xl"
                    onMouseEnter={startVideoTracking}
                    onMouseLeave={stopVideoTracking}
                  >
                    <iframe
                      src={`https://www.youtube.com/embed/${videoId}?autoplay=1`}
                      title={chapter.chapterTitle}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      className="w-full h-full"
                      onLoad={() => {
                        // Start tracking when video loads
                        startVideoTracking();
                      }}
                    />
                  </div>
                ) : (
                  <div className="aspect-video w-full rounded-lg bg-gray-800 flex items-center justify-center">
                    <p className="text-gray-400">Invalid YouTube URL</p>
                  </div>
                )}
              </div>
              <div className="p-4 bg-gray-50 border-t border-gray-200">
                <p className="text-sm text-gray-600">{chapter.chapterDescription}</p>
              </div>
            </div>

          {/* Right Section - AI Chatbot or Quiz */}
          <div className="bg-white rounded-2xl shadow-xl border-2 border-pink-200 overflow-hidden flex flex-col">
            {/* Tab Switcher */}
            <div className="flex border-b border-gray-200 bg-gray-50">
              <button
                onClick={() => setActiveTab('chat')}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 font-medium transition-all ${
                  activeTab === 'chat'
                    ? 'bg-white text-purple-600 border-b-2 border-purple-600'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <MessageCircle className="w-5 h-5" />
                <span>Chat</span>
              </button>
              <button
                onClick={handleQuizTabClick}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 font-medium transition-all ${
                  activeTab === 'quiz'
                    ? 'bg-white text-purple-600 border-b-2 border-purple-600'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <Brain className="w-5 h-5" />
                <span>Quiz</span>
                {mcqQuestions.length > 0 && (
                  <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded-full">
                    {mcqQuestions.length}
                  </span>
                )}
              </button>
            </div>

            {activeTab === 'quiz' ? (
              /* Quiz Section */
              <>
                <div className="p-4 bg-gradient-to-r from-purple-600 to-blue-600">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-lg">
                        <Brain className="w-7 h-7 text-purple-600" />
                      </div>
                      <div>
                        <h2 className="text-white font-bold text-lg">Chapter Quiz</h2>
                        <p className="text-white/90 text-xs">Test your knowledge!</p>
                      </div>
                    </div>
                    {/* MCQ Credits Display */}
                    {subscriptionStatus?.hasSubscription && subscriptionStatus.usage && (
                      <div className={`backdrop-blur-sm rounded-lg px-3 py-2 border ${
                        subscriptionStatus.usage.monthlyMcqsRemaining === 0
                          ? 'bg-red-500/30 border-red-300/50'
                          : subscriptionStatus.usage.monthlyMcqsRemaining <= 1
                          ? 'bg-orange-500/30 border-orange-300/50'
                          : 'bg-white/20 border-white/30'
                      }`}>
                        <div className="flex items-center gap-2 text-white text-xs">
                          <Brain className="w-4 h-4" />
                          <span className="font-semibold">
                            {subscriptionStatus.usage.monthlyMcqsRemaining}/{subscriptionStatus.subscription?.monthlyMcqLimit || 0}
                          </span>
                          <span className="text-white/80">MCQs</span>
                          {subscriptionStatus.usage.monthlyMcqsRemaining === 0 && (
                            <span className="text-red-200 text-[10px]">Limit reached</span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {/* Error Message */}
                  {mcqError && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3"
                    >
                      <X className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-red-800 font-medium mb-1">Quiz Generation Error</p>
                        <p className="text-red-700 text-sm">{mcqError}</p>
                        <button
                          onClick={() => setMcqError(null)}
                          className="mt-2 text-xs text-red-600 hover:text-red-800 underline"
                        >
                          Dismiss
                        </button>
                      </div>
                    </motion.div>
                  )}

                  {mcqLoading ? (
                    <div className="flex flex-col items-center justify-center h-full gap-4">
                      <Loader2 className="w-12 h-12 animate-spin text-purple-600" />
                      <p className="text-gray-600 font-medium">Generating quiz questions...</p>
                      <p className="text-sm text-gray-500">This may take a few moments</p>
                    </div>
                  ) : mcqQuestions.length > 0 ? (
                    <>
                      {mcqQuestions.map((question, index) => (
                        <div key={index} className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl p-4 border border-gray-200">
                          <div className="flex items-center gap-2 mb-3">
                            <span className="px-3 py-1 bg-purple-100 text-purple-800 text-sm font-semibold rounded-full">
                              Q{question.Q}
                            </span>
                            <span className={`px-3 py-1 text-sm font-semibold rounded-full ${
                              question.level === 'Basic' ? 'bg-green-100 text-green-800' :
                              question.level === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {question.level}
                            </span>
                          </div>
                          
                          <h4 className="text-base font-semibold text-gray-900 mb-3">
                            {question.question}
                          </h4>
                          
                          <div className="space-y-2">
                            {question.options.map((option, optionIndex) => {
                              const isSelected = mcqAnswers[question.Q] === option;
                              const isCorrect = option === question.answer;
                              const isSubmitted = mcqSubmitted;
                              
                              return (
                                <label
                                  key={optionIndex}
                                  className={`flex items-center p-3 rounded-lg border-2 cursor-pointer transition-all ${
                                    isSelected
                                      ? 'border-purple-500 bg-purple-50'
                                      : 'border-gray-200 hover:border-gray-300'
                                  } ${
                                    isSubmitted && isCorrect
                                      ? 'border-green-500 bg-green-50'
                                      : isSubmitted && isSelected && !isCorrect
                                      ? 'border-red-500 bg-red-50'
                                      : ''
                                  }`}
                                >
                                  <input
                                    type="radio"
                                    name={`question-${question.Q}`}
                                    value={option}
                                    checked={isSelected}
                                    onChange={() => handleMCQAnswer(question.Q, option)}
                                    disabled={isSubmitted}
                                    className="mr-3"
                                  />
                                  <span className={`flex-1 ${
                                    isSubmitted && isCorrect
                                      ? 'text-green-800 font-semibold'
                                      : isSubmitted && isSelected && !isCorrect
                                      ? 'text-red-800 font-semibold'
                                      : 'text-gray-700'
                                  }`}>
                                    {option}
                                  </span>
                                  {isSubmitted && isCorrect && (
                                    <CheckCircle className="w-5 h-5 text-green-600" />
                                  )}
                                  {isSubmitted && isSelected && !isCorrect && (
                                    <X className="w-5 h-5 text-red-600" />
                                  )}
                                </label>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                      
                      {!mcqSubmitted && (
                        <div className="flex justify-center pt-4">
                          <button
                            onClick={submitMCQ}
                            disabled={Object.keys(mcqAnswers).length !== mcqQuestions.length}
                            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl hover:from-purple-700 hover:to-blue-700 transition-all disabled:opacity-50 font-semibold"
                          >
                            Submit Quiz ({Object.keys(mcqAnswers).length}/{mcqQuestions.length})
                          </button>
                        </div>
                      )}
                      
                      {mcqSubmitted && mcqScore !== null && (
                        <div className={`rounded-xl p-6 border-2 ${
                          mcqScore >= 75 
                            ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-300' 
                            : 'bg-gradient-to-r from-orange-50 to-yellow-50 border-orange-300'
                        }`}>
                          <div className="text-center">
                            <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4 ${
                              mcqScore >= 75 
                                ? 'bg-gradient-to-r from-green-500 to-emerald-500' 
                                : 'bg-gradient-to-r from-orange-500 to-yellow-500'
                            }`}>
                              {mcqScore >= 75 ? (
                                <Trophy className="w-8 h-8 text-white" />
                              ) : (
                                <Target className="w-8 h-8 text-white" />
                              )}
                            </div>
                            
                            <h3 className="text-2xl font-bold text-gray-900 mb-2">
                              {mcqScore >= 75 ? '🎉 Chapter Completed!' : 'Quiz Completed!'}
                            </h3>
                            
                            <div className={`text-4xl font-bold mb-2 ${
                              mcqScore >= 75 ? 'text-green-600' : 'text-orange-600'
                            }`}>
                              {mcqScore}%
                            </div>
                            
                            <p className="text-gray-600 mb-4">
                              {mcqScore >= 75 
                                ? `Excellent! You scored ${mcqScore}% and completed this chapter!`
                                : `You scored ${mcqScore}%. Keep practicing to reach 75% for completion!`
                              }
                            </p>
                            
                            <div className="flex gap-3 justify-center">
                              <button
                                onClick={resetMCQ}
                                className="px-4 py-2 bg-white text-gray-700 rounded-lg hover:bg-gray-50 border border-gray-300"
                              >
                                Retake Quiz
                              </button>
                              <button
                                onClick={() => {
                                  setActiveTab('chat');
                                  fetchChapterProgress();
                                }}
                                className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700"
                              >
                                Back to Chat
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-center py-12">
                      <Brain className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600 mb-4">No quiz questions available yet.</p>
                      <button
                        onClick={() => setShowQuizConfirmModal(true)}
                        className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl hover:from-purple-700 hover:to-blue-700 transition-all font-medium shadow-lg"
                      >
                        Generate Quiz
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              /* Chat Section */
              <>
                <div className="p-4 bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <motion.div
                        animate={{ 
                          rotate: [0, 10, -10, 0],
                          scale: [1, 1.1, 1]
                        }}
                        transition={{ 
                          duration: 2, 
                          repeat: Infinity,
                          repeatDelay: 3
                        }}
                        className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-lg"
                      >
                        <Bot className="w-7 h-7 text-purple-600" />
                      </motion.div>
                      <div>
                        <h2 className="text-white font-bold text-lg flex items-center gap-2">
                          AI Learning Buddy
                          <Sparkles className="w-5 h-5 text-yellow-300" />
                        </h2>
                        <p className="text-white/90 text-xs">Ask me anything about this lesson!</p>
                      </div>
                    </div>
                    {/* Chat Credits Display */}
                    {subscriptionStatus?.hasSubscription && subscriptionStatus.usage && (
                      <div className={`backdrop-blur-sm rounded-lg px-3 py-2 border ${
                        subscriptionStatus.usage.dailyChatsRemaining === 0
                          ? 'bg-red-500/30 border-red-300/50'
                          : subscriptionStatus.usage.dailyChatsRemaining <= 1
                          ? 'bg-orange-500/30 border-orange-300/50'
                          : 'bg-white/20 border-white/30'
                      }`}>
                        <div className="flex items-center gap-2 text-white text-xs">
                          <MessageCircle className="w-4 h-4" />
                          <span className="font-semibold">
                            {subscriptionStatus.usage.dailyChatsRemaining}/{subscriptionStatus.subscription?.dailyChatLimit || 0}
                          </span>
                          <span className="text-white/80">chats</span>
                          {subscriptionStatus.usage.dailyChatsRemaining === 0 && (
                            <span className="text-red-200 text-[10px]">Limit reached</span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto p-4 bg-gradient-to-b from-purple-50/50 to-pink-50/50 space-y-4">
              <AnimatePresence>
                {messages.map((message) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.3 }}
                    className={`flex gap-3 ${message.isUser ? 'justify-end' : 'justify-start'}`}
                  >
                    {!message.isUser && (
                      <div className="w-8 h-8 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center flex-shrink-0 shadow-md">
                        <Bot className="w-5 h-5 text-white" />
                      </div>
                    )}
                    <div
                      className={`max-w-[80%] rounded-2xl px-4 py-3 shadow-md ${
                        message.isUser
                          ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                          : 'bg-white text-gray-800 border-2 border-purple-200'
                      }`}
                    >
                      <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                        {message.content}
                      </p>
                    </div>
                    {message.isUser && (
                      <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-purple-400 rounded-full flex items-center justify-center flex-shrink-0 shadow-md">
                        <Star className="w-5 h-5 text-white" />
                      </div>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
              
              {isLoading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex gap-3 justify-start"
                >
                  <div className="w-8 h-8 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center flex-shrink-0 shadow-md">
                    <Bot className="w-5 h-5 text-white" />
                  </div>
                  <div className="bg-white rounded-2xl px-4 py-3 shadow-md border-2 border-purple-200">
                    <div className="flex gap-1">
                      <motion.div
                        animate={{ y: [0, -4, 0] }}
                        transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
                        className="w-2 h-2 bg-purple-500 rounded-full"
                      />
                      <motion.div
                        animate={{ y: [0, -4, 0] }}
                        transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
                        className="w-2 h-2 bg-pink-500 rounded-full"
                      />
                      <motion.div
                        animate={{ y: [0, -4, 0] }}
                        transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }}
                        className="w-2 h-2 bg-blue-500 rounded-full"
                      />
                    </div>
                  </div>
                </motion.div>
              )}
              <div ref={messagesEndRef} />
            </div>

              {/* Input Area */}
            <div className="p-4 bg-gradient-to-r from-purple-100 to-pink-100 border-t-2 border-purple-200">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask me anything about this lesson... 😊"
                  className="flex-1 px-4 py-3 rounded-xl border-2 border-purple-300 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200 bg-white text-gray-800 placeholder-gray-400"
                  disabled={isLoading || (subscriptionStatus?.hasSubscription && subscriptionStatus.usage && subscriptionStatus.usage.dailyChatsRemaining === 0)}
                />
                <motion.button
                  onClick={handleSendMessage}
                  disabled={isLoading || !inputMessage.trim() || (subscriptionStatus?.hasSubscription && subscriptionStatus.usage && subscriptionStatus.usage.dailyChatsRemaining === 0)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-medium"
                >
                  <Send className="w-5 h-5" />
                  <span className="hidden sm:inline">Send</span>
                </motion.button>
              </div>
              <div className="flex items-center justify-between mt-2">
                <p className="text-xs text-gray-500 text-center flex-1">
                  💡 Tip: Ask me to explain concepts, solve problems, or help with homework!
                </p>
                {subscriptionStatus?.hasSubscription && subscriptionStatus.usage && (
                  <div className="text-xs text-gray-600 ml-2">
                    {subscriptionStatus.usage.dailyChatsRemaining === 0 ? (
                      <span className="text-red-600 font-medium">Daily chat limit reached for this chapter</span>
                    ) : (
                      <span className="text-gray-600">
                        {subscriptionStatus.usage.dailyChatsRemaining} chat{subscriptionStatus.usage.dailyChatsRemaining !== 1 ? 's' : ''} remaining for this chapter today
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
              </>
            )}
          </div>
          </div>
        </div>
      )}

      {/* Quiz Confirmation Modal */}
      <AnimatePresence>
        {showQuizConfirmModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowQuizConfirmModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden"
            >
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-6 text-white">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                    <Brain className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">Generate Quiz</h3>
                    <p className="text-white/90 text-sm">Create a new quiz for this chapter</p>
                  </div>
                </div>
              </div>

              {/* Modal Content */}
              <div className="p-6">
                <p className="text-gray-700 mb-6">
                  Do you want to generate a new quiz for this chapter?
                </p>
                <p className="text-sm text-gray-500 mb-6">
                  A fresh quiz will be generated with new questions. Any previous quiz data will be replaced.
                </p>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowQuizConfirmModal(false)}
                    disabled={mcqLoading}
                    className="flex-1 px-4 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={generateMCQ}
                    disabled={mcqLoading || (subscriptionStatus?.hasSubscription && subscriptionStatus.usage && subscriptionStatus.usage.monthlyMcqsRemaining === 0)}
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl hover:from-purple-700 hover:to-blue-700 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {mcqLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Generating...
                      </>
                    ) : subscriptionStatus?.hasSubscription && subscriptionStatus.usage && subscriptionStatus.usage.monthlyMcqsRemaining === 0 ? (
                      <>
                        <X className="w-4 h-4" />
                        Limit Reached
                      </>
                    ) : (
                      <>
                        <Brain className="w-4 h-4" />
                        Generate Quiz
                      </>
                    )}
                  </button>
                  {subscriptionStatus?.hasSubscription && subscriptionStatus.usage && (
                    <p className="text-xs text-gray-500 text-center mt-2">
                      {subscriptionStatus.usage.monthlyMcqsRemaining === 0 ? (
                        <span className="text-red-600">Monthly MCQ limit reached for this chapter. You can still generate MCQs for other chapters.</span>
                      ) : (
                        <span>{subscriptionStatus.usage.monthlyMcqsRemaining} MCQ{subscriptionStatus.usage.monthlyMcqsRemaining !== 1 ? 's' : ''} remaining for this chapter this month</span>
                      )}
                    </p>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
