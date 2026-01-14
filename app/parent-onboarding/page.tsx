'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { RegistrationDataManager } from '@/lib/utils';
import ConsistentLoadingPage from '../components/ConsistentLoadingPage';
import { ScrollProgress } from '../components/ScrollAnimations';

interface ParentOnboardingData {
  // Personal Information
  fullName: string;
  relationshipToStudent: string;
  contactNumber: string;
  alternateContactNumber: string;
  email: string;
  occupation: string;
  educationLevel: string;
  preferredLanguage: string;
  
  // Address Information
  addressLine1: string;
  addressLine2: string;
  cityVillage: string;
  state: string;
  pinCode: string;
  
  // Student Linking
  linkedStudentId: string;
  studentUniqueId: string;
  
  // Consent
  consentToAccessChildData: boolean;
  agreeToTerms: boolean;
}

const relationships = [
  'Father', 'Mother', 'Guardian', 'Other'
];

const educationLevels = [
  'Primary School', 'Secondary School', 'High School', 'Diploma', 
  'Bachelor\'s Degree', 'Master\'s Degree', 'PhD', 'Other'
];

const languageOptions = [
  'English', 'Hindi', 'Spanish', 'French', 'German', 'Chinese', 'Arabic', 'Other'
];

const states = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
  'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
  'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Chandigarh', 'Dadra and Nagar Haveli',
  'Daman and Diu', 'Lakshadweep', 'Puducherry', 'Andaman and Nicobar Islands'
];

