'use client';

import React, { useState, useEffect } from 'react';
import { Play, ExternalLink, Loader2, AlertCircle, Youtube, Clock, Eye, Bookmark, BookmarkCheck, ThumbsUp, CheckCircle } from 'lucide-react';

interface Chapter {
  chapterIndex: number;
  chapterKey: string;
  videoTitle: string;
  videoUrl: string;
}

interface YouTubeData {
  _id: string;
  uniqueid: string;
  chapters: Chapter[];
  totalChapters: number;
  createdAt: string;
  updatedAt: string;
}

interface YouTubeVideoListProps {
  uniqueid: string;
  onVideoSelect?: (videoUrl: string, videoTitle: string) => void;
}

export default function YouTubeVideoList({ uniqueid, onVideoSelect }: YouTubeVideoListProps) {
  const [youtubeData, setYoutubeData] = useState<YouTubeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const [showFallback, setShowFallback] = useState(false);
  const [bookmarkedVideos, setBookmarkedVideos] = useState<Set<string>>(new Set());
  const [likedVideos, setLikedVideos] = useState<Set<string>>(new Set());
  const [completedVideos, setCompletedVideos] = useState<Set<string>>(new Set());
  // No longer need selectedModule since we have chapters directly

  useEffect(() => {
    if (uniqueid) {
      fetchYouTubeData();
    }
  }, [uniqueid]);

  const fetchYouTubeData = async (isRetry = false) => {
    if (!uniqueid || uniqueid === 'default') {
      setLoading(false);
      setError('No uniqueId available');
      return;
    }
    
    if (!isRetry) {
      setLoading(true);
      setError(null);
    }
    
    try {
      console.log('🔍 YouTubeVideoList: Fetching data for uniqueid:', uniqueid);
      
      const response = await fetch(`/api/youtube-data`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include' // Include cookies for authentication
      });
      
      console.log('📊 YouTubeVideoList: API response status:', response.status);
      
      if (response.ok) {
        const result = await response.json();
        console.log('📊 YouTubeVideoList: API response data:', result);
        
        if (result.success && result.data) {
          // Check if this is real data or fallback
          if (result.isFallback) {
            setShowFallback(true);
            setError('Using fallback content while scraper processes your personalized videos...');
            startPolling();
          } else {
            // Real data received, stop polling and show real content
            setYoutubeData(result.data);
            setShowFallback(false);
            setIsPolling(false);
            setError(null);
            console.log('✅ YouTube data loaded:', result.data);
          }
        } else {
          setError(result.message || 'No video data available');
        }
      } else {
        if (response.status === 404) {
          // Show fallback content while scraper is processing
          setShowFallback(true);
          setError('Scraper is processing your content. Showing fallback videos while we wait...');
          startPolling();
        } else {
          const errorData = await response.json();
          setError(errorData.message || 'Failed to fetch YouTube data');
        }
      }
    } catch (err) {
      console.error('❌ YouTubeVideoList: Error fetching YouTube data:', err);
      setError('Network error while fetching YouTube data');
      setShowFallback(true);
    } finally {
      if (!isRetry) {
        setLoading(false);
      }
    }
  };

  const startPolling = () => {
    if (isPolling) return;
    
    setIsPolling(true);
    console.log('🔄 YouTubeVideoList: Starting polling for real data...');
    
    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch(`/api/youtube-data`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include' // Include cookies for authentication
      });
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data && !data.isFallback) {
            // Real data is now available
            console.log('✅ YouTubeVideoList: Real data received, stopping polling');
            setYoutubeData(data.data);
            setShowFallback(false);
            setIsPolling(false);
            setError(null);
            clearInterval(pollInterval);
          }
        }
      } catch (err) {
        console.warn('⚠️ YouTubeVideoList: Polling error:', err);
      }
    }, 5000); // Poll every 5 seconds

    // Stop polling after 5 minutes
    setTimeout(() => {
      if (isPolling) {
        console.log('⏰ YouTubeVideoList: Polling timeout, keeping fallback content');
        setIsPolling(false);
        clearInterval(pollInterval);
      }
    }, 300000); // 5 minutes
  };

  const handleVideoClick = (videoUrl: string, videoTitle: string) => {
    if (onVideoSelect) {
      onVideoSelect(videoUrl, videoTitle);
    } else {
      // Open video in new tab as fallback
      window.open(videoUrl, '_blank');
    }
  };

  const extractVideoId = (url: string): string | null => {
    const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
    const match = url.match(regex);
    return match ? match[1] : null;
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

  const markAsCompleted = (chapterId: string) => {
    setCompletedVideos(prev => {
      const newCompleted = new Set(prev);
      if (newCompleted.has(chapterId)) {
        newCompleted.delete(chapterId);
      } else {
        newCompleted.add(chapterId);
      }
      return newCompleted;
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center">
          <div className="relative">
            <div className="w-16 h-16 bg-gradient-to-r from-red-500 to-red-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
              <Youtube className="w-8 h-8 text-white" />
            </div>
            <Loader2 className="w-6 h-6 animate-spin text-red-500 absolute -top-1 -right-1" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Loading YouTube Videos</h3>
          <p className="text-gray-600">Fetching your personalized learning content...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {isPolling ? 'Processing Your Videos...' : 'Unable to Load Videos'}
          </h3>
          <p className="text-red-600 mb-6">{error}</p>
          
          {isPolling && (
            <div className="mb-6">
              <div className="flex items-center justify-center space-x-2 mb-2">
                <div className="w-4 h-4 bg-blue-500 rounded-full animate-pulse"></div>
                <div className="w-4 h-4 bg-blue-500 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                <div className="w-4 h-4 bg-blue-500 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
              </div>
              <p className="text-sm text-gray-600">
                Checking for your personalized videos every 5 seconds...
              </p>
            </div>
          )}
          
          <button
            onClick={() => {
              // Reset error state and try fetching again
              setError(null);
              fetchYouTubeData();
            }}
            className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all duration-200 font-medium shadow-lg hover:shadow-xl"
          >
            {isPolling ? 'Check Now' : 'Try Again'}
          </button>
        </div>
      </div>
    );
  }

  if (!youtubeData || youtubeData.chapters.length === 0) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Youtube className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Videos Available</h3>
          <p className="text-gray-600 mb-6">No YouTube videos found for this user. Fallback content will be loaded instead.</p>
          <button
            onClick={() => {
              // Reset error state and try fetching again
              setError(null);
              fetchYouTubeData();
            }}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 font-medium shadow-lg hover:shadow-xl"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Video Grid */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="bg-gradient-to-r from-red-500 to-red-600 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                <Youtube className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-white">
                  YouTube Learning Videos
                </h3>
                <p className="text-red-100 text-sm">
                  {youtubeData.totalChapters} learning videos available
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-white/90">
              <Eye className="w-4 h-4" />
              <span className="text-sm font-medium">{youtubeData.totalChapters} videos</span>
            </div>
          </div>
        </div>
        
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {youtubeData.chapters.map((chapter, index) => {
              const chapterId = `chapter-${chapter.chapterIndex}`;
              const isBookmarked = bookmarkedVideos.has(chapterId);
              const isLiked = likedVideos.has(chapterId);
              const isCompleted = completedVideos.has(chapterId);
              
              return (
                <div
                  key={`chapter-${chapter.chapterIndex}`}
                  className="bg-white rounded-xl overflow-hidden hover:shadow-xl transition-all duration-300 group border border-gray-100 hover:border-red-200"
                >
                  {/* Video Info */}
                  <div className="p-5">
                    <div className="flex items-start gap-3 mb-3">
                      <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-red-600 font-bold text-sm">{chapter.chapterIndex}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 
                          className="font-semibold text-gray-900 mb-1 line-clamp-2 group-hover:text-red-600 transition-colors cursor-pointer"
                          onClick={() => handleVideoClick(chapter.videoUrl, chapter.videoTitle)}
                        >
                          {chapter.videoTitle}
                        </h4>
                        <p className="text-sm text-gray-600 mb-2">
                          {chapter.chapterKey}
                        </p>
                      </div>
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleBookmark(chapterId);
                          }}
                          className={`p-2 rounded-full transition-all ${
                            isBookmarked 
                              ? 'bg-yellow-500 text-white hover:bg-yellow-600' 
                              : 'bg-gray-100 text-gray-600 hover:bg-yellow-100 hover:text-yellow-600'
                          }`}
                          title={isBookmarked ? 'Remove bookmark' : 'Bookmark'}
                        >
                          {isBookmarked ? (
                            <BookmarkCheck className="w-4 h-4" />
                          ) : (
                            <Bookmark className="w-4 h-4" />
                          )}
                        </button>
                        
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleLike(chapterId);
                          }}
                          className={`p-2 rounded-full transition-all ${
                            isLiked 
                              ? 'bg-blue-500 text-white hover:bg-blue-600' 
                              : 'bg-gray-100 text-gray-600 hover:bg-blue-100 hover:text-blue-600'
                          }`}
                          title={isLiked ? 'Unlike' : 'Like'}
                        >
                          <ThumbsUp className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
                        </button>
                        
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            markAsCompleted(chapterId);
                          }}
                          className={`p-2 rounded-full transition-all ${
                            isCompleted 
                              ? 'bg-green-500 text-white hover:bg-green-600' 
                              : 'bg-gray-100 text-gray-600 hover:bg-green-100 hover:text-green-600'
                          }`}
                          title={isCompleted ? 'Mark as incomplete' : 'Mark as completed'}
                        >
                          <CheckCircle className={`w-4 h-4 ${isCompleted ? 'fill-current' : ''}`} />
                        </button>
                      </div>
                      
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleVideoClick(chapter.videoUrl, chapter.videoTitle);
                        }}
                        className="flex items-center gap-2 text-xs text-gray-500 hover:text-red-500 transition-colors"
                      >
                        <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                        <span>YouTube Learning</span>
                        <ExternalLink className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Data Info */}
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
            <Eye className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-green-900">Content Summary</h3>
            <p className="text-sm text-green-700">Your personalized learning content</p>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg p-4 border border-green-100">
            <div className="text-2xl font-bold text-green-600">{youtubeData.totalChapters}</div>
            <div className="text-sm text-green-700">Total Videos</div>
          </div>
          <div className="bg-white rounded-lg p-4 border border-green-100">
            <div className="text-2xl font-bold text-green-600">{youtubeData.chapters.length}</div>
            <div className="text-sm text-green-700">Available</div>
          </div>
          <div className="bg-white rounded-lg p-4 border border-green-100">
            <div className="text-2xl font-bold text-green-600">0</div>
            <div className="text-sm text-green-700">Watched</div>
          </div>
          <div className="bg-white rounded-lg p-4 border border-green-100">
            <div className="text-xs font-medium text-green-600 truncate">
              {youtubeData.uniqueid}
            </div>
            <div className="text-sm text-green-700">User ID</div>
          </div>
        </div>
        <div className="mt-4 text-xs text-green-600">
          Last updated: {new Date(youtubeData.updatedAt).toLocaleDateString()} at {new Date(youtubeData.updatedAt).toLocaleTimeString()}
        </div>
      </div>
    </div>
  );
}
