'use client';

import React, { useState, useEffect } from 'react';
import { Play, Loader2, AlertCircle, Youtube, ExternalLink, Maximize2, Minimize2 } from 'lucide-react';

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

interface YouTubeVideoPlayerProps {
  uniqueid: string;
  autoPlay?: boolean;
  showPlaylist?: boolean;
  className?: string;
}

export default function YouTubeVideoPlayer({ 
  uniqueid, 
  autoPlay = false, 
  showPlaylist = true,
  className = '' 
}: YouTubeVideoPlayerProps) {
  const [youtubeData, setYoutubeData] = useState<YouTubeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    if (uniqueid) {
      fetchYouTubeData();
    }
  }, [uniqueid]);

  const fetchYouTubeData = async () => {
    if (!uniqueid || uniqueid === 'default') {
      setLoading(false);
      setError('No uniqueId available');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔍 YouTubeVideoPlayer: Fetching data for uniqueid:', uniqueid);
      
      // Fetch YouTube data
      const response = await fetch(`/api/youtube-data`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include' // Include cookies for authentication
      });
      
      console.log('📊 YouTubeVideoPlayer: API response status:', response.status);
      console.log('📊 YouTubeVideoPlayer: API response headers:', Object.fromEntries(response.headers.entries()));
      
      if (response.ok) {
        const result = await response.json();
        console.log('📊 YouTubeVideoPlayer: API response data:', result);
        
        if (result.success && result.data) {
          setYoutubeData(result.data);
          console.log('✅ YouTube data loaded for video player:', result.data);
        } else {
          console.warn('⚠️ API returned success=false or no data:', result);
          setError(result.message || 'No video data available');
        }
      } else {
        const responseText = await response.text();
        console.error('❌ API error response:', responseText);
        
        if (response.status === 404) {
          setError('No videos found for this student. Please generate content first.');
        } else {
          try {
            const errorData = JSON.parse(responseText);
            setError(errorData.message || 'Failed to fetch YouTube data');
          } catch {
            setError(`HTTP ${response.status}: ${responseText || 'Failed to fetch YouTube data'}`);
          }
        }
      }
    } catch (err) {
      console.error('❌ YouTubeVideoPlayer: Error fetching YouTube data:', err);
      setError(`Network error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  // Extract video ID from YouTube URL
  const extractVideoId = (url: string): string | null => {
    const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
    const match = url.match(regex);
    return match ? match[1] : null;
  };

  // Convert YouTube URL to embed URL
  const getEmbedUrl = (videoUrl: string): string => {
    const videoId = extractVideoId(videoUrl);
    if (!videoId) return '';
    
    const params = new URLSearchParams({
      rel: '0', // Don't show related videos
      modestbranding: '1', // Modest YouTube branding
      showinfo: '0', // Don't show video info
      fs: '1', // Allow fullscreen
      cc_load_policy: '1', // Show captions by default
      iv_load_policy: '3', // Don't show annotations
      autohide: '1', // Auto-hide controls
    });
    
    if (autoPlay) {
      params.append('autoplay', '1');
    }
    
    return `https://www.youtube.com/embed/${videoId}?${params.toString()}`;
  };

  const handleVideoSelect = (index: number) => {
    setCurrentVideoIndex(index);
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
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
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Loading Video Player</h3>
          <p className="text-gray-600">Fetching your learning videos...</p>
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
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Unable to Load Videos</h3>
          <p className="text-red-600 mb-6">{error}</p>
          <button
            onClick={fetchYouTubeData}
            className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all duration-200 font-medium shadow-lg hover:shadow-xl"
          >
            Try Again
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
          <p className="text-gray-600 mb-6">No YouTube videos found for this student.</p>
          <button
            onClick={fetchYouTubeData}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 font-medium shadow-lg hover:shadow-xl"
          >
            Refresh
          </button>
        </div>
      </div>
    );
  }

  const currentVideo = youtubeData.chapters[currentVideoIndex];
  const embedUrl = getEmbedUrl(currentVideo.videoUrl);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Video Player */}
      <div className={`relative ${isFullscreen ? 'fixed inset-0 z-50 bg-black' : 'bg-white rounded-xl shadow-lg overflow-hidden'}`}>
        {/* Video Header */}
        <div className="bg-gradient-to-r from-red-500 to-red-600 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                <Play className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-white">
                  {currentVideo.chapterKey}
                </h3>
                <p className="text-red-100 text-sm line-clamp-1">
                  {currentVideo.videoTitle}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={toggleFullscreen}
                className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors duration-200"
                title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
              >
                {isFullscreen ? (
                  <Minimize2 className="w-5 h-5 text-white" />
                ) : (
                  <Maximize2 className="w-5 h-5 text-white" />
                )}
              </button>
              <a
                href={currentVideo.videoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors duration-200"
                title="Open in YouTube"
              >
                <ExternalLink className="w-5 h-5 text-white" />
              </a>
            </div>
          </div>
        </div>

        {/* Video iframe */}
        <div className={`relative ${isFullscreen ? 'h-full' : 'aspect-video'} bg-black`}>
          {embedUrl ? (
            <iframe
              src={embedUrl}
              title={currentVideo.videoTitle}
              className="w-full h-full"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          ) : (
            <div className="flex items-center justify-center h-full bg-gray-900">
              <div className="text-center text-white">
                <AlertCircle className="w-12 h-12 mx-auto mb-4" />
                <p>Unable to load video</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Video Playlist */}
      {showPlaylist && youtubeData.chapters.length > 1 && (
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <Youtube className="w-4 h-4 text-white" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">Video Playlist</h4>
                <p className="text-sm text-gray-600">{youtubeData.totalChapters} videos available</p>
              </div>
            </div>
          </div>
          
          <div className="max-h-96 overflow-y-auto">
            {youtubeData.chapters.map((chapter, index) => (
              <button
                key={chapter.chapterIndex}
                onClick={() => handleVideoSelect(index)}
                className={`w-full p-4 text-left hover:bg-gray-50 transition-colors duration-200 border-b border-gray-100 last:border-b-0 ${
                  currentVideoIndex === index ? 'bg-blue-50 border-l-4 border-l-blue-600' : ''
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    currentVideoIndex === index ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'
                  }`}>
                    <span className="text-sm font-bold">{chapter.chapterIndex}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h5 className={`font-medium line-clamp-2 ${
                      currentVideoIndex === index ? 'text-blue-900' : 'text-gray-900'
                    }`}>
                      {chapter.videoTitle}
                    </h5>
                    <p className={`text-sm mt-1 ${
                      currentVideoIndex === index ? 'text-blue-700' : 'text-gray-600'
                    }`}>
                      {chapter.chapterKey}
                    </p>
                  </div>
                  {currentVideoIndex === index && (
                    <div className="flex-shrink-0">
                      <Play className="w-5 h-5 text-blue-600" />
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Video Info */}
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
            <Youtube className="w-5 h-5 text-white" />
          </div>
          <div>
            <h4 className="text-lg font-semibold text-green-900">Learning Progress</h4>
            <p className="text-sm text-green-700">Track your video learning journey</p>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg p-4 border border-green-100">
            <div className="text-2xl font-bold text-green-600">{currentVideoIndex + 1}</div>
            <div className="text-sm text-green-700">Current Video</div>
          </div>
          <div className="bg-white rounded-lg p-4 border border-green-100">
            <div className="text-2xl font-bold text-green-600">{youtubeData.totalChapters}</div>
            <div className="text-sm text-green-700">Total Videos</div>
          </div>
          <div className="bg-white rounded-lg p-4 border border-green-100">
            <div className="text-2xl font-bold text-green-600">
              {Math.round(((currentVideoIndex + 1) / youtubeData.totalChapters) * 100)}%
            </div>
            <div className="text-sm text-green-700">Progress</div>
          </div>
          <div className="bg-white rounded-lg p-4 border border-green-100">
            <div className="text-xs font-medium text-green-600 truncate">
              {youtubeData.uniqueid}
            </div>
            <div className="text-sm text-green-700">Student ID</div>
          </div>
        </div>
      </div>
    </div>
  );
}
