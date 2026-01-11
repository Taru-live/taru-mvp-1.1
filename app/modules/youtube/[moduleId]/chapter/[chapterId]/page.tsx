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
  Heart
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

  useEffect(() => {
    fetchUserData();
  }, []);

  useEffect(() => {
    if (uniqueId) {
      fetchChapterData();
    }
  }, [moduleId, chapterId, uniqueId]);

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
            <div>
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
              </div>
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
                <div className="w-full aspect-video rounded-lg overflow-hidden shadow-2xl">
                  <iframe
                    src={`https://www.youtube.com/embed/${videoId}?autoplay=1`}
                    title={chapter.chapterTitle}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="w-full h-full"
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

          {/* Right Section - AI Chatbot */}
          <div className="bg-white rounded-2xl shadow-xl border-2 border-pink-200 overflow-hidden flex flex-col">
            {/* Chat Header */}
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
          </div>
        </div>
      </div>
    </div>
  );
}
