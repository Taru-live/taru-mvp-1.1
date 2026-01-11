'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { TypewriterText, StaggeredText, FloatingText } from '../components/TextAnimations';
import { MagneticButton, TiltCard } from '../components/InteractiveElements';
import { ScrollFade, ParallaxScroll } from '../components/ScrollAnimations';
import ConsistentLoadingPage from '../components/ConsistentLoadingPage';
import { useMinimumDisplayTime } from '../components/useMinimumDisplayTime';



export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedRole, setSelectedRole] = useState('Student');
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [language, setLanguage] = useState('English (USA)');
  const [isLanguageDropdownOpen, setIsLanguageDropdownOpen] = useState(false);
  
  // Ensure loading page displays for at least 3 seconds
  const shouldShowLoading = useMinimumDisplayTime(loading, 3000);

  useEffect(() => {
    const savedLang = localStorage.getItem('lang');
    if (savedLang) setLanguage(savedLang);
  }, []);

  const handleLanguageChange = (lang: string) => {
    setLanguage(lang);
    localStorage.setItem('lang', lang);
    setIsLanguageDropdownOpen(false);
  };

  useEffect(() => {
    // Track mouse position for interactive effects
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY })
    }

    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  useEffect(() => {
    // Close language dropdown when clicking outside
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.language-selector-container')) {
        setIsLanguageDropdownOpen(false);
      }
    };

    if (isLanguageDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isLanguageDropdownOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }

      // Check if user needs onboarding first
      if (data.requiresOnboarding) {
        if (data.user.role === 'student') {
          router.push('/student-onboarding');
          return;
        } else if (data.user.role === 'parent') {
          router.push('/parent-onboarding');
          return;
        } else if (data.user.role === 'organization') {
          router.push('/organization-onboarding');
          return;
        }
      }

      // Check if student needs to complete assessments
      if (data.requiresAssessment && data.user.role === 'student') {
        // Check which assessment needs to be completed first
        try {
          const studentResponse = await fetch('/api/student/profile');
          if (studentResponse.ok) {
            const studentData = await studentResponse.json();
            if (!studentData.interestAssessmentCompleted) {
              // Interest assessment needs to be completed first
              router.push('/interest-assessment');
              return;
            } else {
              // Interest assessment is completed, check diagnostic assessment
              router.push('/diagnostic-assessment');
              return;
            }
          }
        } catch (error) {
          console.error('Error checking student assessment status:', error);
          // Fallback to diagnostic assessment
          router.push('/diagnostic-assessment');
          return;
        }
      }

      // Redirect based on user role after onboarding and assessment checks
      if (data.user.role === 'student') {
        router.push('/dashboard/student');
      } else if (data.user.role === 'parent') {
        router.push('/dashboard/parent');
      } else if (data.user.role === 'teacher') {
        router.push('/dashboard/teacher');
      } else if (data.user.role === 'organization') {
        router.push('/dashboard/organization-admin');
      } else if (data.user.role === 'admin') {
        router.push('/dashboard/admin');
      } else if (data.user.role === 'platform_super_admin') {
        router.push('/dashboard/platform-super-admin');
      } else {
        throw new Error('Unknown user role');
      }
    } catch (err: unknown) {
      console.error('Login error:', err);
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  // Show loading screen during authentication (with minimum 3 second display time)
  if (shouldShowLoading) {
    return (
      <ConsistentLoadingPage
        type="auth"
        title="Signing In"
        subtitle="Verifying your credentials and setting up your experience..."
        tips={[
          'Verifying your account credentials',
          'Setting up your personalized experience',
          'Redirecting to your dashboard'
        ]}
      />
    );
  }

  return (
    <motion.main 
      className="h-screen flex flex-col items-center justify-start overflow-x-hidden overflow-y-hidden bg-[#6D18CE] relative w-full"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
    >
      {/* Enhanced Interactive Background Elements */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Mouse-following gradient orbs */}
        <motion.div
          className="absolute w-48 h-48 sm:w-64 sm:h-64 md:w-80 md:h-80 lg:w-96 lg:h-96 rounded-full bg-gradient-to-r from-white/10 to-purple-300/10 blur-3xl"
          animate={{
            x: mousePosition.x * 0.05 - 200,
            y: mousePosition.y * 0.05 - 200,
          }}
          transition={{ type: "spring", stiffness: 30, damping: 20 }}
        />
        <motion.div
          className="absolute w-32 h-32 sm:w-48 sm:h-48 md:w-56 md:h-56 lg:w-64 lg:h-64 rounded-full bg-gradient-to-r from-pink-300/10 to-blue-300/10 blur-2xl"
          animate={{
            x: mousePosition.x * -0.03 + 100,
            y: mousePosition.y * -0.03 + 100,
          }}
          transition={{ type: "spring", stiffness: 20, damping: 25 }}
        />
        
        {/* Floating particles */}
        {[...Array(15)].map((_, i) => {
          // Use deterministic positioning based on index to avoid hydration mismatch
          const basePosition = (i * 137.5) % 100; // Golden ratio for better distribution
          const left = (basePosition + (i * 23.7)) % 100;
          const top = (basePosition * 1.618 + (i * 31.2)) % 100;
          
          return (
            <motion.div
              key={`particle-${i}`}
              className="absolute w-2 h-2 bg-white/30 rounded-full"
              style={{
                left: `${left}%`,
                top: `${top}%`,
              }}
              animate={{
                y: [0, -30, 0],
                x: [0, (i % 3 - 1) * 10, 0],
                scale: [1, 1.5, 1],
                opacity: [0.2, 0.8, 0.2],
              }}
              transition={{
                duration: 3 + (i % 3) * 1,
                repeat: Infinity,
                ease: "easeInOut",
                delay: (i % 4) * 0.5,
              }}
            />
          );
        })}
        
        {/* Floating geometric shapes */}
        {[...Array(8)].map((_, i) => {
          // Use deterministic positioning based on index to avoid hydration mismatch
          const basePosition = (i * 89.3) % 100; // Different multiplier for variety
          const left = (basePosition + (i * 41.7)) % 100;
          const top = (basePosition * 2.414 + (i * 19.8)) % 100;
          
          return (
            <motion.div
              key={`shape-${i}`}
              className="absolute w-3 h-3 bg-white/20 rounded-full"
              style={{
                left: `${left}%`,
                top: `${top}%`,
              }}
              animate={{
                y: [0, -40, 0],
                x: [0, (i % 5 - 2) * 8, 0],
                scale: [1, 1.3, 1],
                opacity: [0.3, 0.7, 0.3],
                rotate: [0, 180, 360],
              }}
              transition={{
                duration: 5 + (i % 4) * 1.2,
                repeat: Infinity,
                ease: "easeInOut",
                delay: (i % 3) * 0.8,
              }}
            />
          );
        })}
      </div>

      {/* Mobile Logo - Above White Box */}
      <motion.div
        className="lg:hidden mb-2 sm:mb-3 cursor-pointer"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.6 }}
        onClick={() => router.push('/')}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
      >
        <Image 
          src="/icons/logo.svg" 
          alt="Logo" 
          width={48} 
          height={48} 
          className="w-10 h-10 sm:w-12 sm:h-12 object-contain mx-auto"
        />
      </motion.div>

      {/* Main Login Popup Container */}
      <motion.div 
        className="relative w-full h-full bg-[#6D18CE] rounded-2xl sm:rounded-3xl md:rounded-[40px] flex flex-col lg:flex-row"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.8 }}
      >
                 {/* Left Section - Purple Background with Content */}
         <motion.section 
           className="w-full lg:w-[577px] relative hidden lg:flex flex-col items-center justify-center p-6 sm:p-8 md:p-12 h-full"
           initial={{ x: -100, opacity: 0 }}
           animate={{ x: 0, opacity: 1 }}
           transition={{ duration: 0.8 }}
         >
           {/* Logo */}
           <motion.div
             className="absolute top-4 sm:top-6 md:top-8 lg:top-[64px] left-4 sm:left-6 md:left-8 lg:left-[63px] cursor-pointer"
             initial={{ y: -20, opacity: 0 }}
             animate={{ y: 0, opacity: 1 }}
             transition={{ delay: 0.3, duration: 0.6 }}
             onClick={() => router.push('/')}
           >
             <Image src="/icons/logo.svg" alt="Logo" width={68} height={68} className="w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16 lg:w-[68px] lg:h-[68px] object-contain" />
           </motion.div>
           
           {/* Main Text */}
           <motion.div 
             className="w-full max-w-[457.73px] mt-16 sm:mt-20 md:mt-24 lg:mt-0 lg:absolute lg:top-[172px] lg:left-[63px] px-4 sm:px-6"
             initial={{ y: 50, opacity: 0 }}
             animate={{ y: 0, opacity: 1 }}
             transition={{ delay: 0.5, duration: 0.8 }}
           >
            <div className="text-xl sm:text-2xl md:text-3xl lg:text-[39.375px] leading-tight sm:leading-snug md:leading-normal lg:leading-[48px] font-normal text-white">
              <StaggeredText
                text="Start your journey with just one click."
                className="block mb-2"
                delay={0.2}
                staggerDelay={0.05}
                animationType="fadeUp"
              />
              <StaggeredText
                text="Choose your role and"
                className="block mb-2"
                delay={0.8}
                staggerDelay={0.05}
                animationType="slideLeft"
              />
              <FloatingText
                text="unlock a world of learning."
                className="font-bold block"
                intensity={2}
              />
            </div>
           </motion.div>
           
           {/* Mascot Image */}
           <motion.div
             className="mt-6 sm:mt-8 md:mt-12 lg:mt-0 lg:absolute lg:top-[400px] lg:left-[75px]"
             initial={{ scale: 0.8, opacity: 0 }}
             animate={{ scale: 1, opacity: 1 }}
             transition={{ delay: 0.7, duration: 0.6 }}
           >
             <Image src="/landingPage.png" alt="Mascot" width={407} height={352} className="w-48 h-auto sm:w-56 sm:h-auto md:w-64 md:h-auto lg:w-[407px] lg:h-[352px] object-contain" />
           </motion.div>
         </motion.section>

                 {/* Right Section - White Form Card */}
         <motion.section 
           className="w-full lg:w-[823px] bg-white rounded-2xl sm:rounded-3xl md:rounded-[40px] shadow-lg lg:shadow-[-21px_0px_144px_#6219B5] relative flex-1 h-full overflow-y-auto"
           initial={{ x: 100, opacity: 0 }}
           animate={{ x: 0, opacity: 1 }}
           transition={{ duration: 0.8 }}
         >
          {/* Language Selector - Top Right */}
          <motion.div 
            className="absolute top-3 sm:top-4 md:top-6 right-3 sm:right-4 md:right-6 z-10 language-selector-container"
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.6 }}
          >
            <div className="relative">
              <motion.button
                onClick={() => setIsLanguageDropdownOpen(!isLanguageDropdownOpen)}
                className="bg-[#6D18CE] hover:bg-[#5A14B0] text-white rounded-lg px-3 sm:px-4 py-2 shadow-lg transition-colors flex items-center gap-2"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <span className="text-lg">🌐</span>
                <span className="text-xs sm:text-sm font-medium hidden sm:inline">{language}</span>
                <svg 
                  className={`w-4 h-4 text-white transition-transform ${isLanguageDropdownOpen ? 'rotate-180' : ''}`}
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </motion.button>
              
              <AnimatePresence>
                {isLanguageDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden z-50"
                  >
                    {['English (USA)', 'हिन्दी', 'मराठी'].map((lang) => (
                      <button
                        key={lang}
                        onClick={() => handleLanguageChange(lang)}
                        className={`w-full text-left px-4 py-2.5 text-sm hover:bg-purple-50 transition-colors ${
                          language === lang ? 'bg-purple-100 text-purple-700 font-semibold' : 'text-gray-700'
                        }`}
                      >
                        {lang}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>

          {/* Super Admin Login Button - Top Right (to the left of language button) */}
          

          {/* Main Content Container */}
          <div className="relative w-full h-full px-4 sm:px-6 md:px-8 lg:px-[155px] py-3 sm:py-4 md:py-5 lg:py-8 flex flex-col justify-center items-center lg:items-center">

            {/* Welcome back Title */}
            <motion.h2 
              className="mt-0 sm:mt-1 text-xl sm:text-2xl md:text-3xl lg:text-[32px] leading-tight sm:leading-snug md:leading-[38px] font-bold text-black w-full lg:w-[250px] mx-auto text-center mb-1 sm:mb-1.5 md:mb-2"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.8, duration: 0.5 }}
            >
              Welcome back!
            </motion.h2>

            {/* Welcome back Subtitle */}
            <motion.p 
              className="mt-1 sm:mt-1.5 w-full lg:w-[500px] mx-auto text-center text-sm sm:text-base md:text-lg leading-relaxed sm:leading-6 md:leading-7 font-normal text-[#454545] mb-2 sm:mb-3 md:mb-4"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.85, duration: 0.5 }}
            >
              Please enter your details.
            </motion.p>

            {/* Login Form */}
            <motion.form 
              onSubmit={handleSubmit}
              className="mt-1 sm:mt-1.5 md:mt-2 w-full lg:w-[514px] lg:mx-auto"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 1.1, duration: 0.6 }}
            >
              {/* Email Input */}
              <div className="relative mb-4 sm:mb-5 md:mb-6">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  required
                  className="w-full h-11 sm:h-12 md:h-14 px-4 sm:px-5 md:px-6 border-[0.5px] border-[#C2C2C2] rounded-full sm:rounded-[70px] text-sm sm:text-base md:text-[16.0016px] leading-tight sm:leading-[19px] font-medium text-black bg-transparent focus:outline-none focus:border-[#6D18CE] transition-colors touch-manipulation"
                />
              </div>

              {/* Password Input */}
              <div className="relative mb-4 sm:mb-5 md:mb-6">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  required
                  className="w-full h-11 sm:h-12 md:h-14 px-4 sm:px-5 md:px-6 border-[0.5px] border-[#C2C2C2] rounded-full sm:rounded-[70px] text-sm sm:text-base md:text-[16.0016px] leading-tight sm:leading-[19px] font-medium text-black bg-transparent focus:outline-none focus:border-[#6D18CE] transition-colors touch-manipulation"
                />
              </div>

              {/* Remember me and Forgot password */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-0 mb-4 sm:mb-5 md:mb-6">
                <div className="flex items-center gap-2 sm:gap-[6px]">
                  <input
                    type="checkbox"
                    className="w-5 h-5 sm:w-6 sm:h-6 md:w-[34px] md:h-[34px] border border-black rounded touch-manipulation"
                  />
                  <span className="text-xs sm:text-[13px] leading-tight sm:leading-[16px] font-normal text-black">Remember me</span>
                </div>
                <span className="text-xs sm:text-[13px] leading-tight sm:leading-[16px] font-bold text-[#6D18CE] cursor-pointer hover:text-[#5A14B0] transition-colors touch-manipulation">
                  Forgot password
                </span>
              </div>

              {/* Error Message */}
              <AnimatePresence>
                {error && (
                  <motion.div 
                    className="mb-4 sm:mb-5 md:mb-6 alert-error"
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    transition={{ duration: 0.3 }}
                  >
                    {error}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Sign In Button */}
              <motion.button
                type="submit"
                disabled={loading}
                className="w-full max-w-full lg:max-w-[514px] h-11 sm:h-12 md:h-14 lg:h-16 bg-gradient-to-r from-[#6D18CE] to-[#8B5CF6] text-white rounded-full sm:rounded-[90px] font-semibold text-sm sm:text-base md:text-[16.0016px] flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed hover-glow touch-manipulation"
                whileHover={{ 
                  scale: 1.02,
                  boxShadow: "0 20px 25px -5px rgba(109, 24, 206, 0.4)"
                }}
                whileTap={{ scale: 0.98 }}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 1.2, duration: 0.4 }}
              >
                <AnimatePresence mode="wait">
                  {loading ? (
                    <motion.div
                      key="loading"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex items-center justify-center gap-2"
                    >
                      <motion.div
                        className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"
                        style={{ borderTopColor: '#FFFFFF' }}
                      />
                      <span className="text-white">Signing in...</span>
                    </motion.div>
                  ) : (
                    <motion.span
                      key="login"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      Sign in
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.button>
            </motion.form>

            {/* Register Link */}
            <motion.div 
              className="mt-4 sm:mt-5 md:mt-6 text-center w-full lg:w-[205px] lg:mx-auto mb-2 sm:mb-2.5 md:mb-3"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 1.3, duration: 0.4 }}
            >
              <span className="text-xs sm:text-[13px] leading-tight sm:leading-[16px] font-normal text-black">Don&apos;t have an account? </span>
              <motion.span
                onClick={() => router.push('/register')}
                className="text-[#6D18CE] hover:text-[#5A14B0] font-semibold cursor-pointer text-xs sm:text-[13px] transition-colors duration-200 touch-manipulation"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Sign up
              </motion.span>
            </motion.div>
          </div>
        </motion.section>
             </motion.div>
       
       {/* Google Translate Button - Bottom Left of Screen */}
       <motion.div 
         className="fixed bottom-3 sm:bottom-4 left-3 sm:left-4 z-50"
         initial={{ y: 20, opacity: 0 }}
         animate={{ y: 0, opacity: 1 }}
         transition={{ delay: 0.4, duration: 0.6 }}
       >
         <div className="bg-white/90 backdrop-blur-sm border border-gray-200 rounded-lg px-2 sm:px-3 py-1.5 sm:py-2 shadow-lg">
         </div>
       </motion.div>
     </motion.main>
   );
} 