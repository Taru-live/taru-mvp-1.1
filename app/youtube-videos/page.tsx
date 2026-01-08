'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import YouTubeVideoList from '../components/YouTubeVideoList';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import ConsistentLoadingPage from '../components/ConsistentLoadingPage';

function YouTubeVideosContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [uniqueid, setUniqueid] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Get uniqueid from URL parameters or localStorage
    const urlUniqueid = searchParams?.get('uniqueid') || null;
    const storedUniqueid = localStorage.getItem('userUniqueId');
    
    if (urlUniqueid) {
      setUniqueid(urlUniqueid);
    } else if (storedUniqueid) {
      setUniqueid(storedUniqueid);
    }
  }, [searchParams]);

  const handleRefresh = () => {
    setIsLoading(true);
    // Force refresh by updating the key
    setTimeout(() => {
      setIsLoading(false);
    }, 1000);
  };

  const handleVideoSelect = (videoUrl: string, videoTitle: string) => {
    // Open video in new tab
    window.open(videoUrl, '_blank');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.back()}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                Back
              </button>
              <div className="h-6 w-px bg-gray-300"></div>
              <h1 className="text-xl font-semibold text-gray-900">
                YouTube Learning Videos
              </h1>
            </div>
            
            <div className="flex items-center gap-4">
              {uniqueid && (
                <div className="text-sm text-gray-600">
                  ID: {uniqueid}
                </div>
              )}
              <button
                onClick={handleRefresh}
                disabled={isLoading}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {uniqueid ? (
          <YouTubeVideoList
            key={isLoading ? 'refreshing' : uniqueid}
            uniqueid={uniqueid}
            onVideoSelect={handleVideoSelect}
          />
        ) : (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">📺</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No User ID Found
              </h3>
              <p className="text-gray-600 mb-6">
                Please provide a unique ID to view YouTube videos.
              </p>
              <div className="space-y-4">
                <div>
                  <label htmlFor="uniqueid" className="block text-sm font-medium text-gray-700 mb-2">
                    Enter Unique ID
                  </label>
                  <input
                    id="uniqueid"
                    type="text"
                    value={uniqueid}
                    onChange={(e) => setUniqueid(e.target.value)}
                    placeholder="Enter your unique ID"
                    className="w-full max-w-md px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <button
                  onClick={() => {
                    if (uniqueid) {
                      localStorage.setItem('userUniqueId', uniqueid);
                    }
                  }}
                  disabled={!uniqueid}
                  className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Load Videos
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function YouTubeVideosPage() {
  return (
    <Suspense fallback={
      <ConsistentLoadingPage
        type="videos"
        title="Loading YouTube Videos"
        subtitle="Fetching your learning videos from YouTube..."
        tips={[
          'Connecting to YouTube educational channels',
          'Filtering content for your grade level',
          'Organizing videos by subject and topic'
        ]}
      />
    }>
      <YouTubeVideosContent />
    </Suspense>
  );
}
