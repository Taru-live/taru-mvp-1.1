'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Play, 
  BookOpen, 
  MessageCircle, 
  Brain, 
  Loader2, 
  RefreshCw, 
  AlertCircle, 
  AlertTriangle,
  CheckCircle,
  Star,
  Clock,
  Trophy,
  Sparkles,
  Video,
  FileText,
  Users,
  TrendingUp,
  ChevronRight,
  X,
  Search,
  Filter,
  Grid3X3,
  List,
  PlayCircle,
  PauseCircle,
  Volume2,
  Maximize2,
  Share2,
  Heart,
  Bookmark,
  BookmarkCheck,
  Download,
  Eye,
  Target,
  Zap,
  Award,
  Lightbulb,
  Rocket,
  Globe,
  Lock,
  Unlock,
  ThumbsUp,
  Share,
  ExternalLink
} from 'lucide-react';
import N8NLoadingIndicator from '@/app/components/N8NLoadingIndicator';

interface Chapter {
  chapterId: number;
  chapterTitle: string;
  chapterDescription: string;
  youtubeUrl: string;
  youtubeTitle: string;
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

interface StudentModulesData {
  uniqueid: string;
  modules: Module[];
}

interface YoutubeData {
  _id?: string;
  uniqueid: string;
  modules: Module[];
  createdAt?: string;
  updatedAt?: string;
}

interface MCQQuestion {
  Q: string;
  level: string;
  question: string;
  options: string[];
  answer: string;
}

interface ModulesTabProps {
  user: {
    uniqueId?: string | null;
    fullName?: string;
    classGrade?: string;
    
  } | null;
}

export default function ModulesTab({ user }: ModulesTabProps) {
  const [youtubeData, setYoutubeData] = useState<YoutubeData | null>(null);
  const [loading, setLoading] = useState(false);
  const [scraping, setScraping] = useState(false);
  const [selectedChapter, setSelectedChapter] = useState<number | null>(null);
  const [expandedModules, setExpandedModules] = useState<Set<number>>(new Set());
  const [expandedSubmodules, setExpandedSubmodules] = useState<Set<string>>(new Set());
  const [mcqQuestions, setMcqQuestions] = useState<MCQQuestion[]>([]);
  const [mcqLoading, setMcqLoading] = useState(false);
  const [mcqAnswers, setMcqAnswers] = useState<Record<string, string>>({});
  const [mcqSubmitted, setMcqSubmitted] = useState(false);
  const [mcqScore, setMcqScore] = useState<number | null>(null);
  const [chatQuery, setChatQuery] = useState('');
  const [chatResponse, setChatResponse] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [showMcq, setShowMcq] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterLevel, setFilterLevel] = useState<'all' | 'basic' | 'intermediate' | 'advanced'>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'title'>('newest');
  const [playingVideo, setPlayingVideo] = useState<string | null>(null);
  const [progress, setProgress] = useState<Record<string, number>>({});
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [completedModules, setCompletedModules] = useState<Set<string>>(new Set());
  const [hoveredVideo, setHoveredVideo] = useState<string | null>(null);
  const [bookmarkedVideos, setBookmarkedVideos] = useState<Set<string>>(new Set());
  const [likedVideos, setLikedVideos] = useState<Set<string>>(new Set());
  const [showVideoControls, setShowVideoControls] = useState<string | null>(null);
  const [showScrollToTop, setShowScrollToTop] = useState(false);
  
  // N8N Loading Indicator states
  const [n8nStatus, setN8nStatus] = useState<'idle' | 'triggering' | 'processing' | 'checking' | 'completed' | 'error'>('idle');
  const [n8nProgress, setN8nProgress] = useState(0);
  const [n8nMessage, setN8nMessage] = useState('');
  const [showN8nIndicator, setShowN8nIndicator] = useState(false);
  const [n8nStartTime, setN8nStartTime] = useState<number | null>(null);
  const [isFirstTimeGeneration, setIsFirstTimeGeneration] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [deletionOccurred, setDeletionOccurred] = useState(false);
  const [generationFailed, setGenerationFailed] = useState(false);

  // Fetch YouTube data on component mount
  useEffect(() => {
    if (user?.uniqueId) {
      fetchYouTubeData();
      fetchProgressData();
    }
  }, [user?.uniqueId]);

  // Also fetch progress data when component mounts (in case user?.uniqueId is not available initially)
  useEffect(() => {
    if (user?.uniqueId) {
      fetchProgressData();
    }
  }, [user?.uniqueId]);

  // Fetch progress data for all chapters
  const fetchProgressData = async () => {
    if (!user?.uniqueId) {
      console.log('❌ No user uniqueId available for fetching progress');
      return;
    }
    
    console.log('🔄 Fetching progress data for student:', user.uniqueId);
    
    try {
      const response = await fetch(`/api/modules/progress?studentId=${user.uniqueId}`);
      console.log('📡 Progress API response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('📊 Fetched progress data:', data);
        
        if (data.success && data.progress && data.progress.length > 0) {
          const progressMap: Record<string, number> = {};
          const completedSet = new Set<string>();
          
          data.progress.forEach((module: any) => {
            console.log('📝 Processing module:', module);
            console.log('🔍 Module ID from API:', module.moduleId);
            // Use quiz score as progress percentage
            const progressPercentage = module.quizScore || 0;
            progressMap[module.moduleId] = progressPercentage;
            console.log('📊 Setting progress for', module.moduleId, 'to', progressPercentage);
            
            // Mark as completed if score >= 75% OR if completedAt exists
            const isCompleted = progressPercentage >= 75 || module.completedAt;
            if (isCompleted) {
              completedSet.add(module.moduleId);
              console.log('✅ Module marked as completed:', module.moduleId, {
                score: progressPercentage,
                completedAt: module.completedAt,
                isCompleted
              });
            } else {
              console.log('⚠️ Module not completed:', module.moduleId, {
                score: progressPercentage,
                completedAt: module.completedAt
              });
            }
          });
          
          console.log('✅ Final progress map:', progressMap);
          console.log('✅ Completed modules:', Array.from(completedSet));
          
          setProgress(progressMap);
          setCompletedModules(completedSet);
        } else {
          console.log('⚠️ No progress data found or empty progress array');
          setProgress({});
          setCompletedModules(new Set());
        }
      } else {
        console.error('❌ Failed to fetch progress data:', response.status, response.statusText);
        const errorText = await response.text();
        console.error('❌ Error response:', errorText);
      }
    } catch (error) {
      console.error('❌ Error fetching progress data:', error);
    }
  };

  // Database check function
  const checkDatabaseForModules = async (): Promise<boolean> => {
    if (!user?.uniqueId) return false;
    
    try {
      const response = await fetch(`/api/youtube-urls?uniqueid=${encodeURIComponent(user.uniqueId)}`);
      
      if (response.ok) {
        const result = await response.json();
        // Check if we have actual data (not fallback) and modules exist
        if (result.success && result.data && result.data.chapters && result.data.chapters.length > 0) {
          console.log('✅ Database check: Modules found in database');
          return true;
        }
      }
      
      console.log('⏳ Database check: No modules found yet');
      return false;
    } catch (error) {
      console.error('❌ Database check error:', error);
      return false;
    }
  };

  // Status validation function - removed timeout restrictions
  const validateN8nStatus = (currentStatus: string, startTime: number | null) => {
    // No timeout restrictions - let the process continue until completion
    return currentStatus;
  };

  // Handle database check completion
  const handleDatabaseCheckComplete = (hasModules: boolean) => {
    if (hasModules) {
      console.log('✅ Database check successful: Modules found, marking as completed');
      setN8nStatus('completed');
      setN8nProgress(100);
      setN8nMessage('Your learning modules are ready!');
      
      // Refresh the YouTube data to show the new modules
      fetchYouTubeData();
      
      // Hide indicator after 2 minutes
      setTimeout(() => {
        setShowN8nIndicator(false);
      }, 120000);
    } else {
      console.log('❌ Database check failed: No modules found after all attempts');
      setN8nStatus('error');
      setN8nMessage('Failed to generate learning modules. Please try again.');
      
      // Hide indicator after 5 seconds
      setTimeout(() => {
        setShowN8nIndicator(false);
      }, 5000);
    }
  };

  // Cleanup effect for N8N polling
  useEffect(() => {
    return () => {
      // Cleanup any ongoing polling when component unmounts
      setShowN8nIndicator(false);
      setN8nStatus('idle');
    };
  }, []);

  // Effect to lock background scrolling when modals are open
  useEffect(() => {
    const lockScroll = () => {
      // Store original overflow value
      const originalOverflow = document.body.style.overflow;
      const originalPaddingRight = document.body.style.paddingRight;
      
      // Lock background scrolling
      document.body.style.overflow = 'hidden';
      document.body.style.paddingRight = '0px';
      
      // Store original values for cleanup
      return () => {
        document.body.style.overflow = originalOverflow;
        document.body.style.paddingRight = originalPaddingRight;
      };
    };

    if (showChat || showMcq) {
      const cleanup = lockScroll();
      
      // Cleanup function
      return cleanup;
    } else {
      // Restore scrolling when modals are closed
      document.body.style.overflow = 'unset';
      document.body.style.paddingRight = '0px';
    }
  }, [showChat, showMcq]);

  // Additional cleanup on component unmount
  useEffect(() => {
    return () => {
      // Ensure scrolling is restored when component unmounts
      document.body.style.overflow = 'unset';
      document.body.style.paddingRight = '0px';
    };
  }, []);

