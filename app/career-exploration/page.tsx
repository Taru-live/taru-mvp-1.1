'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import ConsistentLoadingPage from '../components/ConsistentLoadingPage';

interface CareerOption {
  ID: string;
  career: string;
  description: string;
}

// SVG Icon Components
const RocketIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
  </svg>
);

const TargetIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="10" strokeWidth={2} />
    <circle cx="12" cy="12" r="6" strokeWidth={2} />
    <circle cx="12" cy="12" r="2" fill="currentColor" />
  </svg>
);

const PaletteIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
  </svg>
);

const GearIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const MicroscopeIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
  </svg>
);

const LaptopIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
);

// Icon renderer function
const renderIcon = (iconType: string, className: string) => {
  switch (iconType) {
    case 'rocket':
      return <RocketIcon className={className} />;
    case 'target':
      return <TargetIcon className={className} />;
    case 'palette':
      return <PaletteIcon className={className} />;
    case 'gear':
      return <GearIcon className={className} />;
    case 'microscope':
      return <MicroscopeIcon className={className} />;
    case 'laptop':
      return <LaptopIcon className={className} />;
    default:
      return <TargetIcon className={className} />;
  }
};

export default function CareerExploration() {
  const [careerOptions, setCareerOptions] = useState<CareerOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isNavigating, setIsNavigating] = useState(false);
  const [currentScrollIndex, setCurrentScrollIndex] = useState(0);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [touchStartX, setTouchStartX] = useState(0);
  const [touchEndX, setTouchEndX] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Load preserved career options from localStorage on mount
  useEffect(() => {
    const preservedOptions = localStorage.getItem('careerOptions');
    if (preservedOptions) {
      try {
        const parsedOptions = JSON.parse(preservedOptions);
        if (Array.isArray(parsedOptions) && parsedOptions.length > 0) {
          console.log('🔍 Loading preserved career options from localStorage');
          setCareerOptions(parsedOptions);
          setLoading(false);
          return;
        }
      } catch (err) {
        console.error('Error parsing preserved career options:', err);
        localStorage.removeItem('careerOptions');
      }
    }
    // Only fetch if no preserved options exist
    fetchCareerOptions();
  }, []);

  // Update scroll state when career options change
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (container) {
      updateScrollState();
    }
  }, [careerOptions]);

  const updateScrollState = () => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const { scrollLeft, scrollWidth, clientWidth } = container;
    setCanScrollLeft(scrollLeft > 0);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1);
  };

  const scrollToIndex = (index: number) => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const cardWidth = container.scrollWidth / (careerOptions.length || defaultCareerPaths.length);
    const scrollPosition = index * cardWidth;
    
    container.scrollTo({
      left: scrollPosition,
      behavior: 'smooth'
    });
    
    setCurrentScrollIndex(index);
  };

  const scrollLeft = () => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const cardWidth = container.scrollWidth / (careerOptions.length || defaultCareerPaths.length);
    const newIndex = Math.max(0, currentScrollIndex - 1);
    scrollToIndex(newIndex);
  };

  const scrollRight = () => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const maxIndex = (careerOptions.length || defaultCareerPaths.length) - 1;
    const newIndex = Math.min(maxIndex, currentScrollIndex + 1);
    scrollToIndex(newIndex);
  };

  const handleScroll = () => {
    updateScrollState();
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEndX(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStartX || !touchEndX) return;
    
    const distance = touchStartX - touchEndX;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe && canScrollRight) {
      scrollRight();
    } else if (isRightSwipe && canScrollLeft) {
      scrollLeft();
    }
  };

  const fetchCareerOptions = async (forceRefresh: boolean = false) => {
    try {
      // Clear preserved options if force refresh is requested
      if (forceRefresh) {
        localStorage.removeItem('careerOptions');
        console.log('🔍 Cleared preserved career options, fetching new ones...');
      } else {
        console.log('🔍 Fetching career options...');
      }
      
      setLoading(true);
      const response = await fetch('/api/career-options');
      
      console.log('🔍 Career options API response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('🔍 Career options data received:', data);
        
        let options: CareerOption[] = [];
        
        // Handle the new webhook format
        if (data.success && data.careerOptions) {
          options = data.careerOptions;
        } else if (data.careerOptions) {
          options = data.careerOptions;
        }
        
        if (options.length > 0) {
          setCareerOptions(options);
          // Save to localStorage for persistence
          localStorage.setItem('careerOptions', JSON.stringify(options));
          console.log('🔍 Career options saved to localStorage');
        } else {
          setCareerOptions([]);
        }
      } else {
        console.error('Failed to fetch career options:', response.status);
        setError('Failed to load career options');
      }
    } catch (err) {
      console.error('Error fetching career options:', err);
      setError('Failed to load career options');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateNewOptions = () => {
    fetchCareerOptions(true);
  };

  const handleDone = () => {
    router.push('/dashboard/student');
  };

  const handleLearnMore = useCallback((career: string, description: string) => {
    // Prevent double navigation
    if (isNavigating) {
      console.log('🔍 Learn More already navigating, ignoring duplicate click');
      return;
    }
    
    console.log('🔍 Learn More clicked for career:', { career, description });
    setIsNavigating(true);
    
    // Navigate to detailed career page with career path and description parameters
    router.push(`/career-details?careerPath=${encodeURIComponent(career)}&description=${encodeURIComponent(description)}`);
    
    // Reset navigation state after a short delay
    setTimeout(() => {
      setIsNavigating(false);
    }, 1000);
  }, [isNavigating, router]);

  if (loading) {
    return (
      <ConsistentLoadingPage
        type="general"
        title="Generating Career Options"
        subtitle="Our AI is analyzing your assessment results and creating personalized career recommendations..."
        tips={[
          'Processing your assessment responses',
          'Analyzing your interests and skills',
          'Matching you with suitable career paths',
          'Generating detailed career descriptions',
          'Preparing personalized recommendations'
        ]}
        extendedLoading={true}
      />
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-50 flex items-center justify-center p-4">
        <motion.div 
          className="text-center bg-white/80 backdrop-blur-sm rounded-2xl sm:rounded-3xl p-6 sm:p-8 md:p-12 shadow-2xl border border-red-200 w-full max-w-md sm:max-w-lg"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <motion.div 
            className="text-5xl sm:text-6xl md:text-8xl mb-4 sm:mb-6"
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            ⚠️
          </motion.div>
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-3 sm:mb-4">Oops! Something went wrong</h2>
          <p className="text-gray-600 mb-6 sm:mb-8 text-sm sm:text-base md:text-lg">{error}</p>
          <motion.button
            onClick={() => window.location.reload()}
            className="px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-xl sm:rounded-2xl text-sm sm:text-base font-semibold hover:from-red-600 hover:to-pink-600 transition-all duration-300 shadow-lg hover:shadow-xl"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Try Again
          </motion.button>
        </motion.div>
      </div>
    );
  }

  // Default career paths if no data available
  const defaultCareerPaths = [
    {
      title: "Creative Explorer",
      description: "Design, animation, and storytelling could be your world! You have a natural talent for creative expression and visual communication.",
      icon: "palette",
      hasLearnMore: true
    },
    {
      title: "Logical Leader", 
      description: "You're great with strategies - future entrepreneur or engineer? Your analytical thinking and problem-solving skills are exceptional.",
      icon: "gear",
      hasLearnMore: true
    },
    {
      title: "Science Detective",
      description: "You love to explore and experiment — maybe a future scientist! Your curiosity and methodical approach to discovery are remarkable.",
      icon: "microscope",
      hasLearnMore: true
    },
    {
      title: "Tech Innovator",
      description: "Technology and innovation fascinate you! You have the potential to create the next big breakthrough in the digital world.",
      icon: "laptop",
      hasLearnMore: true
    }
  ];

  return (
    <div className="h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute -top-20 sm:-top-40 -right-20 sm:-right-40 w-40 h-40 sm:w-60 sm:h-60 md:w-80 md:h-80 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-50 sm:opacity-70"
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 180, 360],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear"
          }}
        />
        <motion.div
          className="absolute -bottom-20 sm:-bottom-40 -left-20 sm:-left-40 w-40 h-40 sm:w-60 sm:h-60 md:w-80 md:h-80 bg-blue-300 rounded-full mix-blend-multiply filter blur-xl opacity-50 sm:opacity-70"
          animate={{
            scale: [1.2, 1, 1.2],
            rotate: [360, 180, 0],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "linear"
          }}
        />
        <motion.div
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-32 h-32 sm:w-48 sm:h-48 md:w-60 md:h-60 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-30 sm:opacity-50"
          animate={{
            scale: [1, 1.3, 1],
            x: [0, 50, 0],
            y: [0, -25, 0],
          }}
          transition={{
            duration: 30,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      </div>

      {/* Main Container */}
      <div className="relative z-10 h-screen flex flex-col overflow-hidden">
        {/* Enhanced Header */}
        <motion.header 
          className="bg-white/90 backdrop-blur-2xl border-b border-purple-200/50 sticky top-0 z-50 shadow-lg"
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <div className="max-w-7xl xl:max-w-[90rem] 2xl:max-w-[100rem] mx-auto px-1 sm:px-2 md:px-4 lg:px-6 xl:px-12 2xl:px-16">
            <div className="flex justify-center items-center h-10 sm:h-12 md:h-14 lg:h-14 xl:h-16">

              {/* Progress Steps with Labels */}
              <div className="flex items-center w-full justify-center">
                <div className="flex items-center space-x-1 sm:space-x-2 md:space-x-3 lg:space-x-4 xl:space-x-6 2xl:space-x-8 bg-gradient-to-r from-purple-50 to-blue-50 rounded-md sm:rounded-lg md:rounded-xl lg:rounded-2xl px-2 sm:px-3 md:px-4 lg:px-5 xl:px-8 2xl:px-10 py-1 sm:py-1.5 md:py-2 lg:py-2 xl:py-2.5 2xl:py-2.5 border border-purple-200/50 w-full lg:w-auto lg:min-w-fit h-full">
                  {[
                    { step: 1, label: "Assessment", completed: true },
                    { step: 2, label: "Career Exploration", completed: true, current: true },
                    { step: 3, label: "Learning Path", completed: false }
                  ].map((item, index) => (
                    <motion.div
                      key={item.step}
                      className="flex items-center space-x-1 sm:space-x-1.5 md:space-x-2 lg:space-x-3 xl:space-x-4 2xl:space-x-5 flex-1 lg:flex-none"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.2 }}
                    >
                      <motion.div 
                        className={`w-4 h-4 sm:w-5 sm:h-5 md:w-5 md:h-5 lg:w-6 lg:h-6 xl:w-7 xl:h-7 2xl:w-7 2xl:h-7 rounded-full flex items-center justify-center shadow-md flex-shrink-0 ${
                          item.current
                            ? 'bg-gradient-to-r from-purple-500 to-blue-500' 
                            : item.completed
                            ? 'bg-gradient-to-r from-green-500 to-emerald-500'
                            : 'bg-gradient-to-r from-purple-300 to-blue-300'
                        }`}
                        whileHover={{ scale: 1.1, rotate: 5 }}
                        transition={{ type: "spring", stiffness: 300 }}
                      >
                        {item.completed && !item.current ? (
                          <svg className="w-2 h-2 sm:w-2.5 sm:h-2.5 md:w-2.5 md:h-2.5 lg:w-3 lg:h-3 xl:w-3.5 xl:h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          <span className="text-white font-bold text-[8px] sm:text-[10px] md:text-xs lg:text-xs xl:text-sm">{item.step}</span>
                        )}
                      </motion.div>
                      <div className="flex flex-col justify-center lg:min-w-fit">
                        <span className="text-[8px] sm:text-[10px] md:text-xs lg:text-xs xl:text-sm 2xl:text-base font-medium text-gray-700 truncate lg:overflow-visible lg:whitespace-nowrap leading-tight">
                          {item.label}
                        </span>
                        <span className="text-[8px] sm:text-[10px] md:text-[10px] lg:text-[10px] xl:text-xs 2xl:text-sm text-gray-500 hidden md:block truncate lg:overflow-visible lg:whitespace-nowrap leading-tight">
                          {item.current ? 'Current Step' : item.completed ? 'Completed' : 'Upcoming'}
                        </span>
                      </div>
                      {index < 2 && (
                        <motion.div 
                          className="w-2 sm:w-3 md:w-4 lg:w-6 xl:w-10 2xl:w-12 h-0.5 md:h-1 bg-gradient-to-r from-purple-300 to-blue-300 flex-shrink-0 hidden sm:block"
                          initial={{ scaleX: 0 }}
                          animate={{ scaleX: 1 }}
                          transition={{ delay: 0.5 + index * 0.2, duration: 0.5 }}
                        />
                      )}
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </motion.header>

        {/* Main Content */}
        <main className="flex-1 w-full max-w-7xl xl:max-w-[90rem] 2xl:max-w-[100rem] mx-auto px-2 sm:px-4 md:px-6 lg:px-8 xl:px-12 2xl:px-16 py-1 sm:py-2 md:py-3 overflow-hidden flex flex-col min-h-0">
          {/* Hero Section */}
          <motion.div 
            className="text-center mb-1 sm:mb-2 md:mb-3 flex-shrink-0"
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.8 }}
          >
            <motion.div
              className="inline-flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 lg:w-14 lg:h-14 bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 rounded-lg sm:rounded-xl mb-0.5 sm:mb-1 shadow-lg text-white"
              whileHover={{ scale: 1.1, rotate: 5 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <RocketIcon className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 lg:w-7 lg:h-7" />
            </motion.div>
            
            <motion.h1 
              className="text-lg sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl 2xl:text-5xl font-bold bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 bg-clip-text text-transparent mb-0.5 sm:mb-1 px-2"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.8 }}
            >
              Your Future, Imagined!
            </motion.h1>
            
            <motion.p 
              className="text-[10px] sm:text-xs md:text-sm lg:text-base xl:text-lg 2xl:text-xl text-gray-600 max-w-3xl xl:max-w-4xl 2xl:max-w-5xl mx-auto leading-tight px-2"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.7, duration: 0.8 }}
            >
              Discover personalized career paths tailored just for you. 
              <span className="text-purple-600 font-semibold"> Let's explore what the future holds!</span>
            </motion.p>
          </motion.div>

          {/* Career Paths Section */}
          <motion.div
            className="flex-1 flex flex-col min-h-0 mb-3 sm:mb-4 md:mb-5 lg:mb-6"
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.9, duration: 0.8 }}
          >
            <div className="text-center mb-2 sm:mb-3 md:mb-4 flex-shrink-0">
              <div className="flex items-center justify-center gap-2 mb-1 sm:mb-1.5">
                <h2 className="text-base sm:text-lg md:text-xl lg:text-2xl xl:text-3xl 2xl:text-4xl font-bold text-gray-900 px-2">
                  Suggested Career Paths
                </h2>
                {careerOptions.length > 0 && (
                  <motion.button
                    onClick={handleGenerateNewOptions}
                    disabled={loading}
                    className="px-2 sm:px-3 md:px-4 py-1 sm:py-1.5 md:py-2 text-[10px] sm:text-xs md:text-sm font-medium text-purple-600 hover:text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-lg sm:rounded-xl border border-purple-200 hover:border-purple-300 transition-all duration-200 flex items-center gap-1 sm:gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    title="Generate new career options"
                  >
                    {loading ? (
                      <>
                        <div className="w-3 h-3 sm:w-4 sm:h-4 border-2 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
                        <span className="hidden sm:inline">Generating...</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        <span className="hidden sm:inline">New Options</span>
                      </>
                    )}
                  </motion.button>
                )}
              </div>
              <div className="w-12 sm:w-16 md:w-20 lg:w-24 xl:w-28 h-0.5 bg-gradient-to-r from-purple-500 to-blue-500 mx-auto rounded-full mb-1 sm:mb-1.5"></div>
              <p className="text-[10px] sm:text-xs md:text-sm lg:text-base xl:text-lg text-gray-600 mb-2 sm:mb-3 px-2">
                Explore your personalized career recommendations
              </p>
            </div>

            {/* Career Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-5 lg:gap-6 xl:gap-7 2xl:gap-8 px-1 sm:px-2 flex-1 min-h-0">
              {(careerOptions.length > 0 ? careerOptions : defaultCareerPaths).map((path, index) => {
                const isApiData = 'career' in path;
                const title = isApiData ? path.career : path.title;
                const description = isApiData ? path.description : path.description;
                const icon = isApiData ? 'target' : path.icon;
                const hasLearnMore = isApiData ? true : path.hasLearnMore;
                
                return (
                  <motion.div
                    key={index}
                    className="group relative bg-white/80 backdrop-blur-sm rounded-lg sm:rounded-xl md:rounded-2xl p-2 sm:p-3 md:p-4 lg:p-5 shadow-xl hover:shadow-2xl transition-all duration-300 border border-purple-100/50 hover:border-purple-200/50 flex flex-col h-full"
                    initial={{ y: 30, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 1.1 + index * 0.1, duration: 0.6 }}
                    whileHover={{ y: -5, scale: 1.02 }}
                  >
                    {/* Decorative Background */}
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-50/50 to-blue-50/50 rounded-lg sm:rounded-xl md:rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    
                    {/* Content */}
                    <div className="relative z-10 flex flex-col flex-1 min-h-0">
                      {/* Icon */}
                      <motion.div 
                        className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 lg:w-14 lg:h-14 xl:w-16 xl:h-16 2xl:w-20 2xl:h-20 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg sm:rounded-xl flex items-center justify-center mb-1 sm:mb-2 md:mb-3 shadow-lg flex-shrink-0 text-white"
                        whileHover={{ rotate: 10, scale: 1.1 }}
                        transition={{ type: "spring", stiffness: 300 }}
                      >
                        {renderIcon(icon, "w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 lg:w-7 lg:h-7 xl:w-8 xl:h-8 2xl:w-10 2xl:h-10")}
                      </motion.div>

                      {/* Title */}
                      <h3 className="text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl 2xl:text-3xl font-bold text-gray-900 mb-1 sm:mb-1.5 group-hover:text-purple-600 transition-colors duration-300 line-clamp-2 flex-shrink-0">
                        {title}
                      </h3>

                      {/* Description */}
                      <p className="text-[10px] sm:text-xs md:text-sm lg:text-base xl:text-lg 2xl:text-xl text-gray-600 leading-tight mb-2 sm:mb-3 line-clamp-3 flex-1 min-h-0 overflow-hidden">
                        {description}
                      </p>

                      {/* Learn More Button */}
                      {hasLearnMore && (
                        <motion.button 
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleLearnMore(title, description);
                          }}
                          disabled={isNavigating}
                          className={`group/btn relative w-full py-1.5 sm:py-2 md:py-2.5 lg:py-3 xl:py-3.5 px-2 sm:px-3 md:px-4 lg:px-5 rounded-lg sm:rounded-xl font-semibold text-white transition-all duration-300 text-[10px] sm:text-xs md:text-sm lg:text-base xl:text-lg mt-auto flex-shrink-0 ${
                            isNavigating 
                              ? 'bg-gray-400 cursor-not-allowed' 
                              : 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 cursor-pointer shadow-lg hover:shadow-xl'
                          }`}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <span className="flex items-center justify-center gap-1 sm:gap-1.5">
                            {isNavigating ? (
                              <>
                                <div className="w-3 h-3 sm:w-4 sm:h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                <span className="hidden sm:inline">Loading...</span>
                                <span className="sm:hidden">...</span>
                              </>
                            ) : (
                              <>
                                <span>Learn More</span>
                                <svg className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 group-hover/btn:translate-x-1 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                </svg>
                              </>
                            )}
                          </span>
                        </motion.button>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>

          {/* Done Button */}
          <motion.div 
            className="text-center mt-4 sm:mt-5 md:mt-6 lg:mt-8 flex-shrink-0 px-2"
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 1.5, duration: 0.8 }}
          >
            <motion.button
              onClick={handleDone}
              className="group relative inline-flex items-center justify-center px-3 sm:px-4 md:px-6 lg:px-8 xl:px-10 2xl:px-12 py-1.5 sm:py-2 md:py-2.5 lg:py-3 xl:py-3.5 2xl:py-4 text-xs sm:text-sm md:text-base lg:text-lg xl:text-xl 2xl:text-2xl font-bold text-white bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 rounded-lg sm:rounded-xl shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden w-full sm:w-auto max-w-xs sm:max-w-none"
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
            >
              {/* Animated background */}
              <div className="absolute inset-0 bg-gradient-to-r from-purple-700 via-blue-700 to-indigo-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              
              {/* Content */}
              <span className="relative z-10 flex items-center gap-1 sm:gap-2">
                <span className="text-xs sm:text-sm md:text-base lg:text-lg xl:text-xl">Done! Let's Begin the Journey</span>
                <motion.svg 
                  className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 lg:w-6 lg:h-6 group-hover:translate-x-1 transition-transform duration-200" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                  animate={{ x: [0, 5, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </motion.svg>
              </span>
            </motion.button>
          </motion.div>
        </main>
      </div>
    </div>
  );
}