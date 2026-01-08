'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import ConsistentLoadingPage from '../../components/ConsistentLoadingPage';
import YouTubeVideoList from '../../components/YouTubeVideoList';
import ModuleErrorBoundary from '../../components/ModuleErrorBoundary';

interface ModuleContent {
  type: string;
  name: string;
  description: string;
  duration: number;
  status: string;
}

interface Module {
  moduleId: string;
  name: string;
  subject: string;
  category: string;
  description: string;
  learningObjectives: string[];
  recommendedFor: string[];
  xpPoints: number;
  estimatedDuration: number;
  difficulty: string;
  learningType: string;
  content: ModuleContent[];
  prerequisites: string[];
  badges: {
    name: string;
    description: string;
    icon: string;
  }[];
  tags: string[];
}

interface ModuleProgress {
  status: 'not-started' | 'in-progress' | 'completed';
  progress: number;
  xpEarned: number;
}

function ModuleDetailContent() {
  const [module, setModule] = useState<Module | null>(null);
  const [progress, setProgress] = useState<ModuleProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'content' | 'progress' | 'youtube-videos'>('overview');
  const [showYouTubeVideos, setShowYouTubeVideos] = useState(false);
  const router = useRouter();
  const params = useParams();
  const moduleId = (params?.id as string) || '';

  useEffect(() => {
    fetchModuleData();
  }, [moduleId]);

  const fetchModuleData = async () => {
    try {
      const response = await fetch(`/api/modules/${moduleId}`);
      if (response.ok) {
        const data = await response.json();
        setModule(data.module);
        setProgress(data.progress);
      } else {
        // If API fails, we'll show a fallback module
        console.warn('Module API failed, using fallback content');
        // The API now returns fallback modules instead of errors
      }
    } catch (error) {
      console.warn('Failed to load module, using fallback content:', error);
      // The API now returns fallback modules instead of errors
    } finally {
      setLoading(false);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200';
      case 'intermediate': return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200';
      case 'advanced': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-200';
    }
  };

  const getLearningTypeIcon = (type: string) => {
    switch (type) {
      case 'video': return '🎥';
      case 'quiz': return '❓';
      case 'story': return '📖';
      case 'interactive': return '🎮';
      case 'project': return '🔨';
      default: return '📚';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'academic': return '🎓';
      case 'vocational': return '🔧';
      case 'life-skills': return '💡';
      default: return '📚';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500';
      case 'in-progress': return 'bg-blue-500';
      case 'not-started': return 'bg-gray-400';
      default: return 'bg-gray-400';
    }
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
  };

  const handleStartModule = async () => {
    try {
      const response = await fetch(`/api/modules/${moduleId}/start`, {
        method: 'POST'
      });
      
      if (response.ok) {
        // Navigate to the first content item or module player
        router.push(`/modules/${moduleId}/learn`);
      } else {
        throw new Error('Failed to start module');
      }
    } catch (error) {
      console.error('Start module error:', error);
      alert('Failed to start module. Please try again.');
    }
  };

  const handleContinueModule = () => {
    router.push(`/modules/${moduleId}/learn`);
  };

  if (loading) {
    return (
      <ConsistentLoadingPage
        type="modules"
        title="Loading Module"
        subtitle="Preparing your learning content..."
        tips={[
          'Loading module content and resources',
          'Setting up interactive elements',
          'Preparing your learning experience'
        ]}
      />
    );
  }

  if (!module) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Oops!</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Module not found
          </p>
          <button
            onClick={() => router.push('/recommended-modules')}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium transition-colors hover:bg-blue-700"
          >
            Back to Modules
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 mb-8 relative">
          <div className="absolute top-4 right-4">
          </div>
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center space-x-4">
              <span className="text-4xl">{getCategoryIcon(module.category)}</span>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  {module.name}
                </h1>
                <p className="text-lg text-gray-600 dark:text-gray-400">
                  {module.subject} • {module.category.charAt(0).toUpperCase() + module.category.slice(1)}
                </p>
              </div>
            </div>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getDifficultyColor(module.difficulty)}`}>
              {module.difficulty}
            </span>
          </div>

          <p className="text-gray-700 dark:text-gray-300 text-lg mb-6">
            {module.description}
          </p>

          {/* Module Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {module.xpPoints}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">XP Points</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {formatDuration(module.estimatedDuration)}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Duration</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {module.content.length}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Lessons</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-amber-700 dark:text-amber-400">
                {getLearningTypeIcon(module.learningType)}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400 capitalize">{module.learningType}</div>
            </div>
          </div>

          {/* Progress Bar */}
          {progress && (
            <div className="mb-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Progress
                </span>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {progress.progress}%
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                <div
                  className={`h-3 rounded-full transition-all duration-300 ${
                    progress.status === 'completed' ? 'bg-green-500' :
                    progress.status === 'in-progress' ? 'bg-blue-500' :
                    'bg-gray-400'
                  }`}
                  style={{ width: `${progress.progress}%` }}
                />
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            {progress?.status === 'not-started' ? (
              <button
                onClick={handleStartModule}
                className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium transition-colors hover:bg-blue-700"
              >
                Start Learning
              </button>
            ) : progress?.status === 'in-progress' ? (
              <button
                onClick={handleContinueModule}
                className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg font-medium transition-colors hover:bg-green-700"
              >
                Continue Learning
              </button>
            ) : (
              <button
                onClick={handleContinueModule}
                className="flex-1 px-6 py-3 bg-purple-600 text-white rounded-lg font-medium transition-colors hover:bg-purple-700"
              >
                Review Module
              </button>
            )}
            <button
              onClick={() => router.push('/recommended-modules')}
              className="px-6 py-3 bg-gray-500 text-white rounded-lg font-medium transition-colors hover:bg-gray-600"
            >
              Back to Modules
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="flex">
              {[
                { key: 'overview', label: 'Overview', icon: '📋' },
                { key: 'content', label: 'Content', icon: '📚' },
                { key: 'progress', label: 'Progress', icon: '📊' },
                { key: 'youtube-videos', label: 'YouTube Videos', icon: '📺' }
              ].map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as 'overview' | 'content' | 'progress' | 'youtube-videos')}
                  className={`flex-1 px-6 py-4 text-center font-medium transition-colors ${
                    activeTab === tab.key
                      ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-b-2 border-blue-600'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  <span className="mr-2">{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Learning Objectives */}
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                    What You&apos;ll Learn
                  </h3>
                  <ul className="space-y-3">
                    {module.learningObjectives.map((objective, index) => (
                      <li key={index} className="flex items-start space-x-3">
                        <span className="text-green-500 mt-1">✓</span>
                        <span className="text-gray-700 dark:text-gray-300">{objective}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Recommended For */}
                {module.recommendedFor.length > 0 && (
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                      Recommended For
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {module.recommendedFor.map(item => (
                        <span key={item} className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 rounded-full text-sm">
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Prerequisites */}
                {module.prerequisites.length > 0 && (
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                      Prerequisites
                    </h3>
                    <div className="space-y-2">
                      {module.prerequisites.map(prereq => (
                        <div key={prereq} className="flex items-center space-x-2">
                          <span className="text-amber-600">🔗</span>
                          <span className="text-gray-700 dark:text-gray-300">{prereq}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Badges */}
                {module.badges.length > 0 && (
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                      Badges You Can Earn
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {module.badges.map(badge => (
                        <div key={badge.name} className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                          <span className="text-2xl">{badge.icon}</span>
                          <div>
                            <h4 className="font-medium text-gray-900 dark:text-white">{badge.name}</h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400">{badge.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Tags */}
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                    Tags
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {module.tags.map(tag => (
                      <span key={tag} className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full text-sm">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Content Tab */}
            {activeTab === 'content' && (
              <div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                  Module Content
                </h3>
                <div className="space-y-4">
                  {module.content.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-600 rounded-lg"
                    >
                      <div className="flex items-center space-x-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white ${getStatusColor(item.status)}`}>
                          {index + 1}
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900 dark:text-white">{item.name}</h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{item.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          {formatDuration(item.duration)}
                        </span>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          item.status === 'completed' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200' :
                          item.status === 'in-progress' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200' :
                          'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                        }`}>
                          {item.status.replace('-', ' ')}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Progress Tab */}
            {activeTab === 'progress' && progress && (
              <div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                  Your Progress
                </h3>
                <div className="space-y-6">
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-lg font-medium text-gray-900 dark:text-white">Overall Progress</h4>
                      <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                        {progress.progress}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-3">
                      <div
                        className={`h-3 rounded-full transition-all duration-300 ${
                          progress.status === 'completed' ? 'bg-green-500' :
                          progress.status === 'in-progress' ? 'bg-blue-500' :
                          'bg-gray-400'
                        }`}
                        style={{ width: `${progress.progress}%` }}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-6">
                      <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">XP Earned</h4>
                      <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                        {progress.xpEarned} / {module.xpPoints}
                      </div>
                    </div>
                    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6">
                      <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Status</h4>
                      <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 capitalize">
                        {progress.status.replace('-', ' ')}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* YouTube Videos Tab */}
            {activeTab === 'youtube-videos' && (
              <div className="h-[calc(100vh-200px)]">
                <YouTubeVideoList
                  uniqueid={moduleId}
                  onVideoSelect={(videoUrl, videoTitle) => {
                    console.log('Video selected:', { videoUrl, videoTitle });
                    window.open(videoUrl, '_blank');
                  }}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ModuleDetail() {
  return (
    <ModuleErrorBoundary>
      <ModuleDetailContent />
    </ModuleErrorBoundary>
  );
} 