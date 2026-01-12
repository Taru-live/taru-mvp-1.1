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
  TrendingUp
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

  // Progress state
  const [chapterProgress, setChapterProgress] = useState<number>(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [videoWatchTime, setVideoWatchTime] = useState(0);
  const [videoDuration, setVideoDuration] = useState(0);
  const videoWatchIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    fetchUserData();
  }, []);

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

  // Generate MCQ quiz
  const generateMCQ = async () => {
    if (!chapterId) return;

    // If questions already exist, just switch to quiz tab
    if (mcqQuestions.length > 0) {
      setActiveTab('quiz');
      return;
    }

    setMcqLoading(true);
    setMcqAnswers({});
    setMcqSubmitted(false);
    setMcqScore(null);
    setActiveTab('quiz');

    try {
      const response = await fetch('/api/webhook/generate-mcq', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ chapterId: chapterId }),
      });

      if (response.ok) {
        const result = await response.json();
        setMcqQuestions(result.questions || []);
      } else {
        const errorData = await response.json();
        console.error('Failed to generate MCQ:', errorData);
      }
    } catch (error) {
      console.error('Error generating MCQ:', error);
    } finally {
      setMcqLoading(false);
    }
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
              <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
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
                onClick={generateMCQ}
                disabled={mcqLoading}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl hover:from-purple-700 hover:to-blue-700 transition-all duration-200 disabled:opacity-50 font-medium shadow-lg"
              >
                {mcqLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Brain className="w-4 h-4" />
                )}
                <span className="hidden sm:inline">Start Quiz</span>
              </motion.button>
            </div>
          </div>
        </div>
      </div>

      {/* Two Column Layout */}
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
                onClick={() => {
                  setActiveTab('quiz');
                  if (mcqQuestions.length === 0) {
                    generateMCQ();
                  }
                }}
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
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-lg">
                      <Brain className="w-7 h-7 text-purple-600" />
                    </div>
                    <div>
                      <h2 className="text-white font-bold text-lg">Chapter Quiz</h2>
                      <p className="text-white/90 text-xs">Test your knowledge!</p>
                    </div>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {mcqLoading ? (
                    <div className="flex items-center justify-center h-full">
                      <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
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
                      <p className="text-gray-600">No quiz questions available. Click Quiz to generate!</p>
                    </div>
                  )}
                </div>
              </>
            ) : (
              /* Chat Section */
              <>
                <div className="p-4 bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500">
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
                  disabled={isLoading}
                />
                <motion.button
                  onClick={handleSendMessage}
                  disabled={isLoading || !inputMessage.trim()}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-medium"
                >
                  <Send className="w-5 h-5" />
                  <span className="hidden sm:inline">Send</span>
                </motion.button>
              </div>
              <p className="text-xs text-gray-500 mt-2 text-center">
                💡 Tip: Ask me to explain concepts, solve problems, or help with homework!
              </p>
            </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
