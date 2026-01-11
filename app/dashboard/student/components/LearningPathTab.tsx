'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BookOpen, 
  Target, 
  CheckCircle, 
  Clock, 
  ArrowRight, 
  RefreshCw, 
  AlertCircle,
  Plus,
  Edit3,
  Trash2,
  Save,
  X,
  ExternalLink,
  Star,
  TrendingUp,
  Users,
  Calendar,
  MapPin,
  Award,
  Zap,
  Lightbulb,
  Rocket,
  Globe,
  Lock,
  Unlock,
  ChevronRight
} from 'lucide-react';
import { useRouter } from 'next/navigation';

interface LearningPath {
  _id: string;
  studentId: string;
  careerPath: string;
  description: string;
  learningModules: Array<{
    module: string;
    description: string;
    submodules?: Array<{
      title: string;
      description: string;
      chapters?: Array<{
        title: string;
      }>;
    }>;
  }>;
  timeRequired: string;
  focusAreas: string[];
  createdAt: string;
  updatedAt: string;
  isActive?: boolean;
}

interface LearningPathTabProps {
  user: {
    uniqueId?: string;
    name?: string;
  } | null;
  onTabChange?: (tab: string) => void;
}

export default function LearningPathTab({ user, onTabChange }: LearningPathTabProps) {
  const [learningPaths, setLearningPaths] = useState<LearningPath[]>([]);
  const [currentPath, setCurrentPath] = useState<LearningPath | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingPath, setEditingPath] = useState<LearningPath | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [pathToDelete, setPathToDelete] = useState<LearningPath | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedPathDetails, setSelectedPathDetails] = useState<LearningPath | null>(null);
  const [expandedModules, setExpandedModules] = useState<Set<number>>(new Set());
  const router = useRouter();

  // Helper function to normalize career path title for comparison
  const normalizeCareerPath = (careerPath: string): string => {
    return careerPath.trim().toLowerCase();
  };

  // Helper function to format date properly
  const formatDate = (dateString: string | Date): string => {
    if (!dateString) return 'Unknown';
    try {
      const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
      if (isNaN(date.getTime())) return 'Invalid date';
      return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Invalid date';
    }
  };

  // Fetch saved learning paths
  const fetchLearningPaths = async () => {
    if (!user?.uniqueId) {
      console.log('🔍 No user uniqueId available for fetching learning paths');
      setLoading(false);
      return;
    }
    
    try {
      console.log('🔍 Fetching learning paths for user:', user.uniqueId);
      setLoading(true);
      const response = await fetch(`/api/learning-paths?studentId=${user.uniqueId}`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      console.log('🔍 Learning paths API response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('🔍 Learning paths data received:', data);
        
        // Remove duplicates - keep only the most recent one for each career path title
        const allPaths = data.learningPaths || [];
        const uniquePathsMap = new Map<string, LearningPath>();
        
        allPaths.forEach((path: LearningPath) => {
          const normalizedTitle = normalizeCareerPath(path.careerPath);
          const existingPath = uniquePathsMap.get(normalizedTitle);
          
          if (!existingPath) {
            // First occurrence of this title
            uniquePathsMap.set(normalizedTitle, path);
          } else {
            // Compare dates to keep the most recent one
            const existingDate = new Date(existingPath.updatedAt || existingPath.createdAt || 0);
            const currentDate = new Date(path.updatedAt || path.createdAt || 0);
            
            if (currentDate > existingDate) {
              // Current path is more recent, replace it
              uniquePathsMap.set(normalizedTitle, path);
              console.log(`🔄 Replacing duplicate "${path.careerPath}" with more recent version`);
            } else {
              console.log(`⏭️ Skipping duplicate "${path.careerPath}" (keeping existing more recent version)`);
            }
          }
        });
        
        // Convert map back to array and sort by updatedAt (most recent first)
        const uniquePaths = Array.from(uniquePathsMap.values()).sort((a, b) => {
          const dateA = new Date(a.updatedAt || a.createdAt || 0);
          const dateB = new Date(b.updatedAt || b.createdAt || 0);
          return dateB.getTime() - dateA.getTime();
        });
        
        const duplicateCount = allPaths.length - uniquePaths.length;
        if (duplicateCount > 0) {
          console.log(`✅ Removed ${duplicateCount} duplicate learning path(s) from display`);
        }
        
        setLearningPaths(uniquePaths);
        
        // Set the active path as current, or the most recent one if none is active
        const activePath = uniquePaths.find(p => p.isActive);
        if (activePath) {
          setCurrentPath(activePath);
        } else if (uniquePaths.length > 0 && !currentPath) {
          // No active path, set the most recent one as current
          setCurrentPath(uniquePaths[0]);
        } else if (currentPath) {
          // Update current path if it still exists in the deduplicated list
          const updatedCurrentPath = uniquePaths.find(p => p._id === currentPath._id);
          if (updatedCurrentPath) {
            setCurrentPath(updatedCurrentPath);
          } else if (uniquePaths.length > 0) {
            // Current path was removed as duplicate, set the first one
            setCurrentPath(uniquePaths[0]);
          }
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('Failed to fetch learning paths:', response.status, errorData);
        setError('Failed to load learning paths');
      }
    } catch (err) {
      console.error('Error fetching learning paths:', err);
      setError('Failed to load learning paths');
    } finally {
      setLoading(false);
    }
  };

  // Save learning path from career details
  const saveLearningPath = async (careerPath: string, description: string, learningModules: any[], timeRequired: string, focusAreas: string[]) => {
    if (!user?.uniqueId) return;
    
    try {
      setSaving(true);
      const response = await fetch('/api/learning-paths/save', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          studentId: user.uniqueId,
          careerPath,
          description,
          learningModules,
          timeRequired,
          focusAreas
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setSuccess('Learning path saved successfully!');
        await fetchLearningPaths(); // Refresh the list
        setTimeout(() => setSuccess(null), 3000);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to save learning path');
      }
    } catch (err) {
      console.error('Error saving learning path:', err);
      setError('Failed to save learning path');
    } finally {
      setSaving(false);
    }
  };

  // Show delete confirmation dialog
  const confirmDelete = (path: LearningPath) => {
    setPathToDelete(path);
    setShowDeleteConfirm(true);
  };

  // Delete learning path after confirmation
  const deleteLearningPath = async () => {
    if (!pathToDelete) return;
    
    const pathIdToDelete = pathToDelete._id; // Store ID before deletion
    
    try {
      const response = await fetch(`/api/learning-paths/${pathIdToDelete}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        setSuccess('Learning path deleted successfully!');
        
        // If we deleted the current path, clear it before refreshing
        if (currentPath?._id === pathIdToDelete) {
          setCurrentPath(null);
        }
        
        await fetchLearningPaths(); // Refresh the list
        
        // After refresh, if no current path is set, select the first one if available
        setTimeout(() => {
          if (!currentPath && learningPaths.length > 0) {
            setCurrentPath(learningPaths[0]);
          }
        }, 100);
        
        setTimeout(() => setSuccess(null), 3000);
      } else if (response.status === 404) {
        // Path was already deleted (possibly by duplicate removal), just refresh
        console.log('Learning path already deleted, refreshing list...');
        setSuccess('Learning path removed successfully!');
        await fetchLearningPaths();
        setTimeout(() => setSuccess(null), 3000);
      } else {
        const errorData = await response.json().catch(() => ({}));
        setError(errorData.error || 'Failed to delete learning path');
      }
    } catch (err) {
      console.error('Error deleting learning path:', err);
      setError('Failed to delete learning path');
    } finally {
      setShowDeleteConfirm(false);
      setPathToDelete(null);
    }
  };

  // Cancel delete
  const cancelDelete = () => {
    setShowDeleteConfirm(false);
    setPathToDelete(null);
  };

  // Set active learning path
  const setActivePath = async (path: LearningPath) => {
    try {
      const response = await fetch(`/api/learning-paths/${path._id}/set-active`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ studentId: user?.uniqueId }),
      });

      if (response.ok) {
        // Update the path's isActive status locally
        const updatedPath = { ...path, isActive: true };
        setCurrentPath(updatedPath);
        
        // Update the path in the learningPaths array
        setLearningPaths(prevPaths => 
          prevPaths.map(p => ({
            ...p,
            isActive: p._id === path._id
          }))
        );
        
        setSuccess('Learning path activated successfully!');
        setTimeout(() => setSuccess(null), 3000);
      } else {
        const errorData = await response.json().catch(() => ({}));
        setError(errorData.error || 'Failed to activate learning path');
      }
    } catch (err) {
      console.error('Error setting active path:', err);
      setError('Failed to activate learning path');
    }
  };

  useEffect(() => {
    if (user?.uniqueId) {
      console.log('🔍 User uniqueId available, fetching learning paths...', user.uniqueId);
      fetchLearningPaths();
    } else {
      console.log('🔍 No user uniqueId available yet, waiting...');
      setLoading(false);
    }
  }, [user?.uniqueId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin text-purple-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading learning paths...</p>
        </div>
      </div>
    );
  }

  if (!user?.uniqueId) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Target className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">User Not Found</h3>
          <p className="text-gray-600">Please log in to view your learning paths.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 relative">
      {/* Background Elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-purple-200/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-blue-200/20 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-indigo-200/20 rounded-full blur-3xl"></div>
      </div>

      <motion.div 
        className="relative bg-white/80 backdrop-blur-sm rounded-xl sm:rounded-3xl shadow-2xl p-4 sm:p-6 md:p-8 max-w-7xl mx-auto border border-white/20"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        {/* Enhanced Header */}
        <motion.div 
          className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 sm:mb-8 md:mb-12 gap-4 sm:gap-6"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-center gap-3 sm:gap-4 md:gap-6 w-full lg:w-auto">
            <motion.div
              className="relative w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 bg-gradient-to-br from-purple-500 via-blue-500 to-indigo-600 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-2xl flex-shrink-0"
            >
              <Target className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 text-white" />
              <div className="absolute -top-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
                <Star className="w-2 h-2 sm:w-2.5 sm:h-2.5 md:w-3 md:h-3 text-white" />
              </div>
            </motion.div>
            <div className="min-w-0 flex-1">
              <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 bg-clip-text text-transparent mb-1 sm:mb-2">
                Learning Paths
              </h2>
              <p className="text-gray-600 text-sm sm:text-base md:text-lg lg:text-xl">Your personalized career learning journey</p>
              <div className="flex items-center gap-2 sm:gap-3 md:gap-4 mt-2 sm:mt-3 flex-wrap">
                <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-purple-600 bg-purple-50 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full">
                  <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-purple-500 rounded-full animate-pulse"></div>
                  {learningPaths.length} Paths Available
                </div>
                <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-blue-600 bg-blue-50 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full">
                  <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-blue-500 rounded-full"></div>
                  AI-Powered
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 w-full lg:w-auto">
            <motion.button
              onClick={() => router.push('/career-exploration')}
              className="group relative bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 hover:from-blue-700 hover:via-purple-700 hover:to-indigo-700 text-white px-4 sm:px-6 md:px-8 py-2.5 sm:py-3 md:py-4 rounded-xl sm:rounded-2xl transition-all duration-300 flex items-center justify-center gap-2 sm:gap-3 shadow-xl hover:shadow-2xl overflow-hidden text-sm sm:text-base md:text-lg font-semibold"
              whileHover={{ scale: 1.05, y: -3 }}
              whileTap={{ scale: 0.95 }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <Plus className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 relative z-10" />
              <span className="relative z-10">Choose New Path</span>
              <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 relative z-10 group-hover:translate-x-1 transition-transform duration-300" />
            </motion.button>
          </div>
        </motion.div>

        {/* Enhanced Error and Success Messages */}
        <AnimatePresence>
          {error && (
            <motion.div 
              className="mb-8 p-6 bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 text-red-700 rounded-2xl flex items-center gap-4 shadow-lg"
              initial={{ opacity: 0, y: -20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.9 }}
              transition={{ duration: 0.4, type: "spring" }}
            >
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                <AlertCircle className="w-6 h-6 text-red-500" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-lg mb-1">Something went wrong</h4>
                <p className="text-sm">{error}</p>
              </div>
              <button
                onClick={() => setError(null)}
                className="p-2 hover:bg-red-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </motion.div>
          )}
          {success && (
            <motion.div 
              className="mb-8 p-6 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 text-green-700 rounded-2xl flex items-center gap-4 shadow-lg"
              initial={{ opacity: 0, y: -20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.9 }}
              transition={{ duration: 0.4, type: "spring" }}
            >
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                <CheckCircle className="w-6 h-6 text-green-500" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-lg mb-1">Success!</h4>
                <p className="text-sm">{success}</p>
              </div>
              <button
                onClick={() => setSuccess(null)}
                className="p-2 hover:bg-green-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Enhanced Learning Paths List */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6 md:gap-8">
          {learningPaths.length === 0 ? (
            <div className="col-span-2 text-center py-10 sm:py-16 md:py-20 px-4">
              <motion.div 
                className="relative w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 bg-gradient-to-br from-purple-100 via-blue-100 to-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6 sm:mb-8 shadow-2xl"
                animate={{ 
                  scale: [1, 1.05, 1],
                  rotate: [0, 5, -5, 0]
                }}
                transition={{ 
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              >
                <Target className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 text-purple-500" />
                <div className="absolute -top-1 -right-1 sm:-top-2 sm:-right-2 w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
                  <Plus className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 text-white" />
                </div>
              </motion.div>
              <h3 className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-4 sm:mb-5 md:mb-6">
                No Learning Paths Yet
              </h3>
              <p className="text-gray-600 text-sm sm:text-base md:text-lg lg:text-xl mb-6 sm:mb-8 md:mb-10 max-w-2xl mx-auto leading-relaxed px-4">
                Embark on your personalized learning journey by exploring career options and creating your first AI-powered learning path tailored just for you.
              </p>
              <motion.button
                onClick={() => router.push('/career-exploration')}
                className="group relative bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 hover:from-purple-700 hover:via-blue-700 hover:to-indigo-700 text-white px-6 sm:px-8 md:px-12 py-3 sm:py-4 md:py-5 rounded-xl sm:rounded-2xl font-semibold text-sm sm:text-base md:text-lg transition-all duration-300 shadow-2xl hover:shadow-3xl overflow-hidden"
                whileHover={{ scale: 1.05, y: -3 }}
                whileTap={{ scale: 0.95 }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative z-10 flex items-center gap-2 sm:gap-3">
                  <Rocket className="w-5 h-5 sm:w-6 sm:h-6" />
                  <span className="hidden sm:inline">Explore Career Options</span>
                  <span className="sm:hidden">Explore Careers</span>
                  <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform duration-300" />
                </div>
              </motion.button>
            </div>
          ) : (
            learningPaths.map((path, index) => (
              <motion.div
                key={path._id}
                className={`group relative bg-gradient-to-br from-white via-purple-50/30 to-blue-50/30 rounded-xl sm:rounded-2xl md:rounded-3xl p-4 sm:p-6 md:p-8 border-2 transition-all duration-500 overflow-visible ${
                  currentPath?._id === path._id 
                    ? 'border-purple-500 shadow-2xl md:scale-105' 
                    : 'border-gray-200 hover:border-purple-300 hover:shadow-2xl'
                }`}
                initial={{ opacity: 0, y: 30, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ delay: index * 0.15, duration: 0.6 }}
                whileHover={{ scale: 1.03, y: -5 }}
              >
                {/* Background Pattern Container */}
                <div className="absolute inset-0 overflow-hidden rounded-xl sm:rounded-2xl md:rounded-3xl">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-100/50 to-blue-100/50 rounded-full -translate-y-16 translate-x-16"></div>
                  <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-blue-100/50 to-purple-100/50 rounded-full translate-y-12 -translate-x-12"></div>
                </div>
                
                {/* Active Badge */}
                {currentPath?._id === path._id && (
                  <motion.div 
                    className="absolute top-4 right-4 sm:top-6 sm:right-6 bg-gradient-to-r from-purple-500 via-blue-500 to-indigo-500 text-white px-2 sm:px-3 md:px-4 py-1 sm:py-1.5 md:py-2 rounded-full text-xs sm:text-sm font-bold flex items-center gap-1 sm:gap-2 shadow-xl z-20"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.3, type: "spring" }}
                  >
                    <Star className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4" />
                    <span className="hidden sm:inline">Active Path</span>
                    <span className="sm:hidden">Active</span>
                  </motion.div>
                )}

                {/* Path Header */}
                <div className="relative z-10">
                  <div className="flex flex-col sm:flex-row justify-between items-start mb-4 sm:mb-6 gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                        <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl flex items-center justify-center flex-shrink-0 ${
                          currentPath?._id === path._id 
                            ? 'bg-gradient-to-r from-purple-500 to-blue-500' 
                            : 'bg-gradient-to-r from-purple-400 to-blue-400'
                        }`}>
                          <Target className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 mb-1 truncate">{path.careerPath}</h3>
                          <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-gray-500">
                            <Calendar className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                            <span className="truncate">Created {formatDate(path.createdAt)}</span>
                          </div>
                        </div>
                      </div>
                      
                      <p className="text-gray-600 text-sm sm:text-base mb-3 sm:mb-4 leading-relaxed line-clamp-2">{path.description}</p>
                      
                      <div className="flex items-center gap-3 sm:gap-4 md:gap-6 text-xs sm:text-sm text-gray-600 flex-wrap">
                        <div className="flex items-center gap-1.5 sm:gap-2 bg-purple-50 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full">
                          <Clock className="w-3 h-3 sm:w-4 sm:h-4 text-purple-600 flex-shrink-0" />
                          <span className="font-medium truncate">{path.timeRequired}</span>
                        </div>
                        <div className="flex items-center gap-1.5 sm:gap-2 bg-blue-50 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full">
                          <BookOpen className="w-3 h-3 sm:w-4 sm:h-4 text-blue-600 flex-shrink-0" />
                          <span className="font-medium">{path.learningModules.length} modules</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Enhanced Actions */}
                    <div className="flex gap-2 sm:ml-4 md:ml-6 self-start sm:self-center">
                      {currentPath?._id !== path._id && (
                        <motion.button
                          onClick={() => setActivePath(path)}
                          className="group p-2 sm:p-3 text-purple-600 hover:bg-purple-100 rounded-lg sm:rounded-xl transition-all duration-300 border border-purple-200 hover:border-purple-300"
                          whileHover={{ scale: 1.1, rotate: 5 }}
                          whileTap={{ scale: 0.9 }}
                        >
                          <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 group-hover:scale-110 transition-transform duration-300" />
                        </motion.button>
                      )}
                      <motion.button
                        onClick={() => confirmDelete(path)}
                        className="group p-2 sm:p-3 text-red-600 hover:bg-red-100 rounded-lg sm:rounded-xl transition-all duration-300 border border-red-200 hover:border-red-300"
                        whileHover={{ scale: 1.1, rotate: -5 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        <Trash2 className="w-4 h-4 sm:w-5 sm:h-5 group-hover:scale-110 transition-transform duration-300" />
                      </motion.button>
                    </div>
                  </div>

                  {/* Enhanced Focus Areas */}
                  <div className="mb-4 sm:mb-6">
                    <h4 className="text-xs sm:text-sm font-semibold text-gray-700 mb-2 sm:mb-3 flex items-center gap-1.5 sm:gap-2">
                      <Zap className="w-3 h-3 sm:w-4 sm:h-4 text-purple-600 flex-shrink-0" />
                      Focus Areas
                    </h4>
                    <div className="flex flex-wrap gap-1.5 sm:gap-2">
                      {path.focusAreas.slice(0, 3).map((area, idx) => (
                        <motion.span
                          key={idx}
                          className="px-2 sm:px-3 md:px-4 py-1 sm:py-1.5 md:py-2 bg-gradient-to-r from-purple-100 to-blue-100 text-purple-700 text-xs sm:text-sm font-medium rounded-full border border-purple-200 hover:border-purple-300 transition-all duration-300"
                          whileHover={{ scale: 1.05 }}
                        >
                          {area}
                        </motion.span>
                      ))}
                      {path.focusAreas.length > 3 && (
                        <span className="px-2 sm:px-3 md:px-4 py-1 sm:py-1.5 md:py-2 bg-gray-100 text-gray-600 text-xs sm:text-sm font-medium rounded-full border border-gray-200">
                          +{path.focusAreas.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Enhanced Learning Modules Preview */}
                  <div className="mb-4 sm:mb-6">
                    <h4 className="text-xs sm:text-sm font-semibold text-gray-700 mb-2 sm:mb-3 flex items-center gap-1.5 sm:gap-2">
                      <BookOpen className="w-3 h-3 sm:w-4 sm:h-4 text-blue-600 flex-shrink-0" />
                      Learning Modules
                    </h4>
                    <div className="space-y-2 sm:space-y-3">
                      {path.learningModules.slice(0, 2).map((module, idx) => (
                        <motion.div 
                          key={idx} 
                          className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 bg-white/60 rounded-lg sm:rounded-xl border border-gray-100 hover:border-purple-200 transition-all duration-300"
                          whileHover={{ x: 5 }}
                        >
                          <div className="w-2 h-2 sm:w-3 sm:h-3 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex-shrink-0"></div>
                          <span className="text-xs sm:text-sm text-gray-700 font-medium truncate">{module.module}</span>
                        </motion.div>
                      ))}
                      {path.learningModules.length > 2 && (
                        <div className="text-xs sm:text-sm text-gray-500 bg-gray-50 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg text-center">
                          +{path.learningModules.length - 2} more modules available
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Enhanced View Details Button */}
                  <motion.button
                    onClick={() => {
                      setSelectedPathDetails(path);
                      setShowDetailsModal(true);
                    }}
                    className="group w-full py-2.5 sm:py-3 md:py-4 bg-gradient-to-r from-purple-50 via-blue-50 to-indigo-50 hover:from-purple-100 hover:via-blue-100 hover:to-indigo-100 text-purple-700 rounded-xl sm:rounded-2xl font-semibold text-sm sm:text-base transition-all duration-300 flex items-center justify-center gap-2 sm:gap-3 border border-purple-200 hover:border-purple-300 shadow-lg hover:shadow-xl"
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <ExternalLink className="w-4 h-4 sm:w-5 sm:h-5 group-hover:rotate-12 transition-transform duration-300" />
                    <span className="hidden sm:inline">View Full Details</span>
                    <span className="sm:hidden">View Details</span>
                    <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform duration-300" />
                  </motion.button>
                </div>
              </motion.div>
            ))
          )}
        </div>

        {/* Enhanced Current Path Details */}
        {currentPath && (
          <motion.div 
            className="mt-6 sm:mt-8 md:mt-12 bg-gradient-to-r from-purple-50 via-blue-50 to-indigo-50 rounded-xl sm:rounded-2xl md:rounded-3xl p-4 sm:p-6 md:p-8 border-2 border-purple-200 shadow-2xl relative overflow-hidden"
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: 0.4, duration: 0.6 }}
          >
            {/* Background Pattern */}
            <div className="absolute top-0 right-0 w-20 h-20 sm:w-32 sm:h-32 md:w-40 md:h-40 bg-gradient-to-br from-purple-200/30 to-blue-200/30 rounded-full -translate-y-10 sm:-translate-y-16 md:-translate-y-20 translate-x-10 sm:translate-x-16 md:translate-x-20"></div>
            <div className="absolute bottom-0 left-0 w-16 h-16 sm:w-24 sm:h-24 md:w-32 md:h-32 bg-gradient-to-tr from-blue-200/30 to-purple-200/30 rounded-full translate-y-8 sm:translate-y-12 md:translate-y-16 -translate-x-8 sm:-translate-x-12 md:-translate-x-16"></div>
            
            <div className="relative z-10">
              <div className="flex items-center gap-2 sm:gap-3 md:gap-4 mb-4 sm:mb-6">
                <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 bg-gradient-to-r from-purple-500 via-blue-500 to-indigo-500 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-xl flex-shrink-0">
                  <Star className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-white" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-xl sm:text-2xl md:text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-1 sm:mb-2">
                    Current Learning Path
                  </h3>
                  <p className="text-base sm:text-lg md:text-xl font-semibold text-gray-800 truncate">{currentPath.careerPath}</p>
                </div>
              </div>
              
              <p className="text-gray-700 text-sm sm:text-base md:text-lg mb-4 sm:mb-6 md:mb-8 leading-relaxed max-w-4xl">{currentPath.description}</p>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 md:gap-6 mb-4 sm:mb-6 md:mb-8">
                <div className="flex items-center gap-2 sm:gap-3 p-3 sm:p-4 bg-white/60 rounded-xl sm:rounded-2xl border border-purple-200">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-100 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0">
                    <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm text-gray-500 font-medium">Duration</p>
                    <p className="text-base sm:text-lg font-bold text-gray-800 truncate">{currentPath.timeRequired}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 sm:gap-3 p-3 sm:p-4 bg-white/60 rounded-xl sm:rounded-2xl border border-blue-200">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0">
                    <BookOpen className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm text-gray-500 font-medium">Modules</p>
                    <p className="text-base sm:text-lg font-bold text-gray-800">{currentPath.learningModules.length}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 sm:gap-3 p-3 sm:p-4 bg-white/60 rounded-xl sm:rounded-2xl border border-indigo-200">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-indigo-100 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0">
                    <Target className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-600" />
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm text-gray-500 font-medium">Focus Areas</p>
                    <p className="text-base sm:text-lg font-bold text-gray-800">{currentPath.focusAreas.length}</p>
                  </div>
                </div>
              </div>

              <motion.button
                onClick={() => onTabChange?.('modules')}
                className="group relative w-full sm:w-auto bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 hover:from-purple-700 hover:via-blue-700 hover:to-indigo-700 text-white px-6 sm:px-8 md:px-10 py-3 sm:py-4 md:py-5 rounded-xl sm:rounded-2xl font-bold text-sm sm:text-base md:text-lg transition-all duration-300 shadow-2xl hover:shadow-3xl flex items-center justify-center gap-2 sm:gap-3 md:gap-4 overflow-hidden"
                whileHover={{ scale: 1.05, y: -3 }}
                whileTap={{ scale: 0.95 }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <Rocket className="w-5 h-5 sm:w-6 sm:h-6 relative z-10" />
                <span className="relative z-10">Start Learning Journey</span>
                <ArrowRight className="w-5 h-5 sm:w-6 sm:h-6 relative z-10 group-hover:translate-x-2 transition-transform duration-300" />
              </motion.button>
            </div>
          </motion.div>
        )}
      </motion.div>

      {/* Learning Path Details Modal */}
      <AnimatePresence>
        {showDetailsModal && selectedPathDetails && (
          <motion.div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowDetailsModal(false)}
          >
            <motion.div
              className="bg-white rounded-xl sm:rounded-2xl md:rounded-3xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto relative m-4"
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="sticky top-0 bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 text-white p-4 sm:p-5 md:p-6 rounded-t-xl sm:rounded-t-2xl md:rounded-t-3xl z-10">
                <div className="flex items-center justify-between gap-3 sm:gap-4">
                  <div className="flex items-center gap-2 sm:gap-3 md:gap-4 min-w-0 flex-1">
                    <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 bg-white/20 rounded-xl sm:rounded-2xl flex items-center justify-center backdrop-blur-sm flex-shrink-0">
                      <Target className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold mb-1 truncate">{selectedPathDetails.careerPath}</h2>
                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 text-xs sm:text-sm text-white/90">
                        <div className="flex items-center gap-1.5 sm:gap-2">
                          <Calendar className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                          <span className="truncate">Created {formatDate(selectedPathDetails.createdAt)}</span>
                        </div>
                        <div className="flex items-center gap-1.5 sm:gap-2">
                          <Clock className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                          <span className="truncate">{selectedPathDetails.timeRequired}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowDetailsModal(false)}
                    className="p-1.5 sm:p-2 hover:bg-white/20 rounded-lg sm:rounded-xl transition-colors flex-shrink-0"
                  >
                    <X className="w-5 h-5 sm:w-6 sm:h-6" />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="p-4 sm:p-6 md:p-8 space-y-4 sm:space-y-6 md:space-y-8">
                {/* Description */}
                <div>
                  <h3 className="text-base sm:text-lg md:text-xl font-bold text-gray-900 mb-2 sm:mb-3 md:mb-4 flex items-center gap-1.5 sm:gap-2">
                    <BookOpen className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600 flex-shrink-0" />
                    Overview
                  </h3>
                  <p className="text-gray-700 text-sm sm:text-base md:text-lg leading-relaxed">{selectedPathDetails.description}</p>
                </div>

                {/* Focus Areas */}
                {selectedPathDetails.focusAreas && selectedPathDetails.focusAreas.length > 0 && (
                  <div>
                    <h3 className="text-base sm:text-lg md:text-xl font-bold text-gray-900 mb-2 sm:mb-3 md:mb-4 flex items-center gap-1.5 sm:gap-2">
                      <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-500 flex-shrink-0" />
                      Focus Areas
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                      {selectedPathDetails.focusAreas.map((area, index) => (
                        <div
                          key={index}
                          className="p-3 sm:p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg sm:rounded-xl border border-purple-200"
                        >
                          <div className="flex items-center gap-2 sm:gap-3">
                            <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-purple-500 rounded-full flex-shrink-0"></div>
                            <span className="text-sm sm:text-base text-gray-800 font-medium">{area}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Learning Modules */}
                {selectedPathDetails.learningModules && selectedPathDetails.learningModules.length > 0 && (
                  <div>
                    <h3 className="text-base sm:text-lg md:text-xl font-bold text-gray-900 mb-2 sm:mb-3 md:mb-4 flex items-center gap-1.5 sm:gap-2">
                      <BookOpen className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 flex-shrink-0" />
                      Learning Modules ({selectedPathDetails.learningModules.length})
                    </h3>
                    <div className="space-y-3 sm:space-y-4">
                      {selectedPathDetails.learningModules.map((module, index) => {
                        const isExpanded = expandedModules.has(index);
                        const hasSubmodules = module.submodules && module.submodules.length > 0;
                        
                        return (
                          <motion.div
                            key={index}
                            className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg sm:rounded-xl overflow-hidden border border-gray-200"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                          >
                            <div className="p-3 sm:p-4 md:p-6">
                              <div className="flex items-start justify-between mb-2 sm:mb-3 gap-2 sm:gap-4">
                                <div className="flex items-start gap-2 sm:gap-3 md:gap-4 flex-1 min-w-0">
                                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0">
                                    <span className="text-white font-bold text-base sm:text-lg">{index + 1}</span>
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <h4 className="text-base sm:text-lg md:text-xl font-bold text-gray-900 mb-1 sm:mb-2">{module.module}</h4>
                                    <p className="text-sm sm:text-base text-gray-600 leading-relaxed">{module.description}</p>
                                  </div>
                                </div>
                                {hasSubmodules && (
                                  <button
                                    onClick={() => {
                                      const newExpanded = new Set(expandedModules);
                                      if (newExpanded.has(index)) {
                                        newExpanded.delete(index);
                                      } else {
                                        newExpanded.add(index);
                                      }
                                      setExpandedModules(newExpanded);
                                    }}
                                    className="ml-2 sm:ml-4 p-1.5 sm:p-2 text-purple-600 hover:bg-purple-100 rounded-lg transition-colors flex-shrink-0"
                                  >
                                    <ChevronRight
                                      className={`w-4 h-4 sm:w-5 sm:h-5 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`}
                                    />
                                  </button>
                                )}
                              </div>

                              {/* Submodules */}
                              {hasSubmodules && isExpanded && (
                                <motion.div
                                  className="mt-3 sm:mt-4 space-y-2 sm:space-y-3 pl-8 sm:pl-12 md:pl-16"
                                  initial={{ opacity: 0, height: 0 }}
                                  animate={{ opacity: 1, height: 'auto' }}
                                  exit={{ opacity: 0, height: 0 }}
                                >
                                  {module.submodules?.map((submodule, subIndex) => (
                                    <div
                                      key={subIndex}
                                      className="bg-white rounded-lg p-3 sm:p-4 border border-gray-200"
                                    >
                                      <h5 className="text-sm sm:text-base font-semibold text-gray-800 mb-1 sm:mb-2">{submodule.title}</h5>
                                      <p className="text-xs sm:text-sm text-gray-600 mb-2 sm:mb-3">{submodule.description}</p>
                                      
                                      {/* Chapters */}
                                      {submodule.chapters && submodule.chapters.length > 0 && (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 sm:gap-2">
                                          {submodule.chapters.map((chapter, chapterIndex) => (
                                            <div
                                              key={chapterIndex}
                                              className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-gray-700"
                                            >
                                              <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-blue-500 rounded-full flex-shrink-0"></div>
                                              <span className="truncate">{chapter.title}</span>
                                            </div>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </motion.div>
                              )}
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Stats */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 md:gap-6 pt-4 sm:pt-5 md:pt-6 border-t border-gray-200">
                  <div className="text-center p-3 sm:p-4 bg-purple-50 rounded-lg sm:rounded-xl">
                    <Clock className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-purple-600 mx-auto mb-1 sm:mb-2" />
                    <p className="text-xs sm:text-sm text-gray-600 mb-0.5 sm:mb-1">Duration</p>
                    <p className="text-base sm:text-lg md:text-xl font-bold text-gray-900 truncate">{selectedPathDetails.timeRequired}</p>
                  </div>
                  <div className="text-center p-3 sm:p-4 bg-blue-50 rounded-lg sm:rounded-xl">
                    <BookOpen className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-blue-600 mx-auto mb-1 sm:mb-2" />
                    <p className="text-xs sm:text-sm text-gray-600 mb-0.5 sm:mb-1">Modules</p>
                    <p className="text-base sm:text-lg md:text-xl font-bold text-gray-900">{selectedPathDetails.learningModules.length}</p>
                  </div>
                  <div className="text-center p-3 sm:p-4 bg-indigo-50 rounded-lg sm:rounded-xl">
                    <Target className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-indigo-600 mx-auto mb-1 sm:mb-2" />
                    <p className="text-xs sm:text-sm text-gray-600 mb-0.5 sm:mb-1">Focus Areas</p>
                    <p className="text-base sm:text-lg md:text-xl font-bold text-gray-900">{selectedPathDetails.focusAreas.length}</p>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 p-3 sm:p-4 md:p-6 rounded-b-xl sm:rounded-b-2xl md:rounded-b-3xl">
                <div className="flex justify-end">
                  <motion.button
                    onClick={() => setShowDetailsModal(false)}
                    className="w-full sm:w-auto px-6 sm:px-8 py-2.5 sm:py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg sm:rounded-xl font-semibold text-sm sm:text-base hover:from-purple-700 hover:to-blue-700 transition-all duration-300 flex items-center justify-center gap-2 shadow-lg"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 rotate-180" />
                    <span className="hidden sm:inline">Back to Learning Paths</span>
                    <span className="sm:hidden">Back</span>
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteConfirm && pathToDelete && (
          <motion.div
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={cancelDelete}
          >
            <motion.div
              className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertCircle className="w-8 h-8 text-red-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Delete Learning Path</h3>
                <p className="text-gray-600 mb-6">
                  Are you sure you want to delete <strong>"{pathToDelete.careerPath}"</strong>? 
                  This action cannot be undone.
                </p>
                <div className="flex gap-3 justify-center">
                  <motion.button
                    onClick={cancelDelete}
                    className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    onClick={deleteLearningPath}
                    className="px-6 py-3 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 transition-colors flex items-center gap-2"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
