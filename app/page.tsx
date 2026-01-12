'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { ScrollFade } from './components/ScrollAnimations'

export default function Home() {
  const router = useRouter()
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  useEffect(() => {
    // Scroll animations on mount
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -100px 0px'
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate-fade-in')
        }
      })
    }, observerOptions)

    const elements = document.querySelectorAll('[data-animate]')
    elements.forEach((el) => observer.observe(el))

    return () => {
      elements.forEach((el) => observer.unobserve(el))
    }
  }, [])

  return (
    <div className="min-h-screen bg-white">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200">
        <div className="max-w-[1680px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <Link href="/" className="flex items-center">
              <Image 
                src="/webflow-images/taru-logo-final-1.png" 
                alt="Taru Logo" 
                width={120} 
                height={40}
                className="h-8 w-auto"
                priority
              />
            </Link>
            
            {/* Desktop Menu */}
            <div className="hidden md:flex items-center gap-8">
              <Link href="/about-us" className="text-gray-900 hover:text-purple-600 transition-colors font-medium">
                About Us
              </Link>
              <Link href="/pricing" className="text-gray-900 hover:text-purple-600 transition-colors font-medium">
                Pricing
              </Link>
              <Link href="/contact" className="text-gray-900 hover:text-purple-600 transition-colors font-medium">
                Contact Us
              </Link>
              <div className="flex items-center gap-4 ml-4">
                <Link 
                  href="/login"
                  className="px-6 py-2 text-gray-900 border border-gray-900 rounded-full hover:bg-gray-900 hover:text-white transition-all font-medium"
                >
                  Login
                </Link>
                <Link 
                  href="/register"
                  className="px-6 py-2 bg-gray-900 text-white rounded-full hover:bg-purple-600 transition-all font-medium"
                >
                  Register
                </Link>
              </div>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2"
              aria-label="Toggle menu"
            >
              <div className="w-6 h-6 flex flex-col justify-center gap-1.5">
                <span className={`block h-0.5 bg-gray-900 transition-all ${isMenuOpen ? 'rotate-45 translate-y-2' : ''}`}></span>
                <span className={`block h-0.5 bg-gray-900 transition-all ${isMenuOpen ? 'opacity-0' : ''}`}></span>
                <span className={`block h-0.5 bg-gray-900 transition-all ${isMenuOpen ? '-rotate-45 -translate-y-2' : ''}`}></span>
              </div>
            </button>
          </div>

          {/* Mobile Menu */}
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden pb-4 border-t border-gray-200"
            >
              <div className="flex flex-col gap-4 pt-4">
                <Link href="/about-us" className="text-gray-900 hover:text-purple-600 transition-colors font-medium">
                  About Us
                </Link>
                <Link href="/pricing" className="text-gray-900 hover:text-purple-600 transition-colors font-medium">
                  Pricing
                </Link>
                <Link href="/contact" className="text-gray-900 hover:text-purple-600 transition-colors font-medium">
                  Contact Us
                </Link>
                <div className="flex flex-col gap-2 pt-2">
                  <Link 
                    href="/login"
                    className="px-6 py-2 text-center text-gray-900 border border-gray-900 rounded-full hover:bg-gray-900 hover:text-white transition-all font-medium"
                  >
                    Login
                  </Link>
                  <Link 
                    href="/register"
                    className="px-6 py-2 text-center bg-gray-900 text-white rounded-full hover:bg-purple-600 transition-all font-medium"
                  >
                    Register
                  </Link>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <header className="pt-20 bg-gradient-to-b from-purple-50 to-white">
        <div className="max-w-[1680px] mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
          <div className="text-center mb-12">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 max-w-4xl mx-auto leading-tight"
            >
              The Future of Learning, Structured by AI
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto"
            >
              Students across India have big dreams, but many lose direction due to biased or unclear guidance.
            </motion.p>
          </div>

          {/* Hero Image */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="relative w-full max-w-6xl mx-auto"
          >
            <Image
              src="/webflow-images/1.png"
              alt="Hero Image"
              width={1828}
              height={800}
              className="w-full h-auto rounded-lg"
              priority
            />
          </motion.div>

          {/* Problem Cards */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12 max-w-5xl mx-auto"
          >
            {[
              {
                title: 'Misdirected Potential',
                description: 'Many students enter careers they never wanted due to poor awareness and late guidance.'
              },
              {
                title: 'Scattered AI Confusion',
                description: 'Unfocused AI use creates confusion and shortcuts instead of real learning.'
              },
              {
                title: 'Unstructured Ambitions',
                description: 'Big goals fail without clear structure and disciplined preparation.'
              }
            ].map((item, index) => (
              <div
                key={index}
                className="bg-white p-6 rounded-lg shadow-md border border-gray-100 hover:shadow-lg transition-shadow"
              >
                <Image
                  src="/webflow-images/Vector-11414.png"
                  alt=""
                  width={24}
                  height={24}
                  className="mb-4"
                />
                <h3 className="text-xl font-bold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-gray-600">{item.description}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </header>

      {/* Value Proposition */}
      <section className="py-16 lg:py-24 bg-white">
        <div className="max-w-[1680px] mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            data-animate
            className="text-center max-w-4xl mx-auto"
          >
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 leading-tight">
              Taru turns AI into a trusted guide,{' '}
              <span className="text-purple-600">shaping ambition into clear, future-ready learning and career paths.</span>
            </h2>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 lg:py-24 bg-gray-50">
        <div className="max-w-[1680px] mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <motion.div
            data-animate
            className="text-center mb-16"
          >
            <Image
              src="/webflow-images/Group-2147224520.png"
              alt=""
              width={80}
              height={80}
              className="mx-auto mb-6"
            />
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900">
              AI-Driven Learning with Purpose
            </h2>
          </motion.div>

          {/* Feature Cards */}
          <div className="space-y-24">
            {/* Career Roadmaps */}
            <ScrollFade>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                <div>
                  <Image
                    src="/webflow-images/Group-2147224526.png"
                    alt=""
                    width={60}
                    height={60}
                    className="mb-6"
                  />
                  <h3 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
                    Career Roadmaps
                  </h3>
                  <p className="text-lg text-gray-600 leading-relaxed">
                    AI designs personalized journeys from schooling to professional readiness, creating clear pathways for every student's unique aspirations.
                  </p>
                </div>
                <div className="relative">
                  <Image
                    src="/webflow-images/4.png"
                    alt="Career Roadmaps"
                    width={1613}
                    height={1000}
                    className="w-full h-auto rounded-lg shadow-lg"
                  />
                </div>
              </div>
            </ScrollFade>

            {/* Skill Assessments */}
            <ScrollFade>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                <div className="lg:order-2">
                  <Image
                    src="/webflow-images/Group-2147224526.png"
                    alt=""
                    width={60}
                    height={60}
                    className="mb-6"
                  />
                  <h3 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
                    Skill Assessments
                  </h3>
                  <p className="text-lg text-gray-600 leading-relaxed">
                    Comprehensive evaluations identify strengths, weaknesses, and the right next steps for meaningful academic and career progression.
                  </p>
                </div>
                <div className="lg:order-1 relative">
                  <Image
                    src="/webflow-images/7.png"
                    alt="Skill Assessments"
                    width={2304}
                    height={1500}
                    className="w-full h-auto rounded-lg shadow-lg"
                  />
                </div>
              </div>
            </ScrollFade>

            {/* Multilingual Support */}
            <ScrollFade>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center bg-purple-600 rounded-2xl p-8 lg:p-12">
                <div>
                  <Image
                    src="/webflow-images/Group-2147224526.png"
                    alt=""
                    width={60}
                    height={60}
                    className="mb-6 brightness-0 invert"
                  />
                  <h3 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                    Multilingual Support
                  </h3>
                  <p className="text-lg text-purple-100 leading-relaxed">
                    Accessible in English and regional languages across India, ensuring no student is left behind due to language barriers.
                  </p>
                </div>
                <div className="relative">
                  <Image
                    src="/webflow-images/9.png"
                    alt="Multilingual Support"
                    width={1613}
                    height={1000}
                    className="w-full h-auto rounded-lg shadow-lg"
                  />
                </div>
              </div>
            </ScrollFade>

            {/* Guided Learning Journeys */}
            <ScrollFade>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                <div className="lg:order-2">
                  <Image
                    src="/webflow-images/Group-2147224526.png"
                    alt=""
                    width={60}
                    height={60}
                    className="mb-6"
                  />
                  <h3 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
                    Guided Learning Journeys
                  </h3>
                  <p className="text-lg text-gray-600 leading-relaxed">
                    Learning is structured through proven methods, delivered via one intuitive platform for students, parents, and institutions.
                  </p>
                </div>
                <div className="lg:order-1 relative">
                  <Image
                    src="/webflow-images/6.png"
                    alt="Guided Learning Journeys"
                    width={2304}
                    height={1500}
                    className="w-full h-auto rounded-lg shadow-lg"
                  />
                </div>
              </div>
            </ScrollFade>
          </div>
        </div>
      </section>

      {/* What Makes Taru Unique */}
      <section className="py-16 lg:py-24 bg-white">
        <div className="max-w-[1680px] mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            data-animate
            className="text-center mb-16"
          >
            <h3 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900">
              What Makes Taru Unique
            </h3>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                number: '01',
                title: 'Structured Over Scattered',
                description: 'AI guidance organized into logical, progressive steps rather than random suggestions that confuse and overwhelm students seeking direction.',
                image: '/webflow-images/image-104925.png'
              },
              {
                number: '02',
                title: 'Career-First Philosophy',
                description: 'Every feature strategically aligns learning with real-world outcomes, ensuring students develop skills employers actually need and value.',
                image: '/webflow-images/image-104926.png'
              },
              {
                number: '03',
                title: 'Inclusive Design',
                description: 'Multilingual, affordable, and accessible for urban and rural learners alike, breaking down traditional barriers to quality education.',
                image: '/webflow-images/image-104927.png'
              },
              {
                number: '04',
                title: 'Ethical AI',
                description: 'Encourages genuine growth and learning rather than shortcuts or dependency, building students\' confidence and capabilities.',
                image: '/webflow-images/image-104929.png'
              },
              {
                number: '05',
                title: 'Scalable Ecosystem',
                description: 'Flexible platform designed to partner seamlessly with schools, NGOs, and existing education platforms for maximum reach and impact.',
                image: '/webflow-images/image-104928.png'
              },
              {
                number: '',
                title: 'Taru stands apart as the bridge between aspirations and achievement in the AI era.',
                description: '',
                image: '/webflow-images/Group-2147224522.png',
                isLast: true
              }
            ].map((item, index) => (
              <ScrollFade key={index}>
                <div className={`p-8 rounded-lg ${item.isLast ? 'bg-purple-600 text-white' : 'bg-gray-50 hover:shadow-lg transition-shadow'}`}>
                  {item.number && (
                    <h4 className="text-5xl font-bold mb-4 text-purple-600">{item.number}</h4>
                  )}
                  <h4 className={`text-xl font-bold mb-4 ${item.isLast ? 'text-white' : 'text-gray-900'}`}>
                    {item.title}
                  </h4>
                  {item.description && (
                    <p className={`mb-6 ${item.isLast ? 'text-purple-100' : 'text-gray-600'}`}>
                      {item.description}
                    </p>
                  )}
                  <div className="relative h-48">
                    <Image
                      src={item.image}
                      alt={item.title}
                      fill
                      className="object-contain"
                    />
                  </div>
                </div>
              </ScrollFade>
            ))}
          </div>
        </div>
      </section>

      {/* Pathways for Growth */}
      <section className="py-16 lg:py-24 bg-gray-50">
        <div className="max-w-[1680px] mx-auto px-4 sm:px-6 lg:px-8">
          <ScrollFade>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div className="relative h-96 lg:h-[500px]">
                <Image
                  src="/webflow-images/Gemini_Generated_Image_253ng6253ng6253n.png"
                  alt="Pathways for Growth"
                  fill
                  className="object-cover rounded-lg"
                />
              </div>
              <div>
                <h3 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
                  Pathways for Growth
                </h3>
                <p className="text-lg text-gray-600 mb-8">
                  Flexible opportunities to scale impact and expand access to structured, ethical learning.
                </p>
                <div className="space-y-6 mb-8">
                  <div className="flex gap-4">
                    <Image
                      src="/webflow-images/Vector-11414.png"
                      alt=""
                      width={24}
                      height={24}
                      className="flex-shrink-0"
                    />
                    <div>
                      <h4 className="text-xl font-bold text-gray-900 mb-2">Investment Path</h4>
                      <p className="text-gray-600">Support full-scale platform growth and nationwide student reach.</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <Image
                      src="/webflow-images/Vector-11414.png"
                      alt=""
                      width={24}
                      height={24}
                      className="flex-shrink-0"
                    />
                    <div>
                      <h4 className="text-xl font-bold text-gray-900 mb-2">Acquisition Path</h4>
                      <p className="text-gray-600">Integrate Taru's platform into an existing education ecosystem.</p>
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="text-2xl font-bold text-gray-900 mb-3">First-Mover Advantage</h4>
                  <p className="text-gray-600">
                    Each pathway enables early leadership in AI-driven structured learning, designed specifically for India's diverse educational needs and cultural realities.
                  </p>
                </div>
              </div>
            </div>
          </ScrollFade>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-16">
        <div className="max-w-[1680px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
            {/* Logo */}
            <div>
              <Image
                src="/webflow-images/taru-logo-final-1.png"
                alt="Taru Logo"
                width={120}
                height={40}
                className="h-8 w-auto mb-6 brightness-0 invert"
              />
            </div>

            {/* Quick Links */}
            <div>
              <h5 className="font-semibold mb-4">Quick Links</h5>
              <ul className="space-y-2">
                <li><Link href="/about-us" className="text-gray-400 hover:text-white transition-colors">About us</Link></li>
                <li><Link href="/pricing" className="text-gray-400 hover:text-white transition-colors">Pricing</Link></li>
                <li><Link href="/contact" className="text-gray-400 hover:text-white transition-colors">Contact Us</Link></li>
                <li><Link href="/login" className="text-gray-400 hover:text-white transition-colors">Login</Link></li>
                <li><Link href="/register" className="text-gray-400 hover:text-white transition-colors">Register</Link></li>
                <li><Link href="/terms-and-conditions" className="text-gray-400 hover:text-white transition-colors">Terms and Conditions</Link></li>
                <li><Link href="/privacy-policy" className="text-gray-400 hover:text-white transition-colors">Privacy Policy</Link></li>
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h5 className="font-semibold mb-4">Contact</h5>
              <ul className="space-y-2">
                <li><a href="tel:+911234567890" className="text-gray-400 hover:text-white transition-colors">+91 1234567890</a></li>
                <li><a href="mailto:support@taru.live" className="text-gray-400 hover:text-white transition-colors">support@taru.live</a></li>
                <li className="text-gray-400">Pune, Maharashtra,<br />India</li>
              </ul>
            </div>

            {/* Social Links */}
            <div>
              <h5 className="font-semibold mb-4">Follow us</h5>
              <div className="flex flex-col gap-3">
                <a href="https://www.facebook.com/livetaru" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M22 12.0611C22 6.50451 17.5229 2 12 2C6.47715 2 2 6.50451 2 12.0611C2 17.0828 5.65684 21.2452 10.4375 22V14.9694H7.89844V12.0611H10.4375V9.84452C10.4375 7.32296 11.9305 5.93012 14.2146 5.93012C15.3088 5.93012 16.4531 6.12663 16.4531 6.12663V8.60261H15.1922C13.95 8.60261 13.5625 9.37822 13.5625 10.1739V12.0611H16.3359L15.8926 14.9694H13.5625V22C18.3432 21.2452 22 17.083 22 12.0611Z" />
                  </svg>
                  <span>Facebook</span>
                </a>
                <a href="https://www.instagram.com/taru.live_ai/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path fillRule="evenodd" clipRule="evenodd" d="M16 3H8C5.23858 3 3 5.23858 3 8V16C3 18.7614 5.23858 21 8 21H16C18.7614 21 21 18.7614 21 16V8C21 5.23858 18.7614 3 16 3ZM19.25 16C19.2445 17.7926 17.7926 19.2445 16 19.25H8C6.20735 19.2445 4.75549 17.7926 4.75 16V8C4.75549 6.20735 6.20735 4.75549 8 4.75H16C17.7926 4.75549 19.2445 6.20735 19.25 8V16ZM16.75 8.25C17.3023 8.25 17.75 7.80228 17.75 7.25C17.75 6.69772 17.3023 6.25 16.75 6.25C16.1977 6.25 15.75 6.69772 15.75 7.25C15.75 7.80228 16.1977 8.25 16.75 8.25ZM12 7.5C9.51472 7.5 7.5 9.51472 7.5 12C7.5 14.4853 9.51472 16.5 12 16.5C14.4853 16.5 16.5 14.4853 16.5 12C16.5027 10.8057 16.0294 9.65957 15.1849 8.81508C14.3404 7.97059 13.1943 7.49734 12 7.5ZM9.25 12C9.25 13.5188 10.4812 14.75 12 14.75C13.5188 14.75 14.75 13.5188 14.75 12C14.75 10.4812 13.5188 9.25 12 9.25C10.4812 9.25 9.25 10.4812 9.25 12Z" />
                  </svg>
                  <span>Instagram</span>
                </a>
                <a href="https://twitter.com/home" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.1761 4H19.9362L13.9061 10.7774L21 20H15.4456L11.0951 14.4066L6.11723 20H3.35544L9.80517 12.7508L3 4H8.69545L12.6279 9.11262L17.1761 4ZM16.2073 18.3754H17.7368L7.86441 5.53928H6.2232L16.2073 18.3754Z" />
                  </svg>
                  <span>X</span>
                </a>
                <a href="https://www.linkedin.com/showcase/taru-ai" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path fillRule="evenodd" clipRule="evenodd" d="M4.5 3C3.67157 3 3 3.67157 3 4.5V19.5C3 20.3284 3.67157 21 4.5 21H19.5C20.3284 21 21 20.3284 21 19.5V4.5C21 3.67157 20.3284 3 19.5 3H4.5ZM8.52076 7.00272C8.52639 7.95897 7.81061 8.54819 6.96123 8.54397C6.16107 8.53975 5.46357 7.90272 5.46779 7.00413C5.47201 6.15897 6.13998 5.47975 7.00764 5.49944C7.88795 5.51913 8.52639 6.1646 8.52076 7.00272ZM12.2797 9.76176H9.75971H9.7583V18.3216H12.4217V18.1219C12.4217 17.742 12.4214 17.362 12.4211 16.9819V16.9818V16.9816V16.9815V16.9812C12.4203 15.9674 12.4194 14.9532 12.4246 13.9397C12.426 13.6936 12.4372 13.4377 12.5005 13.2028C12.7381 12.3253 13.5271 11.7586 14.4074 11.8979C14.9727 11.9864 15.3467 12.3141 15.5042 12.8471C15.6013 13.1803 15.6449 13.5389 15.6491 13.8863C15.6605 14.9339 15.6589 15.9815 15.6573 17.0292V17.0294C15.6567 17.3992 15.6561 17.769 15.6561 18.1388V18.3202H18.328V18.1149C18.328 17.6629 18.3278 17.211 18.3275 16.7591V16.759V16.7588C18.327 15.6293 18.3264 14.5001 18.3294 13.3702C18.3308 12.8597 18.276 12.3563 18.1508 11.8627C17.9638 11.1286 17.5771 10.5211 16.9485 10.0824C16.5027 9.77019 16.0133 9.5691 15.4663 9.5466C15.404 9.54401 15.3412 9.54062 15.2781 9.53721L15.2781 9.53721L15.2781 9.53721C14.9984 9.52209 14.7141 9.50673 14.4467 9.56066C13.6817 9.71394 13.0096 10.0641 12.5019 10.6814C12.4429 10.7522 12.3852 10.8241 12.2991 10.9314L12.2991 10.9315L12.2797 10.9557V9.76176ZM5.68164 18.3244H8.33242V9.76733H5.68164V18.3244Z" />
                  </svg>
                  <span>LinkedIn</span>
                </a>
              </div>
            </div>
          </div>

          {/* Footer Bottom */}
          <div className="border-t border-gray-800 pt-8 mt-8">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <p className="text-gray-400 text-sm">
                © 2026 Taru - <Link href="/terms-and-conditions" className="hover:text-white transition-colors">Terms & Conditions</Link>
              </p>
              <a href="https://www.utcons.com" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors text-sm">
                Powered by <span className="font-semibold">UTCONS</span>
              </a>
            </div>
          </div>
        </div>
      </footer>

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        [data-animate].animate-fade-in {
          animation: fade-in 0.6s ease-out forwards;
        }
      `}</style>
    </div>
  )
}
