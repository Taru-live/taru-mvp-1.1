import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { 
  User, 
  Mail, 
  GraduationCap, 
  Building, 
  Globe, 
  Key, 
  Save, 
  X, 
  Edit3, 
  Check, 
  AlertCircle, 
  Eye, 
  EyeOff,
  Settings,
  Shield,
  Bell,
  Palette,
  Moon,
  Sun,
  Monitor
} from 'lucide-react';

interface ProfileData {
  name: string;
  email: string;
  grade: string;
  school: string;
  language: string;
  studentKey: string;
  nickname?: string;
  learningModePreference?: string;
  interestsOutsideClass?: string[];
  preferredCareerDomains?: string[];
  avatar?: string;
}

interface SettingsTabProps {
  profile: ProfileData;
  onProfileUpdate?: (updatedProfile: Partial<ProfileData>) => void;
  onAvatarChange?: (avatarPath: string) => void;
  availableAvatars?: string[];
}

export default function SettingsTab({ profile, onProfileUpdate }: SettingsTabProps) {
  // Monitoring: Log profile data for debugging and monitoring
  console.log('[SettingsTab] Profile data received:', {
    name: profile.name,
    email: profile.email,
    grade: profile.grade,
    school: profile.school,
    language: profile.language,
    studentKey: profile.studentKey,
  });
  
  const [isEditing, setIsEditing] = useState(false);
  const [editedProfile, setEditedProfile] = useState<ProfileData>({
    name: profile.name || '',
    email: profile.email || '',
    grade: profile.grade || '',
    school: profile.school || '',
    language: profile.language || 'English',
    studentKey: profile.studentKey || '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [hoveredField, setHoveredField] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'preferences' | 'security'>('profile');

  const handleInputChange = (field: keyof ProfileData, value: string) => {
    setEditedProfile(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: editedProfile.name,
          grade: editedProfile.grade,
          school: editedProfile.school,
          language: editedProfile.language,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update profile');
      }

      const data = await response.json();
      
      // Update the profile data using the response data
      if (onProfileUpdate && data.profile) {
        onProfileUpdate({
          name: data.profile.name,
          grade: data.profile.grade,
          school: data.profile.school,
          language: data.profile.language,
        });
      }

      setIsEditing(false);
      setSuccess('Profile updated successfully!');
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setEditedProfile({
      name: profile.name,
      email: profile.email,
      grade: profile.grade,
      school: profile.school,
      language: profile.language,
      studentKey: profile.studentKey,
    });
    setIsEditing(false);
    setError(null);
    setSuccess(null);
  };

  // Show loading state if profile data is not loaded
  if (!profile.name && !profile.email) {
    return (
      <motion.div 
        className="bg-white rounded-2xl shadow-xl p-4 sm:p-6 md:p-8 max-w-6xl mx-auto"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="flex items-center justify-center h-48 sm:h-64">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-sm sm:text-base text-gray-600">Loading profile data...</p>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div 
      className="bg-white rounded-2xl shadow-xl p-4 sm:p-6 md:p-8 max-w-6xl mx-auto"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      {/* Header with title and edit button */}
      <motion.div 
        className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-0 mb-6 sm:mb-8"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 bg-gradient-to-br from-blue-100 to-purple-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <Settings className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-blue-600" />
          </div>
          <div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900">{profile.name}</h2>
            <p className="text-gray-600 text-sm sm:text-base md:text-lg">Update your Details!</p>
          </div>
        </div>
        
        {!isEditing && (
          <motion.button
            onClick={() => setIsEditing(true)}
            className="group bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-4 py-2 sm:px-5 sm:py-2.5 md:px-6 md:py-3 rounded-xl transition-all duration-300 flex items-center gap-2 shadow-lg hover:shadow-xl text-sm sm:text-base w-full sm:w-auto justify-center"
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
          >
            <Edit3 className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="hidden sm:inline">Edit Profile</span>
            <span className="sm:hidden">Edit</span>
          </motion.button>
        )}
      </motion.div>

      {/* Error and Success Messages */}
      <AnimatePresence>
        {error && (
          <motion.div 
            className="mb-4 sm:mb-6 p-3 sm:p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs sm:text-sm flex items-center gap-2 sm:gap-3"
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.3 }}
          >
            <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-red-500 flex-shrink-0" />
            <span className="break-words">{error}</span>
          </motion.div>
        )}
        {success && (
          <motion.div 
            className="mb-4 sm:mb-6 p-3 sm:p-4 bg-green-50 border border-green-200 text-green-700 rounded-xl text-xs sm:text-sm flex items-center gap-2 sm:gap-3"
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.3 }}
          >
            <Check className="w-4 h-4 sm:w-5 sm:h-5 text-green-500 flex-shrink-0" />
            <span className="break-words">{success}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Profile Content */}
      <div className="flex flex-col lg:flex-row gap-4 sm:gap-6 md:gap-8">
        {/* Left Column - Avatar and Basic Info */}
        <div className="lg:w-1/3">
          {/* Avatar Section */}
          <div className="text-center mb-4 sm:mb-6">
            <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full mx-auto mb-3 sm:mb-4 flex items-center justify-center overflow-hidden">
              {profile.avatar ? (
                <Image 
                  src={profile.avatar} 
                  alt={profile.name} 
                  width={96} 
                  height={96} 
                  className="w-full h-full object-cover rounded-full"
                />
              ) : (
                <span className="text-white text-2xl sm:text-3xl font-bold">
                  {profile.name.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            <h3 className="text-base sm:text-lg font-semibold text-gray-900">{profile.name}</h3>
            <p className="text-xs sm:text-sm text-gray-500">Student</p>
          </div>

          {/* Student Key Display */}
          <div className="bg-purple-50 rounded-lg p-3 sm:p-4 mb-3 sm:mb-4">
            <p className="text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">Student ID</p>
            <p className="font-mono text-purple-700 text-base sm:text-lg font-bold break-all">{profile.studentKey || 'Not available'}</p>
            <p className="text-xs text-gray-500 mt-1">This ID is unique and cannot be changed</p>
          </div>

          {/* Additional Student Information */}
          {(profile.nickname || profile.learningModePreference || profile.interestsOutsideClass || profile.preferredCareerDomains) && (
            <div className="space-y-2 sm:space-y-3">
              {profile.nickname && (
                <div className="bg-blue-50 rounded-lg p-2.5 sm:p-3">
                  <p className="text-xs sm:text-sm font-medium text-gray-700 mb-1">Nickname</p>
                  <p className="text-blue-700 font-medium text-sm sm:text-base">{profile.nickname}</p>
                </div>
              )}
              
              {profile.learningModePreference && (
                <div className="bg-green-50 rounded-lg p-2.5 sm:p-3">
                  <p className="text-xs sm:text-sm font-medium text-gray-700 mb-1">Learning Mode</p>
                  <p className="text-green-700 font-medium text-sm sm:text-base">{profile.learningModePreference}</p>
                </div>
              )}
              
              {profile.interestsOutsideClass && profile.interestsOutsideClass.length > 0 && (
                <div className="bg-orange-50 rounded-lg p-2.5 sm:p-3">
                  <p className="text-xs sm:text-sm font-medium text-gray-700 mb-1">Interests</p>
                  <div className="flex flex-wrap gap-1">
                    {profile.interestsOutsideClass.map((interest, index) => (
                      <span key={index} className="px-2 py-1 bg-orange-200 text-orange-800 text-xs rounded-full">
                        {interest}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              {profile.preferredCareerDomains && profile.preferredCareerDomains.length > 0 && (
                <div className="bg-indigo-50 rounded-lg p-2.5 sm:p-3">
                  <p className="text-xs sm:text-sm font-medium text-gray-700 mb-1">Career Interests</p>
                  <div className="flex flex-wrap gap-1">
                    {profile.preferredCareerDomains.map((domain, index) => (
                      <span key={index} className="px-2 py-1 bg-indigo-200 text-indigo-800 text-xs rounded-full">
                        {domain}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Column - Form Fields */}
        <div className="lg:w-2/3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5 md:gap-6">
            {/* Left Column Fields */}
            <div className="space-y-3 sm:space-y-4">
              {/* Full Name Field */}
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                  Full Name
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editedProfile.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-900 bg-white"
                    placeholder="Enter your full name"
                  />
                ) : (
                  <div className="px-3 py-2 text-sm sm:text-base bg-gray-50 border border-gray-200 rounded-md text-gray-900">
                    {profile.name || 'Not provided'}
                  </div>
                )}
              </div>

              {/* Date of Birth Field */}
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                  Date of Birth
                </label>
                {isEditing ? (
                  <div className="relative">
                    <input
                      type="date"
                      className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-900 bg-white"
                      placeholder="dd/mm/yyyy"
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <svg className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  </div>
                ) : (
                  <div className="px-3 py-2 text-sm sm:text-base bg-gray-50 border border-gray-200 rounded-md text-gray-900">
                    dd/mm/yyyy
                  </div>
                )}
              </div>

              {/* Location Field */}
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                  Location / City
                </label>
                {isEditing ? (
                  <div className="relative">
                    <select className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-900 bg-white appearance-none">
                      <option value="">Select City</option>
                      <option value="Mumbai">Mumbai</option>
                      <option value="Delhi">Delhi</option>
                      <option value="Bangalore">Bangalore</option>
                      <option value="Hyderabad">Hyderabad</option>
                      <option value="Chennai">Chennai</option>
                      <option value="Kolkata">Kolkata</option>
                      <option value="Pune">Pune</option>
                      <option value="Ahmedabad">Ahmedabad</option>
                    </select>
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <svg className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                ) : (
                  <div className="px-3 py-2 text-sm sm:text-base bg-gray-50 border border-gray-200 rounded-md text-gray-900">
                    Select City
                  </div>
                )}
              </div>
            </div>

            {/* Right Column Fields */}
            <div className="space-y-3 sm:space-y-4">
              {/* Guardian Name Field */}
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                  Guardian Name
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-900 bg-white"
                    placeholder="Enter guardian name"
                  />
                ) : (
                  <div className="px-3 py-2 text-sm sm:text-base bg-gray-50 border border-gray-200 rounded-md text-gray-900">
                    Enter guardian name
                  </div>
                )}
              </div>

              {/* Gender Field */}
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                  Gender
                </label>
                {isEditing ? (
                  <div className="relative">
                    <select className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-900 bg-white appearance-none">
                      <option value="">Select Gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <svg className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                ) : (
                  <div className="px-3 py-2 text-sm sm:text-base bg-gray-50 border border-gray-200 rounded-md text-gray-900">
                    Select Gender
                  </div>
                )}
              </div>

              {/* Language Field */}
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                  Language
                </label>
                {isEditing ? (
                  <div className="relative">
                    <select
                      value={editedProfile.language}
                      onChange={(e) => handleInputChange('language', e.target.value)}
                      className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-900 bg-white appearance-none"
                    >
                      <option value="">Select Language</option>
                      <option value="English">English</option>
                      <option value="Hindi">Hindi</option>
                      <option value="Bengali">Bengali</option>
                      <option value="Telugu">Telugu</option>
                      <option value="Marathi">Marathi</option>
                      <option value="Tamil">Tamil</option>
                      <option value="Gujarati">Gujarati</option>
                      <option value="Kannada">Kannada</option>
                      <option value="Malayalam">Malayalam</option>
                      <option value="Punjabi">Punjabi</option>
                    </select>
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <svg className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                ) : (
                  <div className="px-3 py-2 text-sm sm:text-base bg-gray-50 border border-gray-200 rounded-md text-gray-900">
                    {profile.language || 'Not provided'}
                  </div>
                )}
              </div>

              {/* Grade Field */}
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                  Grade
                </label>
                {isEditing ? (
                  <div className="relative">
                    <select
                      value={editedProfile.grade}
                      onChange={(e) => handleInputChange('grade', e.target.value)}
                      className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-900 bg-white appearance-none"
                    >
                      <option value="">Select Grade</option>
                      <option value="1st Grade">1st Grade</option>
                      <option value="2nd Grade">2nd Grade</option>
                      <option value="3rd Grade">3rd Grade</option>
                      <option value="4th Grade">4th Grade</option>
                      <option value="5th Grade">5th Grade</option>
                      <option value="6th Grade">6th Grade</option>
                      <option value="7th Grade">7th Grade</option>
                      <option value="8th Grade">8th Grade</option>
                      <option value="9th Grade">9th Grade</option>
                      <option value="10th Grade">10th Grade</option>
                      <option value="11th Grade">11th Grade</option>
                      <option value="12th Grade">12th Grade</option>
                    </select>
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <svg className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                ) : (
                  <div className="px-3 py-2 text-sm sm:text-base bg-gray-50 border border-gray-200 rounded-md text-gray-900">
                    {profile.grade || 'Not provided'}
                  </div>
                )}
              </div>

              {/* School Field */}
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                  School
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editedProfile.school}
                    onChange={(e) => handleInputChange('school', e.target.value)}
                    className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-900 bg-white"
                    placeholder="Enter your school name"
                  />
                ) : (
                  <div className="px-3 py-2 text-sm sm:text-base bg-gray-50 border border-gray-200 rounded-md text-gray-900">
                    {profile.school || 'Not provided'}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Email Field (Read-only) */}
          <div className="mt-4 sm:mt-6">
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
              Email Address
            </label>
            <div className="px-3 py-2 text-sm sm:text-base bg-gray-50 border border-gray-200 rounded-md text-gray-900 break-all">
              {profile.email || 'Not provided'}
            </div>
            <p className="text-xs text-gray-500 mt-1">Email address cannot be changed</p>
          </div>
        </div>
      </div>

      {/* Edit Mode Buttons */}
      {isEditing && (
        <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={handleCancel}
            disabled={isLoading}
            className="px-5 py-2.5 sm:px-6 sm:py-3 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed border border-gray-300 font-medium text-sm sm:text-base w-full sm:w-auto"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isLoading}
            className="px-5 py-2.5 sm:px-6 sm:py-3 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-sm font-medium text-sm sm:text-base w-full sm:w-auto"
          >
            {isLoading && (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            )}
            {isLoading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      )}
    </motion.div>
  );
} 