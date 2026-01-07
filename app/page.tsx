'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { TypewriterText, StaggeredText, GradientText, FloatingText } from './components/TextAnimations'
import { MagneticButton, TiltCard, RippleButton } from './components/InteractiveElements'
import { StaggerContainer, StaggerItem } from './components/PageTransitions'

export default function Home() {
  const router = useRouter()
  const [currentCard, setCurrentCard] = useState(0)
  const [showWelcome, setShowWelcome] = useState(false)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })

  useEffect(() => {
    // Show welcome modal on first visit
    const hasVisited = localStorage.getItem('hasVisited')
    if (!hasVisited) {
      setShowWelcome(true)
      localStorage.setItem('hasVisited', 'true')
      setTimeout(() => setShowWelcome(false), 3000)
    }

    // Track mouse position for interactive effects
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY })
    }

    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  const nextCard = () => {
    setCurrentCard((prev) => (prev + 1) % 4)
  }

  const prevCard = () => {
    setCurrentCard((prev) => (prev - 1 + 4) % 4)
  }

  const cards = [
    {
      title: "Welcome to the Future of Learning",
      description: "Empowering every child with personalized learning paths. Built for Bharat, made to unlock potential through smart education. Simple. Inclusive. Transformative.",
      buttonText: "Continue",
      buttonAction: nextCard,
      showBack: false,
      illustration: "learning"
    },
    {
      title: "Dynamic AI Learning Environments", 
      description: "Our intelligent system understands each learner's pace. Backed by AI, powered by diagnostics — ensuring no child is left behind. Learn in your own language, your own way.",
      buttonText: "Continue",
      buttonAction: nextCard,
      showBack: true,
      illustration: "ai"
    },
    {
      title: "Ready to Learn?",
      description: "Start your journey with just one click. Choose your role and unlock a world of learning. Let's get started!",
      buttonText: "Continue",
      buttonAction: nextCard,
      showBack: true,
      illustration: "ready"
    },
    {
      title: "Testimonials",
      description: "Embark on an exciting journey to discover how water moves through our planet! This interactive module combines stunning animations, fun experiments and engaging quizzes to help you understand the water cycle like never before.",
      buttonText: "Register",
      buttonAction: () => router.push('/register'),
      showBack: true,
      illustration: "testimonials"
    }
  ]

  return (
    <motion.main 
      className="min-h-screen flex flex-col overflow-x-hidden overflow-y-auto bg-gray-800 relative w-full"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
    >
      {/* Enhanced Interactive Background Elements */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Mouse-following gradient orbs */}
        <motion.div
          className="absolute w-48 h-48 sm:w-64 sm:h-64 md:w-80 md:h-80 lg:w-96 lg:h-96 rounded-full bg-gradient-to-r from-purple-400/20 to-pink-400/20 blur-3xl"
          animate={{
            x: mousePosition.x * 0.1 - 200,
            y: mousePosition.y * 0.1 - 200,
          }}
          transition={{ type: "spring", stiffness: 50, damping: 15 }}
        />
        <motion.div
          className="absolute w-32 h-32 sm:w-48 sm:h-48 md:w-56 md:h-56 lg:w-64 lg:h-64 rounded-full bg-gradient-to-r from-blue-400/20 to-indigo-400/20 blur-2xl"
          animate={{
            x: mousePosition.x * -0.05 + 100,
            y: mousePosition.y * -0.05 + 100,
          }}
          transition={{ type: "spring", stiffness: 30, damping: 20 }}
        />
        
        {/* Enhanced floating particles */}
        {[...Array(20)].map((_, i) => {
          // Use deterministic positioning based on index to avoid hydration mismatch
          const basePosition = (i * 137.5) % 100; // Golden ratio for better distribution
          const left = (basePosition + (i * 23.7)) % 100;
          const top = (basePosition * 1.618 + (i * 31.2)) % 100;
          
          return (
            <motion.div
              key={`particle-${i}`}
              className="absolute w-2 h-2 bg-gradient-to-r from-purple-400/40 to-pink-400/40 rounded-full"
              style={{
                left: `${left}%`,
                top: `${top}%`,
              }}
              animate={{
                y: [0, -40, 0],
                x: [0, (i % 3 - 1) * 15, 0],
                scale: [1, 1.8, 1],
                opacity: [0.2, 0.9, 0.2],
              }}
              transition={{
                duration: 4 + (i % 3) * 1.5,
                repeat: Infinity,
                ease: "easeInOut",
                delay: (i % 4) * 0.75,
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
              className="absolute w-4 h-4 bg-gradient-to-r from-blue-400/30 to-purple-400/30 rounded-full"
              style={{
                left: `${left}%`,
                top: `${top}%`,
              }}
              animate={{
                y: [0, -50, 0],
                x: [0, (i % 5 - 2) * 10, 0],
                scale: [1, 1.3, 1],
                opacity: [0.4, 0.8, 0.4],
                rotate: [0, 180, 360],
              }}
              transition={{
                duration: 6 + (i % 4) * 1.5,
                repeat: Infinity,
                ease: "easeInOut",
                delay: (i % 3) * 1.2,
              }}
            />
          );
        })}
      </div>
      {/* 🎉 Welcome Modal */}
      <AnimatePresence>
        {showWelcome && (
          <motion.div 
            className="fixed inset-0 z-50 bg-black bg-opacity-60 flex items-center justify-center p-4 sm:p-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <motion.div 
              className="bg-white bg-opacity-90 rounded-2xl sm:rounded-3xl px-4 py-3 sm:px-6 sm:py-4 md:px-8 md:py-6 text-center shadow-2xl border border-purple-300 max-w-xs sm:max-w-sm md:max-w-xl w-full mx-4"
              initial={{ scale: 0.8, y: 50, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.8, y: -50, opacity: 0 }}
              transition={{ 
                type: "spring",
                stiffness: 300,
                damping: 30,
                duration: 0.6
              }}
            >
                  <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2, duration: 0.4 }}
                  >
                    <GradientText 
                      text="🎉 Welcome to Taru!"
                      className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-extrabold mb-2"
                      colors={['#6a0dad', '#8B5CF6', '#A855F7', '#C084FC']}
                      speed={2}
                    />
                  </motion.div>
                  <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.3, duration: 0.4 }}
                  >
                    <TypewriterText
                      text="You're all set to begin your learning journey 🚀"
                      className="text-xs sm:text-sm md:text-base lg:text-lg text-gray-800 font-medium px-2"
                      delay={0.5}
                      speed={0.03}
                    />
                  </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

             {/* Top Navigation Bar */}
       <motion.div 
         className="absolute top-0 left-0 right-0 z-20 flex justify-end items-center px-3 sm:px-4 md:px-6 py-3 sm:py-4 gap-2 sm:gap-4"
         initial={{ y: -20, opacity: 0 }}
         animate={{ y: 0, opacity: 1 }}
         transition={{ delay: 0.4, duration: 0.6 }}
       >


         {/* Login Link */}
         <Link
           href="/login"
           className="text-white hover:text-blue-300 font-semibold text-sm sm:text-base md:text-lg transition-colors duration-200 bg-black/20 backdrop-blur-sm px-3 sm:px-4 py-1.5 sm:py-2 rounded-full border border-white/20 touch-manipulation"
         >
           <motion.span
             whileHover={{ scale: 1.05 }}
             whileTap={{ scale: 0.95 }}
             className="inline-block"
           >
             Sign In
           </motion.span>
         </Link>
       </motion.div>

             {/* Main Content - Full Screen Card Layout */}
               <div className="flex-1 relative overflow-hidden bg-gray-700 min-h-screen">
         <AnimatePresence mode="wait">
           <motion.div
             key={currentCard}
             className="absolute inset-0 flex items-center justify-center min-h-screen"
             initial={{ opacity: 0, x: 100 }}
             animate={{ opacity: 1, x: 0 }}
             exit={{ opacity: 0, x: -100 }}
             transition={{ duration: 0.5 }}
           >
                           {/* Main Card */}
              <motion.div 
                className="bg-white w-full h-full min-h-screen relative overflow-x-hidden overflow-y-auto flex flex-col"
                whileHover={{ scale: 1.005 }}
                transition={{ duration: 0.3 }}
              >
                                 {/* Grid Pattern - Left Bottom Corner on White Background */}
                 <div className="absolute bottom-0 left-0 w-32 h-32 sm:w-48 sm:h-48 md:w-64 md:h-64 pointer-events-none z-10">
                   
                   <svg className="absolute inset-0 w-full h-full" viewBox="0 0 256 256" fill="none" xmlns="http://www.w3.org/2000/svg">
                     <defs>
                       <pattern id="grid-left-bottom-white" x="0" y="0" width="64" height="64" patternUnits="userSpaceOnUse">
                         <path d="M 64 0 L 0 0 0 64" fill="none" stroke="rgba(0,0,0,0.1)" strokeWidth="1"/>
                       </pattern>
                     </defs>
                     <rect width="320" height="320" fill="url(#grid-left-bottom-white)" />
                   </svg>
                 </div>

                 {/* Grid Pattern - Right Top Corner on White Background */}
                 <div className="absolute top-0 right-0 w-32 h-32 sm:w-48 sm:h-48 md:w-64 md:h-64 pointer-events-none z-10">
                   
                   <svg className="absolute inset-0 w-full h-full" viewBox="0 0 256 256" fill="none" xmlns="http://www.w3.org/2000/svg">
                     <defs>
                       <pattern id="grid-right-top-white" x="0" y="0" width="64" height="64" patternUnits="userSpaceOnUse">
                         <path d="M64 0 L 0 0 0 64" fill="none" stroke="rgba(0, 0, 0, 0.25)" strokeWidth="0.5"/>
                       </pattern>
                     </defs>
                     <rect width="320" height="320" fill="url(#grid-right-top-white)" />
                   </svg>
                 </div>
              {/* Logo in Card */}
              <motion.div
                className="absolute top-3 sm:top-4 md:top-6 left-3 sm:left-4 md:left-6 rounded-full p-2 sm:p-2.5 md:p-3 z-30"
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ 
                  delay: 0.2, 
                  duration: 0.8,
                  type: "spring",
                  stiffness: 200,
                  damping: 15
                }}
                whileHover={{ 
                  scale: 1.1, 
                  rotate: 5,
                  transition: { duration: 0.3 }
                }}
              >
                <motion.div
                  animate={{ 
                    rotate: [0, 5, -5, 0],
                    scale: [1, 1.05, 1]
                  }}
                  transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                >
                  <Image 
                    src="/icons/logo.svg" 
                    alt="Logo" 
                    width={50} 
                    height={50} 
                    className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 object-contain" 
                  />
                </motion.div>
              </motion.div>

                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               {/* Content Container */}
                                   <div className="md:flex-1 md:flex md:flex-col md:items-center md:justify-center text-center p-4 sm:p-6 md:p-8 lg:p-12 xl:p-16 pb-20 sm:pb-24 md:pb-32">
                 
                  {/* Illustration Area */}
                  <motion.div 
                    className="mb-[5px] md:mb-4 lg:mb-6 relative w-full min-h-[200px] sm:min-h-[300px] md:min-h-[400px]"
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.3, duration: 0.5 }}
                  >
                    {cards[currentCard].illustration === "learning" && (
                      <>
                        {/* Mobile Layout - Only Teacher Image (screens < md) */}
                        <div className="md:hidden absolute top-[65px] sm:top-[81px] left-1/2 transform -translate-x-1/2 pointer-events-none">
                          <Image 
                            src="/teacher_landing.png" 
                            alt="Teacher" 
                            width={400} 
                            height={400} 
                            className="w-48 h-48 sm:w-56 sm:h-56 object-contain"
                          />
                        </div>

                        {/* Desktop Layout - All Images (md and larger) */}
                        <div className="hidden md:block absolute inset-0 pointer-events-none overflow-hidden">
                          {/* Top Left - AI Logo */}
                          <div className="absolute top-8 md:top-16 lg:top-20 left-8 md:left-8 lg:left-16 xl:left-24">
                            <Image 
                              src="/ai_landing.png" 
                              alt="AI Logo" 
                              width={142} 
                              height={142} 
                              className="w-24 h-24 lg:w-32 lg:h-32 xl:w-[142px] xl:h-[142px] object-contain"
                            />
                          </div>
                          
                          {/* Top Right - Computer Monitor */}
                          <div className="absolute top-8 md:top-16 lg:top-20 right-8 md:right-8 lg:right-16 xl:right-24">
                            <Image 
                              src="/comcap_landing.png" 
                              alt="Computer Monitor" 
                              width={164} 
                              height={164} 
                              className="w-24 h-24 lg:w-32 lg:h-32 xl:w-[164px] xl:h-[164px] object-contain transform rotate-[8.37deg]"
                            />
                          </div>
                          
                          {/* Center - Teacher/Presentation */}
                          <div className="absolute top-1/4 md:top-8 lg:top-12 xl:top-16 left-1/2 transform -translate-x-1/2">
                            <Image 
                              src="/teacher_landing.png" 
                              alt="Teacher" 
                              width={400} 
                              height={400}
                              className="sm:w-80 sm:h-80 w-56 h-56 lg:w-72 lg:h-72 xl:w-80 xl:h-80 2xl:w-[400px] 2xl:h-[400px] object-contain"
                            />
                          </div>
                          
                          {/* Bottom Left - Graduation Cap and Diploma */}
                          <div className="absolute bottom-4 md:bottom-8 lg:bottom-12 xl:bottom-16 left-8 md:left-8 lg:left-16 xl:left-24">
                            <Image 
                              src="/cap_landing.png" 
                              alt="Graduation Cap and Diploma" 
                              width={196} 
                              height={196} 
                              className="w-32 h-32 lg:w-40 lg:h-40 xl:w-48 xl:h-48 2xl:w-[196px] 2xl:h-[196px] object-contain"
                            />
                          </div>
                          
                          {/* Bottom Right - Robot Teaching */}
                          <div className="absolute bottom-8 md:bottom-16 lg:bottom-20 xl:bottom-24 right-8 md:right-8 lg:right-16 xl:right-24">
                            <Image 
                              src="/robo_landing.png" 
                              alt="Robot Teaching" 
                              width={158} 
                              height={158} 
                              className="w-24 h-24 lg:w-32 lg:h-32 xl:w-40 xl:h-40 2xl:w-[158px] 2xl:h-[158px] object-contain transform -rotate-[9.6deg]"
                            />
                          </div>
                        </div>
                      </>
                    )}
                  
                                     {cards[currentCard].illustration === "ai" && (
                     <div className="absolute inset-0 pointer-events-none overflow-hidden">
                       {/* Top Left - Books */}
                       <div className="absolute top-8 sm:top-12 md:top-16 lg:top-20 left-2 sm:left-4 md:left-8 lg:left-16 xl:left-24">
                         <Image 
                           src="/book_landing.png" 
                           alt="Books" 
                           width={180} 
                           height={180} 
                           className="w-20 h-20 sm:w-24 sm:h-24 md:w-32 md:h-32 lg:w-40 lg:h-40 xl:w-48 xl:h-48 2xl:w-[180px] 2xl:h-[180px] object-contain"
                         />
                       </div>
                       
                                               {/* Top Right - Robot Star */}
                        <div className="absolute top-8 sm:top-12 md:top-16 lg:top-20 right-2 sm:right-4 md:right-8 lg:right-16 xl:right-24">
                          <Image 
                            src="/robot_star_landing.png" 
                            alt="Robot Star" 
                            width={180} 
                            height={180} 
                            className="w-20 h-20 sm:w-24 sm:h-24 md:w-32 md:h-32 lg:w-40 lg:h-40 xl:w-48 xl:h-48 2xl:w-[180px] 2xl:h-[180px] object-contain transform rotate-[8.37deg]"
                          />
                        </div>
                       
                       {/* Center - Robot Class */}
                       <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                         <Image 
                           src="/robo_class_landing.png" 
                           alt="Robot Class" 
                           width={300} 
                           height={300} 
                           className="w-32 h-32 sm:w-40 sm:h-40 md:w-56 md:h-56 lg:w-64 lg:h-64 xl:w-72 xl:h-72 2xl:w-[300px] 2xl:h-[300px] object-contain"
                         />
                       </div>
                       
                       {/* Bottom Right - Bulb Books */}
                       <div className="absolute bottom-8 sm:bottom-12 md:bottom-16 lg:bottom-20 xl:bottom-24 right-2 sm:right-4 md:right-8 lg:right-16 xl:right-24">
                         <Image 
                           src="/bulbook_landing.png" 
                           alt="Bulb Books" 
                           width={180} 
                           height={180} 
                           className="w-20 h-20 sm:w-24 sm:h-24 md:w-32 md:h-32 lg:w-40 lg:h-40 xl:w-48 xl:h-48 2xl:w-[180px] 2xl:h-[180px] object-contain transform -rotate-[9.6deg]"
                         />
                       </div>
                     </div>
                   )}
                  
                                                                                                                                                       {cards[currentCard].illustration === "ready" && (
                       <div className="absolute inset-0 pointer-events-none overflow-hidden">
                         {/* Left Center - Computer */}
                         <div className="absolute top-1/2 left-2 sm:left-4 md:left-8 lg:left-16 xl:left-24 transform -translate-y-1/2">
                           <Image 
                             src="/landing3_comp.png" 
                             alt="Computer" 
                             width={180} 
                             height={180} 
                             className="w-20 h-20 sm:w-24 sm:h-24 md:w-32 md:h-32 lg:w-40 lg:h-40 xl:w-48 xl:h-48 2xl:w-[180px] 2xl:h-[180px] object-contain"
                           />
                         </div>
                         
                         {/* Top Right - TV/Monitor */}
                         <div className="absolute top-8 sm:top-12 md:top-16 lg:top-20 right-2 sm:right-4 md:right-8 lg:right-16 xl:right-24">
                           <Image 
                             src="/landing3_tv.png" 
                             alt="TV/Monitor" 
                             width={180} 
                             height={180} 
                             className="w-20 h-20 sm:w-24 sm:h-24 md:w-32 md:h-32 lg:w-40 lg:h-40 xl:w-48 xl:h-48 2xl:w-[180px] 2xl:h-[180px] object-contain transform rotate-[8.37deg]"
                           />
                         </div>
                         
                         {/* Center - Man with Laptop */}
                         <div className="absolute top-4 sm:top-6 md:top-8 lg:top-12 xl:top-16 left-1/2 transform -translate-x-1/2">
                           <Image 
                             src="/landing3_man.png" 
                             alt="Man with Laptop" 
                             width={300} 
                             height={300} 
                             className="w-32 h-32 sm:w-40 sm:h-40 md:w-56 md:h-56 lg:w-64 lg:h-64 xl:w-72 xl:h-72 2xl:w-[300px] 2xl:h-[300px] object-contain"
                           />
                         </div>
                         
                         {/* Bottom Right - Kid with Laptop */}
                         <div className="absolute bottom-8 sm:bottom-12 md:bottom-16 lg:bottom-20 xl:bottom-24 right-2 sm:right-4 md:right-8 lg:right-16 xl:right-24">
                           <Image 
                             src="/landing3_kid.png" 
                             alt="Kid with Laptop" 
                             width={180} 
                             height={180} 
                             className="w-20 h-20 sm:w-24 sm:h-24 md:w-32 md:h-32 lg:w-40 lg:h-40 xl:w-48 xl:h-48 2xl:w-[180px] 2xl:h-[180px] object-contain transform -rotate-[9.6deg]"
                           />
                         </div>
                                               </div>
                      )}
                      
                      {cards[currentCard].illustration === "testimonials" && (
                        <div className="absolute inset-0 pointer-events-none overflow-hidden">
                          {/* Top Right - Bell */}
                          <div className="absolute top-4 sm:top-6 md:top-8 lg:top-12 xl:top-16 right-2 sm:right-4 md:right-8 lg:right-12 xl:right-20 z-20">
                            <Image 
                              src="/landing4_bell.png" 
                              alt="Bell" 
                              width={120} 
                              height={120} 
                              className="w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 lg:w-24 lg:h-24 xl:w-[120px] xl:h-[120px] object-contain" 
                            />
                          </div>
                          
                          {/* Center Above Text - Center Icon */}
                          <div className="absolute left-1/2 top-2 sm:top-4 md:top-6 lg:top-8 xl:top-10 transform -translate-x-1/2 z-20">
                            <Image 
                              src="/landing4_center.png" 
                              alt="Center Icon" 
                              width={500} 
                              height={500} 
                              className="w-32 h-32 sm:w-40 sm:h-40 md:w-56 md:h-56 lg:w-72 lg:h-72 xl:w-96 xl:h-96 2xl:w-[500px] 2xl:h-[500px] object-contain" 
                            />
                          </div>
                          
                          {/* Bottom Left - Message Icon */}
                          <div className="absolute bottom-4 sm:bottom-6 md:bottom-8 lg:bottom-12 xl:bottom-16 left-2 sm:left-4 md:left-8 lg:left-12 xl:left-20 z-20">
                            <Image 
                              src="/landing4_msg.png" 
                              alt="Message Icon" 
                              width={200} 
                              height={200} 
                              className="w-16 h-16 sm:w-20 sm:h-20 md:w-28 md:h-28 lg:w-36 lg:h-36 xl:w-48 xl:h-48 2xl:w-[200px] 2xl:h-[200px] object-contain" 
                            />
                          </div>
                          
                          {/* Below Text Center - Avishkar Icon */}
                          <div className="absolute left-1/2 bottom-4 sm:bottom-6 md:bottom-8 lg:bottom-12 xl:bottom-20 transform -translate-x-1/2 z-20">
                            <Image 
                              src="/landing4_avishkar.png" 
                              alt="Avishkar" 
                              width={160} 
                              height={160} 
                              className="w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 lg:w-28 lg:h-28 xl:w-40 xl:h-40 2xl:w-[160px] 2xl:h-[160px] object-contain" 
                            />
                          </div>
                        </div>
                      )}
                 </motion.div>

                 {/* Title with Advanced Animations */}
                 <motion.div
                   className="mt-4 sm:mt-6 mb-2 sm:mb-3 md:mb-4 px-2 sm:px-4"
                   initial={{ y: 20, opacity: 0 }}
                   animate={{ y: 0, opacity: 1 }}
                   transition={{ delay: 0.4, duration: 0.5 }}
                 >
                 {currentCard === 0 && (
                   <StaggeredText
                     text="Welcome to the Future of Learning"
                     className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl 2xl:text-7xl font-black text-gray-900 tracking-wide leading-tight"
                     delay={0.2}
                     staggerDelay={0.08}
                     animationType="fadeUp"
                   />
                 )}
                 {currentCard === 1 && (
                   <div className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl 2xl:text-7xl font-black tracking-wide leading-tight">
                     <span className="text-black">Dynamic </span>
                     <GradientText
                       text="AI"
                       className="text-blue-600"
                       colors={['#2563eb', '#3b82f6', '#60a5fa']}
                       speed={1.5}
                     />
                     <FloatingText
                       text=" Learning Environments"
                       className="text-black"
                       intensity={3}
                     />
                   </div>
                 )}
                 {currentCard === 2 && (
                   <StaggeredText
                     text="Ready to Learn?"
                     className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl 2xl:text-7xl font-black text-gray-900 tracking-wide leading-tight"
                     delay={0.1}
                     staggerDelay={0.1}
                     animationType="scale"
                   />
                 )}
                 {currentCard === 3 && (
                   <GradientText
                     text="Success Stories"
                     className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl 2xl:text-7xl font-black tracking-wide leading-tight"
                     colors={['#059669', '#10b981', '#34d399', '#6ee7b7']}
                     speed={2}
                   />
                 )}
               </motion.div>

                 {/* Description with Typewriter Effect */}
                 <motion.div 
                   className="text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl text-gray-700 mb-3 sm:mb-4 md:mb-5 lg:mb-6 leading-relaxed max-w-xs sm:max-w-md md:max-w-2xl lg:max-w-3xl xl:max-w-4xl pl-8 pr-4 sm:px-6"
                   initial={{ y: 20, opacity: 0 }}
                   animate={{ y: 0, opacity: 1 }}
                   transition={{ delay: 0.5, duration: 0.5 }}
                 >
                  <TypewriterText
                    text={cards[currentCard].description}
                    delay={0.8}
                    speed={0.02}
                    cursor={false}
                  />
                </motion.div>

                {/* Enhanced Interactive Buttons */}
                <StaggerContainer 
                  className="flex gap-3 sm:gap-4 md:gap-6 justify-center flex-wrap px-4"
                  staggerDelay={0.1}
                  initialDelay={0.6}
                >
                  {cards[currentCard].showBack && (
                    <StaggerItem>
                      <MagneticButton
                        onClick={prevCard}
                        className="px-6 sm:px-8 md:px-10 py-3 sm:py-4 md:py-5 bg-gradient-to-r from-gray-100 to-gray-200 border-2 border-gray-300 text-gray-700 rounded-full font-semibold hover:shadow-lg transition-all duration-300 text-sm sm:text-base md:text-lg lg:text-xl touch-manipulation min-w-[100px] sm:min-w-[120px]"
                        magnetStrength={0.2}
                      >
                        Back
                      </MagneticButton>
                    </StaggerItem>
                  )}
                  
                  <StaggerItem>
                    <RippleButton
                      onClick={cards[currentCard].buttonAction}
                      className="px-6 sm:px-8 md:px-10 py-3 sm:py-4 md:py-5 bg-gradient-to-r from-black to-gray-800 text-white rounded-full font-semibold hover:shadow-xl transition-all duration-300 text-sm sm:text-base md:text-lg lg:text-xl relative overflow-hidden touch-manipulation min-w-[120px] sm:min-w-[140px]"
                      rippleColor="rgba(255, 255, 255, 0.3)"
                    >
                      <span className="relative z-10">{cards[currentCard].buttonText}</span>
                    </RippleButton>
                  </StaggerItem>
                </StaggerContainer>

                {/* Card Indicators */}
                <motion.div 
                  className="flex gap-2 sm:gap-3 justify-center mt-6 sm:mt-8 mb-4 sm:mb-6"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.7, duration: 0.5 }}
                >
                  {[0, 1, 2, 3].map((index) => (
                    <motion.button
                      key={index}
                      onClick={() => setCurrentCard(index)}
                      className={`w-2 h-2 sm:w-3 sm:h-3 md:w-4 md:h-4 rounded-full transition-all duration-300 touch-manipulation ${
                        currentCard === index ? 'bg-blue-600 scale-125' : 'bg-gray-300'
                      }`}
                      whileHover={{ scale: 1.2 }}
                      whileTap={{ scale: 0.9 }}
                      aria-label={`Go to slide ${index + 1}`}
                    />
                  ))}
                </motion.div>
              </div>

               {/* Google Translate - Bottom Left */}
               <motion.div 
                 className="absolute bottom-3 sm:bottom-4 md:bottom-6 left-3 sm:left-4 md:left-6 z-30"
                 initial={{ opacity: 0, x: -20 }}
                 animate={{ opacity: 1, x: 0 }}
                 transition={{ delay: 0.8, duration: 0.5 }}
               >
                 <div className="bg-white/90 backdrop-blur-sm border border-gray-200 rounded-lg px-2 sm:px-3 py-1.5 sm:py-2 shadow-lg">
                 </div>
               </motion.div>              
            </motion.div>
          </motion.div>
        </AnimatePresence>
      </div>
    </motion.main>
  )
}
