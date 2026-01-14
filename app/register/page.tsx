'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { RegistrationDataManager } from '@/lib/utils'
import ConsistentLoadingPage from '../components/ConsistentLoadingPage'

export default function Register() {
  const router = useRouter()
  const [selectedRole, setSelectedRole] = useState('student')
  const [formData, setFormData] = useState({
    fullName: '',
    guardianName: '',
    classGrade: '',
    language: '',
    location: '',
    email: '',
    password: '',
    confirmPassword: '',
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const [language, setLanguage] = useState('English (USA)')
  const [isLanguageDropdownOpen, setIsLanguageDropdownOpen] = useState(false)
  const [isOAuthUser, setIsOAuthUser] = useState(false)
  const [oauthData, setOauthData] = useState<{email?: string, name?: string, picture?: string, googleId?: string} | null>(null)

  useEffect(() => {
    // Track mouse position for interactive effects
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY })
    }

    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  useEffect(() => {
    const savedLang = localStorage.getItem('lang')
    if (savedLang) setLanguage(savedLang)

    // Check for OAuth parameter in URL
    const urlParams = new URLSearchParams(window.location.search)
    const oauthParam = urlParams.get('oauth')
    
    if (oauthParam === 'google') {
      setIsOAuthUser(true)
      // Fetch OAuth data from API
      fetch('/api/auth/oauth-data')
        .then(res => res.json())
        .then(data => {
          if (data.oauthData) {
            setOauthData(data.oauthData)
            // Pre-fill form with OAuth data
            setFormData(prev => ({
              ...prev,
              fullName: data.oauthData.name || '',
              email: data.oauthData.email || '',
            }))
          } else {
            // OAuth data expired or not found, redirect to login
            setError('OAuth session expired. Please try signing in again.')
            setTimeout(() => {
              router.push('/login')
            }, 3000)
          }
        })
        .catch(err => {
          console.error('Error fetching OAuth data:', err)
          setError('Failed to load OAuth data. Please try again.')
        })
      
      // Clean up URL
      window.history.replaceState({}, '', '/register')
    }

    // Check for OAuth errors in URL
    const oauthError = urlParams.get('error')
    if (oauthError) {
      const errorMessages: Record<string, string> = {
        'oauth_failed': 'Google authentication failed. Please try again.',
        'invalid_state': 'Security verification failed. Please try again.',
        'no_code': 'Authentication was cancelled.',
        'config_error': 'Authentication service is not configured properly.',
        'invalid_token': 'Invalid authentication token. Please try again.',
        'no_email': 'No email address found in your Google account.',
        'oauth_callback_failed': 'Authentication callback failed. Please try again.',
      }
      setError(errorMessages[oauthError] || 'Authentication failed. Please try again.')
      // Clean up URL
      window.history.replaceState({}, '', '/register')
    }
  }, [router])

  useEffect(() => {
    // Close language dropdown when clicking outside
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (!target.closest('.language-selector-container')) {
        setIsLanguageDropdownOpen(false)
      }
    }

    if (isLanguageDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isLanguageDropdownOpen])

  const handleLanguageChange = (lang: string) => {
    setLanguage(lang)
    localStorage.setItem('lang', lang)
    setIsLanguageDropdownOpen(false)
  }

  const handleRoleChange = (role: string) => {
    console.log('Role changed to:', role);
    setSelectedRole(role)
    setFormData({
      fullName: '',
      guardianName: '',
      classGrade: '',
      language: '',
      location: '',
      email: '',
      password: '',
      confirmPassword: '',
    })
    setError('')
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    if (error) setError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    // Skip password validation for OAuth users
    if (!isOAuthUser) {
      if (formData.password !== formData.confirmPassword) {
        setError('Passwords do not match')
        setIsLoading(false)
        return
      }
      if (formData.password.length < 6) {
        setError('Password must be at least 6 characters long')
        setIsLoading(false)
        return
      }
    }

    // Validate student ID format for parent registration
    if (selectedRole === 'parent') {
      const studentId = formData.classGrade.trim()
      if (!studentId.startsWith('STU')) {
        setError('Student ID must start with "STU" (e.g., STUabc123def)')
        setIsLoading(false)
        return
      }
      if (studentId.length < 8) {
        setError('Student ID must be at least 8 characters long')
        setIsLoading(false)
        return
      }
    }

    // Validate organization type for organization registration
    if (selectedRole === 'organization') {
      const orgType = formData.classGrade.trim()
      if (orgType.length < 3) {
        setError('Organization type must be at least 3 characters long')
        setIsLoading(false)
        return
      }
    }

    // Store registration data for auto-filling in onboarding
    const registrationData = {
      role: selectedRole,
      fullName: formData.fullName,
      email: formData.email,
      guardianName: formData.guardianName,
      classGrade: formData.classGrade,
      language: formData.language,
      location: formData.location,
      timestamp: new Date().toISOString()
    };
    
    // Store in localStorage for auto-filling
    RegistrationDataManager.storeRegistrationData(registrationData);

    // Prepare profile data based on role
    let profileData: Record<string, string> = {}
    if (selectedRole === 'student') {
      profileData = {
        grade: formData.classGrade,
        language: formData.language,
        location: formData.location,
        guardianName: formData.guardianName,
      }
    } else if (selectedRole === 'teacher') {
      profileData = {
        subjectSpecialization: formData.classGrade,
        experienceYears: formData.language,
      }
    } else if (selectedRole === 'parent') {
      profileData = {
        linkedStudentUniqueId: formData.classGrade.trim(),
      }
    } else if (selectedRole === 'organization') {
      profileData = {
        organizationType: formData.classGrade,
        industry: formData.language,
        location: formData.location,
        guardianName: formData.guardianName,
      }
    }

    try {
      // Prepare registration payload
      const registrationPayload: any = {
        name: formData.fullName,
        email: formData.email,
        role: selectedRole,
        profile: profileData,
      };

      // Include password only for non-OAuth users
      if (!isOAuthUser) {
        registrationPayload.password = formData.password;
      } else if (oauthData) {
        // Include OAuth data for OAuth users
        registrationPayload.oauthData = {
          googleId: oauthData.googleId,
          picture: oauthData.picture,
        };
      }

      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(registrationPayload),
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || 'Registration failed')
      }

      // For OAuth users, the registration API will handle authentication
      // For regular users, auto-login
      if (!isOAuthUser) {
        try {
          const loginResponse = await fetch('/api/auth/login', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email: formData.email, password: formData.password }),
          });

          const loginData = await loginResponse.json();
          if (!loginResponse.ok) {
            throw new Error(loginData.error || 'Auto-login failed');
          }
        } catch (loginError) {
          console.error('Auto-login failed:', loginError);
        }
      }
      
      // Redirect based on role after a short delay
      setTimeout(() => {
        if (selectedRole === 'student') {
          router.push('/student-onboarding');
        } else if (selectedRole === 'parent') {
          router.push('/parent-onboarding');
        } else if (selectedRole === 'organization') {
          router.push('/organization-onboarding');
        } else if (selectedRole === 'teacher') {
          router.push('/dashboard/teacher');
        } else {
          router.push('/login');
        }
      }, 2000);

    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Registration failed. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  // Show loading screen during registration
  if (isLoading) {
    return (
      <ConsistentLoadingPage
        type="auth"
        title="Creating Account"
        subtitle="Setting up your account and preparing your personalized experience..."
        tips={[
          'Creating your account profile',
          'Setting up your learning preferences',
          'Preparing your dashboard'
        ]}
      />
    );
  }

  return (
    <motion.main 
      className="h-screen flex flex-col items-center justify-start overflow-x-hidden overflow-y-hidden bg-[#6D18CE] relative w-full"
      style={{ zIndex: 1, position: 'relative' }}
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
        className="lg:hidden mb-4 sm:mb-6 cursor-pointer"
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
          className="w-12 h-12 sm:w-14 sm:h-14 object-contain mx-auto"
        />
      </motion.div>

      {/* Main Registration Popup Container */}
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
            <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-[39.375px] leading-tight sm:leading-snug md:leading-normal lg:leading-[48px] font-normal text-white flex items-center">
              Start your journey with just one click. Choose your role and unlock a world of learning.
            </h2>
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
            className="absolute top-0 sm:top-3 md:top-6 right-2 sm:right-3 md:right-6 z-10 language-selector-container"
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.6 }}
          >
            <div className="relative">
              <motion.button
                onClick={() => setIsLanguageDropdownOpen(!isLanguageDropdownOpen)}
                className="bg-[#6D18CE] hover:bg-[#5A14B0] text-white rounded-lg px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 shadow-lg transition-colors flex items-center gap-1 sm:gap-2"
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
                    className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden z-50"
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

          {/* Main Content Container */}
          <div className="px-3 sm:px-4 md:px-6 lg:px-[60px] pt-1 sm:pt-2 md:pt-4 lg:pt-[40px] pb-0 sm:pb-0 md:pb-4 lg:pb-[40px] h-full flex flex-col">
            {/* Role Selector Tabs */}
            <motion.div 
              className="w-full h-10 sm:h-12 md:h-[56px] mb-1.5 sm:mb-2 md:mb-6"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.9, duration: 0.5 }}
            >
              <div className="flex bg-[#F2F4F7] rounded-xl p-0.5 sm:p-1 h-full">
                {['student', 'teacher', 'parent', 'organization'].map((role, index) => (
                  <motion.button 
                    key={role}
                    onClick={() => handleRoleChange(role)}
                    className={`flex-1 px-1 sm:px-2 md:px-4 py-1 sm:py-1.5 md:py-3 rounded-lg font-normal text-[10px] sm:text-xs md:text-[12px] transition-all duration-200 touch-manipulation ${
                      selectedRole === role 
                        ? 'bg-white text-[#101828] shadow-sm' 
                        : 'text-[#667085]'
                    }`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    initial={{ y: 10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 1.0 + index * 0.1, duration: 0.3 }}
                  >
                    {role.charAt(0).toUpperCase() + role.slice(1)}
                  </motion.button>
                ))}
              </div>
            </motion.div>

            {/* Create Account Title */}
            <motion.h2 
              className="text-lg sm:text-xl md:text-[24.7297px] leading-tight sm:leading-snug md:leading-[30px] font-bold text-black mb-1.5 sm:mb-2 md:mb-6 w-auto lg:w-[190px]"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.8, duration: 0.5 }}
            >
              Create Account
            </motion.h2>

            {/* Registration Form */}
            <motion.form 
              onSubmit={handleSubmit}
              className="flex-1 flex flex-col min-h-0"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 1.1, duration: 0.6 }}
            >
              {/* Form Fields Container */}
              <div className="flex-shrink-0 space-y-1.5 sm:space-y-2 md:space-y-5 lg:space-y-6">
                {/* Full Name */}
                <div className="relative">
                  <label className="block text-xs sm:text-sm md:text-[16.0016px] font-medium leading-tight sm:leading-[19px] text-[#C2C2C2] mb-0.5 sm:mb-1">Full Name</label>
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    className="w-full border-b-[0.5px] border-[#C2C2C2] pb-0.5 sm:pb-1 text-xs sm:text-sm md:text-black bg-transparent focus:outline-none focus:border-[#6D18CE] transition-colors touch-manipulation"
                    required
                  />
                </div>

                {/* Guardian Name / Contact Person - Only for organization role */}
                {selectedRole === 'organization' && (
                  <div className="relative">
                    <label className="block text-xs sm:text-sm md:text-[16.0016px] font-medium leading-tight sm:leading-[19px] text-[#C2C2C2] mb-0.5 sm:mb-1">
                      Contact Person
                    </label>
                    <input
                      type="text"
                      name="guardianName"
                      value={formData.guardianName}
                      onChange={handleInputChange}
                      placeholder="e.g., John Doe, HR Manager"
                      className="w-full border-b-[0.5px] border-[#C2C2C2] pb-0.5 sm:pb-1 text-xs sm:text-sm md:text-black bg-transparent focus:outline-none focus:border-[#6D18CE] transition-colors touch-manipulation"
                      required
                    />
                  </div>
                )}

                                 {/* Class/Grade and Language - Side by side */}
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 md:gap-8 lg:gap-[378px]">
                   <div className="relative">
                     <label className="block text-xs sm:text-sm md:text-[16.0016px] font-medium leading-tight sm:leading-[19px] text-[#C2C2C2] mb-0.5 sm:mb-1">
                       {selectedRole === 'student' ? 'Class/Grade' : 
                        selectedRole === 'teacher' ? 'Subject' : 
                        selectedRole === 'parent' ? 'Student ID' : 
                        selectedRole === 'organization' ? 'Organization Type' :
                        'Organization Type'}
                     </label>
                                           {selectedRole === 'student' ? (
                        <div className="relative">
                          <select
                            name="classGrade"
                            value={formData.classGrade}
                            onChange={handleInputChange}
                            className="w-full border-b-[0.5px] border-[#C2C2C2] pb-0.5 sm:pb-1 text-xs sm:text-sm md:text-black bg-transparent focus:outline-none focus:border-[#6D18CE] transition-colors appearance-none cursor-pointer pr-6 sm:pr-8 touch-manipulation"
                            required
                          >
                         <option value="" disabled>Select Grade</option>
                         <option value="Pre-K">Pre-K</option>
                         <option value="Kindergarten">Kindergarten</option>
                         <option value="Grade 1">Grade 1</option>
                         <option value="Grade 2">Grade 2</option>
                         <option value="Grade 3">Grade 3</option>
                         <option value="Grade 4">Grade 4</option>
                         <option value="Grade 5">Grade 5</option>
                         <option value="Grade 6">Grade 6</option>
                         <option value="Grade 7">Grade 7</option>
                         <option value="Grade 8">Grade 8</option>
                         <option value="Grade 9">Grade 9</option>
                         <option value="Grade 10">Grade 10</option>
                                                   <option value="Grade 11">Grade 11</option>
                          <option value="Grade 12">Grade 12</option>
                        </select>
                        <div className="absolute right-0 top-1/2 transform -translate-y-1/2 pointer-events-none">
                          <svg className="w-3 h-3 sm:w-4 sm:h-4 text-[#C2C2C2]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                        </div>
                      ) : selectedRole === 'teacher' ? (
                        <div className="relative">
                          <select
                            name="classGrade"
                            value={formData.classGrade}
                            onChange={handleInputChange}
                            className="w-full border-b-[0.5px] border-[#C2C2C2] pb-0.5 sm:pb-1 text-xs sm:text-sm md:text-black bg-transparent focus:outline-none focus:border-[#6D18CE] transition-colors appearance-none cursor-pointer pr-6 sm:pr-8 touch-manipulation"
                            required
                          >
                            <option value="" disabled>Select Subject</option>
                            <option value="Mathematics">Mathematics</option>
                            <option value="Science">Science</option>
                            <option value="English">English</option>
                            <option value="History">History</option>
                            <option value="Geography">Geography</option>
                            <option value="Computer Science">Computer Science</option>
                            <option value="Art">Art</option>
                            <option value="Music">Music</option>
                            <option value="Physical Education">Physical Education</option>
                            <option value="Languages">Languages</option>
                            <option value="Social Studies">Social Studies</option>
                            <option value="Other">Other</option>
                          </select>
                          <div className="absolute right-0 top-1/2 transform -translate-y-1/2 pointer-events-none">
                            <svg className="w-4 h-4 text-[#C2C2C2]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </div>
                        </div>
                      ) : selectedRole === 'organization' ? (
                        <div className="relative">
                          <select
                            name="classGrade"
                            value={formData.classGrade}
                            onChange={handleInputChange}
                            className="w-full border-b-[0.5px] border-[#C2C2C2] pb-0.5 sm:pb-1 text-xs sm:text-sm md:text-black bg-transparent focus:outline-none focus:border-[#6D18CE] transition-colors appearance-none cursor-pointer pr-6 sm:pr-8 touch-manipulation"
                            required
                          >
                            <option value="" disabled>Select Organization Type</option>
                            <option value="School">School</option>
                            <option value="University">University</option>
                            <option value="NGO">NGO</option>
                            <option value="Corporate">Corporate</option>
                            <option value="Government">Government</option>
                            <option value="Non-Profit">Non-Profit</option>
                            <option value="Educational Institute">Educational Institute</option>
                            <option value="Training Center">Training Center</option>
                            <option value="Other">Other</option>
                          </select>
                          <div className="absolute right-0 top-1/2 transform -translate-y-1/2 pointer-events-none">
                            <svg className="w-4 h-4 text-[#C2C2C2]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </div>
                        </div>
                     ) : (
                       <input
                         type="text"
                         name="classGrade"
                         value={formData.classGrade}
                         onChange={handleInputChange}
                         placeholder="e.g., STUabc123def"
                         className="w-full border-b-[0.5px] border-[#C2C2C2] pb-0.5 sm:pb-1 text-xs sm:text-sm md:text-black bg-transparent focus:outline-none focus:border-[#6D18CE] transition-colors touch-manipulation"
                         required
                       />
                     )}
                   </div>
                   <div className="relative">
                     <label className="block text-xs sm:text-sm md:text-[16.0016px] font-medium leading-tight sm:leading-[19px] text-[#C2C2C2] mb-0.5 sm:mb-1">
                       {selectedRole === 'student' ? 'Language' : 
                        selectedRole === 'teacher' ? 'Experience' : 
                        selectedRole === 'parent' ? 'Location' : 
                        selectedRole === 'organization' ? 'Industry' :
                        'Industry'}
                     </label>
                     {selectedRole === 'student' ? (
                       <div className="relative">
                         <select
                           name="language"
                           value={formData.language}
                           onChange={handleInputChange}
                           className="w-full border-b-[0.5px] border-[#C2C2C2] pb-0.5 sm:pb-1 text-xs sm:text-sm md:text-black bg-transparent focus:outline-none focus:border-[#6D18CE] transition-colors appearance-none cursor-pointer pr-6 sm:pr-8"
                           required
                         >
                         <option value="" disabled>Select Language</option>
                         <option value="English">English</option>
                         <option value="Hindi">Hindi</option>
                         <option value="Bengali">Bengali</option>
                         <option value="Telugu">Telugu</option>
                         <option value="Marathi">Marathi</option>
                         <option value="Tamil">Tamil</option>
                         <option value="Gujarati">Gujarati</option>
                         <option value="Urdu">Urdu</option>
                         <option value="Kannada">Kannada</option>
                         <option value="Odia">Odia</option>
                         <option value="Malayalam">Malayalam</option>
                         <option value="Punjabi">Punjabi</option>
                         <option value="Assamese">Assamese</option>
                         <option value="Bhojpuri">Bhojpuri</option>
                         <option value="Sanskrit">Sanskrit</option>
                         <option value="Kashmiri">Kashmiri</option>
                         <option value="Konkani">Konkani</option>
                         <option value="Manipuri">Manipuri</option>
                         <option value="Nepali">Nepali</option>
                         <option value="Sindhi">Sindhi</option>
                         <option value="Other">Other</option>
                       </select>
                       <div className="absolute right-0 top-1/2 transform -translate-y-1/2 pointer-events-none">
                         <svg className="w-4 h-4 text-[#C2C2C2]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                         </svg>
                       </div>
                       </div>
                     ) : selectedRole === 'teacher' ? (
                       <div className="relative">
                         <select
                           name="language"
                           value={formData.language}
                           onChange={handleInputChange}
                           className="w-full border-b-[0.5px] border-[#C2C2C2] pb-0.5 sm:pb-1 text-xs sm:text-sm md:text-black bg-transparent focus:outline-none focus:border-[#6D18CE] transition-colors appearance-none cursor-pointer pr-6 sm:pr-8"
                           required
                         >
                           <option value="" disabled>Select Experience</option>
                           <option value="0-2 years">0-2 years</option>
                           <option value="3-5 years">3-5 years</option>
                           <option value="6-10 years">6-10 years</option>
                           <option value="11-15 years">11-15 years</option>
                           <option value="16-20 years">16-20 years</option>
                           <option value="20+ years">20+ years</option>
                         </select>
                         <div className="absolute right-0 top-1/2 transform -translate-y-1/2 pointer-events-none">
                           <svg className="w-4 h-4 text-[#C2C2C2]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                           </svg>
                         </div>
                       </div>
                     ) : selectedRole === 'organization' ? (
                       <div className="relative">
                         <select
                           name="language"
                           value={formData.language}
                           onChange={handleInputChange}
                           className="w-full border-b-[0.5px] border-[#C2C2C2] pb-0.5 sm:pb-1 text-xs sm:text-sm md:text-black bg-transparent focus:outline-none focus:border-[#6D18CE] transition-colors appearance-none cursor-pointer pr-6 sm:pr-8"
                           required
                         >
                           <option value="" disabled>Select Industry</option>
                           <option value="Education">Education</option>
                           <option value="Technology">Technology</option>
                           <option value="Healthcare">Healthcare</option>
                           <option value="Finance">Finance</option>
                           <option value="Manufacturing">Manufacturing</option>
                           <option value="Retail">Retail</option>
                           <option value="Media & Entertainment">Media & Entertainment</option>
                           <option value="Transportation">Transportation</option>
                           <option value="Energy">Energy</option>
                           <option value="Real Estate">Real Estate</option>
                           <option value="Consulting">Consulting</option>
                           <option value="Non-Profit">Non-Profit</option>
                           <option value="Government">Government</option>
                           <option value="Other">Other</option>
                         </select>
                         <div className="absolute right-0 top-1/2 transform -translate-y-1/2 pointer-events-none">
                           <svg className="w-4 h-4 text-[#C2C2C2]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                           </svg>
                         </div>
                       </div>
                     ) : (
                       <input
                         type="text"
                         name="language"
                         value={formData.language}
                         onChange={handleInputChange}
                         placeholder="Enter location"
                         className="w-full border-b-[0.5px] border-[#C2C2C2] pb-0.5 sm:pb-1 text-xs sm:text-sm md:text-black bg-transparent focus:outline-none focus:border-[#6D18CE] transition-colors touch-manipulation"
                         required
                       />
                     )}
                   </div>
                 </div>

                {/* Location - Only for student role */}
                {selectedRole === 'student' && (
                  <div className="relative">
                    <label className="block text-xs sm:text-sm md:text-[16.0016px] font-medium leading-tight sm:leading-[19px] text-[#C2C2C2] mb-0.5 sm:mb-1">Location</label>
                    <input
                      type="text"
                      name="location"
                      value={formData.location}
                      onChange={handleInputChange}
                      className="w-full border-b-[0.5px] border-[#C2C2C2] pb-0.5 sm:pb-1 text-xs sm:text-sm md:text-black bg-transparent focus:outline-none focus:border-[#6D18CE] transition-colors touch-manipulation"
                      required
                    />
                  </div>
                )}

                {/* Email */}
                <div className="relative">
                  <label className="block text-xs sm:text-sm md:text-[16.0016px] font-medium leading-tight sm:leading-[19px] text-[#C2C2C2] mb-0.5 sm:mb-1">Email Address</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    readOnly={isOAuthUser}
                    className={`w-full border-b-[0.5px] border-[#C2C2C2] pb-0.5 sm:pb-1 text-xs sm:text-sm md:text-black bg-transparent focus:outline-none focus:border-[#6D18CE] transition-colors touch-manipulation ${isOAuthUser ? 'cursor-not-allowed opacity-70' : ''}`}
                    required
                  />
                </div>

                {/* OAuth User Message */}
                {isOAuthUser && (
                  <div className="relative mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-xs sm:text-sm text-blue-800">
                      <span className="font-semibold">Signing up with Google:</span> You're using your Google account. No password needed!
                    </p>
                  </div>
                )}

                {/* Password - Hidden for OAuth users */}
                {!isOAuthUser && (
                  <div className="relative">
                    <label className="block text-xs sm:text-sm md:text-[16.0016px] font-medium leading-tight sm:leading-[19px] text-[#C2C2C2] mb-0.5 sm:mb-1">Password</label>
                    <input
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      className="w-full border-b-[0.5px] border-[#C2C2C2] pb-0.5 sm:pb-1 text-xs sm:text-sm md:text-black bg-transparent focus:outline-none focus:border-[#6D18CE] transition-colors touch-manipulation"
                      required
                    />
                  </div>
                )}

                {/* Confirm Password - Hidden for OAuth users */}
                {!isOAuthUser && (
                  <div className="relative">
                    <label className="block text-xs sm:text-sm md:text-[16.0016px] font-medium leading-tight sm:leading-[19px] text-[#C2C2C2] mb-0.5 sm:mb-1">Confirm Password</label>
                    <input
                      type="password"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      className="w-full border-b-[0.5px] border-[#C2C2C2] pb-0.5 sm:pb-1 text-xs sm:text-sm md:text-black bg-transparent focus:outline-none focus:border-[#6D18CE] transition-colors touch-manipulation"
                      required
                    />
                  </div>
                )}
              </div>

              {/* Error Message */}
              <AnimatePresence>
                {error && (
                  <motion.div 
                    className="my-1 sm:my-2 alert-error text-xs sm:text-sm"
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    transition={{ duration: 0.3 }}
                  >
                    {error}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Bottom Section */}
              <div className="mt-1 sm:mt-2 md:mt-6 lg:mt-8 space-y-1.5 sm:space-y-2 md:space-y-4 flex-shrink-0">
                {/* Divider */}
                <motion.div 
                  className="w-full lg:w-[514px] mx-auto flex items-center gap-3 sm:gap-4"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1.85, duration: 0.4 }}
                >
                  <div className="flex-1 h-[0.5px] bg-[#C2C2C2]"></div>
                  <span className="text-xs sm:text-[13px] text-[#454545] font-medium">OR</span>
                  <div className="flex-1 h-[0.5px] bg-[#C2C2C2]"></div>
                </motion.div>

                {/* Google Sign In Button */}
                <motion.button
                  type="button"
                  onClick={() => {
                    window.location.href = '/api/auth/google'
                  }}
                  className="w-full lg:w-[514px] mx-auto h-10 sm:h-12 md:h-14 lg:h-16 bg-white border-[0.5px] border-[#C2C2C2] rounded-full sm:rounded-[90px] font-semibold text-xs sm:text-sm md:text-[16.0016px] flex items-center justify-center gap-3 shadow-md hover:shadow-lg transition-all duration-300 hover:bg-gray-50 touch-manipulation"
                  whileHover={{ 
                    scale: 1.02,
                    boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)"
                  }}
                  whileTap={{ scale: 0.98 }}
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 1.9, duration: 0.4 }}
                >
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  <span className="text-[#454545]">Continue with Google</span>
                </motion.button>

                {/* Register Button */}
                <motion.button
                  type="submit"
                  className="w-full lg:w-[514px] h-10 sm:h-12 md:h-16 lg:h-[69px] bg-gradient-to-r from-[#6D18CE] to-[#8B5CF6] text-white rounded-full sm:rounded-[90px] font-semibold text-xs sm:text-sm md:text-[16.0016px] flex items-center justify-center mx-auto shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed hover-glow touch-manipulation"
                  disabled={isLoading}
                  whileHover={{ 
                    scale: 1.02,
                    boxShadow: "0 20px 25px -5px rgba(109, 24, 206, 0.4)"
                  }}
                  whileTap={{ scale: 0.98 }}
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 1.9, duration: 0.4 }}
                >
                  <AnimatePresence mode="wait">
                    {isLoading ? (
                      <motion.div
                        key="loading"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex items-center justify-center gap-2"
                      >
                        <motion.div
                          className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        />
                        <span>Creating Account...</span>
                      </motion.div>
                    ) : (
                      <motion.span
                        key="register"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                      >
                        Register
                      </motion.span>
                    )}
                  </AnimatePresence>
                </motion.button>

                {/* Sign In Link */}
                <motion.div 
                  className="text-center w-full lg:w-[205px] mx-auto px-2 sm:px-0 mb-0 sm:mb-0 md:mb-0 lg:mb-0"
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 2.0, duration: 0.4 }}
                >
                  <span className="text-xs sm:text-[13px] leading-tight sm:leading-[16px] text-black block sm:inline">Already have an account? </span>
                  <Link
                    href="/login"
                    className="text-[#6D18CE] hover:text-[#5A14B0] font-semibold text-xs sm:text-[13px] transition-colors duration-200 touch-manipulation inline-block mt-1 sm:mt-0"
                  >
                    <motion.span
                      whileHover={{ scale: 1.05 }}
                      className="inline-block"
                    >
                      Sign in
                    </motion.span>
                  </Link>
                </motion.div>
              </div>
            </motion.form>
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
   )
} 