export default function ParentOnboarding() {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSuccess, setIsSuccess] = useState(false);
  const [formData, setFormData] = useState<ParentOnboardingData>({
    fullName: '',
    relationshipToStudent: '',
    contactNumber: '',
    alternateContactNumber: '',
    email: '',
    occupation: '',
    educationLevel: '',
    preferredLanguage: '',
    addressLine1: '',
    addressLine2: '',
    cityVillage: '',
    state: '',
    pinCode: '',
    linkedStudentId: '',
    studentUniqueId: '',
    consentToAccessChildData: false,
    agreeToTerms: false
  });

  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [availableStudents, setAvailableStudents] = useState<Array<{id: string; uniqueId: string; name: string; email: string; grade: string}>>([]);
  const [isLoadingStudents, setIsLoadingStudents] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [hasReadTerms, setHasReadTerms] = useState(false);
  const [hasReadPrivacy, setHasReadPrivacy] = useState(false);
  const router = useRouter();

  // Fetch available students for linking and pre-fill form data
  useEffect(() => {
    const fetchStudents = async () => {
      setIsLoadingStudents(true);
      try {
        const response = await fetch('/api/students/available');
        if (response.ok) {
          const data = await response.json();
          setAvailableStudents(data.students || []);
        }
      } catch (error) {
        console.error('Error fetching students:', error);
      } finally {
        setIsLoadingStudents(false);
      }
    };

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
          setFormData(prev => ({
            ...prev,
            fullName: user.name || registrationData?.fullName || '',
            email: user.email || registrationData?.email || '',
            preferredLanguage: user.profile?.language || registrationData?.language || '',
            // Try to link student if student ID was provided during registration
            linkedStudentId: registrationData?.classGrade || '', // classGrade contains student ID for parents
            studentUniqueId: registrationData?.classGrade || '',
          }));
          
          console.log('🔍 Pre-filled parent form data:', {
            userData: user,
            registrationData: registrationData
          });
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };

    fetchStudents();
    fetchUserAndRegistrationData();
  }, []);

  const validateStep = (step: number): boolean => {
    const newErrors: {[key: string]: string} = {};

    switch (step) {
      case 1:
        if (!formData.relationshipToStudent) newErrors.relationshipToStudent = 'Relationship to student is required';
        if (!formData.contactNumber.trim()) newErrors.contactNumber = 'Contact number is required';
        if (formData.contactNumber && !/^\d{10}$/.test(formData.contactNumber)) {
          newErrors.contactNumber = 'Contact number must be 10 digits';
        }
        if (formData.alternateContactNumber && !/^\d{10}$/.test(formData.alternateContactNumber)) {
          newErrors.alternateContactNumber = 'Alternate contact number must be 10 digits';
        }
        if (!formData.occupation.trim()) newErrors.occupation = 'Occupation is required';
        if (!formData.educationLevel) newErrors.educationLevel = 'Education level is required';
        if (!formData.preferredLanguage) newErrors.preferredLanguage = 'Preferred language is required';
        break;
      
      case 2:
        if (!formData.addressLine1.trim()) newErrors.addressLine1 = 'Address line 1 is required';
        if (!formData.cityVillage.trim()) newErrors.cityVillage = 'City/Village is required';
        if (!formData.state) newErrors.state = 'State is required';
        if (!formData.pinCode.trim()) newErrors.pinCode = 'Pin code is required';
        if (formData.pinCode && !/^\d{6}$/.test(formData.pinCode)) {
          newErrors.pinCode = 'Pin code must be 6 digits';
        }
        break;
      
      case 3:
        if (!formData.linkedStudentId) newErrors.linkedStudentId = 'Please select a student to link';
        if (!formData.studentUniqueId.trim()) newErrors.studentUniqueId = 'Student unique ID is required';
        
        // Validate that the unique ID matches the selected student
        if (formData.linkedStudentId && formData.studentUniqueId) {
          const selectedStudent = availableStudents.find(student => student.id === formData.linkedStudentId);
          if (selectedStudent && selectedStudent.uniqueId !== formData.studentUniqueId) {
            newErrors.studentUniqueId = 'Student unique ID does not match the selected student';
          }
        }
        break;
      
      case 4:
        if (!formData.consentToAccessChildData) {
          newErrors.consentToAccessChildData = 'Consent to access child\'s learning data is required';
        }
        if (!formData.agreeToTerms) {
          newErrors.agreeToTerms = 'You must agree to platform terms & policies';
        }
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 4));
    }
  };

  const handlePrevious = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleInputChange = (field: keyof ParentOnboardingData, value: string | boolean) => {
    setFormData(prev => {
      const newData = { ...prev, [field]: value };
      
      // Auto-populate student unique ID when student is selected
      if (field === 'linkedStudentId' && typeof value === 'string') {
        const selectedStudent = availableStudents.find(student => student.id === value);
        if (selectedStudent) {
          newData.studentUniqueId = selectedStudent.uniqueId;
        }
      }
      
      return newData;
    });
    
    // Clear error when user starts typing
    if (errors[field as string]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field as string];
        return newErrors;
      });
    }
  };

  const handleSubmit = async () => {
    if (!validateStep(4)) return;

    setIsSubmitting(true);
    try {
      console.log('📤 Submitting parent onboarding data:', {
        fullName: formData.fullName,
        relationshipToStudent: formData.relationshipToStudent,
        contactNumber: formData.contactNumber,
        occupation: formData.occupation,
        educationLevel: formData.educationLevel,
        preferredLanguage: formData.preferredLanguage,
        addressLine1: formData.addressLine1,
        cityVillage: formData.cityVillage,
        state: formData.state,
        pinCode: formData.pinCode,
        linkedStudentId: formData.linkedStudentId,
        studentUniqueId: formData.studentUniqueId,
        consentToAccessChildData: formData.consentToAccessChildData,
        agreeToTerms: formData.agreeToTerms
      });

      const response = await fetch('/api/parent/onboarding', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        setIsSuccess(true);
        
        // Clear registration data after successful onboarding
        RegistrationDataManager.clearRegistrationData();
        
        setTimeout(() => {
          router.push('/dashboard/parent');
        }, 3000);
      } else {
        const errorData = await response.json();
        console.error('❌ API Error Response:', {
          status: response.status,
          statusText: response.statusText,
          error: errorData
        });
        throw new Error(errorData.error || 'Failed to submit onboarding data');
      }
    } catch (error: unknown) {
      console.error('❌ Onboarding submission error:', error);
      console.error('Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
      alert('Failed to submit onboarding data. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <motion.main 
        className="min-h-screen flex flex-col md:flex-row bg-white overflow-hidden relative"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        
        
        {/* Scroll Progress Indicator */}
        <ScrollProgress 
          color="linear-gradient(90deg, #6D18CE, #8B5CF6, #A855F7)"
          height="3px"
          className="shadow-lg z-50"
        />
        
        <motion.div 
          className="w-full md:w-1/2 bg-gradient-to-br from-purple-700 via-purple-600 to-purple-500 px-6 py-8 text-white flex flex-col justify-between relative overflow-hidden"
          initial={{ x: -50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0" style={{
              backgroundImage: `radial-gradient(circle at 25% 25%, #FFFFFF 2px, transparent 2px),
                               radial-gradient(circle at 75% 75%, #FFFFFF 2px, transparent 2px)`,
              backgroundSize: '50px 50px, 80px 80px'
            }} />
          </div>
          
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <Image src="/icons/logo.svg" alt="Logo" width={56} height={56} className="absolute top-4 left-4 w-14 h-14 object-contain" />
          </motion.div>
          
          <motion.div 
            className="mt-20 md:mt-32 relative z-10"
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.5 }}
          >
            <h2 className="text-3xl md:text-4xl font-bold leading-snug md:leading-snug px-2 md:px-10">
              🎉 Welcome to Taru! <br />
              Your onboarding is complete!
            </h2>
            <motion.p 
              className="text-lg text-purple-100 mt-4 px-2 md:px-10"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.8 }}
            >
              You're all set to monitor your child's learning journey!
            </motion.p>
          </motion.div>
          
          <motion.div
            initial={{ scale: 0.8, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.7 }}
          >
            <Image src="/landingPage.png" alt="Mascot" width={224} height={256} className="w-56 md:w-64 mx-auto mt-8 md:mt-12 relative z-10" />
          </motion.div>
        </motion.div>
        
        <motion.div 
          className="w-full md:w-1/2 bg-white px-4 sm:px-8 py-10 flex flex-col justify-center relative"
          initial={{ x: 50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <motion.div 
            className="max-w-md mx-auto w-full text-center"
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            <motion.div 
              className="w-20 h-20 bg-gradient-to-br from-green-100 to-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.6, delay: 0.6, type: "spring", stiffness: 200 }}
            >
              <motion.span 
                className="text-3xl"
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 0.5, delay: 0.8 }}
              >
                ✅
              </motion.span>
            </motion.div>
            
            <motion.h1 
              className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.8 }}
            >
              Onboarding Complete!
            </motion.h1>
            
            <motion.p 
              className="text-gray-600 mb-8 text-lg"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 1.0 }}
            >
              You can now monitor your child&apos;s learning progress and achievements
            </motion.p>
            
            <motion.button
              onClick={() => router.push('/dashboard/parent')}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold py-4 px-8 rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 1.2 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Continue to Dashboard
            </motion.button>
          </motion.div>
        </motion.div>
      </motion.main>
    );
  }

  const renderStep1 = () => (
    <motion.div 
      className="space-y-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        <label className="block text-sm font-bold text-gray-700 mb-3">
          Relationship to Student *
        </label>
        <select
          value={formData.relationshipToStudent}
          onChange={(e) => handleInputChange('relationshipToStudent', e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-300 bg-white shadow-sm transition-all duration-300 hover:shadow-md"
        >
          <option value="">Select relationship</option>
          {relationships.map((rel) => (
            <option key={rel} value={rel}>{rel}</option>
          ))}
        </select>
        {errors.relationshipToStudent && <motion.p 
          className="text-red-500 text-sm mt-2 font-medium"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >{errors.relationshipToStudent}</motion.p>}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
      >
        <label className="block text-sm font-bold text-gray-700 mb-3">
          Contact Number *
        </label>
        <input
          type="tel"
          value={formData.contactNumber}
          onChange={(e) => handleInputChange('contactNumber', e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-300 bg-white shadow-sm transition-all duration-300 hover:shadow-md"
          placeholder="Enter your contact number"
        />
        {errors.contactNumber && <motion.p 
          className="text-red-500 text-sm mt-2 font-medium"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >{errors.contactNumber}</motion.p>}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
      >
        <label className="block text-sm font-bold text-gray-700 mb-3">
          Alternate Contact Number
        </label>
        <input
          type="tel"
          value={formData.alternateContactNumber}
          onChange={(e) => handleInputChange('alternateContactNumber', e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-300 bg-white shadow-sm transition-all duration-300 hover:shadow-md"
          placeholder="Enter alternate contact number (optional)"
        />
        {errors.alternateContactNumber && <motion.p 
          className="text-red-500 text-sm mt-2 font-medium"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >{errors.alternateContactNumber}</motion.p>}
      </motion.div>


      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4, delay: 0.4 }}
      >
        <label className="block text-sm font-bold text-gray-700 mb-3">
          Occupation *
        </label>
        <input
          type="text"
          value={formData.occupation}
          onChange={(e) => handleInputChange('occupation', e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-300 bg-white shadow-sm transition-all duration-300 hover:shadow-md"
          placeholder="Enter your occupation"
        />
        {errors.occupation && <motion.p 
          className="text-red-500 text-sm mt-2 font-medium"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >{errors.occupation}</motion.p>}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4, delay: 0.5 }}
      >
        <label className="block text-sm font-bold text-gray-700 mb-3">
          Education Level *
        </label>
        <select
          value={formData.educationLevel}
          onChange={(e) => handleInputChange('educationLevel', e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-300 bg-white shadow-sm transition-all duration-300 hover:shadow-md"
        >
          <option value="">Select education level</option>
          {educationLevels.map((level) => (
            <option key={level} value={level}>{level}</option>
          ))}
        </select>
        {errors.educationLevel && <motion.p 
          className="text-red-500 text-sm mt-2 font-medium"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >{errors.educationLevel}</motion.p>}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4, delay: 0.6 }}
      >
        <label className="block text-sm font-bold text-gray-700 mb-3">
          Preferred Language *
        </label>
        <select
          value={formData.preferredLanguage}
          onChange={(e) => handleInputChange('preferredLanguage', e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-300 bg-white shadow-sm transition-all duration-300 hover:shadow-md"
        >
          <option value="">Select preferred language</option>
          {languageOptions.map((lang) => (
            <option key={lang} value={lang}>{lang}</option>
          ))}
        </select>
        {errors.preferredLanguage && <motion.p 
          className="text-red-500 text-sm mt-2 font-medium"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >{errors.preferredLanguage}</motion.p>}
      </motion.div>
    </motion.div>
  );

  const renderStep2 = () => (
    <motion.div 
      className="space-y-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        <label className="block text-sm font-bold text-gray-700 mb-3">
          Address Line 1 *
        </label>
        <input
          type="text"
          value={formData.addressLine1}
          onChange={(e) => handleInputChange('addressLine1', e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-300 bg-white shadow-sm transition-all duration-300 hover:shadow-md"
          placeholder="Enter your address"
        />
        {errors.addressLine1 && <motion.p 
          className="text-red-500 text-sm mt-2 font-medium"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >{errors.addressLine1}</motion.p>}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
      >
        <label className="block text-sm font-bold text-gray-700 mb-3">
          Address Line 2
        </label>
        <input
          type="text"
          value={formData.addressLine2}
          onChange={(e) => handleInputChange('addressLine2', e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-300 bg-white shadow-sm transition-all duration-300 hover:shadow-md"
          placeholder="Enter additional address details (optional)"
        />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
      >
        <label className="block text-sm font-bold text-gray-700 mb-3">
          City/Village *
        </label>
        <input
          type="text"
          value={formData.cityVillage}
          onChange={(e) => handleInputChange('cityVillage', e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-300 bg-white shadow-sm transition-all duration-300 hover:shadow-md"
          placeholder="Enter your city or village"
        />
        {errors.cityVillage && <motion.p 
          className="text-red-500 text-sm mt-2 font-medium"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >{errors.cityVillage}</motion.p>}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4, delay: 0.4 }}
      >
        <label className="block text-sm font-bold text-gray-700 mb-3">
          State *
        </label>
        <select
          value={formData.state}
          onChange={(e) => handleInputChange('state', e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-300 bg-white shadow-sm transition-all duration-300 hover:shadow-md"
        >
          <option value="">Select state</option>
          {states.map((state) => (
            <option key={state} value={state}>{state}</option>
          ))}
        </select>
        {errors.state && <motion.p 
          className="text-red-500 text-sm mt-2 font-medium"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >{errors.state}</motion.p>}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4, delay: 0.5 }}
      >
        <label className="block text-sm font-bold text-gray-700 mb-3">
          Pin Code *
        </label>
        <input
          type="text"
          value={formData.pinCode}
          onChange={(e) => handleInputChange('pinCode', e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-300 bg-white shadow-sm transition-all duration-300 hover:shadow-md"
          placeholder="Enter your pin code"
        />
        {errors.pinCode && <motion.p 
          className="text-red-500 text-sm mt-2 font-medium"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >{errors.pinCode}</motion.p>}
      </motion.div>
    </motion.div>
  );

  const renderStep3 = () => (
    <motion.div 
      className="space-y-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      {/* Information Card */}
      <motion.div 
        className="bg-blue-50 border border-blue-200 rounded-xl p-4 shadow-sm"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-blue-600 text-sm">ℹ️</span>
            </div>
          </div>
          <div className="flex-1">
            <h4 className="text-sm font-semibold text-blue-800 mb-1">Student Linking</h4>
            <p className="text-xs text-blue-700">
              Select your child from the list below. The unique ID will be automatically filled. 
              This links your parent account to your child's learning progress.
            </p>
          </div>
        </div>
      </motion.div>
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        <label className="block text-sm font-bold text-gray-700 mb-3">
          Link with Student *
        </label>
        <select
          value={formData.linkedStudentId}
          onChange={(e) => handleInputChange('linkedStudentId', e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-300 bg-white shadow-sm transition-all duration-300 hover:shadow-md"
        >
          <option value="">Select a student</option>
          {isLoadingStudents ? (
            <option value="">Loading students...</option>
          ) : availableStudents.length === 0 ? (
            <option value="">No students found</option>
          ) : (
            availableStudents.map(student => (
              <option key={student.id} value={student.id}>
                {student.name} - {student.email} (ID: {student.uniqueId})
              </option>
            ))
          )}
        </select>
        {errors.linkedStudentId && <motion.p 
          className="text-red-500 text-sm mt-2 font-medium"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >{errors.linkedStudentId}</motion.p>}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
      >
        <label className="block text-sm font-bold text-gray-700 mb-3">
          Student Unique ID *
        </label>
        <input
          type="text"
          value={formData.studentUniqueId}
          onChange={(e) => handleInputChange('studentUniqueId', e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-300 bg-white shadow-sm transition-all duration-300 hover:shadow-md"
          placeholder="Student unique ID (auto-filled when student is selected)"
          readOnly={!!formData.linkedStudentId}
        />
        {errors.studentUniqueId && <motion.p 
          className="text-red-500 text-sm mt-2 font-medium"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >{errors.studentUniqueId}</motion.p>}
      </motion.div>
    </motion.div>
  );

  const renderStep4 = () => (
    <motion.div 
      className="space-y-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold text-purple-800">Data Access Consent</h3>
          <button
            type="button"
            onClick={() => setShowPrivacyModal(true)}
            className="text-sm text-purple-600 hover:text-purple-800 underline font-medium"
          >
            Read Privacy Policy
          </button>
        </div>
        <p className="text-sm text-purple-700 mb-3">
          By accepting this consent, you agree to access your child&apos;s learning data 
          to monitor their progress and provide support in their educational journey.
        </p>
        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={formData.consentToAccessChildData}
            onChange={(e) => handleInputChange('consentToAccessChildData', e.target.checked)}
            disabled={!hasReadPrivacy}
            className={`rounded border-gray-300 text-purple-600 focus:ring-purple-500 ${
              !hasReadPrivacy ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          />
          <span className={`text-sm text-purple-700 ${!hasReadPrivacy ? 'opacity-50' : ''}`}>
            I consent to access my child&apos;s learning data *
            {!hasReadPrivacy && <span className="block text-xs text-purple-600 mt-1">(Please read the Privacy Policy first)</span>}
          </span>
        </label>
        {errors.consentToAccessChildData && <p className="text-red-500 text-sm mt-1">{errors.consentToAccessChildData}</p>}
      </div>

      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold text-gray-800">Terms and Conditions</h3>
          <button
            type="button"
            onClick={() => setShowTermsModal(true)}
            className="text-sm text-purple-600 hover:text-purple-800 underline font-medium"
          >
            Read Terms & Conditions
          </button>
        </div>
        <p className="text-sm text-gray-700 mb-3">
          Please read and accept our terms and conditions to continue using the platform.
        </p>
        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={formData.agreeToTerms}
            onChange={(e) => handleInputChange('agreeToTerms', e.target.checked)}
            disabled={!hasReadTerms}
            className={`rounded border-gray-300 text-purple-600 focus:ring-purple-500 ${
              !hasReadTerms ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          />
          <span className={`text-sm text-gray-800 ${!hasReadTerms ? 'opacity-50' : ''}`}>
            I accept the terms and conditions *
            {!hasReadTerms && <span className="block text-xs text-gray-600 mt-1">(Please read the Terms & Conditions first)</span>}
          </span>
        </label>
        {errors.agreeToTerms && <p className="text-red-500 text-sm mt-1">{errors.agreeToTerms}</p>}
      </div>
    </motion.div>
  );

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1: return renderStep1();
      case 2: return renderStep2();
      case 3: return renderStep3();
      case 4: return renderStep4();
      default: return renderStep1();
    }
  };

  return (
    <motion.main 
      className="min-h-screen flex flex-col md:flex-row overflow-hidden relative"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      
      {/* Scroll Progress Indicator */}
      <ScrollProgress 
        color="linear-gradient(90deg, #6D18CE, #8B5CF6, #A855F7)"
        height="3px"
        className="shadow-lg z-50"
      />
      
      {/* 🟪 Left Section - Enhanced Deep Purple Gradient */}
      <motion.section 
        className="w-full md:w-1/2 bg-gradient-to-br from-purple-700 via-purple-600 to-purple-500 px-6 py-8 text-white flex flex-col justify-between relative overflow-hidden"
        initial={{ x: -50, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle at 25% 25%, #FFFFFF 2px, transparent 2px),
                             radial-gradient(circle at 75% 75%, #FFFFFF 2px, transparent 2px)`,
            backgroundSize: '50px 50px, 80px 80px'
          }} />
        </div>
        
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <Image src="/icons/logo.svg" alt="Logo" width={48} height={48} className="absolute top-4 left-4 w-12 h-12 object-contain" />
        </motion.div>
        
        <motion.div 
          className="mt-16 relative z-10"
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.5 }}
        >
          <h2 className="text-3xl md:text-4xl font-bold leading-tight">
            Complete your <br />
            parent profile <br />
            and <span className="text-amber-400 font-extrabold bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">Monitor your<br />Child&apos;s Progress.</span>
          </h2>
          <motion.p 
            className="text-lg text-purple-100 mt-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.8 }}
          >
            Track achievements, monitor progress, and support your child's learning journey
          </motion.p>
        </motion.div>
        
        <motion.div
          initial={{ scale: 0.8, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.7 }}
        >
          <Image src="/landingPage.png" alt="Mascot" width={224} height={256} className="w-56 md:w-64 mx-auto mt-8 relative z-10" />
        </motion.div>
      </motion.section>

      {/* ⬜ Right Section - Enhanced White with Grid */}
      <motion.section 
        className="w-full md:w-1/2 bg-white px-6 py-8 flex flex-col justify-center relative overflow-hidden"
        initial={{ x: 50, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        style={{
          backgroundImage: `
            linear-gradient(rgba(0,0,0,0.02) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0,0,0,0.02) 1px, transparent 1px)
          `,
          backgroundSize: '20px 20px'
        }}
      >
        {/* Enhanced Background Effects */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-50/30 via-pink-50/20 to-blue-50/30 pointer-events-none" />
        <div className="absolute top-10 right-10 w-32 h-32 bg-gradient-to-br from-purple-200/20 to-pink-200/20 rounded-full blur-3xl" />
        <div className="absolute bottom-10 left-10 w-24 h-24 bg-gradient-to-br from-blue-200/20 to-cyan-200/20 rounded-full blur-2xl" />
        
        {/* Google Translate */}
        <div className="absolute top-6 right-6 z-20">
        </div>

        <motion.div 
          className="max-w-md mx-auto w-full"
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.4 }}
        >
          {/* Enhanced Onboarding Form Container */}
          <motion.div 
            className="bg-white rounded-3xl shadow-2xl p-8 border border-gray-200/50 relative overflow-hidden"
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            {/* Background gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-purple-50/50 via-pink-50/30 to-blue-50/50 pointer-events-none" />
            
            <motion.div 
              className="text-center mb-6 relative z-10"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.8 }}
            >
              <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-3">
                Parent Onboarding
              </h1>
              <p className="text-gray-600 text-lg">
                Complete your profile to monitor your child&apos;s progress
              </p>
              
              <motion.div 
                className="flex justify-center mt-6 space-x-8"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 1.0 }}
              >
                {[
                  { step: 1, label: 'Personal Info' },
                  { step: 2, label: 'Address' },
                  { step: 3, label: 'Link Student' },
                  { step: 4, label: 'Consent' }
                ].map(({ step, label }, index) => (
                  <motion.div 
                    key={step} 
                    className="flex flex-col items-center"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 1.2 + index * 0.1 }}
                  >
                    <motion.div 
                      className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shadow-lg transition-all duration-300 ${
                        currentStep >= step 
                          ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white' 
                          : 'bg-gray-200 text-gray-500'
                      }`}
                      whileHover={{ scale: 1.1 }}
                    >
                      {step}
                    </motion.div>
                    <span className="text-xs text-gray-500 mt-2 font-medium">{label}</span>
                  </motion.div>
                ))}
              </motion.div>
            </motion.div>

            <div className="space-y-6">
              {renderCurrentStep()}

              <div className="flex justify-between pt-4">
                <button
                  onClick={handlePrevious}
                  disabled={currentStep === 1}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                >
                  Previous
                </button>
                
                {currentStep < 4 ? (
                  <button
                    onClick={handleNext}
                    className="px-6 py-2 bg-[#7F00FF] text-white rounded-lg hover:bg-[#6B00E6] transition-all duration-200"
                  >
                    Next
                  </button>
                ) : (
                  <button
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="px-6 py-2 bg-[#7F00FF] text-white rounded-lg hover:bg-[#6B00E6] disabled:opacity-50 transition-all duration-200"
                  >
                    {isSubmitting ? 'Submitting...' : 'Complete Onboarding'}
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      </motion.section>

      {/* Terms and Conditions Modal */}
      <AnimatePresence>
        {showTermsModal && (
          <motion.div
            className="fixed inset-0 z-50 bg-black bg-opacity-60 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowTermsModal(false)}
          >
            <motion.div
              className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">Terms and Conditions</h2>
                <button
                  onClick={() => setShowTermsModal(false)}
                  className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
                >
                  ×
                </button>
              </div>
              <div
                className="px-6 py-4 overflow-y-auto flex-1"
                onScroll={(e) => {
                  const target = e.target as HTMLElement;
                  const scrollPercentage = (target.scrollTop + target.clientHeight) / target.scrollHeight;
                  if (scrollPercentage >= 0.95) {
                    setHasReadTerms(true);
                  }
                }}
              >
                <div className="prose max-w-none">
                  <h3 className="text-xl font-semibold mb-4">1. Acceptance of Terms</h3>
                  <p className="text-gray-700 mb-4">
                    By accessing and using Taru Learning platform, you accept and agree to be bound by the terms and provision of this agreement.
                  </p>
                  
                  <h3 className="text-xl font-semibold mb-4">2. Use License</h3>
                  <p className="text-gray-700 mb-4">
                    Permission is granted to temporarily access the materials on Taru Learning's platform for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, and under this license you may not:
                  </p>
                  <ul className="list-disc pl-6 mb-4 text-gray-700">
                    <li>Modify or copy the materials</li>
                    <li>Use the materials for any commercial purpose or for any public display</li>
                    <li>Attempt to reverse engineer any software contained on Taru Learning's platform</li>
                    <li>Remove any copyright or other proprietary notations from the materials</li>
                  </ul>

                  <h3 className="text-xl font-semibold mb-4">3. User Account</h3>
                  <p className="text-gray-700 mb-4">
                    You are responsible for maintaining the confidentiality of your account and password. You agree to accept responsibility for all activities that occur under your account.
                  </p>

                  <h3 className="text-xl font-semibold mb-4">4. Privacy Policy</h3>
                  <p className="text-gray-700 mb-4">
                    Your use of Taru Learning is also governed by our Privacy Policy. Please review our Privacy Policy to understand our practices.
                  </p>

                  <h3 className="text-xl font-semibold mb-4">5. Educational Content</h3>
                  <p className="text-gray-700 mb-4">
                    All educational content provided on Taru Learning is for educational purposes only. We strive to provide accurate information but do not guarantee the completeness or accuracy of all content.
                  </p>

                  <h3 className="text-xl font-semibold mb-4">6. Limitation of Liability</h3>
                  <p className="text-gray-700 mb-4">
                    In no event shall Taru Learning or its suppliers be liable for any damages arising out of the use or inability to use the materials on Taru Learning's platform.
                  </p>

                  <h3 className="text-xl font-semibold mb-4">7. Revisions</h3>
                  <p className="text-gray-700 mb-4">
                    Taru Learning may revise these terms of service at any time without notice. By using this platform you are agreeing to be bound by the then current version of these terms of service.
                  </p>

                  <h3 className="text-xl font-semibold mb-4">8. Contact Information</h3>
                  <p className="text-gray-700 mb-4">
                    If you have any questions about these Terms and Conditions, please contact us at support@tarulearning.com
                  </p>
                </div>
              </div>
              <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
                <button
                  onClick={() => {
                    setShowTermsModal(false);
                    if (hasReadTerms) {
                      setHasReadTerms(true);
                    }
                  }}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all duration-200"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    setHasReadTerms(true);
                    setShowTermsModal(false);
                  }}
                  disabled={!hasReadTerms}
                  className={`px-6 py-2 rounded-lg transition-all duration-200 ${
                    hasReadTerms
                      ? 'bg-gradient-to-r from-[#8B3DFF] to-[#6D18CE] text-white hover:shadow-lg'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  I Have Read and Understand
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Privacy and Consent Modal */}
      <AnimatePresence>
        {showPrivacyModal && (
          <motion.div
            className="fixed inset-0 z-50 bg-black bg-opacity-60 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowPrivacyModal(false)}
          >
            <motion.div
              className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">Privacy Policy & Data Usage Consent</h2>
                <button
                  onClick={() => setShowPrivacyModal(false)}
                  className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
                >
                  ×
                </button>
              </div>
              <div
                className="px-6 py-4 overflow-y-auto flex-1"
                onScroll={(e) => {
                  const target = e.target as HTMLElement;
                  const scrollPercentage = (target.scrollTop + target.clientHeight) / target.scrollHeight;
                  if (scrollPercentage >= 0.95) {
                    setHasReadPrivacy(true);
                  }
                }}
              >
                <div className="prose max-w-none">
                  <h3 className="text-xl font-semibold mb-4">1. Information We Collect</h3>
                  <p className="text-gray-700 mb-4">
                    Taru Learning collects information that you provide directly to us, including:
                  </p>
                  <ul className="list-disc pl-6 mb-4 text-gray-700">
                    <li>Personal information (name, date of birth, contact information)</li>
                    <li>Educational information (grade, subjects, learning preferences)</li>
                    <li>Learning progress and performance data</li>
                    <li>Device information and usage patterns</li>
                  </ul>

                  <h3 className="text-xl font-semibold mb-4">2. How We Use Your Information</h3>
                  <p className="text-gray-700 mb-4">
                    We use the information we collect to:
                  </p>
                  <ul className="list-disc pl-6 mb-4 text-gray-700">
                    <li>Provide personalized learning experiences tailored to your needs</li>
                    <li>Track learning progress and identify areas for improvement</li>
                    <li>Communicate with you about your account and learning journey</li>
                    <li>Enable parents to monitor their child&apos;s progress</li>
                    <li>Improve our platform and develop new educational features</li>
                    <li>Ensure platform security and prevent fraud</li>
                  </ul>

                  <h3 className="text-xl font-semibold mb-4">3. Data Sharing and Disclosure</h3>
                  <p className="text-gray-700 mb-4">
                    We do not sell your personal information. We may share your information only in the following circumstances:
                  </p>
                  <ul className="list-disc pl-6 mb-4 text-gray-700">
                    <li>With your parent or guardian (for students under 18)</li>
                    <li>With your school or educational institution (if applicable)</li>
                    <li>With service providers who assist us in operating our platform</li>
                    <li>When required by law or to protect our rights</li>
                  </ul>

                  <h3 className="text-xl font-semibold mb-4">4. Data Security</h3>
                  <p className="text-gray-700 mb-4">
                    We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction.
                  </p>

                  <h3 className="text-xl font-semibold mb-4">5. Your Rights</h3>
                  <p className="text-gray-700 mb-4">
                    You have the right to:
                  </p>
                  <ul className="list-disc pl-6 mb-4 text-gray-700">
                    <li>Access your personal information</li>
                    <li>Request correction of inaccurate information</li>
                    <li>Request deletion of your information</li>
                    <li>Withdraw consent at any time</li>
                  </ul>

                  <h3 className="text-xl font-semibold mb-4">6. Children's Privacy</h3>
                  <p className="text-gray-700 mb-4">
                    Taru Learning is designed for children and complies with applicable children's privacy laws. We require parental consent for users under 13 years of age.
                  </p>

                  <h3 className="text-xl font-semibold mb-4">7. Data Retention</h3>
                  <p className="text-gray-700 mb-4">
                    We retain your information for as long as your account is active or as needed to provide you services. We may retain certain information for legitimate business purposes or as required by law.
                  </p>

                  <h3 className="text-xl font-semibold mb-4">8. Changes to This Policy</h3>
                  <p className="text-gray-700 mb-4">
                    We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last Updated" date.
                  </p>

                  <h3 className="text-xl font-semibold mb-4">9. Contact Us</h3>
                  <p className="text-gray-700 mb-4">
                    If you have any questions about this Privacy Policy, please contact us at privacy@tarulearning.com
                  </p>
                </div>
              </div>
              <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
                <button
                  onClick={() => {
                    setShowPrivacyModal(false);
                    if (hasReadPrivacy) {
                      setHasReadPrivacy(true);
                    }
                  }}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all duration-200"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    setHasReadPrivacy(true);
                    setShowPrivacyModal(false);
                  }}
                  disabled={!hasReadPrivacy}
                  className={`px-6 py-2 rounded-lg transition-all duration-200 ${
                    hasReadPrivacy
                      ? 'bg-gradient-to-r from-[#8B3DFF] to-[#6D18CE] text-white hover:shadow-lg'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  I Have Read and Understand
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.main>
  );
} 