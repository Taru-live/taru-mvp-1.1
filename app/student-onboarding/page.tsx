'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';

import { RegistrationDataManager } from '@/lib/utils';
import { StudentKeyGenerator } from '@/lib/studentKeyGenerator';
import ConsistentLoadingPage from '../components/ConsistentLoadingPage';



interface StudentOnboardingData {
  // Personal Information (pre-filled from registration)
  fullName: string;
  nickname: string;
  dateOfBirth: string;
  age: number;
  gender: string;
  classGrade: string;
  schoolName: string;
  schoolId: string;
  
  // Preferences
  languagePreference: string;
  learningModePreference: string[];
  interestsOutsideClass: string[];
  preferredCareerDomains: string[];
  favoriteSubjects: string[];
  preferredLearningStyles: string[];
  
  // Guardian Information
  guardianName: string;
  guardianContactNumber: string;
  guardianEmail: string;
  
  // Location and Technical
  location: string;
  deviceId: string;
  
  // Consent
  consentForDataUsage: boolean;
  termsAndConditionsAccepted: boolean;
  
  // Student ID
  uniqueId: string;
}

const languageOptions = [
  'English', 'Hindi', 'Bengali', 'Telugu', 'Marathi', 'Tamil', 'Gujarati', 'Urdu',
  'Kannada', 'Odia', 'Malayalam', 'Punjabi', 'Assamese', 'Bhojpuri', 'Sanskrit',
  'Kashmiri', 'Konkani', 'Manipuri', 'Nepali', 'Sindhi', 'Other'
];

const learningModes = [
  'Visual Learning', 'Auditory Learning', 'Reading/Writing', 'Kinesthetic Learning',
  'Group Learning', 'Individual Learning', 'Online Learning', 'Hands-on Practice'
];

const interests = [
  'Sports', 'Music', 'Art', 'Reading', 'Technology', 'Science', 'Cooking', 'Travel',
  'Photography', 'Dancing', 'Gaming', 'Nature', 'Puzzles', 'Writing', 'Crafts', 'Other'
];

const careerDomains = [
  'Technology', 'Healthcare', 'Business', 'Arts', 'Science', 'Engineering',
  'Education', 'Law', 'Finance', 'Marketing', 'Design', 'Agriculture',
  'Sports', 'Media', 'Environment', 'Other'
];

const favoriteSubjects = [
  'Mathematics', 'Science', 'English', 'History', 'Geography', 'Physics',
  'Chemistry', 'Biology', 'Computer Science', 'Art', 'Music', 'Physical Education',
  'Social Studies', 'Literature', 'Economics', 'Psychology', 'Philosophy', 'Other'
];

const preferredLearningStyles = [
  'Visual Learning', 'Auditory Learning', 'Reading/Writing', 'Kinesthetic Learning',
  'Games and Interactive', 'Stories and Narratives', 'Videos and Animations',
  'Hands-on Practice', 'Group Discussions', 'Individual Study', 'Online Learning',
  'Project-based Learning', 'Problem-solving', 'Experiments', 'Field Trips', 'Other'
];