  // Transform data to new hierarchical format
  const transformToHierarchicalFormat = (data: any): YoutubeData | null => {
    try {
      // Check if data is already in the new format
      if (data.modules && Array.isArray(data.modules) && data.modules.length > 0) {
        // Check if it's the new format (has modules with submodules and chapters)
        const firstModule = data.modules[0];
        if (firstModule.submodules && Array.isArray(firstModule.submodules)) {
          return {
            uniqueid: data.uniqueid || data.uniqueId || user?.uniqueId || '',
            modules: data.modules,
            _id: data._id,
            createdAt: data.createdAt,
            updatedAt: data.updatedAt
          };
        }
      }

      // Transform from old format (flat chapters) to new format
      if (data.chapters && Array.isArray(data.chapters)) {
        // Group chapters into modules and submodules
        // For now, create a simple structure - can be enhanced based on actual data patterns
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
              youtubeTitle: ch.videoTitle || ch.youtubeTitle || ''
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
          uniqueid: data.uniqueid || data.uniqueId || user?.uniqueId || '',
          modules,
          _id: data._id,
          createdAt: data.createdAt,
          updatedAt: data.updatedAt
        };
      }

      // If data is an array (API might return array directly)
      if (Array.isArray(data) && data.length > 0) {
        const studentData = data[0] as StudentModulesData;
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

  const fetchYouTubeData = async (isPolling = false) => {
    if (!user?.uniqueId) return;
    
    if (!isPolling) {
      setLoading(true);
      setError(null);
    }
    
    try {
      const response = await fetch(`/api/youtube-urls?uniqueid=${encodeURIComponent(user.uniqueId)}`);
      
      if (response.ok) {
        const result = await response.json();
        
        // Explicitly check for "Module array missing" message - this means data is still being processed
        const isModuleArrayMissing = result.message && 
          result.message.includes('Module array is missing or invalid');
        
        // Check if API indicates this is a processing state (not an error)
        const isProcessing = result.isProcessing === true || isModuleArrayMissing;
        
        // Handle case where API returns data but success is false (e.g., Module array missing)
        // During first-time generation, this means data is still being processed
        if (result.data) {
          // Transform data to hierarchical format
          const transformedData = transformToHierarchicalFormat(result.data);
          
          if (transformedData) {
            // Check if we have actual modules with content
            const hasValidModules = transformedData.modules && 
                                   transformedData.modules.length > 0 &&
                                   transformedData.modules.some((m: Module) => 
                                     m.submodules && m.submodules.length > 0 &&
                                     m.submodules.some((sm: Submodule) => 
                                       sm.chapters && sm.chapters.length > 0
                                     )
                                   );
            
            if (hasValidModules) {
              setYoutubeData(transformedData);
              // Reset first-time generation state when valid data is available
              setIsFirstTimeGeneration(false);
              setScraping(false);
              
              // Reset failure state if modules were successfully generated
              if (deletionOccurred) {
                setDeletionOccurred(false);
                setGenerationFailed(false);
              }
              
              // If we're polling and got real data (not fallback), update N8N status
              if (isPolling && !result.isFallback) {
                console.log('✅ N8N processing completed successfully');
                setN8nProgress(100);
                setN8nStatus('completed');
                setN8nMessage('YouTube videos are ready for you to explore!');
                
                // Hide indicator after 2 minutes
                setTimeout(() => {
                  setShowN8nIndicator(false);
                }, 120000);
              } else if (isPolling && result.isFallback) {
                console.log('⏳ N8N still processing, using fallback data');
                // Keep processing status if we're still getting fallback data
              }
            } else {
              // Data exists but no valid modules yet - still processing during first-time generation
              // This includes the case where Module array is missing
              if (isFirstTimeGeneration && (isPolling || isProcessing)) {
                if (isProcessing) {
                  console.log('⏳ YouTube data document exists but Module array not populated yet - N8N still processing...');
                } else {
                  console.log('⏳ N8N still processing, waiting for module data...');
                }
                // Keep waiting UI visible - don't update youtubeData
              } else if (!isPolling) {
                // Only show error if not in first-time generation mode and not processing
                if (!isFirstTimeGeneration && !isProcessing) {
                  setError('No modules available. Please try generating modules again.');
                }
              }
            }
          } else {
            // Failed to transform data
            if (isFirstTimeGeneration && (isPolling || isProcessing)) {
              if (isProcessing) {
                console.log('⏳ YouTube data document exists but Module array not populated yet - N8N still processing...');
              } else {
                console.log('⏳ N8N still processing, data transformation pending...');
              }
              // Keep waiting UI visible during first-time generation
            } else if (!isPolling) {
              if (!isFirstTimeGeneration && !isProcessing) {
                setError('Failed to parse module data. Please try again.');
              }
            }
          }
        } else {
          // No data returned
          if (isFirstTimeGeneration && (isPolling || isProcessing)) {
            if (isProcessing) {
              console.log('⏳ YouTube data document exists but Module array not populated yet - N8N still processing...');
            } else {
              console.log('⏳ N8N still processing, no data available yet');
            }
            // Keep waiting UI visible during first-time generation
          } else if (!isPolling) {
            if (!isFirstTimeGeneration && !isProcessing) {
              setError(result.message || 'Failed to fetch modules');
            }
          }
        }
      } else {
        const errorData = await response.json();
        const errorMessage = errorData.message || `HTTP ${response.status}: Failed to fetch modules`;
        
        // During first-time generation, 404 is expected - data hasn't been created yet
        if (isFirstTimeGeneration && isPolling && response.status === 404) {
          console.log('⏳ N8N still processing, YouTube data not created yet...');
          // Keep waiting UI visible - this is expected during first-time generation
        } else if (!isPolling) {
          if (!isFirstTimeGeneration) {
            setError(errorMessage);
          }
        } else {
          console.warn('⚠️ Error during polling:', errorMessage);
          // Don't immediately fail during polling, let the timeout handle it
        }
      }
    } catch (error) {
      console.error('Error fetching YouTube data:', error);
      if (isFirstTimeGeneration && isPolling) {
        console.warn('⚠️ Network error during first-time generation polling:', error);
        // Keep waiting UI visible - network errors are expected during polling
      } else if (!isPolling) {
        if (!isFirstTimeGeneration) {
          setError('Failed to fetch modules. Please try again.');
        }
      } else {
        console.warn('⚠️ Network error during polling:', error);
        // Don't immediately fail during polling, let the timeout handle it
      }
    } finally {
      if (!isPolling) {
        setLoading(false);
      }
    }
  };

  // Handler to show confirmation dialog if modules exist
  const handleDiscoverModules = () => {
    // Check if there are existing modules
    const hasExistingModules = youtubeData && 
                               youtubeData.modules && 
                               youtubeData.modules.length > 0;
    
    if (hasExistingModules) {
      // Show confirmation dialog
      setShowConfirmDialog(true);
    } else {
      // No existing modules, proceed directly
      triggerYouTubeScraping();
    }
  };

  // Confirm and proceed with scraping (with deletion)
  const confirmAndProceed = () => {
    setShowConfirmDialog(false);
    triggerYouTubeScraping(true); // Pass true to indicate deletion is needed
  };

  const triggerYouTubeScraping = async (deleteExisting: boolean = false) => {
    if (!user?.uniqueId) return;
    
    setScraping(true);
    setError(null);
    setSuccess(null);
    
    // Check if this is first time generation (no existing youtubeData)
    if (!youtubeData || !youtubeData.modules || youtubeData.modules.length === 0) {
      setIsFirstTimeGeneration(true);
    }
    
    // Show N8N indicator
    setShowN8nIndicator(true);
    setN8nStatus('triggering');
    setN8nMessage(deleteExisting 
      ? 'Deleting existing data and starting YouTube content generation...' 
      : 'Starting YouTube content generation...');
    setN8nProgress(0);
    setN8nStartTime(Date.now());
    
    try {
      const response = await fetch('/api/webhook/trigger-youtube-scraping', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          uniqueid: user.uniqueId,
          deleteExisting: deleteExisting 
        })
      });

      if (response.ok) {
        const result = await response.json();
        setSuccess(result.message || 'YouTube scraping initiated! Please wait for modules to be processed.');
        
        // Clear local state if existing data was deleted
        if (deleteExisting) {
          setYoutubeData(null);
          setProgress({});
          setCompletedModules(new Set());
          setIsFirstTimeGeneration(true);
          setDeletionOccurred(true);
          setGenerationFailed(false);
          // Refetch progress data to ensure it's cleared
          fetchProgressData();
          console.log('🗑️ Cleared local state after deleting existing data');
        }
        
        // Update N8N status to processing
        setN8nStatus('processing');
        setN8nMessage('');
        
        console.log('🚀 N8N workflow triggered successfully:', {
          webhookSuccess: result.webhookSuccess,
          message: result.message
        });
        
        // Simulate progress updates
        const progressInterval = setInterval(() => {
          setN8nProgress(prev => {
            if (prev >= 90) {
              return prev;
            }
            return prev + Math.random() * 15;
          });
        }, 2000);
        
        // Start polling for results - with timeout for deletion case
        let pollCount = 0;
        let isPollingActive = true;
        const maxPollingTime = deleteExisting ? 10 * 60 * 1000 : Infinity; // 10 minutes if deletion occurred
        const pollingStartTime = Date.now();
        
        // Set up timeout check for deletion case
        let timeoutCheck: NodeJS.Timeout | null = null;
            if (deleteExisting) {
              timeoutCheck = setTimeout(async () => {
                if (isPollingActive) {
                  console.warn('⏰ Polling exceeded maximum time after deletion, checking for modules...');
                  
                  try {
                    if (!user?.uniqueId) {
                      throw new Error('User uniqueId not available');
                    }
                    const checkResponse = await fetch(`/api/youtube-urls?uniqueid=${encodeURIComponent(user.uniqueId)}`);
                    const checkData = await checkResponse.json();
                
                const hasModules = checkData.success && 
                                  checkData.data?.modules && 
                                  Array.isArray(checkData.data.modules) &&
                                  checkData.data.modules.length > 0 &&
                                  checkData.data.modules.some((m: any) => 
                                    m.submodules && Array.isArray(m.submodules) && m.submodules.length > 0
                                  );
                
                if (!hasModules) {
                  // No modules generated - show failure notice
                  isPollingActive = false;
                  clearInterval(progressInterval);
                  setGenerationFailed(true);
                  setN8nStatus('error');
                  setN8nMessage('Module generation failed. Previous content was deleted.');
                  setScraping(false);
                  setIsFirstTimeGeneration(false);
                  
                  setTimeout(() => {
                    setShowN8nIndicator(false);
                  }, 3000);
                }
              } catch (e) {
                console.error('Error checking for modules after timeout:', e);
                // If check fails, assume generation failed
                isPollingActive = false;
                clearInterval(progressInterval);
                setGenerationFailed(true);
                setN8nStatus('error');
                setN8nMessage('Module generation failed. Previous content was deleted.');
                setScraping(false);
                setIsFirstTimeGeneration(false);
                
                setTimeout(() => {
                  setShowN8nIndicator(false);
                }, 3000);
              }
            }
          }, maxPollingTime);
        }
        
        const pollForResults = async () => {
          if (!isPollingActive) return; // Stop if polling was cancelled
          
          try {
            pollCount++;
            console.log(`🔄 Polling attempt ${pollCount} for N8N results`);
            
            await fetchYouTubeData(true); // Use polling mode
            
            // Check current status using a ref or state callback to get fresh value
            setN8nStatus(currentStatus => {
              // Validate status based on timing
              const validatedStatus = validateN8nStatus(currentStatus, n8nStartTime);
              
              if (validatedStatus === 'error') {
                console.warn('⏰ N8N processing exceeded maximum time, stopping');
                isPollingActive = false;
                clearInterval(progressInterval);
                
                // Check if modules were generated before marking as error
                setTimeout(async () => {
                  try {
                    if (!user?.uniqueId) {
                      throw new Error('User uniqueId not available');
                    }
                    const uniqueId = user.uniqueId;
                    const checkResponse = await fetch(`/api/youtube-urls?uniqueid=${encodeURIComponent(uniqueId)}`);
                    const checkData = await checkResponse.json();
                    
                    const hasModules = checkData.success && 
                                      checkData.data?.modules && 
                                      Array.isArray(checkData.data.modules) &&
                                      checkData.data.modules.length > 0;
                    
                    if (!hasModules && deletionOccurred) {
                      setGenerationFailed(true);
                      setN8nMessage('Module generation failed. Previous content was deleted.');
                    }
                  } catch (e) {
                    console.error('Error checking for modules:', e);
                    if (deletionOccurred) {
                      setGenerationFailed(true);
                      setN8nMessage('Module generation failed. Previous content was deleted.');
                    }
                  }
                  setShowN8nIndicator(false);
                }, 3000);
                return 'error';
              }
              
              // Stop polling if status is completed
              if (currentStatus === 'completed') {
                console.log('✅ Polling stopped - data is ready');
                isPollingActive = false;
                clearInterval(progressInterval);
                if (timeoutCheck) clearTimeout(timeoutCheck);
                
                // Final check: verify modules were actually generated after a short delay
                setTimeout(async () => {
                  try {
                    await fetchYouTubeData();
                    // Check if we have valid modules now
                    setYoutubeData(data => {
                      const hasValidModules = data && 
                                             data.modules && 
                                             Array.isArray(data.modules) &&
                                             data.modules.length > 0 &&
                                             data.modules.some((m: Module) => 
                                               m.submodules && Array.isArray(m.submodules) && m.submodules.length > 0
                                             );
                      if (!hasValidModules && deletionOccurred) {
                        setGenerationFailed(true);
                        setN8nStatus('error');
                        setN8nMessage('Module generation failed. Previous content was deleted.');
                      }
                      return data;
                    });
                  } catch (e) {
                    console.error('Error in final module check:', e);
                    if (deletionOccurred) {
                      setGenerationFailed(true);
                      setN8nStatus('error');
                      setN8nMessage('Module generation failed. Previous content was deleted.');
                    }
                  }
                }, 2000);
                return currentStatus;
              }
              
              // Continue polling if status is still processing
              if (currentStatus === 'processing' && isPollingActive) {
                setTimeout(pollForResults, 5000);
                return currentStatus; // Keep current status
              }
              return currentStatus;
            });
          } catch (pollError) {
            console.error('Error polling for results:', pollError);
            isPollingActive = false;
            clearInterval(progressInterval);
            if (timeoutCheck) clearTimeout(timeoutCheck);
            setN8nStatus('error');
            
              // Check if deletion occurred to show appropriate message
            if (deletionOccurred) {
              // Final check: verify if modules exist despite the error
              try {
                if (!user?.uniqueId) {
                  throw new Error('User uniqueId not available');
                }
                const uniqueId = user.uniqueId;
                const checkResponse = await fetch(`/api/youtube-urls?uniqueid=${encodeURIComponent(uniqueId)}`);
                const checkData = await checkResponse.json();
                const hasModules = checkData.success && 
                                  checkData.data?.modules && 
                                  Array.isArray(checkData.data.modules) &&
                                  checkData.data.modules.length > 0;
                
                if (!hasModules) {
                  setGenerationFailed(true);
                  setN8nMessage('Module generation failed. Previous content was deleted.');
                }
              } catch (e) {
                // If check fails, assume generation failed
                setGenerationFailed(true);
                setN8nMessage('Module generation failed. Previous content was deleted.');
              }
            } else {
              setN8nMessage('Failed to check for results. Please try refreshing.');
            }
            
            setScraping(false);
            setIsFirstTimeGeneration(false);
            
            // Hide indicator after error
            setTimeout(() => {
              setShowN8nIndicator(false);
            }, 5000);
          }
        };
        
        // Start polling after a short delay
        setTimeout(pollForResults, 5000);
        
        } else {
        const errorData = await response.json();
        const errorMessage = errorData.error || `HTTP ${response.status}: Failed to trigger YouTube scraping`;
        
        console.error('❌ N8N trigger failed:', {
          status: response.status,
          error: errorMessage,
          details: errorData.details
        });
        
        setError(errorMessage);
        setN8nStatus('error');
        setN8nMessage(`Failed to trigger YouTube scraping: ${errorMessage}`);
        setScraping(false);
        setIsFirstTimeGeneration(false);
        
        // Hide indicator after showing error
        setTimeout(() => {
          setShowN8nIndicator(false);
        }, 5000);
      }
    } catch (error) {
      console.error('❌ Error triggering YouTube scraping:', error);
      
      let errorMessage = 'Failed to trigger YouTube scraping. Please try again.';
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          errorMessage = 'Request timed out. Please check your connection and try again.';
        } else if (error.message.includes('fetch')) {
          errorMessage = 'Network error. Please check your connection and try again.';
        }
      }
      
      setError(errorMessage);
      setN8nStatus('error');
      setN8nMessage(errorMessage);
      setScraping(false);
      setIsFirstTimeGeneration(false);
      
      // Hide indicator after showing error
      setTimeout(() => {
        setShowN8nIndicator(false);
      }, 5000);
    }
    // Note: Don't set scraping to false in finally block
    // It should only be set to false when:
    // 1. Valid modules are available (in fetchYouTubeData)
    // 2. An error occurs (handled above)
    // This ensures the waiting UI stays visible during first-time generation
  };

  const generateMCQ = async (chapterKey: string) => {
    setMcqLoading(true);
    setError(null);
    setMcqAnswers({});
    setMcqSubmitted(false);
    setMcqScore(null);
    
    try {
      const response = await fetch('/api/webhook/generate-mcq', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ chapterId: chapterKey }),
      });
      
      if (response.ok) {
        const result = await response.json();
        setMcqQuestions(result.questions || []);
        setShowMcq(true);
        setShowChat(false);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to generate MCQ questions');
      }
    } catch (error) {
      console.error('Error generating MCQ:', error);
      setError('Failed to generate MCQ questions. Please try again.');
    } finally {
      setMcqLoading(false);
    }
  };

  const handleMCQAnswer = (questionId: string, answer: string) => {
    setMcqAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
  };

  const submitMCQ = async () => {
    let correctAnswers = 0;
    mcqQuestions.forEach(question => {
      if (mcqAnswers[question.Q] === question.answer) {
        correctAnswers++;
      }
    });
    
    const score = Math.round((correctAnswers / mcqQuestions.length) * 100);
    console.log('🎯 Quiz submission:', {
      selectedChapter,
      userUniqueId: user?.uniqueId,
      score,
      correctAnswers,
      totalQuestions: mcqQuestions.length
    });
    
    setMcqScore(score);
    setMcqSubmitted(true);

    // Save quiz score to backend and update progress
    if (selectedChapter && user?.uniqueId) {
      console.log('📤 Calling quiz-score API with:', {
        chapterId: selectedChapter,
        studentId: user.uniqueId,
        score,
        totalQuestions: mcqQuestions.length,
        correctAnswers
      });
      try {
        const response = await fetch(`/api/modules/quiz-score`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            chapterId: selectedChapter,
            studentId: user.uniqueId,
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
          console.log('✅ Quiz score API response:', result);
          
          // Update local progress state immediately with the quiz score
          setProgress(prev => ({
            ...prev,
            [selectedChapter]: score
          }));

          // Force a re-render to ensure progress bars update
          setTimeout(() => {
            setProgress(prev => ({
              ...prev,
              [selectedChapter]: score
            }));
          }, 100);

          // Check if module is completed (score >= 75%)
          if (score >= 75 && selectedChapter !== null) {
            setCompletedModules(prev => {
              const newSet = new Set([...prev, getChapterId(selectedChapter)]);
              console.log('✅ Module marked as completed in frontend:', selectedChapter, 'Score:', score);
              return newSet;
            });
            setSuccess(`🎉 Congratulations! You scored ${score}% and completed this chapter!`);
          } else {
            setSuccess(`You scored ${score}%. Keep practicing to reach 75% for completion!`);
          }

          // Refresh progress data to ensure consistency
          fetchProgressData();

          // Auto-clear success message after 5 seconds
          setTimeout(() => {
            setSuccess(null);
          }, 5000);
        } else {
          const errorData = await response.json().catch(() => ({}));
          console.error('❌ Quiz score API error:', response.status, errorData);
          setError(errorData.error || 'Failed to save quiz score. Please try again.');
        }
      } catch (error) {
        console.error('❌ Quiz score API network error:', error);
        setError('Network error. Please check your connection and try again.');
      }
    } else {
      console.error('❌ Quiz submission conditions not met:', {
        selectedChapter,
        userUniqueId: user?.uniqueId,
        hasSelectedChapter: !!selectedChapter,
        hasUserUniqueId: !!user?.uniqueId
      });
      setError('Missing required data for quiz submission. Please try again.');
    }
  };

  const resetMCQ = () => {
    setMcqAnswers({});
    setMcqSubmitted(false);
    setMcqScore(null);
  };

  const handleChatQuery = async (chapterKey: string) => {
    if (!chatQuery.trim()) return;
    
    setChatLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/webhook/chat-transcribe', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        body: JSON.stringify({ 
          query: chatQuery.trim(), 
          chapterId: chapterKey 
        }),
      });
      
      if (response.ok) {
        const result = await response.json();
        // Handle both string response and array response with HTML content
        let responseContent = '';
        if (Array.isArray(result.answer || result.response)) {
          // Extract HTML content from array format
          const htmlData = result.answer || result.response;
          if (htmlData.length > 0 && htmlData[0].text) {
            responseContent = htmlData[0].text;
          } else {
            responseContent = 'No response received';
          }
        } else {
          responseContent = result.answer || result.response || 'No response received';
        }
        setChatResponse(responseContent);
        setShowChat(true);
        setShowMcq(false);
        } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to process chat query');
      }
    } catch (error) {
      console.error('Error processing chat query:', error);
      setError('Failed to process chat query. Please try again.');
    } finally {
      setChatLoading(false);
    }
  };

  const getChapterId = (chapterId: number) => {
    return `chapter-${chapterId}`;
  };

  const getVideoId = (url: string) => {
    if (!url || url === 'No link found') return null;
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/);
    return match ? match[1] : null;
  };

  // Get all chapters flattened for filtering and display
  const getAllChapters = React.useMemo(() => {
    if (!youtubeData?.modules) return [];
    
    const chapters: Array<Chapter & { moduleId: number; submoduleId: number; moduleTitle: string; submoduleTitle: string }> = [];
    
    youtubeData.modules.forEach(module => {
      module.submodules.forEach(submodule => {
        submodule.chapters.forEach(chapter => {
          chapters.push({
            ...chapter,
            moduleId: module.moduleId,
            submoduleId: submodule.submoduleId,
            moduleTitle: module.moduleTitle,
            submoduleTitle: submodule.submoduleTitle
          });
        });
      });
    });
    
    return chapters;
  }, [youtubeData]);

  // Filter and sort modules
  const filteredChapters = React.useMemo(() => {
    if (!youtubeData?.modules) return [];
    
    let chapters = getAllChapters;
    
    // Filter by search query
    if (searchQuery) {
      chapters = chapters.filter(chapter => {
        return chapter.chapterTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
               chapter.chapterDescription.toLowerCase().includes(searchQuery.toLowerCase()) ||
               chapter.moduleTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
               chapter.submoduleTitle.toLowerCase().includes(searchQuery.toLowerCase());
      });
    }
    
    // Filter by level
    if (filterLevel !== 'all') {
      chapters = chapters.filter(chapter => {
        // Simple level detection based on chapter ID
        const chapterNum = chapter.chapterId;
        if (filterLevel === 'basic') return chapterNum <= 6;
        if (filterLevel === 'intermediate') return chapterNum > 6 && chapterNum <= 12;
        if (filterLevel === 'advanced') return chapterNum > 12;
        return true;
      });
    }
    
    // Sort chapters
    switch (sortBy) {
      case 'title':
        chapters.sort((a, b) => a.chapterTitle.localeCompare(b.chapterTitle));
        break;
      case 'oldest':
        chapters.sort((a, b) => a.chapterId - b.chapterId);
        break;
      case 'newest':
      default:
        // Sort by chapter ID descending (newest first)
        chapters.sort((a, b) => b.chapterId - a.chapterId);
        break;
    }
    
    return chapters;
  }, [youtubeData, searchQuery, filterLevel, sortBy, getAllChapters]);

  const toggleFavorite = (chapterId: string) => {
    setFavorites(prev => {
      const newFavorites = new Set(prev);
      if (newFavorites.has(chapterId)) {
        newFavorites.delete(chapterId);
      } else {
        newFavorites.add(chapterId);
      }
      return newFavorites;
    });
  };

  const markAsCompleted = (chapterId: string) => {
    setCompletedModules(prev => {
      const newCompleted = new Set(prev);
      if (newCompleted.has(chapterId)) {
        newCompleted.delete(chapterId);
      } else {
        newCompleted.add(chapterId);
      }
      return newCompleted;
    });
  };

  const toggleBookmark = (chapterId: string) => {
    setBookmarkedVideos(prev => {
      const newBookmarks = new Set(prev);
      if (newBookmarks.has(chapterId)) {
        newBookmarks.delete(chapterId);
      } else {
        newBookmarks.add(chapterId);
      }
      return newBookmarks;
    });
  };

  const toggleLike = (chapterId: string) => {
    setLikedVideos(prev => {
      const newLikes = new Set(prev);
      if (newLikes.has(chapterId)) {
        newLikes.delete(chapterId);
      } else {
        newLikes.add(chapterId);
      }
      return newLikes;
    });
  };

  const toggleModuleExpansion = (moduleId: number) => {
    setExpandedModules(prev => {
      const newSet = new Set(prev);
      if (newSet.has(moduleId)) {
        newSet.delete(moduleId);
      } else {
        newSet.add(moduleId);
      }
      return newSet;
    });
  };

  const toggleSubmoduleExpansion = (moduleId: number, submoduleId: number) => {
    const key = `${moduleId}-${submoduleId}`;
    setExpandedSubmodules(prev => {
      const newSet = new Set(prev);
      if (newSet.has(key)) {
        newSet.delete(key);
      } else {
        newSet.add(key);
      }
      return newSet;
    });
  };

  // Calculate total chapters count
  const totalChapters = React.useMemo(() => {
    if (!youtubeData?.modules) return 0;
    return youtubeData.modules.reduce((total, module) => {
      return total + module.submodules.reduce((subTotal, submodule) => {
        return subTotal + submodule.chapters.length;
      }, 0);
    }, 0);
  }, [youtubeData]);

  const shareVideo = async (videoUrl: string, videoTitle: string) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: videoTitle,
          text: `Check out this learning video: ${videoTitle}`,
          url: videoUrl,
        });
      } catch (error) {
        console.log('Error sharing:', error);
      }
    } else {
      // Fallback to clipboard
      try {
        await navigator.clipboard.writeText(`${videoTitle} - ${videoUrl}`);
        setSuccess('Video link copied to clipboard!');
        setTimeout(() => setSuccess(null), 3000);
      } catch (error) {
        console.log('Error copying to clipboard:', error);
      }
    }
  };

  // Function to parse HTML content and extract structured data
  const parseHtmlResponse = (htmlContent: string) => {
    try {
      // Create a temporary DOM parser
      const parser = new DOMParser();
      const doc = parser.parseFromString(htmlContent, 'text/html');
      
      // Extract title from head
      const title = doc.querySelector('title')?.textContent || '';
      
      // Find all headings (h1, h2, h3) and their content
      const allHeadings = Array.from(doc.querySelectorAll('h1, h2, h3'));
      const sections = allHeadings.map(heading => {
        const title = heading.textContent || '';
        let content = '';
        
        // Get content from the next sibling elements until we hit another heading
        let nextElement = heading.nextElementSibling;
        const contentElements = [];
        
        while (nextElement && !['H1', 'H2', 'H3'].includes(nextElement.tagName)) {
          contentElements.push(nextElement);
          nextElement = nextElement.nextElementSibling;
        }
        
        // Process content elements
        content = contentElements.map(el => {
          if (el.tagName === 'P') {
            return el.textContent || '';
          } else if (el.tagName === 'UL' || el.tagName === 'OL') {
            return Array.from(el.querySelectorAll('li')).map(li => li.textContent || '').join('\n');
          } else if (el.tagName === 'DIV') {
            return el.textContent || '';
          }
          return '';
        }).filter(text => text.trim()).join('\n\n');
        
        return { title, content };
      });
      
      // Remove duplicate sections based on title similarity and content
      const uniqueSections = sections.filter((section, index, arr) => {
        const isDuplicate = arr.findIndex(s => 
          s.title.toLowerCase().trim() === section.title.toLowerCase().trim() &&
          s.content.trim() === section.content.trim()
        );
        return isDuplicate === index;
      });
      
      // Find specific sections dynamically
      const answerSummary = uniqueSections.find(section => 
        section.title.toLowerCase().includes('answer') || 
        section.title.toLowerCase().includes('summary') ||
        section.title.toLowerCase().includes('overview')
      );
      
      const sourceAcknowledgment = uniqueSections.find(section => 
        section.title.toLowerCase().includes('source') || 
        section.title.toLowerCase().includes('acknowledgment') ||
        section.title.toLowerCase().includes('reference')
      );
      
      const followUpQuestions = uniqueSections.find(section => 
        section.title.toLowerCase().includes('question') || 
        section.title.toLowerCase().includes('follow') ||
        section.title.toLowerCase().includes('ask') ||
        section.title.toLowerCase().includes('smart')
      );
      
      // Extract follow-up questions from the specific section
      let questions = [];
      if (followUpQuestions && followUpQuestions.content) {
        // Split by newlines and filter out empty strings, also handle bullet points
        questions = followUpQuestions.content
          .split('\n')
          .map(q => q.replace(/^[-•]\s*/, '').trim()) // Remove bullet points
          .filter(q => q.trim());
      } else {
        // Fallback: extract all list items
        const allListItems = Array.from(doc.querySelectorAll('ul li, ol li')).map(li => li.textContent || '').filter(text => text.trim());
        questions = allListItems;
      }
      
      // Get main content - prefer answer summary, fallback to first section, then all paragraphs
      let mainContent = '';
      if (answerSummary && answerSummary.content) {
        mainContent = answerSummary.content;
      } else if (uniqueSections.length > 0 && uniqueSections[0].content) {
        mainContent = uniqueSections[0].content;
      } else {
        const paragraphs = Array.from(doc.querySelectorAll('p')).map(p => p.textContent || '').filter(text => text.trim());
        mainContent = paragraphs.join('\n\n');
      }
      
      // Clean up main content - remove bullet points and format properly
      if (mainContent) {
        mainContent = mainContent
          .split('\n')
          .map(line => line.replace(/^[-•]\s*/, '').trim())
          .filter(line => line.trim())
          .join('\n');
      }
      
      return {
        title,
        header: answerSummary?.title || uniqueSections[0]?.title || 'AI Response',
        article: mainContent,
        footer: sourceAcknowledgment?.title || '',
        footerText: sourceAcknowledgment?.content || '',
        sectionTitle: followUpQuestions?.title || '',
        followUpQuestions: questions,
        allSections: uniqueSections
      };
    } catch (error) {
      console.error('Error parsing HTML:', error);
      return {
        title: '',
        header: 'AI Response',
        article: htmlContent, // Fallback to original content
        footer: '',
        footerText: '',
        sectionTitle: '',
        followUpQuestions: [],
        allSections: []
      };
    }
  };

  // Test function to demonstrate HTML parsing with sample data
  const testHtmlParsing = () => {
    const sampleHtml = `<!DOCTYPE html>
<html>
<head>
    <title>Security Systems</title>
</head>
<body>
<h2>Answer Summary</h2>
<p>
<b>Antivirus software</b> scans your computer for known malware using special signatures and removes harmful files.<br> 
<b>Intrusion Detection Systems (IDS)</b> watch network data (NIDS) or computer logs/files (HIDS) to find unusual or suspicious activities and send alerts.<br> 
<b>Amazon GuardDuty</b> constantly checks AWS accounts using machine learning and data like network logs and activity records to spot threats automatically.<br> 
When any threat is found, these tools give details so you can quickly fix the problem and keep your system safe.
</p>

<h2>Source Acknowledgment</h2>
<p>✅ This is explained in the video you watched.</p>

<h2>Always Ask 3 Smart Follow-Up Questions</h2>
<ul>
<li>Want to learn how machine learning helps detect threats in GuardDuty?</li>
<li>Curious about the difference between network-based and host-based IDS?</li>
<li>Interested in how antivirus keeps up with new types of malware?</li>
</ul>

</body>
</html>`;
    
    const parsed = parseHtmlResponse(sampleHtml);
    console.log('Parsed HTML content:', parsed);
    return parsed;
  };

  // Function to render parsed HTML content
  const renderHtmlContent = (htmlContent: string) => {
    const parsed = parseHtmlResponse(htmlContent);
    
    // Get dynamic section titles based on content
    const getSectionTitle = (section: any) => {
      const title = section.title.toLowerCase();
      if (title.includes('answer') || title.includes('summary')) return 'Answer Summary';
      if (title.includes('concept') || title.includes('explanation')) return 'Key Concepts';
      if (title.includes('source') || title.includes('acknowledgment')) return 'Source Reference';
      if (title.includes('question') || title.includes('follow') || title.includes('smart')) return 'Follow-up Questions';
      return section.title || 'Content';
    };

    const getSectionIcon = (section: any) => {
      const title = section.title.toLowerCase();
      if (title.includes('answer') || title.includes('summary')) return <BookOpen className="w-4 h-4 text-blue-600" />;
      if (title.includes('concept') || title.includes('explanation')) return <Lightbulb className="w-4 h-4 text-green-600" />;
      if (title.includes('source') || title.includes('acknowledgment')) return <FileText className="w-4 h-4 text-gray-600" />;
      if (title.includes('question') || title.includes('follow') || title.includes('smart')) return <MessageCircle className="w-4 h-4 text-purple-600" />;
      return <BookOpen className="w-4 h-4 text-blue-600" />;
    };

    const getSectionColor = (section: any) => {
      const title = section.title.toLowerCase();
      if (title.includes('answer') || title.includes('summary')) return 'from-blue-50 to-indigo-50 border-blue-200';
      if (title.includes('concept') || title.includes('explanation')) return 'from-green-50 to-emerald-50 border-green-200';
      if (title.includes('source') || title.includes('acknowledgment')) return 'from-gray-50 to-slate-50 border-gray-200';
      if (title.includes('question') || title.includes('follow') || title.includes('smart')) return 'from-purple-50 to-pink-50 border-purple-200';
      return 'from-blue-50 to-indigo-50 border-blue-200';
    };

    return (
      <div className="space-y-4">
        {/* Dynamic Header Section */}
        {parsed.header && (
          <div className={`bg-gradient-to-r ${getSectionColor({ title: parsed.header })} rounded-lg p-4 border`}>
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 bg-blue-100 rounded-md flex items-center justify-center flex-shrink-0">
                {getSectionIcon({ title: parsed.header })}
              </div>
              <h2 className="text-lg font-bold text-blue-900">{parsed.header}</h2>
            </div>
          </div>
        )}
        
        {/* Dynamic Main Content */}
        {parsed.article && (
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-green-100 rounded-md flex items-center justify-center flex-shrink-0 mt-1">
                <Lightbulb className="w-4 h-4 text-green-600" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-semibold text-gray-800 mb-3">
                  {parsed.allSections.length > 0 ? getSectionTitle(parsed.allSections[0]) : 'Key Concepts'}
                </h3>
                <div 
                  className="text-gray-800 leading-relaxed text-sm [&_strong]:font-bold [&_strong]:text-gray-900 [&_br]:block [&_br]:mb-2 [&_strong]:text-blue-700 [&_li]:mb-2 [&_li]:ml-4"
                  dangerouslySetInnerHTML={{ 
                    __html: parsed.article.replace(/\n/g, '<br>') 
                  }}
                />
              </div>
            </div>
          </div>
        )}
        
        {/* Dynamic Footer Section */}
        {parsed.footer && (
          <div className={`bg-gradient-to-r ${getSectionColor({ title: parsed.footer })} rounded-lg p-4 border`}>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-6 h-6 bg-gray-100 rounded-md flex items-center justify-center flex-shrink-0">
                {getSectionIcon({ title: parsed.footer })}
              </div>
              <h3 className="text-base font-semibold text-gray-800">{parsed.footer}</h3>
            </div>
            {parsed.footerText && (
              <div 
                className="text-gray-600 text-sm bg-white/60 rounded-md p-3 border border-gray-200 [&_strong]:font-bold [&_strong]:text-gray-800 [&_br]:block [&_br]:mb-1"
                dangerouslySetInnerHTML={{ 
                  __html: parsed.footerText.replace(/\n/g, '<br>') 
                }}
              />
            )}
          </div>
        )}
        
        {/* Dynamic Follow-up Questions Section */}
        {parsed.sectionTitle && parsed.followUpQuestions.length > 0 && (
          <div className={`bg-gradient-to-r ${getSectionColor({ title: parsed.sectionTitle })} rounded-lg p-4 border`}>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-6 h-6 bg-purple-100 rounded-md flex items-center justify-center flex-shrink-0">
                {getSectionIcon({ title: parsed.sectionTitle })}
              </div>
              <h3 className="text-base font-semibold text-purple-900">{parsed.sectionTitle}</h3>
            </div>
            <div className="space-y-2">
              {parsed.followUpQuestions.map((question, index) => (
                <div key={index} className="flex items-start gap-2 group">
                  <div className="w-1.5 h-1.5 bg-purple-500 rounded-full mt-2 flex-shrink-0 group-hover:bg-purple-600 transition-colors"></div>
                  <button
                    onClick={() => setChatQuery(question)}
                    className="text-left text-purple-800 hover:text-purple-900 hover:bg-purple-100 rounded-md p-2 transition-all duration-200 text-sm font-medium w-full border border-transparent hover:border-purple-200 hover:shadow-sm"
                  >
                    {question}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Render any additional sections dynamically - exclude already shown sections */}
        {parsed.allSections.length > 1 && (
          <div className="space-y-3">
            {parsed.allSections.slice(1).map((section, index) => {
              if (!section.content || section.content.trim() === '') return null;
              
              // Skip sections that are already displayed in main content
              const isAlreadyShown = 
                section.title.toLowerCase() === parsed.header?.toLowerCase() ||
                section.title.toLowerCase() === parsed.footer?.toLowerCase() ||
                section.title.toLowerCase() === parsed.sectionTitle?.toLowerCase();
              
              if (isAlreadyShown) return null;
              
              // Clean up section content
              const cleanContent = section.content
                .split('\n')
                .map(line => line.replace(/^[-•]\s*/, '').trim())
                .filter(line => line.trim())
                .join('\n');
              
              if (!cleanContent.trim()) return null;
              
              return (
                <div key={index} className={`bg-gradient-to-r ${getSectionColor(section)} rounded-lg p-4 border`}>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-6 h-6 bg-gray-100 rounded-md flex items-center justify-center flex-shrink-0">
                      {getSectionIcon(section)}
                    </div>
                    <h3 className="text-base font-semibold text-gray-800">{section.title}</h3>
                  </div>
                  <div 
                    className="text-gray-600 text-sm [&_strong]:font-bold [&_strong]:text-gray-800 [&_br]:block [&_br]:mb-1 [&_li]:mb-2 [&_li]:ml-4"
                    dangerouslySetInnerHTML={{ 
                      __html: cleanContent.replace(/\n/g, '<br>') 
                    }}
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Success/Error Messages */}
      {success && (
        <div className="fixed top-4 right-4 z-50 bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3 shadow-lg">
          <CheckCircle className="w-5 h-5 text-green-600" />
          <span className="text-green-800">{success}</span>
          <button
            onClick={() => setSuccess(null)}
            className="ml-auto text-green-600 hover:text-green-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
      
      {error && (
        <div className="fixed top-4 right-4 z-50 bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3 shadow-lg">
          <AlertCircle className="w-5 h-5 text-red-600" />
          <span className="text-red-800">{error}</span>
          <button
            onClick={() => setError(null)}
            className="ml-auto text-red-600 hover:text-red-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-700 text-white">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-full h-full">
            <div className="absolute top-10 left-10 w-20 h-20 bg-white/10 rounded-full blur-xl"></div>
            <div className="absolute top-32 right-20 w-32 h-32 bg-blue-300/20 rounded-full blur-2xl"></div>
            <div className="absolute bottom-20 left-1/3 w-24 h-24 bg-purple-300/20 rounded-full blur-xl"></div>
          </div>
        </div>
        
        <div className="relative px-6 py-12 sm:px-8 lg:px-12">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm">
                  <BookOpen className="w-8 h-8" />
                  </div>
                  <div>
                  <h1 className="text-4xl font-bold mb-2">Learning Modules</h1>
                  <p className="text-blue-100 text-lg">Discover, learn, and master new skills</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <button
                  onClick={() => fetchYouTubeData()}
                  disabled={loading}
                  className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-xl backdrop-blur-sm transition-all duration-200 disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                  Refresh
                </button>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                <div className="flex items-center gap-3 mb-2">
                  <Video className="w-6 h-6 text-blue-300" />
                  <span className="text-sm font-medium text-blue-100">Total Chapters</span>
                </div>
                <div className="text-3xl font-bold">{totalChapters}</div>
              </div>
              
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                <div className="flex items-center gap-3 mb-2">
                  <BookOpen className="w-6 h-6 text-purple-300" />
                  <span className="text-sm font-medium text-blue-100">Total Modules</span>
                </div>
                <div className="text-3xl font-bold">{youtubeData?.modules?.length || 0}</div>
              </div>
              
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                <div className="flex items-center gap-3 mb-2">
                  <Trophy className="w-6 h-6 text-yellow-300" />
                  <span className="text-sm font-medium text-blue-100">Completed</span>
                </div>
                <div className="text-3xl font-bold">{completedModules.size}</div>
          </div>
              
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                <div className="flex items-center gap-3 mb-2">
                  <TrendingUp className="w-6 h-6 text-green-300" />
                  <span className="text-sm font-medium text-blue-100">Progress</span>
                </div>
                <div className="text-3xl font-bold">
                  {totalChapters > 0 ? Math.round((completedModules.size / totalChapters) * 100) : 0}%
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <button
                onClick={handleDiscoverModules}
                disabled={scraping || !user?.uniqueId}
                className="group relative overflow-hidden bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-2xl p-8 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-2xl hover:shadow-emerald-500/25"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-400/20 to-teal-400/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative flex items-center gap-4">
                  <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                    {scraping ? (
                      <Loader2 className="w-8 h-8 animate-spin" />
                    ) : (
                      <Rocket className="w-8 h-8" />
                    )}
                  </div>
                  <div className="text-left">
                    <h3 className="text-2xl font-bold mb-2">
                      {scraping ? 'Discovering New Content...' : 'Discover New Modules'}
                    </h3>
                    <p className="text-emerald-100 text-lg">
                      {scraping ? 'AI is finding the best learning content for you' : 'Let AI find personalized learning content'}
                    </p>
          </div>
        </div>
                <div className="absolute top-4 right-4">
                  <Sparkles className="w-6 h-6 text-white/60" />
      </div>
              </button>

              <button
                onClick={() => fetchYouTubeData()}
                disabled={loading || !user?.uniqueId}
                className="group relative overflow-hidden bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white rounded-2xl p-8 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-2xl hover:shadow-violet-500/25"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-violet-400/20 to-purple-400/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative flex items-center gap-4">
                  <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                    {loading ? (
                      <Loader2 className="w-8 h-8 animate-spin" />
                    ) : (
                      <BookOpen className="w-8 h-8" />
                    )}
                  </div>
                  <div className="text-left">
                    <h3 className="text-2xl font-bold mb-2">
                      {loading ? 'Loading Your Library...' : 'Browse Your Library'}
                    </h3>
                    <p className="text-violet-100 text-lg">
                      {loading ? 'Fetching your personalized modules' : 'Explore your curated learning collection'}
                    </p>
                  </div>
                </div>
                <div className="absolute top-4 right-4">
                  <Globe className="w-6 h-6 text-white/60" />
                </div>
                </button>
              </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-6 py-8 sm:px-8 lg:px-12">
        <div className="max-w-7xl mx-auto">

          {/* Status Messages */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 flex items-center gap-3">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl text-green-700 flex items-center gap-3">
              <CheckCircle className="w-5 h-5 flex-shrink-0" />
              <span>{success}</span>
            </div>
          )}

          {/* Search and Filter Controls */}
          {youtubeData && youtubeData.modules && youtubeData.modules.length > 0 && (
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 mb-8">
              <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
                {/* Search */}
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search modules..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
            />
          </div>

                {/* Filters */}
                <div className="flex gap-3">
                  <select
                    value={filterLevel}
                    onChange={(e) => setFilterLevel(e.target.value as any)}
                    className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
                  >
                    <option value="all">All Levels</option>
                    <option value="basic">Basic</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>

                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
                  >
                    <option value="newest">Newest First</option>
                    <option value="oldest">Oldest First</option>
                    <option value="title">Alphabetical</option>
                  </select>

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
          )}

          {/* Modules Display */}
          {youtubeData && youtubeData.modules && youtubeData.modules.length > 0 ? (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-bold text-gray-900">
                  Your Learning Modules
                </h3>
                <span className="text-gray-500">
                  {filteredChapters.length} of {totalChapters} chapters
                </span>
              </div>
              
              {/* Hierarchical View: Modules -> Submodules -> Chapters */}
              <div className="space-y-6">
                {youtubeData.modules.map((module) => {
                  const isModuleExpanded = expandedModules.has(module.moduleId);
                  
                  return (
                    <div key={module.moduleId} className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
                      {/* Module Header */}
                      <div 
                        className="p-6 cursor-pointer hover:bg-gray-50 transition-colors"
                        onClick={() => toggleModuleExpansion(module.moduleId)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4 flex-1">
                            <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl">
                              <BookOpen className="w-6 h-6 text-white" />
                            </div>
                            <div className="flex-1">
                              <h3 className="text-xl font-bold text-gray-900 mb-1">
                                {module.moduleTitle}
                              </h3>
                              <p className="text-gray-600 text-sm">{module.moduleDescription}</p>
                              <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                                <span>{module.submodules.length} submodules</span>
                                <span>•</span>
                                <span>{module.submodules.reduce((sum, sub) => sum + sub.chapters.length, 0)} chapters</span>
                              </div>
                            </div>
                          </div>
                          <ChevronRight 
                            className={`w-6 h-6 text-gray-400 transition-transform ${isModuleExpanded ? 'rotate-90' : ''}`}
                          />
                        </div>
                      </div>
                      
                      {/* Submodules */}
                      {isModuleExpanded && (
                        <div className="border-t border-gray-200">
                          {module.submodules.map((submodule) => {
                            const submoduleKey = `${module.moduleId}-${submodule.submoduleId}`;
                            const isSubmoduleExpanded = expandedSubmodules.has(submoduleKey);
                            
                            return (
                              <div key={submodule.submoduleId} className="border-b border-gray-100 last:border-b-0">
                                {/* Submodule Header */}
                                <div 
                                  className="p-5 cursor-pointer hover:bg-gray-50 transition-colors bg-gray-50/50"
                                  onClick={() => toggleSubmoduleExpansion(module.moduleId, submodule.submoduleId)}
                                >
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3 flex-1">
                                      <div className="p-2 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg">
                                        <FileText className="w-4 h-4 text-white" />
                                      </div>
                                      <div className="flex-1">
                                        <h4 className="text-lg font-semibold text-gray-800 mb-1">
                                          {submodule.submoduleTitle}
                                        </h4>
                                        <p className="text-gray-600 text-sm">{submodule.submoduleDescription}</p>
                                        <span className="text-xs text-gray-500 mt-1 inline-block">
                                          {submodule.chapters.length} chapters
                                        </span>
                                      </div>
                                    </div>
                                    <ChevronRight 
                                      className={`w-5 h-5 text-gray-400 transition-transform ${isSubmoduleExpanded ? 'rotate-90' : ''}`}
                                    />
                                  </div>
                                </div>
                                
                                {/* Chapters */}
                                {isSubmoduleExpanded && (
                                  <div className="bg-gray-50/30">
                                    {viewMode === 'grid' ? (
                                      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 p-6">
                                        {submodule.chapters
                                          .filter(chapter => {
                                            // Apply search filter
                                            if (searchQuery) {
                                              const matchesSearch = 
                                                chapter.chapterTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                                chapter.chapterDescription.toLowerCase().includes(searchQuery.toLowerCase());
                                              if (!matchesSearch) return false;
                                            }
                                            return true;
                                          })
                                          .map((chapter, chapterIndex) => {
                                            const videoId = getVideoId(chapter.youtubeUrl);
                                            const chapterId = getChapterId(chapter.chapterId);
                                            const isFavorite = favorites.has(chapterId);
                                            const isCompleted = completedModules.has(chapterId);
                                            const isPlaying = playingVideo === chapterId;
                                            const isBookmarked = bookmarkedVideos.has(chapterId);
                                            const isLiked = likedVideos.has(chapterId);
                                            const isHovered = hoveredVideo === chapterId;
                    
                                            return (
                                              <motion.div 
                                                key={chapter.chapterId} 
                                                className="group relative bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden hover:shadow-2xl transition-all duration-300 hover:-translate-y-1"
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: chapterIndex * 0.1 }}
                                                whileHover={{ scale: 1.02 }}
                                                onHoverStart={() => setHoveredVideo(chapterId)}
                                                onHoverEnd={() => setHoveredVideo(null)}
                                              >
                                                {/* Video Section */}
                                                <div className="relative aspect-video bg-gradient-to-br from-gray-100 to-gray-200">
                                                  {videoId ? (
                                                    <>
                                                      {isPlaying ? (
                                                        <iframe
                                                          key={`playing-${chapterId}`}
                                                          src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1`}
                                                          title={chapter.youtubeTitle}
                                                          className="w-full h-full"
                                                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                                          allowFullScreen
                                                        />
                                                      ) : (
                                                        <div className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center relative">
                                                          {/* Video Thumbnail */}
                                                          <img
                                                            src={`https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`}
                                                            alt={chapter.youtubeTitle}
                                                            className="w-full h-full object-cover"
                                                            onError={(e) => {
                                                              const target = e.target as HTMLImageElement;
                                                              target.src = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
                                                            }}
                                                          />
                                                          {/* Play Overlay */}
                                                          <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                                                            <motion.button
                                                              onClick={() => setPlayingVideo(chapterId)}
                                                              className="p-6 bg-red-600 hover:bg-red-700 rounded-full shadow-2xl transform transition-all duration-300 hover:scale-110"
                                                              whileHover={{ scale: 1.1 }}
                                                              whileTap={{ scale: 0.9 }}
                                                            >
                                                              <Play className="w-12 h-12 text-white" />
                                                            </motion.button>
                                                          </div>
                                                        </div>
                                                      )}
                                                      
                                                      {/* Control Overlay */}
                                                      {isPlaying && (
                                                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 flex items-center justify-center">
                                                          <div className="flex gap-3">
                                                            <motion.button
                                                              onClick={() => setPlayingVideo(null)}
                                                              className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 p-4 bg-white/90 rounded-full hover:bg-white hover:scale-110 transform transition-all"
                                                              whileHover={{ scale: 1.1 }}
                                                              whileTap={{ scale: 0.9 }}
                                                            >
                                                              <PauseCircle className="w-8 h-8 text-gray-800" />
                                                            </motion.button>
                                                            
                                                            <motion.button
                                                              onClick={() => window.open(chapter.youtubeUrl, '_blank')}
                                                              className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 p-3 bg-white/90 rounded-full hover:bg-white hover:scale-110 transform transition-all"
                                                              whileHover={{ scale: 1.1 }}
                                                              whileTap={{ scale: 0.9 }}
                                                            >
                                                              <ExternalLink className="w-6 h-6 text-gray-800" />
                                                            </motion.button>
                                                          </div>
                                                        </div>
                                                      )}
                                                    </>
                                                  ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-gray-500">
                                                      <div className="text-center">
                                                        <Video className="w-12 h-12 mx-auto mb-2" />
                                                        <p>Video not available</p>
                                                      </div>
                                                    </div>
                                                  )}
                                                  
                                                  {/* Overlay Badges */}
                                                  <div className="absolute top-4 left-4 flex gap-2">
                                                    <span className="px-3 py-1 bg-black/70 text-white text-xs font-medium rounded-full backdrop-blur-sm">
                                                      Chapter {chapter.chapterId}
                                                    </span>
                                                    {isCompleted && (
                                                      <span className="px-3 py-1 bg-green-500 text-white text-xs font-medium rounded-full">
                                                        <CheckCircle className="w-3 h-3 inline mr-1" />
                                                        Completed
                                                      </span>
                                                    )}
                                                  </div>
                                                  
                                                  {/* Action Buttons Overlay */}
                                                  <div className="absolute top-4 right-4 flex gap-2">
                                                    <motion.button
                                                      onClick={() => toggleBookmark(chapterId)}
                                                      className={`p-2 rounded-full backdrop-blur-sm transition-all ${
                                                        isBookmarked 
                                                          ? 'bg-yellow-500 text-white' 
                                                          : 'bg-black/70 text-white hover:bg-yellow-500'
                                                      }`}
                                                      whileHover={{ scale: 1.1 }}
                                                      whileTap={{ scale: 0.9 }}
                                                    >
                                                      {isBookmarked ? (
                                                        <BookmarkCheck className="w-4 h-4" />
                                                      ) : (
                                                        <Bookmark className="w-4 h-4" />
                                                      )}
                                                    </motion.button>
                                                    
                                                    <motion.button
                                                      onClick={() => toggleLike(chapterId)}
                                                      className={`p-2 rounded-full backdrop-blur-sm transition-all ${
                                                        isLiked 
                                                          ? 'bg-blue-500 text-white' 
                                                          : 'bg-black/70 text-white hover:bg-blue-500'
                                                      }`}
                                                      whileHover={{ scale: 1.1 }}
                                                      whileTap={{ scale: 0.9 }}
                                                    >
                                                      <ThumbsUp className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
                                                    </motion.button>
                                                    
                                                    <motion.button
                                                      onClick={() => shareVideo(chapter.youtubeUrl, chapter.youtubeTitle)}
                                                      className="p-2 rounded-full backdrop-blur-sm bg-black/70 text-white hover:bg-purple-500 transition-all"
                                                      whileHover={{ scale: 1.1 }}
                                                      whileTap={{ scale: 0.9 }}
                                                    >
                                                      <Share className="w-4 h-4" />
                                                    </motion.button>
                                                    
                                                    <motion.button
                                                      onClick={() => toggleFavorite(chapterId)}
                                                      className={`p-2 rounded-full backdrop-blur-sm transition-all ${
                                                        isFavorite 
                                                          ? 'bg-red-500 text-white' 
                                                          : 'bg-black/70 text-white hover:bg-red-500'
                                                      }`}
                                                      whileHover={{ scale: 1.1 }}
                                                      whileTap={{ scale: 0.9 }}
                                                    >
                                                      <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
                                                    </motion.button>
                                                    
                                                    <motion.button
                                                      onClick={() => markAsCompleted(chapterId)}
                                                      className={`p-2 rounded-full backdrop-blur-sm transition-all ${
                                                        isCompleted 
                                                          ? 'bg-green-500 text-white' 
                                                          : 'bg-black/70 text-white hover:bg-green-500'
                                                      }`}
                                                      whileHover={{ scale: 1.1 }}
                                                      whileTap={{ scale: 0.9 }}
                                                    >
                                                      <CheckCircle className="w-4 h-4" />
                                                    </motion.button>
                                                  </div>
                                                </div>
                      
                                                {/* Content Section */}
                                                <div className="p-6">
                                                  <h4 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
                                                    {chapter.chapterTitle}
                                                  </h4>
                                                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                                                    {chapter.chapterDescription}
                                                  </p>
                                                  
                                                  {/* Progress Bar */}
                                                  <div className="mb-4">
                                                    <div className="flex items-center justify-between text-sm text-gray-500 mb-1">
                                                      <span>Quiz Score</span>
                                                      <span>{progress[chapterId] || 0}%</span>
                                                    </div>
                                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                                      <div 
                                                        className={`h-2 rounded-full transition-all duration-300 ${
                                                          isCompleted 
                                                            ? 'bg-gradient-to-r from-green-500 to-emerald-500' 
                                                            : progress[chapterId] >= 75 
                                                              ? 'bg-gradient-to-r from-orange-500 to-yellow-500'
                                                              : 'bg-gradient-to-r from-blue-500 to-purple-600'
                                                        }`}
                                                        style={{ width: `${progress[chapterId] || 0}%` }}
                                                      ></div>
                                                    </div>
                                                    {progress[chapterId] >= 75 && !isCompleted && (
                                                      <p className="text-xs text-orange-600 mt-1">
                                                        Quiz passed! Complete other activities to finish chapter
                                                      </p>
                                                    )}
                                                    {progress[chapterId] > 0 && progress[chapterId] < 75 && (
                                                      <p className="text-xs text-blue-600 mt-1">
                                                        Keep practicing to reach 75% for completion
                                                      </p>
                                                    )}
                                                  </div>
                                                  
                                                  {/* Action Buttons */}
                                                  <div className="flex gap-2">
                                                    <button
                                                      onClick={() => {
                                                        setSelectedChapter(chapter.chapterId);
                                                        generateMCQ(chapter.chapterId.toString());
                                                      }}
                                                      disabled={mcqLoading}
                                                      className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl hover:from-purple-700 hover:to-blue-700 transition-all duration-200 disabled:opacity-50 font-medium"
                                                    >
                                                      {mcqLoading && selectedChapter === chapter.chapterId ? (
                                                        <Loader2 className="w-4 h-4 animate-spin" />
                                                      ) : (
                                                        <Brain className="w-4 h-4" />
                                                      )}
                                                      Quiz
                                                    </button>
                                                    
                                                    <button
                                                      onClick={() => {
                                                        setSelectedChapter(chapter.chapterId);
                                                        setShowChat(true);
                                                        setShowMcq(false);
                                                      }}
                                                      className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl hover:from-emerald-700 hover:to-teal-700 transition-all duration-200 font-medium"
                                                    >
                                                      <MessageCircle className="w-4 h-4" />
                                                      Chat
                                                    </button>
                                                  </div>
                                                </div>
                                              </motion.div>
                                            );
                                          })}
                                      </div>
                                    ) : (
                                      <div className="space-y-4 p-6">
                                        {submodule.chapters
                                          .filter(chapter => {
                                            // Apply search filter
                                            if (searchQuery) {
                                              const matchesSearch = 
                                                chapter.chapterTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                                chapter.chapterDescription.toLowerCase().includes(searchQuery.toLowerCase());
                                              if (!matchesSearch) return false;
                                            }
                                            return true;
                                          })
                                          .map((chapter) => {
                                            const videoId = getVideoId(chapter.youtubeUrl);
                                            const chapterId = getChapterId(chapter.chapterId);
                                            const isFavorite = favorites.has(chapterId);
                                            const isCompleted = completedModules.has(chapterId);
                                            
                                            return (
                                              <div 
                                                key={chapter.chapterId} 
                                                className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-all duration-300"
                                              >
                                                <div className="flex items-center gap-6">
                                                  {/* Video Thumbnail */}
                                                  <div className="relative w-32 h-20 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                                                    {videoId ? (
                                                      <img
                                                        src={`https://img.youtube.com/vi/${videoId}/mqdefault.jpg`}
                                                        alt={chapter.youtubeTitle}
                                                        className="w-full h-full object-cover"
                                                      />
                                                    ) : (
                                                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                                                        <Video className="w-8 h-8" />
                                                      </div>
                                                    )}
                                                    <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                                                      <PlayCircle className="w-6 h-6 text-white" />
                                                    </div>
                                                  </div>
                                                  
                                                  {/* Content */}
                                                  <div className="flex-1 min-w-0">
                                                    <div className="flex items-start justify-between mb-2">
                                                      <div className="flex-1">
                                                        <h4 className="text-lg font-semibold text-gray-900 line-clamp-1 mb-1">
                                                          {chapter.chapterTitle}
                                                        </h4>
                                                        <p className="text-sm text-gray-600 line-clamp-2">
                                                          {chapter.chapterDescription}
                                                        </p>
                                                      </div>
                                                      <div className="flex items-center gap-2 ml-4">
                                                        <button
                                                          onClick={() => toggleFavorite(chapterId)}
                                                          className={`p-2 rounded-lg transition-colors ${
                                                            isFavorite 
                                                              ? 'bg-red-100 text-red-600' 
                                                              : 'text-gray-400 hover:bg-red-100 hover:text-red-600'
                                                          }`}
                                                        >
                                                          <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
                                                        </button>
                                                        <button
                                                          onClick={() => markAsCompleted(chapterId)}
                                                          className={`p-2 rounded-lg transition-colors ${
                                                            isCompleted 
                                                              ? 'bg-green-100 text-green-600' 
                                                              : 'text-gray-400 hover:bg-green-100 hover:text-green-600'
                                                          }`}
                                                        >
                                                          <CheckCircle className="w-4 h-4" />
                                                        </button>
                                                      </div>
                                                    </div>
                                                    
                                                    <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                                                      {isCompleted && (
                                                        <span className="flex items-center gap-1 text-green-600">
                                                          <CheckCircle className="w-4 h-4" />
                                                          Completed
                                                        </span>
                                                      )}
                                                    </div>

                                                    {/* Progress Bar */}
                                                    <div className="mb-4">
                                                      <div className="flex items-center justify-between text-sm text-gray-500 mb-1">
                                                        <span>Quiz Score</span>
                                                        <span>{progress[chapterId] || 0}%</span>
                                                      </div>
                                                      <div className="w-full bg-gray-200 rounded-full h-2">
                                                        <div 
                                                          className={`h-2 rounded-full transition-all duration-300 ${
                                                            isCompleted 
                                                              ? 'bg-gradient-to-r from-green-500 to-emerald-500' 
                                                              : progress[chapterId] >= 75 
                                                                ? 'bg-gradient-to-r from-orange-500 to-yellow-500'
                                                                : 'bg-gradient-to-r from-blue-500 to-purple-600'
                                                          }`}
                                                          style={{ width: `${progress[chapterId] || 0}%` }}
                                                        ></div>
                                                      </div>
                                                      {progress[chapterId] >= 75 && !isCompleted && (
                                                        <p className="text-xs text-orange-600 mt-1">
                                                          Quiz passed! Complete other activities to finish chapter
                                                        </p>
                                                      )}
                                                      {progress[chapterId] > 0 && progress[chapterId] < 75 && (
                                                        <p className="text-xs text-blue-600 mt-1">
                                                          Keep practicing to reach 75% for completion
                                                        </p>
                                                      )}
                                                    </div>
          
                                                    {/* Action Buttons */}
                                                    <div className="flex gap-3">
                                                      <button
                                                        onClick={() => {
                                                          setSelectedChapter(chapter.chapterId);
                                                          generateMCQ(chapter.chapterId.toString());
                                                        }}
                                                        disabled={mcqLoading}
                                                        className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
                                                      >
                                                        {mcqLoading && selectedChapter === chapter.chapterId ? (
                                                          <Loader2 className="w-4 h-4 animate-spin" />
                                                        ) : (
                                                          <Brain className="w-4 h-4" />
                                                        )}
                                                        Take Quiz
                                                      </button>
                                                      
                                                      <button
                                                        onClick={() => {
                                                          setSelectedChapter(chapter.chapterId);
                                                          setShowChat(true);
                                                          setShowMcq(false);
                                                        }}
                                                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                                      >
                                                        <MessageCircle className="w-4 h-4" />
                                                        Ask Question
                                                      </button>
                                                    </div>
                                                  </div>
                                                </div>
                                              </div>
                                            );
                                          })}
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  )
                })}
                </div>
              </div>
            ) : isFirstTimeGeneration && scraping ? (
              // First-time generation waiting UI
              <div className="text-center py-20 px-4">
                <div className="max-w-2xl mx-auto">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5 }}
                    className="relative mb-12"
                  >
                    {/* Animated background circles */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <motion.div
                        className="absolute w-64 h-64 bg-gradient-to-r from-purple-200 to-blue-200 rounded-full opacity-20 blur-3xl"
                        animate={{
                          scale: [1, 1.2, 1],
                          rotate: [0, 180, 360],
                        }}
                        transition={{
                          duration: 8,
                          repeat: Infinity,
                          ease: "easeInOut",
                        }}
                      />
                      <motion.div
                        className="absolute w-48 h-48 bg-gradient-to-r from-blue-200 to-purple-200 rounded-full opacity-30 blur-2xl"
                        animate={{
                          scale: [1.2, 1, 1.2],
                          rotate: [360, 180, 0],
                        }}
                        transition={{
                          duration: 6,
                          repeat: Infinity,
                          ease: "easeInOut",
                        }}
                      />
                    </div>
                    
                    {/* Main icon container */}
                    <div className="relative z-10">
                      <motion.div
                        className="w-40 h-40 mx-auto bg-gradient-to-br from-purple-500 via-blue-500 to-indigo-600 rounded-3xl flex items-center justify-center shadow-2xl"
                        animate={{
                          rotate: [0, 5, -5, 0],
                        }}
                        transition={{
                          duration: 4,
                          repeat: Infinity,
                          ease: "easeInOut",
                        }}
                      >
                        <motion.div
                          animate={{
                            scale: [1, 1.1, 1],
                          }}
                          transition={{
                            duration: 2,
                            repeat: Infinity,
                            ease: "easeInOut",
                          }}
                        >
                          <Video className="w-20 h-20 text-white" />
                        </motion.div>
                      </motion.div>
                      
                      {/* Orbiting sparkles */}
                      {[0, 120, 240].map((angle, index) => (
                        <motion.div
                          key={index}
                          className="absolute top-1/2 left-1/2 w-6 h-6"
                          style={{
                            transformOrigin: '0 80px',
                          }}
                          animate={{
                            rotate: [angle, angle + 360],
                          }}
                          transition={{
                            duration: 3 + index,
                            repeat: Infinity,
                            ease: "linear",
                          }}
                        >
                          <div className="w-6 h-6 bg-yellow-400 rounded-full shadow-lg flex items-center justify-center">
                            <Sparkles className="w-3 h-3 text-yellow-600" />
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>

                  {/* Content */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3, duration: 0.5 }}
                    className="space-y-6"
                  >
                    <h3 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-4">
                      Generating Your Learning Modules
                    </h3>
                    
                    <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-2xl p-6 border-2 border-purple-200">
                      <div className="flex items-center justify-center gap-3 mb-4">
                        <Clock className="w-6 h-6 text-purple-600" />
                        <p className="text-xl font-semibold text-gray-800">
                          Please wait for at least <span className="text-purple-600 font-bold">1 minute</span>
                        </p>
                      </div>
                      <p className="text-gray-600 text-lg leading-relaxed">
                        We're curating personalized YouTube content and creating interactive learning modules just for you. 
                        This process takes a moment to ensure the best quality content.
                      </p>
                    </div>

                    {/* Progress indicator */}
                    <div className="mt-8">
                      <div className="flex items-center justify-center gap-2 mb-3">
                        <Loader2 className="w-5 h-5 animate-spin text-purple-600" />
                        <span className="text-sm font-medium text-gray-600">
                          Processing YouTube data...
                        </span>
                      </div>
                      <div className="w-full max-w-md mx-auto h-2 bg-gray-200 rounded-full overflow-hidden">
                        <motion.div
                          className="h-full bg-gradient-to-r from-purple-500 to-blue-500"
                          initial={{ width: "0%" }}
                          animate={{ width: "60%" }}
                          transition={{
                            duration: 2,
                            repeat: Infinity,
                            repeatType: "reverse",
                            ease: "easeInOut",
                          }}
                        />
                      </div>
                    </div>

                    {/* Tips */}
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.8, duration: 0.5 }}
                      className="mt-8 bg-white rounded-xl p-6 border border-gray-200 shadow-sm"
                    >
                      <div className="flex items-start gap-3">
                        <Lightbulb className="w-6 h-6 text-yellow-500 flex-shrink-0 mt-1" />
                        <div className="text-left">
                          <p className="font-semibold text-gray-800 mb-2">What's happening?</p>
                          <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
                            <li>Fetching relevant YouTube videos</li>
                            <li>Analyzing content and creating modules</li>
                            <li>Preparing interactive learning materials</li>
                          </ul>
                        </div>
                      </div>
                    </motion.div>
                  </motion.div>
                </div>
              </div>
            ) : generationFailed && deletionOccurred ? (
              // Generation failed after deletion - show error notice
              <div className="text-center py-20 px-4">
                <div className="max-w-2xl mx-auto">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5 }}
                    className="bg-white rounded-3xl shadow-2xl border-2 border-red-200 overflow-hidden"
                  >
                    {/* Header */}
                    <div className="relative bg-gradient-to-r from-red-500 to-orange-600 text-white p-6">
                      <div className="absolute inset-0 bg-black/10"></div>
                      <div className="relative flex items-center gap-4">
                        <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm">
                          <AlertTriangle className="w-8 h-8" />
                        </div>
                        <div>
                          <h3 className="text-2xl font-bold mb-1">Module Generation Failed</h3>
                          <p className="text-red-100 text-sm">Previous content was deleted</p>
                        </div>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-8 space-y-6">
                      <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6">
                        <p className="text-gray-800 font-semibold mb-3 text-lg">
                          ⚠️ Important Notice
                        </p>
                        <p className="text-gray-700 mb-4">
                          Unfortunately, the module generation process failed. Your previous modules and learning progress have been deleted and cannot be restored.
                        </p>
                        <div className="bg-white rounded-lg p-4 border border-red-200">
                          <p className="text-sm text-gray-600 font-medium mb-2">What happened:</p>
                          <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
                            <li>Previous modules were deleted as requested</li>
                            <li>Module generation process encountered an error</li>
                            <li>No new modules were created</li>
                          </ul>
                        </div>
                      </div>

                      <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6">
                        <p className="text-sm text-gray-700">
                          <span className="font-semibold">What you can do:</span> You can try generating modules again. The system will attempt to create new learning content for you.
                        </p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="p-6 bg-gray-50 flex gap-3">
                      <button
                        onClick={() => {
                          setGenerationFailed(false);
                          setDeletionOccurred(false);
                        }}
                        className="flex-1 px-6 py-3 bg-gray-200 text-gray-800 rounded-xl font-semibold hover:bg-gray-300 transition-colors"
                      >
                        Dismiss
                      </button>
                      <button
                        onClick={() => {
                          setGenerationFailed(false);
                          setDeletionOccurred(false);
                          handleDiscoverModules();
                        }}
                        className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-semibold hover:from-purple-700 hover:to-blue-700 transition-all shadow-lg hover:shadow-xl"
                      >
                        Try Again
                      </button>
                    </div>
                  </motion.div>
                </div>
              </div>
            ) : (
              <div className="text-center py-20">
                <div className="max-w-md mx-auto">
                  <div className="relative mb-8">
                    <div className="w-32 h-32 mx-auto bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center">
                      <BookOpen className="w-16 h-16 text-blue-400" />
                    </div>
                    <div className="absolute -top-2 -right-2 w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center">
                      <Sparkles className="w-4 h-4 text-yellow-600" />
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">No Modules Available</h3>
                  <p className="text-gray-500 text-lg mb-8">
                    Start your learning journey by discovering new modules tailored to your interests and goals.
                  </p>
                  <button
                    onClick={handleDiscoverModules}
                    disabled={scraping || !user?.uniqueId}
                    className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-2xl hover:from-purple-700 hover:to-blue-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
                  >
                    {scraping ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Rocket className="w-5 h-5" />
                    )}
                    Discover New Modules
                  </button>
                </div>
              </div>
            )}
        </div>
      </div>

      {/* MCQ Modal */}
      {showMcq && selectedChapter && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-hidden">
          <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl">
            {/* Header */}
            <div className="relative bg-gradient-to-r from-purple-600 to-blue-600 text-white p-8 flex-shrink-0">
              <div className="absolute inset-0 bg-black/10"></div>
              <div className="relative flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm">
                    <Brain className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold mb-1">MCQ Quiz</h3>
                    <p className="text-purple-100">Chapter {selectedChapter} - Test your knowledge</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowMcq(false)}
                  className="p-2 hover:bg-white/20 rounded-xl transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>
            
            {/* Content */}
            <div className="p-8 flex-1 overflow-y-auto">
              {mcqQuestions.length > 0 ? (
                <div className="space-y-6">
                  {mcqQuestions.map((question, index) => (
                    <div key={index} className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-2xl p-6 border border-gray-200 hover:shadow-lg transition-all duration-300">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="px-4 py-2 bg-purple-100 text-purple-800 text-sm font-semibold rounded-full">
                          Q{question.Q}
                        </div>
                        <div className={`px-4 py-2 text-sm font-semibold rounded-full ${
                          question.level === 'Basic' ? 'bg-green-100 text-green-800' :
                          question.level === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {question.level}
                        </div>
                        <div className="ml-auto">
                          <Target className="w-5 h-5 text-gray-400" />
                        </div>
                      </div>
                      
                      <div className="mb-6">
                        <h4 className="text-lg font-semibold text-gray-900 mb-4 leading-relaxed">
                          {question.question}
                        </h4>
                        
                        {/* Options */}
                        <div className="space-y-3">
                          {question.options.map((option, optionIndex) => {
                            const isSelected = mcqAnswers[question.Q] === option;
                            const isCorrect = option === question.answer;
                            const isSubmitted = mcqSubmitted;
                            
                            return (
                              <label
                                key={optionIndex}
                                className={`relative flex items-center p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                                  isSelected
                                    ? 'border-purple-500 bg-purple-50'
                                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
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
                                  className="absolute opacity-0 w-0 h-0 pointer-events-none -z-10"
                                  style={{ 
                                    position: 'absolute', 
                                    left: '-9999px',
                                    appearance: 'none',
                                    WebkitAppearance: 'none',
                                    MozAppearance: 'none'
                                  }}
                                />
                                <div className={`w-5 h-5 rounded-full border-2 mr-4 flex items-center justify-center flex-shrink-0 ${
                                  isSelected
                                    ? 'border-purple-500 bg-purple-500'
                                    : 'border-gray-300 bg-white'
                                } ${
                                  isSubmitted && isCorrect
                                    ? 'border-green-500 bg-green-500'
                                    : isSubmitted && isSelected && !isCorrect
                                    ? 'border-red-500 bg-red-500'
                                    : ''
                                }`}>
                                  {isSelected && (
                                    <div className="w-2 h-2 bg-white rounded-full"></div>
                                  )}
                                </div>
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
                        </div>
                  ))}
                  
                  {/* Submit Button */}
                  {!mcqSubmitted && (
                    <div className="flex justify-center pt-6">
                      <button
                        onClick={submitMCQ}
                        disabled={Object.keys(mcqAnswers).length !== mcqQuestions.length}
                        className="px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl hover:from-purple-700 hover:to-blue-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-semibold shadow-lg hover:shadow-xl flex items-center gap-2"
                      >
                        <Brain className="w-5 h-5" />
                        Submit Quiz
                        <span className="text-sm opacity-75">
                          ({Object.keys(mcqAnswers).length}/{mcqQuestions.length} answered)
                        </span>
                      </button>
                      </div>
                  )}
                  
                  {/* Results */}
                  {mcqSubmitted && mcqScore !== null && (
                    <div className={`rounded-2xl p-6 border-2 ${
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

                        {/* Progress indicator */}
                        <div className="mb-6">
                          <div className="flex items-center justify-between text-sm text-gray-500 mb-2">
                            <span>Chapter Progress</span>
                            <span>{mcqScore >= 75 ? '100%' : `${mcqScore}%`}</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-3">
                            <div 
                              className={`h-3 rounded-full transition-all duration-500 ${
                                mcqScore >= 75 
                                  ? 'bg-gradient-to-r from-green-500 to-emerald-500' 
                                  : 'bg-gradient-to-r from-orange-500 to-yellow-500'
                              }`}
                              style={{ width: `${mcqScore >= 75 ? 100 : mcqScore}%` }}
                            />
                          </div>
                          {mcqScore >= 75 ? (
                            <p className="text-sm text-green-600 mt-2 font-semibold">
                              🎉 Chapter completed! Great job!
                            </p>
                          ) : (
                            <p className="text-sm text-gray-500 mt-2">
                              Need 75% to complete this chapter
                            </p>
                          )}
                        </div>
                        
                        <div className="flex gap-3 justify-center">
                          <button
                            onClick={resetMCQ}
                            className="px-6 py-3 bg-white text-gray-700 rounded-lg hover:bg-gray-50 transition-colors border border-gray-300"
                          >
                            Retake Quiz
                          </button>
                          <button
                            onClick={() => {
                              setShowMcq(false);
                              // Refresh progress data to ensure main progress bars are updated
                              fetchProgressData();
                            }}
                            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-colors"
                          >
                            Close
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="w-24 h-24 mx-auto bg-gradient-to-br from-purple-100 to-blue-100 rounded-full flex items-center justify-center mb-6">
                    <Brain className="w-12 h-12 text-purple-400" />
                  </div>
                  <h4 className="text-xl font-semibold text-gray-900 mb-2">No Questions Available</h4>
                  <p className="text-gray-500">No MCQ questions have been generated for this chapter yet.</p>
                </div>
              )}
            </div>
            </div>
          </div>
        )}

      {/* Chat Modal */}
      {showChat && selectedChapter && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-6xl w-full max-h-[95vh] flex flex-col shadow-2xl">
            {/* Header */}
            <div className="relative bg-gradient-to-r from-emerald-600 to-teal-600 text-white p-6 flex-shrink-0">
              <div className="absolute inset-0 bg-black/10"></div>
              <div className="relative flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm">
                    <MessageCircle className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold mb-1">AI Learning Assistant</h3>
                    <p className="text-emerald-100">Chapter {selectedChapter} - Ask anything about this topic</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowChat(false)}
                  className="p-2 hover:bg-white/20 rounded-xl transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>
            
            {/* Content - Scrollable Area */}
            <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
              <div className="p-6">
                <div className="space-y-6">
                  {/* Chat Input */}
                  <div className="bg-gradient-to-r from-gray-50 to-emerald-50 rounded-2xl p-6 border border-gray-200">
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      Ask a question about this chapter:
                    </label>
                    <div className="flex gap-3">
                      <div className="flex-1 relative">
                        <input
                          type="text"
                          value={chatQuery}
                          onChange={(e) => setChatQuery(e.target.value)}
                          placeholder="e.g., What is the main concept of this chapter? How does this work?"
                          className="w-full pl-4 pr-4 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-gray-900 bg-white text-lg"
                          onKeyPress={(e) => e.key === 'Enter' && selectedChapter !== null && handleChatQuery(selectedChapter.toString())}
                        />
                      </div>
                      <button
                        onClick={() => selectedChapter !== null && handleChatQuery(selectedChapter.toString())}
                        disabled={chatLoading || !chatQuery.trim()}
                        className="px-6 py-4 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl hover:from-emerald-700 hover:to-teal-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-semibold shadow-lg hover:shadow-xl"
                      >
                        {chatLoading ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          <div className="flex items-center gap-2">
                            <Zap className="w-5 h-5" />
                            Ask
                          </div>
                        )}
                      </button>
                    </div>
                  </div>
                  
                  {/* Chat Response */}
                  {chatResponse && (
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border border-gray-200 shadow-lg">
                      {/* Header */}
                      <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-white/50 backdrop-blur-sm rounded-t-2xl">
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div className="p-2 bg-blue-100 rounded-lg flex-shrink-0">
                            <Lightbulb className="w-5 h-5 text-blue-600" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <h4 className="text-lg font-semibold text-gray-900 truncate">
                              {chatResponse ? parseHtmlResponse(chatResponse).header || 'AI Response' : 'AI Response'}
                            </h4>
                            <p className="text-sm text-gray-500 truncate">
                              {chatResponse ? `Generated for Chapter ${selectedChapter}` : `Ready for Chapter ${selectedChapter}`}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <button
                            onClick={() => setChatResponse('')}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            title="Clear response"
                          >
                            <X className="w-4 h-4 text-gray-500" />
                          </button>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(chatResponse);
                              setSuccess('Response copied to clipboard!');
                              setTimeout(() => setSuccess(null), 3000);
                            }}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            title="Copy response"
                          >
                            <Download className="w-4 h-4 text-gray-500" />
                          </button>
                        </div>
                      </div>
                      
                      {/* Scrollable Content */}
                      <div className="relative max-h-96 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 hover:scrollbar-thumb-gray-400 scrollbar-thumb-rounded-full scrollbar-track-rounded-full">
                        <div className="p-6">
                          {chatLoading ? (
                            <div className="flex items-center justify-center py-12">
                              <div className="flex flex-col items-center gap-4">
                                <div className="relative">
                                  <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
                                  <div className="absolute inset-0 flex items-center justify-center">
                                    <Brain className="w-5 h-5 text-blue-600" />
                                  </div>
                                </div>
                                <div className="text-center">
                                  <p className="text-gray-600 font-medium">AI is thinking...</p>
                                  <p className="text-sm text-gray-500">Generating response for Chapter {selectedChapter}</p>
                                  <div className="flex items-center gap-1 mt-3">
                                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ) : (
                            renderHtmlContent(chatResponse)
                          )}
                        </div>
                        
                        {/* Fade overlay at bottom */}
                        <div className="sticky bottom-0 left-0 right-0 h-6 bg-gradient-to-t from-blue-50 to-transparent pointer-events-none"></div>
                      </div>
                      
                      {/* Footer */}
                      <div className="px-6 py-3 bg-white/30 backdrop-blur-sm border-t border-gray-200 rounded-b-2xl">
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse flex-shrink-0"></div>
                            <span className="truncate">AI Generated Response</span>
                            {chatResponse && (
                              <span className="text-gray-400 truncate">
                                • {chatResponse.length} chars • {chatResponse.split(' ').length} words
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-4 flex-shrink-0">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              Just now
                            </span>
                            <span className="flex items-center gap-1">
                              <Brain className="w-3 h-3" />
                              Ch {selectedChapter}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Quick Questions */}
                  <div className="bg-gradient-to-r from-gray-50 to-purple-50 rounded-2xl p-6 border border-gray-200">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4">Quick Questions:</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {[
                        "What is the main concept?",
                        "How does this work?",
                        "What are the key points?",
                        "Can you explain this simply?"
                      ].map((question, index) => (
                        <button
                          key={index}
                          onClick={() => setChatQuery(question)}
                          className="p-3 text-left bg-white hover:bg-blue-50 rounded-xl border border-gray-200 hover:border-blue-300 transition-all duration-200 text-gray-700 hover:text-blue-700 text-sm"
                        >
                          {question}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Dialog for Discovering New Modules */}
      <AnimatePresence>
        {showConfirmDialog && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            onClick={() => setShowConfirmDialog(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl max-w-md w-full shadow-2xl overflow-hidden"
            >
              {/* Header */}
              <div className="relative bg-gradient-to-r from-orange-500 to-red-600 text-white p-6">
                <div className="absolute inset-0 bg-black/10"></div>
                <div className="relative flex items-center gap-4">
                  <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm">
                    <AlertTriangle className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold mb-1">Warning: Data Will Be Deleted</h3>
                    <p className="text-orange-100 text-sm">This action cannot be undone</p>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="p-6 space-y-4">
                <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4">
                  <p className="text-gray-800 font-semibold mb-2">
                    Are you sure you want to discover new modules?
                  </p>
                  <ul className="text-sm text-gray-700 space-y-2 list-disc list-inside">
                    <li>All existing modules will be <span className="font-bold text-red-600">permanently deleted</span></li>
                    <li>All your learning progress will be <span className="font-bold text-red-600">lost</span></li>
                    <li>Completed modules and achievements will be <span className="font-bold text-red-600">removed</span></li>
                    <li>You will need to start learning from the beginning</li>
                  </ul>
                </div>

                <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
                  <p className="text-sm text-gray-700">
                    <span className="font-semibold">Note:</span> New modules will be generated based on your current learning path, but all previous progress will be reset.
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="p-6 bg-gray-50 flex gap-3">
                <button
                  onClick={() => setShowConfirmDialog(false)}
                  className="flex-1 px-6 py-3 bg-gray-200 text-gray-800 rounded-xl font-semibold hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmAndProceed}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-red-600 to-orange-600 text-white rounded-xl font-semibold hover:from-red-700 hover:to-orange-700 transition-all shadow-lg hover:shadow-xl"
                >
                  Yes, Delete & Discover
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* N8N Loading Indicator */}
        <N8NLoadingIndicator
          isVisible={showN8nIndicator}
          status={n8nStatus}
          message={n8nMessage}
          progress={n8nProgress}
          startTime={n8nStartTime}
          onDatabaseCheck={async () => {
            const hasModules = await checkDatabaseForModules();
            handleDatabaseCheckComplete(hasModules);
            return hasModules;
          }}
          onClose={() => {
            setShowN8nIndicator(false);
            setN8nStatus('idle');
            setN8nMessage('');
            setN8nProgress(0);
            setN8nStartTime(null);
          }}
        />
    </div>
  );
} 