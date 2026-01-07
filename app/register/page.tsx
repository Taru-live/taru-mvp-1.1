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

  useEffect(() => {
    // Track mouse position for interactive effects
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY })
    }

    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

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
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.fullName,
          email: formData.email,
          password: formData.password,
          role: selectedRole,
          profile: profileData,
        }),
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || 'Registration failed')
      }

      // Show success message and auto-login
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
        
        // Redirect based on role after a short delay
        setTimeout(() => {
          if (selectedRole === 'student') {
            router.push('/student-onboarding');
          } else if (selectedRole === 'parent') {
            router.push('/parent-onboarding');
          } else if (selectedRole === 'organization') {
            router.push('/dashboard/admin');
          } else if (selectedRole === 'teacher') {
            router.push('/dashboard/teacher');
          } else {
            router.push('/login');
          }
        }, 2000);
      } catch (loginError) {
        console.error('Auto-login failed:', loginError);
        // If auto-login fails, redirect to login page
        setTimeout(() => {
          router.push('/login');
        }, 2000);
      }

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
      className="min-h-screen flex flex-col items-center justify-center overflow-x-hidden overflow-y-auto bg-[#6D18CE] p-2 sm:p-4 md:p-6 py-4 sm:py-6 md:py-8 lg:py-3 relative w-full"
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
        className="relative w-full max-w-[1400px] bg-[#6D18CE] rounded-2xl sm:rounded-3xl md:rounded-[40px] flex flex-col lg:flex-row"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.8 }}
      >
        {/* Left Section - Purple Background with Content */}
        <motion.section 
          className="w-full lg:w-[577px] relative hidden lg:flex flex-col items-center justify-center p-6 sm:p-8 md:p-12"
          style={{ 
            minHeight: 'clamp(500px, 80vh, 856px)',
            height: 'auto'
          }}
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
           className="w-full lg:w-[823px] bg-white rounded-2xl sm:rounded-3xl md:rounded-[40px] shadow-lg lg:shadow-[-21px_0px_144px_#6219B5] relative flex-1 lg:min-h-[856px]"
           initial={{ x: 100, opacity: 0 }}
           animate={{ x: 0, opacity: 1 }}
           transition={{ duration: 0.8 }}
         >

          {/* Main Content Container */}
          <div className="px-4 sm:px-6 md:px-8 lg:px-[60px] py-4 sm:py-5 md:py-6 lg:py-[40px] h-full flex flex-col">
            {/* Role Selector Tabs */}
            <motion.div 
              className="w-full h-12 sm:h-14 md:h-[56px] mb-3 sm:mb-4 md:mb-6"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.9, duration: 0.5 }}
            >
              <div className="flex bg-[#F2F4F7] rounded-xl p-1 h-full">
                {['student', 'teacher', 'parent', 'organization'].map((role, index) => (
                  <motion.button 
                    key={role}
                    onClick={() => handleRoleChange(role)}
                    className={`flex-1 px-2 sm:px-3 md:px-4 py-2 sm:py-2.5 md:py-3 rounded-lg font-normal text-xs sm:text-[12px] transition-all duration-200 touch-manipulation ${
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
              className="text-xl sm:text-2xl md:text-[24.7297px] leading-tight sm:leading-snug md:leading-[30px] font-bold text-black mb-3 sm:mb-4 md:mb-6 w-auto lg:w-[190px]"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.8, duration: 0.5 }}
            >
              Create Account
            </motion.h2>

            {/* Registration Form */}
            <motion.form 
              onSubmit={handleSubmit}
              className="flex-1 flex flex-col"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 1.1, duration: 0.6 }}
            >
              {/* Form Fields Container */}
              <div className="flex-1 space-y-3 sm:space-y-4 md:space-y-5 lg:space-y-6 overflow-y-auto">
                {/* Full Name */}
                <div className="relative">
                  <label className="block text-sm sm:text-base md:text-[16.0016px] font-medium leading-tight sm:leading-[19px] text-[#C2C2C2] mb-1">Full Name</label>
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    className="w-full border-b-[0.5px] border-[#C2C2C2] pb-1 text-sm sm:text-base md:text-black bg-transparent focus:outline-none focus:border-[#6D18CE] transition-colors touch-manipulation"
                    required
                  />
                </div>

                {/* Guardian Name / Contact Person - Only for organization role */}
                {selectedRole === 'organization' && (
                  <div className="relative">
                    <label className="block text-sm sm:text-base md:text-[16.0016px] font-medium leading-tight sm:leading-[19px] text-[#C2C2C2] mb-1">
                      Contact Person
                    </label>
                    <input
                      type="text"
                      name="guardianName"
                      value={formData.guardianName}
                      onChange={handleInputChange}
                      placeholder="e.g., John Doe, HR Manager"
                      className="w-full border-b-[0.5px] border-[#C2C2C2] pb-1 text-sm sm:text-base md:text-black bg-transparent focus:outline-none focus:border-[#6D18CE] transition-colors touch-manipulation"
                      required
                    />
                  </div>
                )}

                                 {/* Class/Grade and Language - Side by side */}
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 md:gap-8 lg:gap-[378px]">
                   <div className="relative">
                     <label className="block text-sm sm:text-base md:text-[16.0016px] font-medium leading-tight sm:leading-[19px] text-[#C2C2C2] mb-1">
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
                            className="w-full border-b-[0.5px] border-[#C2C2C2] pb-1 text-sm sm:text-base md:text-black bg-transparent focus:outline-none focus:border-[#6D18CE] transition-colors appearance-none cursor-pointer pr-8 touch-manipulation"
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
                          <svg className="w-4 h-4 text-[#C2C2C2]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                            className="w-full border-b-[0.5px] border-[#C2C2C2] pb-1 text-sm sm:text-base md:text-black bg-transparent focus:outline-none focus:border-[#6D18CE] transition-colors appearance-none cursor-pointer pr-8 touch-manipulation"
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
                            className="w-full border-b-[0.5px] border-[#C2C2C2] pb-1 text-sm sm:text-base md:text-black bg-transparent focus:outline-none focus:border-[#6D18CE] transition-colors appearance-none cursor-pointer pr-8 touch-manipulation"
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
                         className="w-full border-b-[0.5px] border-[#C2C2C2] pb-1 text-sm sm:text-base md:text-black bg-transparent focus:outline-none focus:border-[#6D18CE] transition-colors touch-manipulation"
                         required
                       />
                     )}
                   </div>
                   <div className="relative">
                     <label className="block text-sm sm:text-base md:text-[16.0016px] font-medium leading-tight sm:leading-[19px] text-[#C2C2C2] mb-1">
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
                           className="w-full border-b-[0.5px] border-[#C2C2C2] pb-1 text-black bg-transparent focus:outline-none focus:border-[#6D18CE] transition-colors appearance-none cursor-pointer pr-8"
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
                           className="w-full border-b-[0.5px] border-[#C2C2C2] pb-1 text-black bg-transparent focus:outline-none focus:border-[#6D18CE] transition-colors appearance-none cursor-pointer pr-8"
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
                           className="w-full border-b-[0.5px] border-[#C2C2C2] pb-1 text-black bg-transparent focus:outline-none focus:border-[#6D18CE] transition-colors appearance-none cursor-pointer pr-8"
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
                         className="w-full border-b-[0.5px] border-[#C2C2C2] pb-1 text-sm sm:text-base md:text-black bg-transparent focus:outline-none focus:border-[#6D18CE] transition-colors touch-manipulation"
                         required
                       />
                     )}
                   </div>
                 </div>

                {/* Location - Only for student role */}
                {selectedRole === 'student' && (
                  <div className="relative">
                    <label className="block text-sm sm:text-base md:text-[16.0016px] font-medium leading-tight sm:leading-[19px] text-[#C2C2C2] mb-1">Location</label>
                    <input
                      type="text"
                      name="location"
                      value={formData.location}
                      onChange={handleInputChange}
                      className="w-full border-b-[0.5px] border-[#C2C2C2] pb-1 text-sm sm:text-base md:text-black bg-transparent focus:outline-none focus:border-[#6D18CE] transition-colors touch-manipulation"
                      required
                    />
                  </div>
                )}

                {/* Email */}
                <div className="relative">
                  <label className="block text-sm sm:text-base md:text-[16.0016px] font-medium leading-tight sm:leading-[19px] text-[#C2C2C2] mb-1">Email Address</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full border-b-[0.5px] border-[#C2C2C2] pb-1 text-sm sm:text-base md:text-black bg-transparent focus:outline-none focus:border-[#6D18CE] transition-colors touch-manipulation"
                    required
                  />
                </div>

                {/* Password */}
                <div className="relative">
                  <label className="block text-sm sm:text-base md:text-[16.0016px] font-medium leading-tight sm:leading-[19px] text-[#C2C2C2] mb-1">Password</label>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className="w-full border-b-[0.5px] border-[#C2C2C2] pb-1 text-sm sm:text-base md:text-black bg-transparent focus:outline-none focus:border-[#6D18CE] transition-colors touch-manipulation"
                    required
                  />
                </div>

                {/* Confirm Password */}
                <div className="relative">
                  <label className="block text-sm sm:text-base md:text-[16.0016px] font-medium leading-tight sm:leading-[19px] text-[#C2C2C2] mb-1">Confirm Password</label>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    className="w-full border-b-[0.5px] border-[#C2C2C2] pb-1 text-sm sm:text-base md:text-black bg-transparent focus:outline-none focus:border-[#6D18CE] transition-colors touch-manipulation"
                    required
                  />
                </div>
              </div>

              {/* Error Message */}
              <AnimatePresence>
                {error && (
                  <motion.div 
                    className="my-2 alert-error"
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
              <div className="mt-4 sm:mt-5 md:mt-6 lg:mt-8 space-y-3 sm:space-y-4">
                {/* Register Button */}
                <motion.button
                  type="submit"
                  className="w-full lg:w-[514px] h-12 sm:h-14 md:h-16 lg:h-[69px] bg-gradient-to-r from-[#6D18CE] to-[#8B5CF6] text-white rounded-full sm:rounded-[90px] font-semibold text-sm sm:text-base md:text-[16.0016px] flex items-center justify-center mx-auto shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed hover-glow touch-manipulation"
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
                  className="text-center w-full lg:w-[205px] mx-auto"
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 2.0, duration: 0.4 }}
                >
                  <span className="text-xs sm:text-[13px] leading-tight sm:leading-[16px] text-black">Already have an account? </span>
                  <Link
                    href="/login"
                    className="text-[#6D18CE] hover:text-[#5A14B0] font-semibold text-xs sm:text-[13px] transition-colors duration-200 touch-manipulation"
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