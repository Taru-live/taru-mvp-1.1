'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  BookOpen, 
  FileText, 
  ChevronRight, 
  Grid3X3, 
  List,
  ArrowLeft,
  Play
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

export default function YouTubeModulePage() {
  const router = useRouter();
  const params = useParams();
  const moduleId = params?.moduleId as string;
  
  const [module, setModule] = useState<Module | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [uniqueId, setUniqueId] = useState<string | null>(null);
  const [expandedSubmodules, setExpandedSubmodules] = useState<Set<number>>(new Set());

  useEffect(() => {
    fetchUserData();
  }, []);

  useEffect(() => {
    if (uniqueId) {
      fetchModuleData();
    }
  }, [moduleId, uniqueId]);

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
      console.log('🔄 Transforming data:', data);
      
      // Check if data is already in the new format
      if (data.modules && Array.isArray(data.modules) && data.modules.length > 0) {
        // Check if it's the new format (has modules with submodules and chapters)
        const firstModule = data.modules[0];
        if (firstModule.submodules && Array.isArray(firstModule.submodules)) {
          console.log('✅ Data already in hierarchical format');
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
        console.log('🔄 Transforming from flat chapters format');
        // Group chapters into modules and submodules
        const modules: Module[] = [];
        let currentModuleId = 1;
        let currentSubmoduleId = 1;
        let chapterCounter = 1;
        
        // Group chapters into modules (every 4 chapters = 1 module, 2 chapters = 1 submodule)
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
        
        console.log('✅ Transformed to hierarchical format:', modules.length, 'modules');
        return {
          uniqueid: data.uniqueid || data.uniqueId || uniqueId || '',
          modules,
          _id: data._id,
          createdAt: data.createdAt,
          updatedAt: data.updatedAt
        };
      }

      // If data is an array (API might return array directly)
      if (Array.isArray(data) && data.length > 0) {
        const studentData = data[0];
        if (studentData.modules && Array.isArray(studentData.modules)) {
          console.log('✅ Data is array format');
          return {
            uniqueid: studentData.uniqueid,
            modules: studentData.modules
          };
        }
      }

      console.warn('⚠️ Could not transform data, returning null');
      return null;
    } catch (error) {
      console.error('Error transforming data:', error);
      return null;
    }
  };

  const fetchModuleData = async () => {
    if (!uniqueId) {
      console.log('⏳ Waiting for uniqueId...');
      return;
    }
    
    try {
      console.log('🔍 Fetching module data for uniqueId:', uniqueId);
      const response = await fetch(`/api/youtube-urls?uniqueid=${encodeURIComponent(uniqueId)}`);
      console.log('📡 API response status:', response.status);
      
      if (response.ok) {
        const result = await response.json();
        console.log('📊 API result:', result);
        
        if (result.data) {
          // Transform data to hierarchical format
          const transformedData = transformToHierarchicalFormat(result.data);
          console.log('🔄 Transformed data:', transformedData);
          
          if (transformedData && transformedData.modules && transformedData.modules.length > 0) {
            const modules = transformedData.modules;
            console.log('🔍 Looking for moduleId:', moduleId, 'Available modules:', modules.map((m: Module) => ({ id: m.moduleId, title: m.moduleTitle })));
            const foundModule = modules.find((m: Module) => m.moduleId.toString() === moduleId);
            if (foundModule) {
              console.log('✅ Module found:', foundModule.moduleTitle);
              setModule(foundModule);
            } else {
              console.error('❌ Module not found. Available modules:', modules.map((m: Module) => ({ id: m.moduleId, title: m.moduleTitle })));
            }
          } else {
            // Try direct access if transformation returns null
            const modules = result.data?.modules || result.modules || [];
            console.log('🔍 Trying direct access. Modules:', modules.length);
            if (modules.length > 0) {
              const foundModule = modules.find((m: Module) => m.moduleId.toString() === moduleId);
              if (foundModule) {
                console.log('✅ Module found via direct access');
                setModule(foundModule);
              } else {
                console.error('❌ Module not found. Available modules:', modules.map((m: Module) => ({ id: m.moduleId, title: m.moduleTitle })));
              }
            } else {
              console.error('❌ No modules found in response');
            }
          }
        } else {
          console.error('❌ No data in API response');
        }
      } else {
        console.error('❌ API response not OK:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('❌ Error fetching module data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmoduleClick = (submoduleId: number) => {
    router.push(`/modules/youtube/${moduleId}/submodule/${submoduleId}`);
  };

  const handleChapterClick = (chapterId: number, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    router.push(`/modules/youtube/${moduleId}/chapter/${chapterId}`);
  };

  const toggleSubmoduleExpansion = (submoduleId: number, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    setExpandedSubmodules(prev => {
      const newSet = new Set(prev);
      if (newSet.has(submoduleId)) {
        newSet.delete(submoduleId);
      } else {
        newSet.add(submoduleId);
      }
      return newSet;
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading module...</p>
        </div>
      </div>
    );
  }

  if (!module) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Module not found</p>
          <button
            onClick={() => router.push('/dashboard/student')}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push('/dashboard/student')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Dashboard</span>
          </button>
          
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between gap-4 mb-4">
              <div className="flex items-center gap-4 flex-1">
                <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl">
                  <BookOpen className="w-8 h-8 text-white" />
                </div>
                <div className="flex-1">
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">
                    {module.moduleTitle}
                  </h1>
                  <p className="text-gray-600">{module.moduleDescription}</p>
                </div>
              </div>

              {/* View Mode Toggle - Aligned with title */}
              <div className="flex items-center gap-2">
                <div className="flex bg-gray-100 rounded-xl p-1">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-2 rounded-lg transition-colors ${
                      viewMode === 'grid' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'
                    }`}
                  >
                    <Grid3X3 className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-2 rounded-lg transition-colors ${
                      viewMode === 'list' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'
                    }`}
                  >
                    <List className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Submodules Display */}
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {module.submodules.map((submodule) => (
              <motion.div
                key={submodule.submoduleId}
                className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden cursor-pointer hover:shadow-xl transition-shadow"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ y: -5 }}
                onClick={() => handleSubmoduleClick(submodule.submoduleId)}
              >
                <div className="p-6">
                  <div className="flex items-center justify-center mb-4">
                    <div className="p-4 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl">
                      <FileText className="w-8 h-8 text-white" />
                    </div>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2 text-center">
                    {submodule.submoduleTitle}
                  </h3>
                  <p className="text-gray-600 text-sm mb-4 text-center line-clamp-3">
                    {submodule.submoduleDescription}
                  </p>
                  <div className="flex items-center justify-center text-sm text-gray-500">
                    <span>{submodule.chapters.length} chapters</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="space-y-6">
            {module.submodules.map((submodule) => {
              const isExpanded = expandedSubmodules.has(submodule.submoduleId);
              return (
                <div key={submodule.submoduleId} className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
                  <div
                    className="p-6 cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={(e) => toggleSubmoduleExpansion(submodule.submoduleId, e)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 flex-1">
                        <div className="p-3 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl">
                          <FileText className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-xl font-bold text-gray-900 mb-1">
                            {submodule.submoduleTitle}
                          </h3>
                          <p className="text-gray-600 text-sm">{submodule.submoduleDescription}</p>
                          <span className="text-xs text-gray-500 mt-1 inline-block">
                            {submodule.chapters.length} chapters
                          </span>
                        </div>
                      </div>
                      <ChevronRight 
                        className={`w-6 h-6 text-gray-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                      />
                    </div>
                  </div>
                  
                  {/* Chapters List */}
                  {isExpanded && (
                    <div className="border-t border-gray-200 bg-gray-50/50">
                      <div className="p-4 space-y-2">
                        {submodule.chapters.map((chapter) => (
                          <div
                            key={chapter.chapterId}
                            className="bg-white rounded-lg p-4 hover:bg-gray-50 transition-colors cursor-pointer border border-gray-200"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleChapterClick(chapter.chapterId, e);
                            }}
                          >
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg">
                                <Play className="w-4 h-4 text-white" />
                              </div>
                              <div className="flex-1">
                                <h4 className="font-semibold text-gray-900 mb-1">
                                  {chapter.chapterTitle}
                                </h4>
                                <p className="text-sm text-gray-600 line-clamp-2">
                                  {chapter.chapterDescription}
                                </p>
                              </div>
                              <ChevronRight className="w-5 h-5 text-gray-400" />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