export default function StudentOnboarding() {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSuccess, setIsSuccess] = useState(false);
  const [uniqueId, setUniqueId] = useState('');
  const [countdown, setCountdown] = useState(3);

  const [copied, setCopied] = useState(false);
  const [showFavoriteSubjectsDropdown, setShowFavoriteSubjectsDropdown] = useState(false);
  const [showLearningStylesDropdown, setShowLearningStylesDropdown] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [datePickerMonth, setDatePickerMonth] = useState(new Date().getMonth());
  const [datePickerYear, setDatePickerYear] = useState(new Date().getFullYear());
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [hasReadTerms, setHasReadTerms] = useState(false);
  const [hasReadPrivacy, setHasReadPrivacy] = useState(false);

  // Date picker helper functions
  const formatDateDisplay = (dateString: string) => {
    if (!dateString) return 'Select your date of birth';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const getDaysInMonth = (month: number, year: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (month: number, year: number) => {
    return new Date(year, month, 1).getDay();
  };

  const handleDateSelect = (day: number) => {
    const selectedDate = new Date(datePickerYear, datePickerMonth, day);
    const formattedDate = selectedDate.toISOString().split('T')[0];
    handleInputChange('dateOfBirth', formattedDate);
    setShowDatePicker(false);
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      if (datePickerMonth === 0) {
        setDatePickerMonth(11);
        setDatePickerYear(datePickerYear - 1);
      } else {
        setDatePickerMonth(datePickerMonth - 1);
      }
    } else {
      if (datePickerMonth === 11) {
        setDatePickerMonth(0);
        setDatePickerYear(datePickerYear + 1);
      } else {
        setDatePickerMonth(datePickerMonth + 1);
      }
    }
  };

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.dropdown-container')) {
        setShowFavoriteSubjectsDropdown(false);
        setShowLearningStylesDropdown(false);
      }
      // Close date picker when clicking outside
      if (!target.closest('.date-picker-container')) {
        setShowDatePicker(false);
      }
    };

    if (showDatePicker) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDatePicker]);
  const [formData, setFormData] = useState<StudentOnboardingData>({
    fullName: '',
    nickname: '',
    dateOfBirth: '',
    age: 0,
    gender: '',
    classGrade: '',
    schoolName: 'Demo School', // Auto-filled based on entity
    schoolId: '',
    languagePreference: '',
    learningModePreference: [],
    interestsOutsideClass: [],
    preferredCareerDomains: [],
    favoriteSubjects: [],
    preferredLearningStyles: [],
    guardianName: '',
    guardianContactNumber: '',
    guardianEmail: '',
    location: '',
    deviceId: 'device_' + Math.random().toString(36).substr(2, 9),
    consentForDataUsage: false,
    termsAndConditionsAccepted: false,
    uniqueId: '' // Initialize uniqueId
  });

  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [autoFilledFields, setAutoFilledFields] = useState<{[key: string]: boolean}>({});
  const [isOrganizationStudent, setIsOrganizationStudent] = useState(false);
  const router = useRouter();

  // Auto-redirect to interest assessment after 3 seconds when onboarding is successful
  useEffect(() => {
    if (isSuccess) {
      setCountdown(3);
      
      const countdownInterval = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(countdownInterval);
            router.push('/interest-assessment');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(countdownInterval);
    }
  }, [isSuccess, router]);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(uniqueId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  };

  const shareViaWhatsApp = () => {
    const message = `Hi! My Taru Learning student ID is: ${uniqueId}. Please use this ID to link your parent account.`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const shareViaEmail = () => {
    const subject = 'My Taru Learning Student ID';
    const body = `Hi! My Taru Learning student ID is: ${uniqueId}. Please use this ID to link your parent account.`;
    const mailtoUrl = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(mailtoUrl);
  };

  const shareViaLink = () => {
    const shareUrl = `${window.location.origin}/register?role=parent&studentId=${uniqueId}`;
    if (navigator.share) {
      navigator.share({
        title: 'Taru Learning Student ID',
        text: `My student ID: ${uniqueId}`,
        url: shareUrl
      });
    } else {
      // Fallback to copying the link
      navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Fetch existing user data and registration data on component mount
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await fetch('/api/auth/me');
        if (response.ok) {
          const userData = await response.json();
          const user = userData.user;
          
          // Get registration data using utility function
          const registrationData = RegistrationDataManager.getRegistrationData();
          
          // Pre-fill form with existing data and registration data
          const newFormData = {
            ...formData,
            fullName: user.name || registrationData?.fullName || '',
            classGrade: user.profile?.grade || registrationData?.classGrade || '',
            languagePreference: user.profile?.language || registrationData?.language || '',
            location: user.profile?.location || registrationData?.location || '',
            guardianName: user.profile?.guardianName || registrationData?.guardianName || '',
            guardianEmail: registrationData?.email || '',
            // Age will be calculated from date of birth
            // Keep other fields empty for user to fill
          };
          
          setFormData(newFormData);
          
          // Track which fields were auto-filled
          const autoFilled: {[key: string]: boolean} = {};
          if (registrationData?.fullName) autoFilled.fullName = true;
          if (registrationData?.classGrade) autoFilled.classGrade = true;
          if (registrationData?.language) autoFilled.languagePreference = true;
          if (registrationData?.location) autoFilled.location = true;
          if (registrationData?.guardianName) autoFilled.guardianName = true;
          if (registrationData?.email) autoFilled.guardianEmail = true;
          
          setAutoFilledFields(autoFilled);
          
          // Check if student is from an organization
          try {
            const profileResponse = await fetch('/api/student/profile');
            if (profileResponse.ok) {
              const profileData = await profileResponse.json();
              setIsOrganizationStudent(profileData.isOrganizationStudent || false);
              
              // If student is from organization, pre-fill school name
              if (profileData.isOrganizationStudent && profileData.schoolName) {
                setFormData(prev => ({
                  ...prev,
                  schoolName: profileData.schoolName
                }));
              }
            }
          } catch (error) {
            console.error('Error fetching student profile:', error);
          }
          
          console.log('🔍 Pre-filled form data:', {
            userData: user,
            registrationData: registrationData,
            autoFilledFields: autoFilled
          });
        } else {
          router.push('/login');
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
        router.push('/login');
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, [router]);

  // Calculate age when date of birth changes
  useEffect(() => {
    if (formData.dateOfBirth) {
      const today = new Date();
      const birthDate = new Date(formData.dateOfBirth);
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      
      setFormData(prev => ({ ...prev, age }));
      
      // Update date picker month/year to match selected date
      setDatePickerMonth(birthDate.getMonth());
      setDatePickerYear(birthDate.getFullYear());
    }
  }, [formData.dateOfBirth]);

  // Auto-detect location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setFormData(prev => ({ 
            ...prev, 
            location: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}` 
          }));
        },
        () => {
          setFormData(prev => ({ ...prev, location: 'Location not available' }));
        }
      );
    }
  }, []);

  const validateStep = (step: number): boolean => {
    const newErrors: {[key: string]: string} = {};

    switch (step) {
      case 1:
        // Basic info and guardian info validation
        if (!formData.dateOfBirth) {
          newErrors.dateOfBirth = 'Date of birth is required';
        } else {
          // Check if user is at least 5 years old
          const today = new Date();
          const birthDate = new Date(formData.dateOfBirth);
          let age = today.getFullYear() - birthDate.getFullYear();
          const monthDiff = today.getMonth() - birthDate.getMonth();
          
          if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--;
          }
          
          if (age < 5) {
            newErrors.dateOfBirth = 'You must be at least 5 years old to use this platform';
          }
        }
        if (!formData.gender) newErrors.gender = 'Gender is required';
        if (!formData.guardianName.trim()) newErrors.guardianName = 'Guardian name is required';
        if (!formData.languagePreference) newErrors.languagePreference = 'Language preference is required';
        if (!formData.schoolId.trim() || formData.schoolId.trim() === '') {
          newErrors.schoolId = 'School ID is required (enter 0 if not applicable)';
        }
        if (formData.favoriteSubjects.length === 0) {
          newErrors.favoriteSubjects = 'Please select at least one favorite subject';
        }
        if (formData.preferredLearningStyles.length === 0) {
          newErrors.preferredLearningStyles = 'Please select at least one preferred learning style';
        }
        break;
      
      case 2:
        if (!formData.guardianContactNumber.trim()) {
          newErrors.guardianContactNumber = 'Guardian contact number is required';
        }
        if (formData.guardianEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.guardianEmail)) {
          newErrors.guardianEmail = 'Please enter a valid email address';
        }
        break;
      
      case 3:
        // Privacy and consent validation
        if (!formData.consentForDataUsage) {
          newErrors.consentForDataUsage = 'Data usage consent is required';
        }
        if (!formData.termsAndConditionsAccepted) {
          newErrors.termsAndConditionsAccepted = 'Terms and conditions must be accepted';
        }
        break;
      

    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 3));
    }
  };

  const handlePrevious = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleInputChange = (field: keyof StudentOnboardingData, value: string | number | boolean | string[]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Validate age if date of birth is being changed
    if (field === 'dateOfBirth' && typeof value === 'string' && value) {
      const today = new Date();
      const birthDate = new Date(value);
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      
      if (age < 5) {
        setErrors(prev => ({
          ...prev,
          dateOfBirth: 'You must be at least 5 years old to use this platform'
        }));
      } else {
        // Clear error if age is valid
        setErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors.dateOfBirth;
          return newErrors;
        });
      }
    } else {
      // Clear error when user starts typing for other fields
      if (errors[field as string]) {
        setErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors[field as string];
          return newErrors;
        });
      }
    }
  };

  const handleMultiSelect = (field: keyof StudentOnboardingData, value: string) => {
    const currentValues = formData[field] as string[];
    if (currentValues.includes(value)) {
      handleInputChange(field, currentValues.filter(v => v !== value));
    } else {
      handleInputChange(field, [...currentValues, value]);
    }
  };

  const handleSubmit = async () => {
    if (!validateStep(3)) return;

    setIsSubmitting(true);
    try {
      // Generate unique student ID using centralized generator
      const generatedUniqueId = StudentKeyGenerator.generate();
      
      // Update form data with generated unique ID
      const formDataWithUniqueId = {
        ...formData,
        uniqueId: generatedUniqueId
      };
      
      console.log('🔍 Submitting form data:', formDataWithUniqueId);
      
      const formDataToSend = new FormData();
      
      // Append all form data including uniqueId
      for (const [key, value] of Object.entries(formDataWithUniqueId)) {
        if (Array.isArray(value)) {
          formDataToSend.append(key, JSON.stringify(value));
        } else {
          formDataToSend.append(key, String(value));
        }
      }

      console.log('🔍 FormData entries:');
      for (const [key, value] of formDataToSend.entries()) {
        console.log(`🔍 ${key}:`, value);
      }

      const response = await fetch('/api/student/onboarding', {
        method: 'POST',
        body: formDataToSend,
      });

      console.log('🔍 Response status:', response.status);
      console.log('🔍 Response ok:', response.ok);
      console.log('🔍 Response headers:', Object.fromEntries(response.headers.entries()));
      console.log('🔍 Response url:', response.url);

      if (response.ok) {
        const result = await response.json();
        console.log('🔍 Success result:', result);
        setUniqueId(result.uniqueId || generatedUniqueId);
        setIsSuccess(true);
        
        // Clear registration data after successful onboarding
        RegistrationDataManager.clearRegistrationData();
        
      } else {
        let errorData: any = {};
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        
        try {
          const responseText = await response.text();
          console.error('🔍 Error response text:', responseText);
          
          if (responseText && responseText.trim() !== '') {
            try {
              errorData = JSON.parse(responseText);
              console.error('🔍 Parsed error response:', errorData);
            } catch (parseError) {
              console.error('🔍 Failed to parse error response as JSON:', parseError);
              errorData = { error: responseText };
            }
          } else {
            console.error('🔍 Empty error response received');
            errorData = { error: 'Empty response from server' };
          }
          
          // Extract error message with fallbacks
          errorMessage = errorData?.error || 
                        errorData?.message || 
                        errorData?.details || 
                        (typeof errorData === 'string' ? errorData : '') ||
                        `Server error (${response.status})`;
                        
        } catch (responseError) {
          console.error('🔍 Failed to read error response:', responseError);
          errorMessage = `Failed to read server response (${response.status})`;
        }
        
        console.error('🔍 Final error message:', errorMessage);
        throw new Error(errorMessage);
      }
    } catch (error: unknown) {
      console.error('🔍 Onboarding submission error:', error);
      console.error('🔍 Error message:', error instanceof Error ? error.message : 'Unknown error');
      alert(`Failed to submit onboarding data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <ConsistentLoadingPage
        type="onboarding"
        title="Loading Profile"
        subtitle="Setting up your personalized learning profile..."
        tips={[
          'Loading your registration data',
          'Preparing your student profile',
          'Setting up your learning preferences'
        ]}
      />
    );
  }


  if (isSuccess) {
    return (
      <main className="h-screen flex flex-col md:flex-row bg-white overflow-hidden">
        <div className="w-full md:w-1/2 bg-gradient-to-br from-[#8B3DFF] to-[#6D18CE] px-6 py-8 text-white flex flex-col relative">
                  <Image src="/icons/logo.svg" alt="Logo" width={60} height={60} className="w-15 h-15 object-contain mb-8" />
        
        <div className="flex-1 flex flex-col justify-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-12 px-4">
            Welcome to <span className="text-white/90">Taru!</span>
          </h1>
          <p className="text-xl px-4 text-white/80">Your onboarding is complete!</p>
        </div>
        </div>
        <div className="w-full md:w-1/2 bg-white px-4 sm:px-8 py-10 flex flex-col justify-center overflow-y-auto">
          <div className="max-w-md mx-auto w-full text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">✅</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Onboarding Complete!</h1>
            <p className="text-gray-600 mb-4">
              Your unique student ID is
            </p>
            <div className="bg-purple-100 border-2 border-purple-300 rounded-lg p-4 mb-4">
              <p className="text-2xl font-bold text-purple-700">{uniqueId}</p>
            </div>
            
            {/* Share Instructions */}
            <p className="text-sm text-gray-600 mb-4">
              Share this ID with your parent to link their account
            </p>

            {/* Share Buttons */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <button
                onClick={copyToClipboard}
                className="flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2 px-4 rounded-lg transition-colors"
              >
                <span className="text-lg">📋</span>
                {copied ? 'Copied!' : 'Copy Code'}
              </button>
              
              <button
                onClick={shareViaLink}
                className="flex items-center justify-center gap-2 bg-blue-100 hover:bg-blue-200 text-blue-700 font-medium py-2 px-4 rounded-lg transition-colors"
              >
                <span className="text-lg">🔗</span>
                Share Link
              </button>
            </div>

            {/* Social Share Buttons */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              <button
                onClick={shareViaWhatsApp}
                className="flex items-center justify-center gap-2 bg-green-100 hover:bg-green-200 text-green-700 font-medium py-2 px-4 rounded-lg transition-colors"
              >
                <span className="text-lg">📱</span>
                Share via WhatsApp
              </button>
              
              <button
                onClick={shareViaEmail}
                className="flex items-center justify-center gap-2 bg-red-100 hover:bg-red-200 text-red-700 font-medium py-2 px-4 rounded-lg transition-colors"
              >
                <span className="text-lg">📧</span>
                Share via Email
              </button>
            </div>

            {/* Redirect Message */}
            <div className="text-center mb-4">
              <p className="text-gray-600 text-sm mb-2">
                Redirecting to interest assessment in
              </p>
              <div className="text-4xl font-bold text-purple-600 mb-2">
                {countdown}
              </div>
              <p className="text-gray-500 text-xs">
                {countdown > 1 ? 'seconds' : 'second'}...
              </p>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => router.push('/interest-assessment')}
                className="w-full bg-purple-600 text-white font-semibold py-3 px-6 rounded-lg hover:bg-purple-700 transition-colors"
              >
                Take Interest Assessment Now
              </button>
              <button
                onClick={() => router.push('/dashboard/student')}
                className="w-full bg-gray-100 text-gray-700 font-semibold py-3 px-6 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Continue to Dashboard
              </button>
            </div>
          </div>
        </div>
      </main>
    );
  }

  const renderStep1 = () => (
    <div className="space-y-4">
      <div>
        <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
          Full Name
          {autoFilledFields.fullName && (
            <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
              Auto-filled from registration
            </span>
          )}
        </label>
        <input
          type="text"
          value={formData.fullName}
          disabled
          className={`w-full px-4 py-2 border rounded-lg ${
            autoFilledFields.fullName 
              ? 'border-green-300 bg-green-50 text-green-700' 
              : 'border-gray-300 bg-gray-50 text-gray-500'
          }`}
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Nickname
        </label>
        <input
          type="text"
          value={formData.nickname}
          onChange={(e) => handleInputChange('nickname', e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-300"
          placeholder="Enter your nickname"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Date of Birth *
        </label>
        <input
          type="date"
          value={formData.dateOfBirth}
          onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-300"
        />
        {errors.dateOfBirth && <p className="text-red-500 text-sm mt-1">{errors.dateOfBirth}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Age
        </label>
        <input
          type="number"
          value={formData.age}
          disabled
          className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Gender *
        </label>
        <select
          value={formData.gender}
          onChange={(e) => handleInputChange('gender', e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-300"
        >
          <option value="">Select gender</option>
          <option value="male">Male</option>
          <option value="female">Female</option>
          <option value="other">Other</option>
        </select>
        {errors.gender && <p className="text-red-500 text-sm mt-1">{errors.gender}</p>}
      </div>

      <div>
        <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
          Class/Grade
          {autoFilledFields.classGrade && (
            <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
              Auto-filled from registration
            </span>
          )}
        </label>
        <input
          type="text"
          value={formData.classGrade}
          disabled
          className={`w-full px-4 py-2 border rounded-lg ${
            autoFilledFields.classGrade 
              ? 'border-green-300 bg-green-50 text-green-700' 
              : 'border-gray-300 bg-gray-50 text-gray-500'
          }`}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          School Name {isOrganizationStudent ? '(Pre-filled by your organization)' : '(Auto-filled)'}
        </label>
        <input
          type="text"
          value={formData.schoolName}
          disabled
          className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
        />
        {isOrganizationStudent && (
          <p className="mt-1 text-xs text-gray-500">
            This field is pre-filled by your organization and cannot be changed.
          </p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          School ID *
        </label>
        <input
          type="text"
          value={formData.schoolId}
          onChange={(e) => handleInputChange('schoolId', e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-300"
          placeholder="Enter your school ID"
        />
        {errors.schoolId && <p className="text-red-500 text-sm mt-1">{errors.schoolId}</p>}
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Language Preference *
        </label>
        <select
          value={formData.languagePreference}
          onChange={(e) => handleInputChange('languagePreference', e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-300"
        >
          <option value="">Select preferred language</option>
          {languageOptions.map((lang) => (
            <option key={lang} value={lang}>{lang}</option>
          ))}
        </select>
        {errors.languagePreference && <p className="text-red-500 text-sm mt-1">{errors.languagePreference}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Learning Mode Preferences * (Select all that apply)
        </label>
        <div className="grid grid-cols-2 gap-2">
          {learningModes.map((mode) => (
            <label key={mode} className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={formData.learningModePreference.includes(mode)}
                onChange={() => handleMultiSelect('learningModePreference', mode)}
                className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
              />
              <span className="text-sm text-gray-800">{mode}</span>
            </label>
          ))}
        </div>
        {errors.learningModePreference && <p className="text-red-500 text-sm mt-1">{errors.learningModePreference}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Interests Outside Class (Select all that apply)
        </label>
        <div className="grid grid-cols-2 gap-2">
          {interests.map((interest) => (
            <label key={interest} className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={formData.interestsOutsideClass.includes(interest)}
                onChange={() => handleMultiSelect('interestsOutsideClass', interest)}
                className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
              />
              <span className="text-sm text-gray-800">{interest}</span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Preferred Career Domains (Select all that apply)
        </label>
        <div className="grid grid-cols-2 gap-2">
          {careerDomains.map((domain) => (
            <label key={domain} className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={formData.preferredCareerDomains.includes(domain)}
                onChange={() => handleMultiSelect('preferredCareerDomains', domain)}
                className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
              />
              <span className="text-sm text-gray-800">{domain}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Guardian Name *
        </label>
        <input
          type="text"
          value={formData.guardianName}
          onChange={(e) => handleInputChange('guardianName', e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-300"
          placeholder="Enter guardian's full name"
        />
        {errors.guardianName && <p className="text-red-500 text-sm mt-1">{errors.guardianName}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Guardian Contact Number *
        </label>
        <input
          type="tel"
          value={formData.guardianContactNumber}
          onChange={(e) => handleInputChange('guardianContactNumber', e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-300"
          placeholder="Enter guardian's contact number"
        />
        {errors.guardianContactNumber && <p className="text-red-500 text-sm mt-1">{errors.guardianContactNumber}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Guardian Email
        </label>
        <input
          type="email"
          value={formData.guardianEmail}
          onChange={(e) => handleInputChange('guardianEmail', e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-300"
          placeholder="Enter guardian's email (optional)"
        />
        {errors.guardianEmail && <p className="text-red-500 text-sm mt-1">{errors.guardianEmail}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Location (Auto-detected)
        </label>
        <input
          type="text"
          value={formData.location}
          disabled
          className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
        />
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-4">
      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-purple-800 mb-2">Data Usage Consent</h3>
        <p className="text-sm text-purple-700 mb-3">
          By accepting this consent, you agree to allow Taru Learning to collect, process, and use your learning data 
          to provide personalized educational experiences and track your progress.
        </p>
        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={formData.consentForDataUsage}
            onChange={(e) => handleInputChange('consentForDataUsage', e.target.checked)}
            className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
          />
          <span className="text-sm text-purple-700">I consent to the collection and use of my learning data *</span>
        </label>
        {errors.consentForDataUsage && <p className="text-red-500 text-sm mt-1">{errors.consentForDataUsage}</p>}
      </div>

      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-2">Terms and Conditions</h3>
        <p className="text-sm text-gray-700 mb-3">
          Please read and accept our terms and conditions to continue using the platform.
        </p>
        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={formData.termsAndConditionsAccepted}
            onChange={(e) => handleInputChange('termsAndConditionsAccepted', e.target.checked)}
            className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
          />
                      <span className="text-sm text-gray-800">I accept the terms and conditions *</span>
        </label>
        {errors.termsAndConditionsAccepted && <p className="text-red-500 text-sm mt-1">{errors.termsAndConditionsAccepted}</p>}
      </div>
    </div>
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
    <main className="h-screen flex flex-col md:flex-row overflow-hidden">
      {/* 🟪 Left Section - Students Details */}
      <section className="w-full md:w-1/2 bg-gradient-to-br from-[#8B3DFF] to-[#6D18CE] px-6 py-8 text-white flex flex-col relative m-4 rounded-2xl border-2">
        <Image src="/icons/logo.svg" alt="Logo" width={60} height={60} className="w-15 h-15 object-contain mb-8" />
        
        <div className="flex-1 flex flex-col justify-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-12 px-4">
            Student <span className="text-white/90">Details</span>
          </h1>
          
          {/* Progress Steps */}
          <div className="px-4 space-y-3">
            {[
              { step: 1, label: 'Personal Information', description: 'Basic details about you' },
              { step: 2, label: 'Learning Preferences', description: 'How you like to learn' },
              { step: 3, label: 'Guardian Details', description: 'Parent/Guardian information' },
              { step: 4, label: 'Consent & Terms', description: 'Agreements and permissions' }
            ].map(({ step, label, description }) => (
              <div key={step} className="flex items-start">
                <div className="flex flex-col items-center">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold ${
                    step === currentStep 
                      ? 'bg-white text-purple-600' 
                      : step < currentStep 
                        ? 'bg-white/80 text-purple-600' 
                        : 'bg-white/20 text-white/60'
                  }`}>
                    {step}
                  </div>
                  {step < 4 && (
                    <div className={`w-px h-8 mt-4 ${
                      step < currentStep ? 'bg-white/80' : 'bg-white/20'
                    }`} />
                  )}
                </div>
                <div className="ml-4 flex-1">
                  <h3 className={`text-sm font-semibold ${
                    step === currentStep 
                      ? 'text-white' 
                      : step < currentStep 
                        ? 'text-white/90' 
                        : 'text-white/60'
                  }`}>
                    {label}
                  </h3>
                  <p className={`text-xs mt-1 ${
                    step === currentStep 
                      ? 'text-white/80' 
                      : step < currentStep 
                        ? 'text-white/70' 
                        : 'text-white/50'
                  }`}>
                    {description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ⬜ Right Section - Getting to Know You */}
      <section className="w-full md:w-1/2 bg-white px-8 py-8 flex flex-col relative overflow-y-auto">

        <div className="max-w-2xl mx-auto w-full mt-3 md:mt-4 lg:mt-6 rounded-2xl border-2 border-purple-200 p-6 md:p-8 lg:p-10 bg-white shadow-lg">
          {/* Header */}
          <div className="text-center mb-8 relative">
            <div className="absolute top-0 right-0">
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Getting to Know You
              </h1>
          </div>

          {/* Form Content */}
          <div className="space-y-8">
            {currentStep === 1 && (
              <div>
                <h2 className="text-xl font-semibold text-purple-600 mb-6">Basic Info</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={formData.fullName}
                      disabled
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Guardian Name *
                    </label>
                    <input
                      type="text"
                      value={formData.guardianName}
                      onChange={(e) => handleInputChange('guardianName', e.target.value)}
                      placeholder="Enter guardian's full name"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white text-gray-900"
                    />
                    {errors.guardianName && <p className="text-red-500 text-sm mt-1">{errors.guardianName}</p>}
                  </div>
                  <div className="relative date-picker-container">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Date of Birth *
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowDatePicker(!showDatePicker)}
                      className="w-full px-4 py-3 pl-12 border-2 border-purple-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-gradient-to-r from-purple-50 to-pink-50 text-left text-gray-900 font-medium hover:border-purple-400 hover:shadow-md transition-all duration-200 flex items-center relative"
                    >
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                        <svg className="w-5 h-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <span className={`block ${formData.dateOfBirth ? 'text-purple-700' : 'text-gray-400'}`}>
                        {formatDateDisplay(formData.dateOfBirth)}
                      </span>
                    </button>
                    
                    {showDatePicker && (
                      <div className="absolute z-50 mt-2 w-full bg-white rounded-2xl shadow-2xl border-2 border-purple-200 overflow-hidden date-picker-container">
                        {/* Calendar Header */}
                        <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-4">
                          <div className="flex items-center justify-between mb-3">
                            <button
                              type="button"
                              onClick={() => navigateMonth('prev')}
                              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                            >
                              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                              </svg>
                            </button>
                            <h3 className="text-lg font-bold">
                              {monthNames[datePickerMonth]} {datePickerYear}
                            </h3>
                            <button
                              type="button"
                              onClick={() => navigateMonth('next')}
                              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                            >
                              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                            </button>
                          </div>
                          {/* Year Selector */}
                          <div className="flex items-center justify-center gap-2">
                            <button
                              type="button"
                              onClick={() => setDatePickerYear(datePickerYear - 1)}
                              className="px-3 py-1 hover:bg-white/20 rounded-lg transition-colors text-sm"
                            >
                              ‹
                            </button>
                            <span className="text-sm font-medium px-3">{datePickerYear}</span>
                            <button
                              type="button"
                              onClick={() => setDatePickerYear(datePickerYear + 1)}
                              className="px-3 py-1 hover:bg-white/20 rounded-lg transition-colors text-sm"
                            >
                              ›
                            </button>
                          </div>
                        </div>
                        
                        {/* Calendar Grid */}
                        <div className="p-4">
                          {/* Day Headers */}
                          <div className="grid grid-cols-7 gap-1 mb-2">
                            {dayNames.map((day) => (
                              <div key={day} className="text-center text-xs font-semibold text-gray-600 py-2">
                                {day}
                              </div>
                            ))}
                          </div>
                          
                          {/* Calendar Days */}
                          <div className="grid grid-cols-7 gap-1">
                            {Array.from({ length: getFirstDayOfMonth(datePickerMonth, datePickerYear) }).map((_, index) => (
                              <div key={`empty-${index}`} className="aspect-square"></div>
                            ))}
                            {Array.from({ length: getDaysInMonth(datePickerMonth, datePickerYear) }).map((_, index) => {
                              const day = index + 1;
                              const currentDate = new Date(datePickerYear, datePickerMonth, day);
                              const today = new Date();
                              today.setHours(0, 0, 0, 0);
                              const compareDate = new Date(datePickerYear, datePickerMonth, day);
                              compareDate.setHours(0, 0, 0, 0);
                              
                              const isToday = compareDate.getTime() === today.getTime();
                              const isSelected = formData.dateOfBirth && 
                                new Date(formData.dateOfBirth).toDateString() === currentDate.toDateString();
                              const isFuture = compareDate > today;
                              
                              return (
                                <button
                                  key={day}
                                  type="button"
                                  onClick={() => handleDateSelect(day)}
                                  disabled={isFuture}
                                  className={`aspect-square rounded-lg text-sm font-medium transition-all duration-200 ${
                                    isSelected
                                      ? 'bg-gradient-to-br from-purple-600 to-pink-600 text-white shadow-lg scale-110'
                                      : isToday
                                      ? 'bg-purple-100 text-purple-700 border-2 border-purple-400'
                                      : isFuture
                                      ? 'text-gray-300 cursor-not-allowed opacity-50'
                                      : 'text-gray-700 hover:bg-purple-50 hover:text-purple-700 hover:scale-105'
                                  }`}
                                >
                                  {day}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    )}
                    {errors.dateOfBirth && <p className="text-red-500 text-sm mt-1">{errors.dateOfBirth}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Gender *
                    </label>
                    <select
                      value={formData.gender}
                      onChange={(e) => handleInputChange('gender', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white text-gray-900"
                    >
                      <option value="">Select gender</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                    {errors.gender && <p className="text-red-500 text-sm mt-1">{errors.gender}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Location
                    </label>
                    <input
                      type="text"
                      value={formData.location}
                      onChange={(e) => handleInputChange('location', e.target.value)}
                      placeholder="Enter your location/city"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white text-gray-900"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Language Preference *
                    </label>
                    <select
                      value={formData.languagePreference}
                      onChange={(e) => handleInputChange('languagePreference', e.target.value)}
                      className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 ${
                        autoFilledFields.languagePreference 
                          ? 'border-green-300 bg-green-50 text-green-700' 
                          : 'border-gray-300 bg-white text-gray-900'
                      }`}
                    >
                      <option value="">Select language</option>
                      {languageOptions.map((lang) => (
                        <option key={lang} value={lang}>{lang}</option>
                      ))}
                    </select>
                    {autoFilledFields.languagePreference && (
                      <p className="text-xs text-green-600 mt-1">Auto-filled from registration</p>
                    )}
                    {errors.languagePreference && <p className="text-red-500 text-sm mt-1">{errors.languagePreference}</p>}
                  </div>
                </div>

                <div className="mt-8">
                  <h3 className="text-xl font-semibold text-purple-600 mb-6">School & Learning</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Class/Grade
                      </label>
                      <select
                        value={formData.classGrade}
                        onChange={(e) => handleInputChange('classGrade', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white text-gray-900"
                      >
                        <option value="">Select Grade</option>
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
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        School Name {isOrganizationStudent && <span className="text-sm text-gray-500">(Pre-filled by your organization)</span>}
                      </label>
                      <input
                        type="text"
                        value={formData.schoolName}
                        onChange={(e) => handleInputChange('schoolName', e.target.value)}
                        placeholder="Enter school name"
                        disabled={isOrganizationStudent}
                        className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-900 ${
                          isOrganizationStudent 
                            ? 'bg-gray-50 text-gray-500 cursor-not-allowed' 
                            : 'bg-white'
                        }`}
                      />
                      {isOrganizationStudent && (
                        <p className="mt-1 text-xs text-gray-500">
                          This field is pre-filled by your organization and cannot be changed.
                        </p>
                      )}
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="block text-sm font-medium text-gray-700">
                          School ID *
                        </label>
                        <span className="text-xs text-gray-500 italic">
                          If not applicable, enter 0
                        </span>
                      </div>
                      <input
                        type="text"
                        value={formData.schoolId}
                        onChange={(e) => handleInputChange('schoolId', e.target.value)}
                        placeholder="Enter your school ID"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white text-gray-900"
                      />
                      {errors.schoolId && <p className="text-red-500 text-sm mt-1">{errors.schoolId}</p>}
                    </div>
                    <div className="dropdown-container md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Favourite Subjects *
                      </label>
                      <div className="relative">
                        <div 
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white text-gray-900 min-h-[48px] flex flex-wrap gap-2 items-center cursor-pointer hover:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                          onClick={() => setShowFavoriteSubjectsDropdown(!showFavoriteSubjectsDropdown)}
                        >
                          {formData.favoriteSubjects.length === 0 ? (
                            <span className="text-gray-400">Select your favourite subjects</span>
                          ) : (
                            formData.favoriteSubjects.map((subject) => (
                              <span
                                key={subject}
                                className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-sm flex items-center gap-1"
                                onClick={(e) => e.stopPropagation()}
                              >
                                {subject}
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleMultiSelect('favoriteSubjects', subject);
                                  }}
                                  className="text-purple-600 hover:text-purple-800"
                                >
                                  ×
                                </button>
                              </span>
                            ))
                          )}
                        </div>
                        <div className="absolute inset-0 pointer-events-none">
                          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                            <svg 
                              className={`w-4 h-4 text-gray-400 transition-transform ${showFavoriteSubjectsDropdown ? 'rotate-180' : ''}`} 
                              fill="none" 
                              stroke="currentColor" 
                              viewBox="0 0 24 24"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </div>
                        </div>
                      </div>
                      {/* Dropdown Options */}
                      {showFavoriteSubjectsDropdown && (
                        <div className="mt-2 border border-gray-200 rounded-lg bg-white shadow-lg max-h-48 overflow-y-auto z-10 relative">
                          {favoriteSubjects.map((subject) => (
                            <label key={subject} className="flex items-center space-x-2 px-4 py-2 hover:bg-gray-50 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={formData.favoriteSubjects.includes(subject)}
                                onChange={() => handleMultiSelect('favoriteSubjects', subject)}
                                className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                              />
                              <span className="text-sm text-gray-800">{subject}</span>
                            </label>
                          ))}
                        </div>
                      )}
                      {errors.favoriteSubjects && <p className="text-red-500 text-sm mt-1">{errors.favoriteSubjects}</p>}
                    </div>
                    <div className="dropdown-container md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Preferred Learning Style *
                      </label>
                      <div className="relative">
                        <div 
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white text-gray-900 min-h-[48px] flex flex-wrap gap-2 items-center cursor-pointer hover:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          onClick={() => setShowLearningStylesDropdown(!showLearningStylesDropdown)}
                        >
                          {formData.preferredLearningStyles.length === 0 ? (
                            <span className="text-gray-400">Select your preferred learning styles</span>
                          ) : (
                            formData.preferredLearningStyles.map((style) => (
                              <span
                                key={style}
                                className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm flex items-center gap-1"
                                onClick={(e) => e.stopPropagation()}
                              >
                                {style}
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleMultiSelect('preferredLearningStyles', style);
                                  }}
                                  className="text-blue-600 hover:text-blue-800"
                                >
                                  ×
                                </button>
                              </span>
                            ))
                          )}
                        </div>
                        <div className="absolute inset-0 pointer-events-none">
                          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                            <svg 
                              className={`w-4 h-4 text-gray-400 transition-transform ${showLearningStylesDropdown ? 'rotate-180' : ''}`} 
                              fill="none" 
                              stroke="currentColor" 
                              viewBox="0 0 24 24"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </div>
                        </div>
                      </div>
                      {/* Dropdown Options */}
                      {showLearningStylesDropdown && (
                        <div className="mt-2 border border-gray-200 rounded-lg bg-white shadow-lg max-h-48 overflow-y-auto z-10 relative">
                          {preferredLearningStyles.map((style) => (
                            <label key={style} className="flex items-center space-x-2 px-4 py-2 hover:bg-gray-50 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={formData.preferredLearningStyles.includes(style)}
                                onChange={() => handleMultiSelect('preferredLearningStyles', style)}
                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                              />
                              <span className="text-sm text-gray-800">{style}</span>
                            </label>
                          ))}
                        </div>
                      )}
                      {errors.preferredLearningStyles && <p className="text-red-500 text-sm mt-1">{errors.preferredLearningStyles}</p>}
                    </div>
                  </div>
                </div>

                <div className="mt-12 text-center">
                  <button
                    onClick={handleNext}
                    className="bg-gradient-to-r from-[#8B3DFF] to-[#6D18CE] text-white px-12 py-4 rounded-full text-lg font-semibold hover:shadow-lg transition-all duration-200"
                  >
                    Explore your Strengths
                  </button>
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div>
                <h2 className="text-xl font-semibold text-purple-600 mb-6">Guardian Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Guardian Contact Number *
                    </label>
                    <input
                      type="tel"
                      value={formData.guardianContactNumber}
                      onChange={(e) => handleInputChange('guardianContactNumber', e.target.value)}
                      placeholder="Enter guardian's contact number"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white text-gray-900"
                    />
                    {errors.guardianContactNumber && <p className="text-red-500 text-sm mt-1">{errors.guardianContactNumber}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Guardian Email
                    </label>
                    <input
                      type="email"
                      value={formData.guardianEmail}
                      onChange={(e) => handleInputChange('guardianEmail', e.target.value)}
                      placeholder="Enter guardian's email (optional)"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white text-gray-900"
                    />
                    {errors.guardianEmail && <p className="text-red-500 text-sm mt-1">{errors.guardianEmail}</p>}
                  </div>
                </div>
              </div>
            )}

            {currentStep === 3 && (
              <div>
                <h2 className="text-xl font-semibold text-purple-600 mb-6">Privacy & Consent</h2>
            <div className="space-y-6">
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-lg font-semibold text-purple-800">Data Usage Consent</h3>
                      <button
                        type="button"
                        onClick={() => setShowPrivacyModal(true)}
                        className="text-sm text-purple-600 hover:text-purple-800 underline font-medium"
                      >
                        Read Privacy Policy
                      </button>
                    </div>
                    <p className="text-sm text-purple-700 mb-3">
                      By accepting this consent, you agree to allow Taru Learning to collect, process, and use your learning data 
                      to provide personalized educational experiences and track your progress.
                    </p>
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={formData.consentForDataUsage}
                        onChange={(e) => handleInputChange('consentForDataUsage', e.target.checked)}
                        disabled={!hasReadPrivacy}
                        className={`rounded border-gray-300 text-purple-600 focus:ring-purple-500 ${
                          !hasReadPrivacy ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                      />
                      <span className={`text-sm text-purple-700 ${!hasReadPrivacy ? 'opacity-50' : ''}`}>
                        I consent to the collection and use of my learning data *
                        {!hasReadPrivacy && <span className="block text-xs text-purple-600 mt-1">(Please read the Privacy Policy first)</span>}
                      </span>
                    </label>
                    {errors.consentForDataUsage && <p className="text-red-500 text-sm mt-1">{errors.consentForDataUsage}</p>}
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
                        checked={formData.termsAndConditionsAccepted}
                        onChange={(e) => handleInputChange('termsAndConditionsAccepted', e.target.checked)}
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
                    {errors.termsAndConditionsAccepted && <p className="text-red-500 text-sm mt-1">{errors.termsAndConditionsAccepted}</p>}
                  </div>
                </div>
              </div>
            )}

            {currentStep > 1 && (
              <div className="flex justify-between pt-4">
                <button
                  onClick={handlePrevious}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all duration-200"
                >
                  Previous
                </button>
                
                {currentStep < 3 ? (
                  <button
                    onClick={handleNext}
                    className="px-6 py-2 bg-gradient-to-r from-[#8B3DFF] to-[#6D18CE] text-white rounded-lg hover:shadow-lg transition-all duration-200"
                  >
                    Next
                  </button>
                ) : (
                  <button
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="px-6 py-2 bg-gradient-to-r from-[#8B3DFF] to-[#6D18CE] text-white rounded-lg hover:shadow-lg disabled:opacity-50 transition-all duration-200"
                  >
                    {isSubmitting ? 'Submitting...' : 'Complete Onboarding'}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </section>

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
                    <li>Track your learning progress and identify areas for improvement</li>
                    <li>Communicate with you about your account and learning journey</li>
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
    </main>
  );
} 