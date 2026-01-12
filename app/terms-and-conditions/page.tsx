'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { ScrollFade } from '../components/ScrollAnimations'

export default function TermsAndConditions() {
  const router = useRouter()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [showScrollTop, setShowScrollTop] = useState(false)

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

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

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
      <header className="pt-40 pb-12 bg-gradient-to-b from-purple-50 to-white mt-20">
        <div className="max-w-[1680px] mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-4xl mx-auto"
          >
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold text-gray-900 mb-3 leading-tight tracking-tight">
              Terms and Conditions
            </h1>
            <p className="text-xl sm:text-2xl text-gray-700 font-semibold">
              Last Updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </motion.div>
        </div>
      </header>

      {/* Main Content */}
      <section className="py-16 lg:py-24 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="prose prose-lg max-w-none">
            {/* Introduction */}
            <ScrollFade>
              <div className="mb-12">
                <p className="text-lg text-gray-700 leading-relaxed mb-6">
                  Welcome to Taru ("we," "our," or "us"). These Terms and Conditions ("Terms") govern your access to and use of the Taru platform, including our website, mobile applications, and related services (collectively, the "Service"). By accessing or using our Service, you agree to be bound by these Terms.
                </p>
                <p className="text-lg text-gray-700 leading-relaxed">
                  Please read these Terms carefully before using our Service. If you do not agree to these Terms, you may not access or use the Service.
                </p>
              </div>
            </ScrollFade>

            {/* Acceptance of Terms */}
            <ScrollFade delay={0.1}>
              <div className="mb-12">
                <h2 className="text-3xl font-bold text-gray-900 mb-4">1. Acceptance of Terms</h2>
                <p className="text-lg text-gray-700 leading-relaxed mb-4">
                  By creating an account, accessing, or using the Taru platform, you acknowledge that you have read, understood, and agree to be bound by these Terms and our Privacy Policy. If you are using the Service on behalf of an organization, school, or institution, you represent that you have the authority to bind that entity to these Terms.
                </p>
                <p className="text-lg text-gray-700 leading-relaxed">
                  These Terms apply to all users of the Service, including students, parents, teachers, administrators, and any other individuals or entities that access or use the Service.
                </p>
              </div>
            </ScrollFade>

            {/* Description of Service */}
            <ScrollFade delay={0.2}>
              <div className="mb-12">
                <h2 className="text-3xl font-bold text-gray-900 mb-4">2. Description of Service</h2>
                <p className="text-lg text-gray-700 leading-relaxed mb-4">
                  Taru is an AI-powered education, exploration, and career guidance platform designed to support students, parents, and educators. Our Service includes:
                </p>
                <ul className="list-disc list-inside space-y-2 text-lg text-gray-700 ml-4">
                  <li>AI-driven career roadmaps and learning paths</li>
                  <li>Skill assessments and diagnostic evaluations</li>
                  <li>Personalized learning content and recommendations</li>
                  <li>Progress tracking and analytics</li>
                  <li>Communication tools for students, parents, and educators</li>
                  <li>Multilingual support and accessibility features</li>
                </ul>
                <p className="text-lg text-gray-700 leading-relaxed mt-4">
                  We reserve the right to modify, suspend, or discontinue any aspect of the Service at any time, with or without notice.
                </p>
              </div>
            </ScrollFade>

            {/* User Accounts */}
            <ScrollFade delay={0.3}>
              <div className="mb-12">
                <h2 className="text-3xl font-bold text-gray-900 mb-4">3. User Accounts and Registration</h2>
                <p className="text-lg text-gray-700 leading-relaxed mb-4">
                  To access certain features of the Service, you must create an account. When creating an account, you agree to:
                </p>
                <ul className="list-disc list-inside space-y-2 text-lg text-gray-700 ml-4">
                  <li>Provide accurate, current, and complete information</li>
                  <li>Maintain and promptly update your account information</li>
                  <li>Maintain the security of your password and account</li>
                  <li>Accept responsibility for all activities that occur under your account</li>
                  <li>Notify us immediately of any unauthorized use of your account</li>
                </ul>
                <p className="text-lg text-gray-700 leading-relaxed mt-4">
                  You must be at least 13 years old to create an account. Users under 18 must have parental or guardian consent to use the Service.
                </p>
              </div>
            </ScrollFade>

            {/* User Conduct */}
            <ScrollFade delay={0.4}>
              <div className="mb-12">
                <h2 className="text-3xl font-bold text-gray-900 mb-4">4. User Conduct and Responsibilities</h2>
                <p className="text-lg text-gray-700 leading-relaxed mb-4">
                  You agree to use the Service only for lawful purposes and in accordance with these Terms. You agree not to:
                </p>
                <ul className="list-disc list-inside space-y-2 text-lg text-gray-700 ml-4">
                  <li>Violate any applicable laws or regulations</li>
                  <li>Infringe upon the rights of others, including intellectual property rights</li>
                  <li>Transmit any harmful, offensive, or inappropriate content</li>
                  <li>Attempt to gain unauthorized access to the Service or other users' accounts</li>
                  <li>Interfere with or disrupt the Service or servers connected to the Service</li>
                  <li>Use automated systems to access the Service without authorization</li>
                  <li>Impersonate any person or entity or misrepresent your affiliation</li>
                  <li>Collect or store personal data about other users without permission</li>
                </ul>
                <p className="text-lg text-gray-700 leading-relaxed mt-4">
                  We reserve the right to suspend or terminate accounts that violate these Terms or engage in harmful conduct.
                </p>
              </div>
            </ScrollFade>

            {/* Intellectual Property */}
            <ScrollFade delay={0.5}>
              <div className="mb-12">
                <h2 className="text-3xl font-bold text-gray-900 mb-4">5. Intellectual Property Rights</h2>
                <p className="text-lg text-gray-700 leading-relaxed mb-4">
                  The Service, including its original content, features, functionality, logos, and design, is owned by Taru and protected by international copyright, trademark, and other intellectual property laws.
                </p>
                <p className="text-lg text-gray-700 leading-relaxed mb-4">
                  You are granted a limited, non-exclusive, non-transferable license to access and use the Service for personal, non-commercial purposes in accordance with these Terms. This license does not include:
                </p>
                <ul className="list-disc list-inside space-y-2 text-lg text-gray-700 ml-4">
                  <li>The right to resell or commercially use the Service</li>
                  <li>The right to modify, copy, or create derivative works</li>
                  <li>The right to reverse engineer or attempt to extract source code</li>
                  <li>The right to remove any proprietary notices or labels</li>
                </ul>
                <p className="text-lg text-gray-700 leading-relaxed mt-4">
                  Content you create or submit through the Service remains your property, but you grant us a worldwide, royalty-free license to use, reproduce, and distribute such content for the purpose of providing and improving the Service.
                </p>
              </div>
            </ScrollFade>

            {/* Privacy */}
            <ScrollFade delay={0.6}>
              <div className="mb-12">
                <h2 className="text-3xl font-bold text-gray-900 mb-4">6. Privacy and Data Protection</h2>
                <p className="text-lg text-gray-700 leading-relaxed mb-4">
                  Your privacy is important to us. Our collection and use of personal information is governed by our Privacy Policy, which is incorporated into these Terms by reference. By using the Service, you consent to the collection and use of your information as described in our Privacy Policy.
                </p>
                <p className="text-lg text-gray-700 leading-relaxed">
                  We implement appropriate technical and organizational measures to protect your personal data, but no method of transmission over the Internet is 100% secure. You acknowledge that you provide information at your own risk.
                </p>
              </div>
            </ScrollFade>

            {/* Payment Terms */}
            <ScrollFade delay={0.7}>
              <div className="mb-12">
                <h2 className="text-3xl font-bold text-gray-900 mb-4">7. Payment Terms</h2>
                <p className="text-lg text-gray-700 leading-relaxed mb-4">
                  Certain features of the Service may require payment. If you purchase a subscription or make a payment:
                </p>
                <ul className="list-disc list-inside space-y-2 text-lg text-gray-700 ml-4">
                  <li>You agree to pay all fees associated with your account</li>
                  <li>Fees are charged in advance on a recurring basis unless otherwise stated</li>
                  <li>All fees are non-refundable except as required by law or as explicitly stated</li>
                  <li>We reserve the right to change our pricing with 30 days' notice</li>
                  <li>You are responsible for any taxes applicable to your use of the Service</li>
                </ul>
                <p className="text-lg text-gray-700 leading-relaxed mt-4">
                  If payment fails or your account is past due, we may suspend or terminate your access to paid features.
                </p>
              </div>
            </ScrollFade>

            {/* Disclaimers */}
            <ScrollFade delay={0.8}>
              <div className="mb-12">
                <h2 className="text-3xl font-bold text-gray-900 mb-4">8. Disclaimers</h2>
                <p className="text-lg text-gray-700 leading-relaxed mb-4">
                  THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED. WE DISCLAIM ALL WARRANTIES, INCLUDING BUT NOT LIMITED TO:
                </p>
                <ul className="list-disc list-inside space-y-2 text-lg text-gray-700 ml-4">
                  <li>Warranties of merchantability, fitness for a particular purpose, or non-infringement</li>
                  <li>Warranties that the Service will be uninterrupted, secure, or error-free</li>
                  <li>Warranties regarding the accuracy, reliability, or quality of any content or information</li>
                  <li>Warranties that defects will be corrected</li>
                </ul>
                <p className="text-lg text-gray-700 leading-relaxed mt-4">
                  We do not guarantee that the Service will meet your requirements or that the results obtained from using the Service will be accurate or reliable. Career guidance and educational recommendations are provided for informational purposes only and should not be considered as professional advice.
                </p>
              </div>
            </ScrollFade>

            {/* Limitation of Liability */}
            <ScrollFade delay={0.9}>
              <div className="mb-12">
                <h2 className="text-3xl font-bold text-gray-900 mb-4">9. Limitation of Liability</h2>
                <p className="text-lg text-gray-700 leading-relaxed mb-4">
                  TO THE MAXIMUM EXTENT PERMITTED BY LAW, TARU AND ITS AFFILIATES SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING BUT NOT LIMITED TO:
                </p>
                <ul className="list-disc list-inside space-y-2 text-lg text-gray-700 ml-4">
                  <li>Loss of profits, data, or business opportunities</li>
                  <li>Personal injury or property damage</li>
                  <li>Costs of substitute services</li>
                  <li>Any other damages arising from your use or inability to use the Service</li>
                </ul>
                <p className="text-lg text-gray-700 leading-relaxed mt-4">
                  Our total liability for any claims arising from or related to the Service shall not exceed the amount you paid to us in the 12 months preceding the claim.
                </p>
              </div>
            </ScrollFade>

            {/* Indemnification */}
            <ScrollFade delay={1.0}>
              <div className="mb-12">
                <h2 className="text-3xl font-bold text-gray-900 mb-4">10. Indemnification</h2>
                <p className="text-lg text-gray-700 leading-relaxed">
                  You agree to indemnify, defend, and hold harmless Taru and its officers, directors, employees, and agents from and against any claims, liabilities, damages, losses, and expenses, including reasonable attorneys' fees, arising out of or in any way connected with your use of the Service, violation of these Terms, or infringement of any rights of another.
                </p>
              </div>
            </ScrollFade>

            {/* Termination */}
            <ScrollFade delay={1.1}>
              <div className="mb-12">
                <h2 className="text-3xl font-bold text-gray-900 mb-4">11. Termination</h2>
                <p className="text-lg text-gray-700 leading-relaxed mb-4">
                  We may terminate or suspend your account and access to the Service immediately, without prior notice, for any reason, including if you breach these Terms. Upon termination:
                </p>
                <ul className="list-disc list-inside space-y-2 text-lg text-gray-700 ml-4">
                  <li>Your right to use the Service will immediately cease</li>
                  <li>We may delete your account and associated data</li>
                  <li>All provisions of these Terms that by their nature should survive termination shall survive</li>
                </ul>
                <p className="text-lg text-gray-700 leading-relaxed mt-4">
                  You may terminate your account at any time by contacting us or using the account deletion feature in your settings.
                </p>
              </div>
            </ScrollFade>

            {/* Changes to Terms */}
            <ScrollFade delay={1.2}>
              <div className="mb-12">
                <h2 className="text-3xl font-bold text-gray-900 mb-4">12. Changes to Terms</h2>
                <p className="text-lg text-gray-700 leading-relaxed">
                  We reserve the right to modify these Terms at any time. We will notify you of material changes by posting the updated Terms on this page and updating the "Last Updated" date. Your continued use of the Service after such changes constitutes your acceptance of the new Terms. If you do not agree to the modified Terms, you must stop using the Service.
                </p>
              </div>
            </ScrollFade>

            {/* Governing Law */}
            <ScrollFade delay={1.3}>
              <div className="mb-12">
                <h2 className="text-3xl font-bold text-gray-900 mb-4">13. Governing Law and Dispute Resolution</h2>
                <p className="text-lg text-gray-700 leading-relaxed mb-4">
                  These Terms shall be governed by and construed in accordance with the laws of India, without regard to its conflict of law provisions. Any disputes arising from or relating to these Terms or the Service shall be subject to the exclusive jurisdiction of the courts in Pune, Maharashtra, India.
                </p>
                <p className="text-lg text-gray-700 leading-relaxed">
                  Before filing a claim, you agree to attempt to resolve disputes through good faith negotiation. If a dispute cannot be resolved through negotiation, you agree to submit to binding arbitration in accordance with the Arbitration and Conciliation Act, 2015 of India.
                </p>
              </div>
            </ScrollFade>

            {/* Contact Information */}
            <ScrollFade delay={1.4}>
              <div className="mb-12 bg-purple-50 rounded-2xl p-8">
                <h2 className="text-3xl font-bold text-gray-900 mb-4">14. Contact Information</h2>
                <p className="text-lg text-gray-700 leading-relaxed mb-4">
                  If you have any questions about these Terms and Conditions, please contact us:
                </p>
                <ul className="space-y-2 text-lg text-gray-700">
                  <li><strong>Email:</strong> <a href="mailto:support@taru.live" className="text-purple-600 hover:text-purple-800">support@taru.live</a></li>
                  <li><strong>Phone:</strong> <a href="tel:+911234567890" className="text-purple-600 hover:text-purple-800">+91 1234567890</a></li>
                  <li><strong>Address:</strong> Pune, Maharashtra, India</li>
                </ul>
              </div>
            </ScrollFade>

            {/* Severability */}
            <ScrollFade delay={1.5}>
              <div className="mb-12">
                <h2 className="text-3xl font-bold text-gray-900 mb-4">15. Severability</h2>
                <p className="text-lg text-gray-700 leading-relaxed">
                  If any provision of these Terms is found to be unenforceable or invalid, that provision shall be limited or eliminated to the minimum extent necessary so that these Terms shall otherwise remain in full force and effect and enforceable.
                </p>
              </div>
            </ScrollFade>

            {/* Entire Agreement */}
            <ScrollFade delay={1.6}>
              <div className="mb-12">
                <h2 className="text-3xl font-bold text-gray-900 mb-4">16. Entire Agreement</h2>
                <p className="text-lg text-gray-700 leading-relaxed">
                  These Terms, together with our Privacy Policy, constitute the entire agreement between you and Taru regarding your use of the Service and supersede all prior agreements and understandings, whether written or oral.
                </p>
              </div>
            </ScrollFade>
          </div>
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

      {/* Floating Action Buttons */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-4">
        {/* Scroll to Top Button */}
        {showScrollTop && (
          <motion.button
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0 }}
            onClick={scrollToTop}
            className="w-14 h-14 bg-purple-600 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-purple-700 transition-all"
            aria-label="Scroll to top"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
            </svg>
          </motion.button>
        )}
        
        {/* Go to Home Button */}
        <motion.button
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          onClick={() => router.push('/')}
          className="w-14 h-14 bg-gray-900 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-purple-600 transition-all"
          aria-label="Go to home"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
        </motion.button>
      </div>

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
