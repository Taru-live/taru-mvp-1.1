import React, { useState } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Menu } from 'lucide-react';

// Helper function to render icons with fallback
const IconRenderer = ({ icon, label, size = 24, className = "", isActive = false }: { 
  icon: string; 
  label: string; 
  size?: number;
  className?: string;
  isActive?: boolean;
}) => {
  const [imageError, setImageError] = useState(false);
  
  // Apply active/inactive color styling
  const colorClass = isActive ? 'text-white' : 'text-gray-500';
  const combinedClassName = `${className} ${colorClass}`;
  
  // If icon is an emoji (contains emoji characters), render as text
  if (/[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/u.test(icon)) {
    return <span className={combinedClassName}>{icon}</span>;
  }
  
  // If image failed to load or doesn't start with '/', use enhanced fallback icons
  if (imageError || !icon.startsWith('/')) {
    const fallbackIcons: { [key: string]: React.ReactElement } = {
      'overview': (
        <div className="relative">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
          </svg>
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"></div>
        </div>
      ),
      'learning-path': (
        <div className="relative">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
          </svg>
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full"></div>
        </div>
      ),
      'modules': (
        <div className="relative">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6" />
          </svg>
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-gradient-to-r from-orange-500 to-red-500 rounded-full"></div>
        </div>
      ),
      'enhanced-learning': (
        <div className="relative">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"></div>
        </div>
      ),
      'tests': (
        <div className="relative">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
          </svg>
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full"></div>
        </div>
      ),
      'reports': (
        <div className="relative">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-gradient-to-r from-green-500 to-teal-500 rounded-full"></div>
        </div>
      ),
      'progress': (
        <div className="relative">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"></div>
        </div>
      ),
      'rewards': (
        <div className="relative">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3" />
          </svg>
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full"></div>
        </div>
      ),
      'settings': (
        <div className="relative">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-gradient-to-r from-gray-500 to-slate-500 rounded-full"></div>
        </div>
      ),
      'profile': (
        <div className="relative">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          </svg>
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-gradient-to-r from-pink-500 to-rose-500 rounded-full"></div>
        </div>
      ),
      'logout': (
        <div className="relative">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-gradient-to-r from-red-500 to-pink-500 rounded-full"></div>
        </div>
      ),
    };
    
    const iconKey = label.toLowerCase().replace(/\s+/g, '-').replace(/[&]/g, '');
    const fallbackIcon = fallbackIcons[iconKey] || (
      <div className="relative">
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <div className="absolute -top-1 -right-1 w-3 h-3 bg-gradient-to-r from-gray-400 to-slate-400 rounded-full"></div>
      </div>
    );
    return <span className={combinedClassName}>{fallbackIcon}</span>;
  }
  
  // Render as Image component
  return (
    <Image 
      src={icon} 
      alt={label} 
      width={size} 
      height={size}
      className={`${combinedClassName} object-contain`}
      onError={() => setImageError(true)}
      style={{ minWidth: size, minHeight: size }}
    />
  );
};

// Default student navigation items
const defaultNavItems = [
  { id: 'overview', label: 'Overview', icon: '/icons/overview1.png' },
  { id: 'learning-path', label: 'Learning Path', icon: '/icons/learning-path.png' },
  { id: 'modules', label: 'My Learning Modules', icon: '/icons/modules.png' },
  { id: 'tests', label: 'Tests', icon: 'tests' },
  { id: 'enhanced-learning', label: 'Enhanced Learning', icon: '/icons/ai-buddy.png' },
  { id: 'progress', label: 'My Progress Report', icon: '/icons/report.png' },
  { id: 'rewards', label: 'My Rewards & Badges', icon: '/icons/rewards.png' },
  { id: 'settings', label: 'Profile & Settings', icon: '/icons/profile.png' }
];

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  isOpen?: boolean;
  onToggle?: () => void;
  navItems?: Array<{ id: string; label: string; icon: string }>;
  role?: 'student' | 'parent' | 'teacher' | 'admin';
}

