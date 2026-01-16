'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { RegistrationDataManager } from '@/lib/utils';

export default function OrganizationOnboarding() {
  const router = useRouter();
  
  // Load form data and step from localStorage on mount
  const getInitialFormData = () => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('organization_onboarding_formData');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {
          console.error('Error parsing saved form data:', e);
        }
      }
    }
    return {
      organizationName: '',
      organizationType: 'school',
      industry: '',
      address: '',
      city: '',
      state: '',
      country: 'India',
      phoneNumber: '',
      website: '',
      description: '',
      employeeCount: '1-10'
    };
  };

  const getInitialStep = (): number => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('organization_onboarding_currentStep');
      if (saved) {
        try {
          return parseInt(saved, 10) || 1;
        } catch (e) {
          console.error('Error parsing saved step:', e);
        }
      }
    }
    return 1;
  };

  const [currentStep, setCurrentStep] = useState(getInitialStep());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState(getInitialFormData());

  // Pre-fill form with registration data on component mount
  useEffect(() => {
    const fetchUserAndRegistrationData = async () => {
      try {
        // Get user data from API
        const userResponse = await fetch('/api/auth/me');
        if (userResponse.ok) {
          const userData = await userResponse.json();
          const user = userData.user;
          
          // Get registration data using utility function
          const registrationData = RegistrationDataManager.getRegistrationData();
          
          // Pre-fill form with existing data and registration data
          // Only fill empty fields to preserve localStorage data
          setFormData(prev => ({
            ...prev,
            organizationName: prev.organizationName || user.name || registrationData?.fullName || '',
            organizationType: prev.organizationType || user.profile?.organizationType || 'school',
            industry: prev.industry || user.profile?.industry || 'Education',
            // Use location from registration if available
            city: prev.city || registrationData?.location || '',
            // Set default values for required fields only if empty
            address: prev.address || '123 Education Street',
            state: prev.state || 'Demo State',
            phoneNumber: prev.phoneNumber || user.profile?.contactPhone || '7777777777',
            website: prev.website || 'https://demoschool.edu',
            description: prev.description || 'A leading educational institution dedicated to student success',
          }));
          
          console.log('🔍 Pre-filled organization form data:', {
            userData: user,
            registrationData: registrationData
          });
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };

    fetchUserAndRegistrationData();
  }, []);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/organization/onboarding', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Onboarding failed');
      }

      // Clear registration data after successful onboarding
      RegistrationDataManager.clearRegistrationData();

      // Clear localStorage after successful submission
      if (typeof window !== 'undefined') {
        localStorage.removeItem('organization_onboarding_formData');
        localStorage.removeItem('organization_onboarding_currentStep');
      }

      // Redirect to admin dashboard
      router.push('/dashboard/admin');
    } catch (err: unknown) {
      console.error('Onboarding error:', err);
      setError(err instanceof Error ? err.message : 'Onboarding failed');
    } finally {
      setLoading(false);
    }
  };

  // Save formData to localStorage whenever it changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('organization_onboarding_formData', JSON.stringify(formData));
    }
  }, [formData]);

  // Save currentStep to localStorage whenever it changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('organization_onboarding_currentStep', currentStep.toString());
    }
  }, [currentStep]);

  const nextStep = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const organizationTypes = [
    { value: 'school', label: 'School' },
    { value: 'college', label: 'College' },
    { value: 'university', label: 'University' },
    { value: 'training_center', label: 'Training Center' },
    { value: 'edtech_company', label: 'EdTech Company' },
    { value: 'ngo', label: 'NGO' },
    { value: 'government', label: 'Government' },
    { value: 'corporate', label: 'Corporate' },
    { value: 'other', label: 'Other' }
  ];

  const employeeCounts = [
    { value: '1-10', label: '1-10 employees' },
    { value: '11-50', label: '11-50 employees' },
    { value: '51-200', label: '51-200 employees' },
    { value: '201-500', label: '201-500 employees' },
    { value: '501-1000', label: '501-1000 employees' },
    { value: '1000+', label: '1000+ employees' }
  ];

  return (
    <motion.main 
      className="min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-purple-600 to-blue-600 p-4 relative"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
    >
      {/* Google Translate - Bottom Left */}
      <motion.div 
        className="fixed bottom-4 left-4 z-50"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.8, duration: 0.5 }}
      >
        <div className="bg-white/90 backdrop-blur-sm border border-gray-200 rounded-lg px-3 py-2 shadow-lg">
        </div>
      </motion.div>
      {/* Main Container */}
      <motion.div 
        className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl overflow-hidden"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.8 }}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-8 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Image src="/icons/logo.svg" alt="Logo" width={48} height={48} className="w-12 h-12 object-contain" />
              <div>
                <h1 className="text-2xl font-bold">Organization Onboarding</h1>
                <p className="text-purple-100">Complete your organization profile</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-purple-100">Step {currentStep} of 3</div>
              <div className="w-32 h-2 bg-white/20 rounded-full mt-2">
                <motion.div 
                  className="h-full bg-white rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${(currentStep / 3) * 100}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-8">
          <AnimatePresence mode="wait">
            {currentStep === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                transition={{ duration: 0.5 }}
                className="space-y-6"
              >
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Basic Information</h2>
                  <p className="text-gray-600">Tell us about your organization</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Organization Name *
                    </label>
                    <input
                      type="text"
                      value={formData.organizationName}
                      onChange={(e) => handleInputChange('organizationName', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="Enter organization name"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Organization Type *
                    </label>
                    <select
                      value={formData.organizationType}
                      onChange={(e) => handleInputChange('organizationType', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    >
                      {organizationTypes.map(type => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Industry *
                    </label>
                    <input
                      type="text"
                      value={formData.industry}
                      onChange={(e) => handleInputChange('industry', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="e.g., Education, Technology"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Employee Count *
                    </label>
                    <select
                      value={formData.employeeCount}
                      onChange={(e) => handleInputChange('employeeCount', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    >
                      {employeeCounts.map(count => (
                        <option key={count.value} value={count.value}>
                          {count.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </motion.div>
            )}

            {currentStep === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                transition={{ duration: 0.5 }}
                className="space-y-6"
              >
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Contact Information</h2>
                  <p className="text-gray-600">How can we reach your organization?</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      value={formData.phoneNumber}
                      onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="+91 98765 43210"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Website
                    </label>
                    <input
                      type="url"
                      value={formData.website}
                      onChange={(e) => handleInputChange('website', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="https://www.example.com"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                      rows={4}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="Tell us about your organization's mission and goals..."
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {currentStep === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                transition={{ duration: 0.5 }}
                className="space-y-6"
              >
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Address Information</h2>
                  <p className="text-gray-600">Where is your organization located?</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Address *
                    </label>
                    <input
                      type="text"
                      value={formData.address}
                      onChange={(e) => handleInputChange('address', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="Enter full address"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      City *
                    </label>
                    <input
                      type="text"
                      value={formData.city}
                      onChange={(e) => handleInputChange('city', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="Enter city"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      State *
                    </label>
                    <input
                      type="text"
                      value={formData.state}
                      onChange={(e) => handleInputChange('state', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="Enter state"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Country *
                    </label>
                    <input
                      type="text"
                      value={formData.country}
                      onChange={(e) => handleInputChange('country', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="Enter country"
                      required
                    />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Error Message */}
          <AnimatePresence>
            {error && (
              <motion.div 
                className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Navigation Buttons */}
          <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-200">
            <motion.button
              onClick={prevStep}
              disabled={currentStep === 1}
              className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                currentStep === 1
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
              whileHover={currentStep !== 1 ? { scale: 1.02 } : {}}
              whileTap={currentStep !== 1 ? { scale: 0.98 } : {}}
            >
              Previous
            </motion.button>

            {currentStep < 3 ? (
              <motion.button
                onClick={nextStep}
                className="px-6 py-3 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Next
              </motion.button>
            ) : (
              <motion.button
                onClick={handleSubmit}
                disabled={loading}
                className="px-8 py-3 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                whileHover={!loading ? { scale: 1.02 } : {}}
                whileTap={!loading ? { scale: 0.98 } : {}}
              >
                {loading ? 'Completing...' : 'Complete Setup'}
              </motion.button>
            )}
          </div>
        </div>
      </motion.div>
    </motion.main>
  );
} 