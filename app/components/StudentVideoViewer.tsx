'use client';

import React, { useState } from 'react';
import YouTubeVideoPlayer from './YouTubeVideoPlayer';
import { Play, User, Search } from 'lucide-react';

interface StudentVideoViewerProps {
  defaultUniqueId?: string;
  className?: string;
}

export default function StudentVideoViewer({ 
  defaultUniqueId = '',
  className = '' 
}: StudentVideoViewerProps) {
  const [uniqueId, setUniqueId] = useState(defaultUniqueId);
  const [inputUniqueId, setInputUniqueId] = useState(defaultUniqueId);

  const handleLoadVideos = () => {
    if (inputUniqueId.trim()) {
      setUniqueId(inputUniqueId.trim());
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleLoadVideos();
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-gradient-to-r from-red-500 to-red-600 rounded-full flex items-center justify-center">
            <Play className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Student Video Viewer</h1>
            <p className="text-gray-600">Enter a student's unique ID to view their personalized YouTube videos</p>
          </div>
        </div>

        {/* UniqueId Input */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <label htmlFor="uniqueId" className="block text-sm font-medium text-gray-700 mb-2">
              Student Unique ID
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                id="uniqueId"
                type="text"
                value={inputUniqueId}
                onChange={(e) => setInputUniqueId(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Enter student unique ID (e.g., STUMFHU8PF92)"
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors duration-200 text-gray-900 bg-white"
              />
            </div>
          </div>
          <div className="flex items-end gap-2">
            <button
              onClick={handleLoadVideos}
              disabled={!inputUniqueId.trim()}
              className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors duration-200 font-medium shadow-lg hover:shadow-xl flex items-center gap-2"
            >
              <Search className="w-5 h-5" />
              Load Videos
            </button>
          </div>
        </div>

        {/* Current Student Info */}
        {uniqueId && (
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-900">
                Loading videos for student: <code className="bg-blue-100 px-2 py-1 rounded text-blue-800">{uniqueId}</code>
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Video Player */}
      {uniqueId && (
        <YouTubeVideoPlayer 
          uniqueid={uniqueId}
          autoPlay={false}
          showPlaylist={true}
          className="animate-fadeIn"
        />
      )}

      {/* Instructions */}
      {!uniqueId && (
        <div className="bg-gradient-to-r from-gray-50 to-blue-50 border border-gray-200 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">How to use:</h3>
          <div className="space-y-3 text-sm text-gray-700">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">1</div>
              <p>Enter the student's unique ID in the input field above</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">2</div>
              <p>Click "Load Videos" or press Enter to fetch their personalized YouTube content</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">3</div>
              <p>Videos will be displayed in an embedded player with a playlist for easy navigation</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">4</div>
              <p>Use the fullscreen button or open videos directly in YouTube</p>
            </div>
          </div>
          
          <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              <strong>Note:</strong> The student must have completed the content generation process for videos to be available.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