export default function Sidebar({ activeTab, onTabChange, isOpen = false, onToggle, navItems, role }: SidebarProps) {
  // Use provided navItems or fall back to default student items
  const items = navItems || defaultNavItems;
  const [isHovered, setIsHovered] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  
  // Hide scrollbar for admin role (organization dashboard)
  const hideScrollbar = role === 'admin';
  const scrollbarClass = hideScrollbar 
    ? '[&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]' 
    : '';

  // Check if we're on mobile on component mount and window resize
  React.useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      
      // If switching from mobile to desktop, ensure sidebar is visible
      if (!mobile && !isOpen) {
        setIsHovered(false);
      }
    };
    
    // Initial check
    checkMobile();
    
    // Add resize listener with debouncing
    let timeoutId: NodeJS.Timeout;
    const handleResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(checkMobile, 100);
    };
    
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(timeoutId);
    };
  }, [isOpen]);

  const handleTabChange = (tabId: string) => {
    if (tabId === 'logout') {
      // Handle logout
      onTabChange('logout');
      return;
    }
    
    onTabChange(tabId);
    // Close sidebar after selection on mobile only
    if (onToggle && (isMobile || isActuallyMobile)) {
      onToggle();
    }
  };

  const sidebarVariants = {
    closed: {
      x: "-100%",
      transition: {
        type: "spring" as const,
        stiffness: 400,
        damping: 40
      }
    },
    open: {
      x: 0,
      transition: {
        type: "spring" as const,
        stiffness: 400,
        damping: 40
      }
    },
    collapsed: {
      width: "80px",
      transition: {
        type: "spring" as const,
        stiffness: 300,
        damping: 30,
        duration: 0.4
      }
    },
    expanded: {
      width: "320px",
      transition: {
        type: "spring" as const,
        stiffness: 300,
        damping: 30,
        duration: 0.4
      }
    }
  };

  const overlayVariants = {
    closed: {
      opacity: 0,
      transition: {
        duration: 0.3
      }
    },
    open: {
      opacity: 1,
      transition: {
        duration: 0.3
      }
    }
  };

  // Fallback for mobile detection
  const isActuallyMobile = typeof window !== 'undefined' ? window.innerWidth < 768 : false;
  
  // Determine sidebar state based on screen size and interaction
  const isSidebarExpanded = (isMobile || isActuallyMobile) ? isOpen : isHovered;

  return (
    <>
      {/* Hamburger Button - Only visible on mobile when sidebar is closed */}
      {(isMobile || isActuallyMobile) && !isOpen && (
        <motion.button
          onClick={onToggle}
          className="fixed top-4 left-4 z-[60] p-2 bg-white rounded-lg shadow-lg border border-gray-200 md:hidden"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          title="Open Menu"
        >
          <Menu className="w-6 h-6 text-gray-700" />
        </motion.button>
      )}

      {/* Overlay - Only visible on mobile when sidebar is open */}
      <AnimatePresence>
        {(isMobile || isActuallyMobile) && isOpen && (
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-50 z-[45] md:hidden"
            variants={overlayVariants}
            initial="closed"
            animate="open"
            exit="closed"
            onClick={onToggle}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      {(isMobile || isActuallyMobile) ? (
        <AnimatePresence>
          <motion.aside 
            className={`
              fixed top-0 left-0 bottom-0 z-[50] 
              bg-white border-r border-gray-300 
              flex flex-col py-6 px-4 h-screen
              w-80
              ${isSidebarExpanded ? 'shadow-2xl' : ''}
            `}
            variants={sidebarVariants}
            initial={isOpen ? "open" : "closed"}
            animate={isOpen ? "open" : "closed"}
            style={{ touchAction: 'pan-y' }}
          >
            {/* Header with Logo and Close Button */}
            <motion.div 
              className="flex items-center justify-between mb-6 flex-shrink-0"
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.6 }}
            >
              {/* Logo on top left */}
              <div className="flex items-center">
                <motion.div 
                  className="w-12 h-12 rounded-full flex items-center justify-center mr-3"
                  whileHover={{ scale: 1.1, rotate: 360 }}
                  transition={{ duration: 0.5 }}
                >
                  <Image src="/icons/logo.svg" alt="Logo" width={32} height={32} className="w-8 h-8" />
                </motion.div>
                <motion.div 
                  className="block"
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.2 }}
                >
                  <span className="text-lg font-bold text-gray-800">Taru</span>
                </motion.div>
              </div>
              
              {/* Close Button - Only visible on mobile when sidebar is open */}
              <motion.button
                onClick={onToggle}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <X className="w-5 h-5 text-gray-600" />
              </motion.button>
            </motion.div>
            
            {/* Navigation - Scrollable */}
            <nav className={`flex flex-col gap-2 flex-1 min-h-0 overflow-y-auto overflow-x-hidden ${scrollbarClass}`}>
            {items.map((item, index) => (
              <motion.button
                key={item.id}
                onClick={() => handleTabChange(item.id)}
                className={`
                  flex items-center gap-3 px-4 py-2.5 text-left transition-all duration-300 
                  font-medium text-gray-900 relative overflow-hidden group flex-shrink-0 min-h-[44px]
                  focus:outline-none focus:ring-0
                  ${isSidebarExpanded ? 'mx-3' : ''}
                  ${activeTab === item.id 
                    ? 'rounded-3xl bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg' 
                    : 'rounded-lg hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50 active:bg-purple-100'
                  }
                `}
                  initial={{ x: -50, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.4 + index * 0.1, duration: 0.4 }}
                  whileHover={{ 
                    scale: 1.05,
                    x: 8,
                    y: -2,
                    boxShadow: activeTab === item.id 
                      ? "0 10px 25px rgba(147, 51, 234, 0.4)"
                      : "0 5px 15px rgba(147, 51, 234, 0.2)"
                  }}
                  whileTap={{ scale: 0.98 }}
                >
                  {/* Hover Background Effect */}
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-purple-400/20 to-pink-400/20 opacity-0 group-hover:opacity-100"
                    initial={{ x: "-100%" }}
                    whileHover={{ x: "0%" }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                  />
                  
                  {/* Active Indicator */}
                  {activeTab === item.id && (
                    <motion.div
                      className="absolute left-0 top-0 bottom-0 w-1 bg-white rounded-r-full"
                      initial={{ scaleY: 0 }}
                      animate={{ scaleY: 1 }}
                      transition={{ duration: 0.3, ease: "easeOut" }}
                    />
                  )}
                  
                  <motion.span 
                    className="text-lg relative z-10 flex-shrink-0"
                    animate={activeTab === item.id ? { 
                      scale: [1, 1.2, 1],
                      rotate: [0, 10, -10, 0]
                    } : {}}
                    transition={{ duration: 0.5 }}
                  >
                    <IconRenderer icon={item.icon} label={item.label} size={32} isActive={activeTab === item.id} />
                  </motion.span>
                  <motion.span 
                    className="text-sm"
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.2 }}
                  >
                    {item.label}
                  </motion.span>
                  {activeTab === item.id && (
                    <motion.div
                      className="ml-auto w-2 h-2 bg-white rounded-full flex-shrink-0"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ duration: 0.3 }}
                    />
                  )}
                </motion.button>
              ))}
            </nav>
            
            {/* Logout Button - Fixed at bottom */}
            <motion.button
              onClick={() => handleTabChange('logout')}
              className={`flex items-center gap-3 px-4 py-2.5 mt-auto rounded-lg text-left text-red-600 hover:bg-red-100 active:bg-red-200 font-medium transition-all duration-200 flex-shrink-0 min-h-[44px] focus:outline-none focus:ring-0 ${isSidebarExpanded ? 'mx-2' : ''}`}
              initial={{ x: -50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.4 + items.length * 0.1, duration: 0.4 }}
                whileHover={{ 
                  scale: 1.05,
                  y: -2,
                  boxShadow: "0 4px 12px rgba(239, 68, 68, 0.2)"
                }}
              whileTap={{ scale: 0.98 }}
            >
              <motion.span 
                className="text-lg flex-shrink-0"
                whileHover={{ rotate: [0, -20, 20, 0] }}
                transition={{ duration: 0.5 }}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </motion.span> 
              <motion.span 
                className="text-sm"
                animate={{ opacity: 1 }}
                transition={{ duration: 0.2 }}
              >
                Logout
              </motion.span>
            </motion.button>
            
          </motion.aside>
        </AnimatePresence>
      ) : (
        // Desktop sidebar - always visible
        <motion.aside 
          className={`
            fixed top-0 left-0 bottom-0 z-[50] 
            bg-white border-r border-gray-300 
            flex flex-col py-6 px-4 h-screen
            w-20
            ${isSidebarExpanded ? 'shadow-2xl' : ''}
          `}
          variants={sidebarVariants}
          initial="collapsed"
          animate={isHovered ? "expanded" : "collapsed"}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          style={{ touchAction: 'pan-y' }}
        >
          {/* Header with Logo */}
          <motion.div 
            className="flex items-center justify-between mb-6 flex-shrink-0"
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.6 }}
          >
            <div className="flex items-center">
              <motion.div 
                className="w-12 h-12 rounded-full flex items-center justify-center mr-3"
                whileHover={{ scale: 1.1, rotate: 360 }}
                transition={{ duration: 0.5 }}
              >
                <Image src="/icons/logo.svg" alt="Logo" width={32} height={32} className="w-10 h-10" />
              </motion.div>
              <motion.div 
              className="hidden md:block"
              animate={{ opacity: isHovered ? 1 : 0 }}
              transition={{ 
                type: "spring",
                stiffness: 300,
                damping: 30,
                duration: 0.4
              }}
            >
              <span className="text-lg font-bold text-gray-800">Taru</span>
            </motion.div>
            </div>
          </motion.div>
          
          {/* Navigation - Scrollable */}
          <motion.nav 
            className={`flex flex-col flex-1 min-h-0 overflow-y-auto overflow-x-hidden ${scrollbarClass}`}
            animate={{
              gap: isHovered ? "0.75rem" : "0.5rem"
            }}
            transition={{
              type: "spring",
              stiffness: 300,
              damping: 30,
              duration: 0.4
            }}
          >
            {items.map((item, index) => (
              <motion.button
                key={item.id}
                onClick={() => handleTabChange(item.id)}
                className={`
                  flex items-center gap-3 pl-[0.7rem] pr-[0.3rem] py-2.5 rounded-3xl text-left transition-all duration-300 
                  font-medium text-gray-900 relative overflow-hidden group w-full min-h-[44px] flex-shrink-0
                  focus:outline-none focus:ring-0
                  ${isHovered ? 'mx-2' : ''}
                  ${activeTab === item.id 
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg' 
                    : 'hover:bg-gradient-to-r hover:from-purple-100 hover:to-pink-100 active:bg-purple-200'
                  }
                `}
                initial={{ x: -50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.4 + index * 0.1, duration: 0.4 }}
                whileHover={{ 
                  scale: 1.02,
                  x: 0,
                  transition: { duration: 0.2 }
                }}
                whileTap={{ scale: 0.98 }}
              >
                <motion.span 
                  className="text-base flex-shrink-0"
                  animate={activeTab === item.id ? { 
                    scale: [1, 1.2, 1],
                    rotate: [0, 10, -10, 0]
                  } : {}}
                  transition={{ duration: 0.5 }}
                >
                  <IconRenderer icon={item.icon} label={item.label} size={28} isActive={activeTab === item.id} />
                </motion.span>
                <motion.span 
                  className="text-sm whitespace-nowrap"
                  animate={{ opacity: isHovered ? 1 : 0 }}
                  transition={{ 
                    type: "spring",
                    stiffness: 300,
                    damping: 30,
                    duration: 0.4
                  }}
                >
                  {item.label}
                </motion.span>
                {activeTab === item.id && (
                  <motion.div
                    className="ml-auto w-2 h-2 bg-white rounded-full flex-shrink-0"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.3 }}
                  />
                )}
              </motion.button>
            ))}
          </motion.nav>
          
          {/* Logout Button - Fixed at bottom */}
          <motion.button
            onClick={() => handleTabChange('logout')}
            className={`flex items-center gap-3 pl-[0.7rem] pr-[0.3rem] py-2.5 mt-auto rounded-lg text-left text-red-600 hover:bg-red-100 active:bg-red-200 font-medium transition-all duration-200 flex-shrink-0 min-h-[44px] focus:outline-none focus:ring-0 ${isHovered ? 'mx-2' : ''}`}
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.4 + items.length * 0.1, duration: 0.4 }}
            whileHover={{ 
              scale: 1.02,
              x: 0,
              transition: { duration: 0.2 }
            }}
            whileTap={{ scale: 0.98 }}
          >
            <motion.span 
              className="text-base flex-shrink-0"
              whileHover={{ rotate: [0, -20, 20, 0] }}
              transition={{ duration: 0.5 }}
            >
              <IconRenderer icon="/icons/logout.png" label="Logout" size={28} isActive={activeTab === 'logout'} />
            </motion.span> 
            <motion.span 
              className="text-sm whitespace-nowrap"
              animate={{ opacity: isHovered ? 1 : 0 }}
              transition={{ 
                type: "spring",
                stiffness: 300,
                damping: 30,
                duration: 0.4
              }}
            >
              Logout
            </motion.span>
          </motion.button>
          
        </motion.aside>
      )}
    </>
  );
} 