'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  ArrowLeft,
  Play,
  Clock,
  BookOpen,
  FileText,
  Star,
  Grid3X3,
  List,
  Trophy,
  Zap
} from 'lucide-react';

interface Chapter {
  chapterId: number;
  chapterTitle: string;
  chapterDescription: string;
  youtubeUrl: string;
  duration?: string;
  youtubeTitle?: string;
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

export default function SubmodulePage() {
  const router = useRouter();
  const params = useParams();
  const moduleId = params?.moduleId as string;
  const submoduleId = params?.submoduleId as string;
  
  const [module, setModule] = useState<Module | null>(null);
  const [submodule, setSubmodule] = useState<Submodule | null>(null);
  const [loading, setLoading] = useState(true);
  const [uniqueId, setUniqueId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  useEffect(() => {
    fetchUserData();
  }, []);

  useEffect(() => {
    if (uniqueId) {
      fetchSubmoduleData();
    }
  }, [moduleId, submoduleId, uniqueId]);

  const fetchUserData = async () => {
    try {
      const response = await fetch('/api/student/profile');
      if (response.ok) {
        const data = await response.json();
        if (data.uniqueId) {
          setUniqueId(data.uniqueId);
        }
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  const transformToHierarchicalFormat = (data: any): any => {
    try {
      // Check if data is already in the new format
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

      // Transform from old format (flat chapters) to new format
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
            const chapters: Chapter[] = submoduleChapters.map((ch: any) => ({
              chapterId: chapterCounter++,
              chapterTitle: ch.videoTitle || ch.chapterTitle || `Chapter ${chapterCounter - 1}`,
              chapterDescription: ch.chapterDescription || `Learn about ${ch.videoTitle || 'this topic'}`,
              youtubeUrl: ch.videoUrl || ch.youtubeUrl || '',
              duration: ch.duration,
              youtubeTitle: ch.videoTitle || ch.youtubeTitle
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

  const fetchSubmoduleData = async () => {
    if (!uniqueId) return;
    
    try {
      const response = await fetch(`/api/youtube-urls?uniqueid=${encodeURIComponent(uniqueId)}`);
      if (response.ok) {
        const result = await response.json();
        
        if (result.data) {
          const transformedData = transformToHierarchicalFormat(result.data);
          
          if (transformedData && transformedData.modules) {
            const modules = transformedData.modules;
            const foundModule = modules.find((m: Module) => m.moduleId.toString() === moduleId);
            if (foundModule) {
              setModule(foundModule);
              const foundSubmodule = foundModule.submodules.find(
                (sm: Submodule) => sm.submoduleId.toString() === submoduleId
              );
              if (foundSubmodule) {
                setSubmodule(foundSubmodule);
              }
            }
          } else {
            const modules = result.data?.modules || result.modules || [];
            if (modules.length > 0) {
              const foundModule = modules.find((m: Module) => m.moduleId.toString() === moduleId);
              if (foundModule) {
                setModule(foundModule);
                const foundSubmodule = foundModule.submodules.find(
                  (sm: Submodule) => sm.submoduleId.toString() === submoduleId
                );
                if (foundSubmodule) {
                  setSubmodule(foundSubmodule);
                }
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('Error fetching submodule data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChapterClick = (chapterId: number) => {
    router.push(`/modules/youtube/${moduleId}/chapter/${chapterId}`);
  };

  const getVideoId = (url: string) => {
    const match = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
    return match ? match[1] : null;
  };

  // Color palette for kids
  const colors = [
    { bg: 'from-pink-400 to-rose-400', border: 'border-pink-300', icon: 'bg-pink-500' },
    { bg: 'from-blue-400 to-cyan-400', border: 'border-blue-300', icon: 'bg-blue-500' },
    { bg: 'from-purple-400 to-indigo-400', border: 'border-purple-300', icon: 'bg-purple-500' },
    { bg: 'from-green-400 to-emerald-400', border: 'border-green-300', icon: 'bg-green-500' },
    { bg: 'from-yellow-400 to-orange-400', border: 'border-yellow-300', icon: 'bg-yellow-500' },
    { bg: 'from-red-400 to-pink-400', border: 'border-red-300', icon: 'bg-red-500' },
    { bg: 'from-indigo-400 to-purple-400', border: 'border-indigo-300', icon: 'bg-indigo-500' },
    { bg: 'from-teal-400 to-cyan-400', border: 'border-teal-300', icon: 'bg-teal-500' },
    { bg: 'from-orange-400 to-red-400', border: 'border-orange-300', icon: 'bg-orange-500' },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-100 via-pink-100 to-blue-100">
        <div className="text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full mx-auto mb-4"
          />
          <p className="text-purple-700 text-lg font-semibold">Loading fun lessons...</p>
        </div>
      </div>
    );
  }

  if (!module || !submodule) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-100 via-pink-100 to-blue-100">
        <div className="text-center">
          <p className="text-gray-700 mb-4 text-lg">Submodule not found</p>
          <button
            onClick={() => router.push(`/modules/youtube/${moduleId}`)}
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full hover:shadow-lg transition-all font-semibold"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 py-8">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full opacity-20"
            style={{
              width: `${100 + i * 50}px`,
              height: `${100 + i * 50}px`,
              background: `linear-gradient(135deg, ${['#a855f7', '#ec4899', '#3b82f6', '#10b981', '#f59e0b', '#ef4444'][i]}40, ${['#ec4899', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#a855f7'][i]}40)`,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -30, 0],
              x: [0, 20, 0],
              scale: [1, 1.2, 1],
            }}
            transition={{
              duration: 3 + i,
              repeat: Infinity,
              ease: "easeInOut",
              delay: i * 0.5,
            }}
          />
        ))}
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between gap-2 mb-4">
            <button
              onClick={() => router.push(`/modules/youtube/${moduleId}`)}
              className="flex items-center focus:outline-none gap-2 text-purple-700 hover:text-purple-900 font-semibold transition-colors "
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Back to Module</span>
            </button>

            {/* View Mode Toggle - Mobile: Right side of back button */}
            <div className="flex items-center gap-2 sm:hidden">
              <div className="flex bg-gradient-to-r from-purple-100 to-pink-100 rounded-xl p-1 border-2 border-purple-200">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-lg transition-all duration-200 ${
                    viewMode === 'grid' 
                      ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg scale-105' 
                      : 'hover:bg-purple-200 text-purple-600'
                  }`}
                >
                  <Grid3X3 className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-lg transition-all duration-200 ${
                    viewMode === 'list' 
                      ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg scale-105' 
                      : 'hover:bg-purple-200 text-purple-600'
                  }`}
                >
                  <List className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
          
          <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl border-4 border-purple-200 p-6 sm:p-8">
            <div className="flex items-center justify-between gap-4 mb-4">
              <div className="flex items-center gap-4 flex-1">
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="p-4 bg-gradient-to-br from-purple-500 via-pink-500 to-blue-500 rounded-2xl shadow-lg"
                >
                  <FileText className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
                </motion.div>
                <div className="flex-1">
                  <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent mb-2">
                    {submodule.submoduleTitle}
                  </h1>
                  <p className="text-gray-700 text-sm sm:text-base">{submodule.submoduleDescription}</p>
                  <div className="flex items-center gap-4 mt-3">
                    <div className="flex items-center gap-1 text-purple-600">
                      <BookOpen className="w-4 h-4" />
                      <span className="text-sm font-semibold">{submodule.chapters.length} Lessons</span>
                    </div>
                    <div className="flex items-center gap-1 text-yellow-600">
                      <Trophy className="w-4 h-4" />
                      <span className="text-sm font-semibold">Earn XP</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* View Mode Toggle - Desktop: Aligned with title */}
              <div className="hidden sm:flex items-center gap-2">
                <div className="flex bg-gradient-to-r from-purple-100 to-pink-100 rounded-xl p-1 border-2 border-purple-200">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-2 rounded-lg transition-all duration-200 ${
                      viewMode === 'grid' 
                        ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg scale-105' 
                        : 'hover:bg-purple-200 text-purple-600'
                    }`}
                  >
                    <Grid3X3 className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-2 rounded-lg transition-all duration-200 ${
                      viewMode === 'list' 
                        ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg scale-105' 
                        : 'hover:bg-purple-200 text-purple-600'
                    }`}
                  >
                    <List className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Chapters Display - Grid or List */}
        {viewMode === 'grid' ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
          >
          {submodule.chapters.map((chapter, index) => {
            const videoId = getVideoId(chapter.youtubeUrl);
            const colorScheme = colors[index % colors.length];
            
            return (
              <motion.div
                key={chapter.chapterId}
                initial={{ opacity: 0, scale: 0.8, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ delay: 0.1 * index, type: "spring", stiffness: 200 }}
                whileHover={{ scale: 1.05, y: -5 }}
                className="group cursor-pointer"
                onClick={() => handleChapterClick(chapter.chapterId)}
              >
                <div className={`bg-gradient-to-br ${colorScheme.bg} rounded-3xl shadow-xl border-4 ${colorScheme.border} overflow-hidden h-full transition-all duration-300 hover:shadow-2xl`}>
                  {/* Video Thumbnail */}
                  <div className="relative aspect-video bg-gradient-to-br from-gray-800 to-gray-900 overflow-hidden">
                    {videoId ? (
                      <img
                        src={`https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`}
                        alt={chapter.chapterTitle}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Play className="w-16 h-16 text-white opacity-50" />
                      </div>
                    )}
                    
                    {/* Play Button Overlay */}
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/30 transition-colors">
                      <motion.div
                        className={`${colorScheme.icon} rounded-full p-4 shadow-2xl`}
                        whileHover={{ scale: 1.2 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        <Play className="w-8 h-8 text-white fill-white" />
                      </motion.div>
                    </div>

                    {/* Number Badge */}
                    <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm rounded-full w-10 h-10 flex items-center justify-center shadow-lg">
                      <span className="text-lg font-bold text-purple-600">{index + 1}</span>
                    </div>
                  </div>

                  {/* Chapter Info */}
                  <div className="p-5">
                    <h3 className="text-lg sm:text-xl font-bold text-white mb-2 line-clamp-2 min-h-[3.5rem]">
                      {chapter.chapterTitle || chapter.youtubeTitle || `Lesson ${index + 1}`}
                    </h3>
                    <p className="text-white/90 text-sm mb-3 line-clamp-2 min-h-[2.5rem]">
                      {chapter.chapterDescription || 'Learn something amazing!'}
                    </p>
                    
                    {/* Duration Badge */}
                    {chapter.duration && (
                      <div className="flex items-center gap-2 text-white/80 text-xs">
                        <Clock className="w-4 h-4" />
                        <span>{chapter.duration}</span>
                      </div>
                    )}

                    {/* Star Rating */}
                    <div className="flex items-center gap-1 mt-3">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-4 h-4 ${i < 4 ? 'text-yellow-300 fill-yellow-300' : 'text-white/30'}`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="space-y-4"
          >
            {submodule.chapters.map((chapter, index) => {
              const videoId = getVideoId(chapter.youtubeUrl);
              const colorScheme = colors[index % colors.length];
              
              return (
                <motion.div
                  key={chapter.chapterId}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 * index, type: "spring", stiffness: 200 }}
                  whileHover={{ scale: 1.02, x: 5 }}
                  className="group cursor-pointer"
                  onClick={() => handleChapterClick(chapter.chapterId)}
                >
                  <div className={`bg-gradient-to-r ${colorScheme.bg} rounded-2xl shadow-xl border-4 ${colorScheme.border} overflow-hidden transition-all duration-300 hover:shadow-2xl`}>
                    <div className="flex flex-col sm:flex-row">
                      {/* Video Thumbnail */}
                      <div className="relative w-full sm:w-64 h-48 sm:h-auto bg-gradient-to-br from-gray-800 to-gray-900 overflow-hidden flex-shrink-0">
                        {videoId ? (
                          <img
                            src={`https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`}
                            alt={chapter.chapterTitle}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
                            }}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Play className="w-16 h-16 text-white opacity-50" />
                          </div>
                        )}
                        
                        {/* Play Button Overlay */}
                        <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/30 transition-colors">
                          <motion.div
                            className={`${colorScheme.icon} rounded-full p-3 shadow-2xl`}
                            whileHover={{ scale: 1.2 }}
                            whileTap={{ scale: 0.9 }}
                          >
                            <Play className="w-6 h-6 text-white fill-white" />
                          </motion.div>
                        </div>

                        {/* Number Badge */}
                        <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm rounded-full w-10 h-10 flex items-center justify-center shadow-lg">
                          <span className="text-lg font-bold text-purple-600">{index + 1}</span>
                        </div>
                      </div>

                      {/* Chapter Info */}
                      <div className="p-5 flex-1 flex flex-col justify-between">
                        <div>
                          <h3 className="text-xl sm:text-2xl font-bold text-white mb-2">
                            {chapter.chapterTitle || chapter.youtubeTitle || `Lesson ${index + 1}`}
                          </h3>
                          <p className="text-white/90 text-sm sm:text-base mb-3">
                            {chapter.chapterDescription || 'Learn something amazing!'}
                          </p>
                        </div>
                        
                        <div className="flex items-center justify-between flex-wrap gap-3">
                          {/* Duration Badge */}
                          {chapter.duration && (
                            <div className="flex items-center gap-2 text-white/90 text-sm bg-white/20 px-3 py-1.5 rounded-full">
                              <Clock className="w-4 h-4" />
                              <span>{chapter.duration}</span>
                            </div>
                          )}

                          {/* Star Rating */}
                          <div className="flex items-center gap-1">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`w-4 h-4 ${i < 4 ? 'text-yellow-300 fill-yellow-300' : 'text-white/30'}`}
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}

        {/* Fun Footer Message */}
        {submodule.chapters.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mt-12 text-center"
          >
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border-4 border-purple-200 shadow-xl">
              <p className="text-lg font-bold text-purple-700 mb-2">
                🎉 {submodule.chapters.length} Amazing Lessons Waiting for You!
              </p>
              <p className="text-gray-600 text-sm">
                Click on any lesson card to start learning and have fun! 🚀
              </p>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
