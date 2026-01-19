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
  dateOfBirth?: string;
  gender?: string;
  guardianName?: string;
  location?: string;
  createdBy?: {
    type?: 'teacher' | 'organization' | 'self';
    id?: string;
    name?: string;
  } | null;
  managedBy?: {
    type?: 'teacher' | 'organization' | 'self';
    id?: string;
    name?: string;
  } | null;
}

interface SettingsTabProps {
  profile: ProfileData;
  onProfileUpdate?: (updatedProfile: Partial<ProfileData>) => void;
  onAvatarChange?: (avatarPath: string) => void;
  onAvatarClick?: () => void;
  availableAvatars?: string[];
}

export default function SettingsTab({ profile, onProfileUpdate, onAvatarClick }: SettingsTabProps) {
  // Monitoring: Log profile data for debugging and monitoring
  console.log('[SettingsTab] Profile data received:', {
    name: profile.name,
    email: profile.email,
    grade: profile.grade,
    school: profile.school,
    language: profile.language,
    studentKey: profile.studentKey,
    createdBy: profile.createdBy,
    managedBy: profile.managedBy,
  });
  
  const [isEditing, setIsEditing] = useState(false);
  const [editedProfile, setEditedProfile] = useState<ProfileData>({
    name: profile.name || '',
    email: profile.email || '',
    grade: profile.grade || '',
    school: profile.school || '',
    language: profile.language || 'English',
    studentKey: profile.studentKey || '',
    dateOfBirth: profile.dateOfBirth || '',
    gender: profile.gender || '',
    guardianName: profile.guardianName || '',
    location: profile.location || '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [hoveredField, setHoveredField] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'preferences' | 'security'>('profile');
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);

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
          dateOfBirth: editedProfile.dateOfBirth,
          gender: editedProfile.gender,
          guardianName: editedProfile.guardianName,
          location: editedProfile.location,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { error: errorText || 'Failed to update profile' };
        }
        throw new Error(errorData.error || 'Failed to update profile');
      }

      const responseText = await response.text();
      if (!responseText) {
        throw new Error('Empty response from server');
      }

      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('JSON parse error:', parseError, 'Response text:', responseText);
        throw new Error('Invalid response from server');
      }
      
      // Update the profile data using the response data
      if (onProfileUpdate && data.profile) {
        onProfileUpdate({
          name: data.profile.name,
          grade: data.profile.grade,
          school: data.profile.school,
          language: data.profile.language,
          dateOfBirth: data.profile.dateOfBirth,
          gender: data.profile.gender,
          guardianName: data.profile.guardianName,
          location: data.profile.location,
        });
      }

      setIsEditing(false);
      setSuccess('Profile updated successfully!');
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Profile update error:', err);
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
      dateOfBirth: profile.dateOfBirth,
      gender: profile.gender,
      guardianName: profile.guardianName,
      location: profile.location,
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
      {/* Header with title */}
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
          </div>
        </div>
      </motion.div>

      {/* Tab Navigation */}
      <div className="mb-6 border-b border-gray-200">
        <nav className="flex space-x-4">
          <button
            onClick={() => setActiveTab('profile')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'profile'
                ? 'border-purple-600 text-purple-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <User className="w-4 h-4 inline mr-2" />
            Profile
          </button>
          <button
            onClick={() => setActiveTab('security')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'security'
                ? 'border-purple-600 text-purple-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Shield className="w-4 h-4 inline mr-2" />
            Security
          </button>
        </nav>
      </div>

      {/* Error and Success Messages */}
      <AnimatePresence>
        {(error || passwordError) && (
          <motion.div 
            className="mb-4 sm:mb-6 p-3 sm:p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs sm:text-sm flex items-center gap-2 sm:gap-3"
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.3 }}
          >
            <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-red-500 flex-shrink-0" />
            <span className="break-words">{error || passwordError}</span>
          </motion.div>
        )}
        {(success || passwordSuccess) && (
          <motion.div 
            className="mb-4 sm:mb-6 p-3 sm:p-4 bg-green-50 border border-green-200 text-green-700 rounded-xl text-xs sm:text-sm flex items-center gap-2 sm:gap-3"
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.3 }}
          >
            <Check className="w-4 h-4 sm:w-5 sm:h-5 text-green-500 flex-shrink-0" />
            <span className="break-words">{success || passwordSuccess}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tab Content */}
      {activeTab === 'profile' && (
      <div className="flex flex-col lg:flex-row gap-4 sm:gap-6 md:gap-8">
        {/* Left Column - Avatar and Basic Info */}
        <div className="lg:w-1/3">
          {/* Avatar Section */}
          <div className="text-center mb-4 sm:mb-6">
            <div 
              className={`relative w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full mx-auto mb-3 sm:mb-4 flex items-center justify-center overflow-hidden ${
                onAvatarClick ? 'cursor-pointer hover:ring-4 hover:ring-purple-300 transition-all duration-200' : ''
              }`}
              onClick={() => {
                if (onAvatarClick) {
                  onAvatarClick();
                }
              }}
              title="Click to change avatar"
            >
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
              {/* Edit Overlay */}
              {onAvatarClick && (
                <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity duration-200">
                  <Edit3 className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                </div>
              )}
            </div>
            {onAvatarClick && (
              <p className="text-xs sm:text-sm text-purple-600 font-medium mb-2">Click to change avatar</p>
            )}
            <h3 className="text-base sm:text-lg font-semibold text-gray-900">{profile.name}</h3>
            <p className="text-xs sm:text-sm text-gray-500">Student</p>
          </div>

          {/* Student Key Display */}
          <div className="bg-purple-50 rounded-lg p-3 sm:p-4 mb-3 sm:mb-4">
            <p className="text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">Student ID</p>
            <p className="font-mono text-purple-700 text-base sm:text-lg font-bold break-all">{profile.studentKey || 'Not available'}</p>
            <p className="text-xs text-gray-500 mt-1">This ID is unique and cannot be changed</p>
          </div>

          {/* Account Association Display */}
          {(profile.createdBy && (profile.createdBy.type || profile.createdBy.name || profile.createdBy.id)) || 
           (profile.managedBy && (profile.managedBy.type || profile.managedBy.name || profile.managedBy.id)) ? (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4 mb-3 sm:mb-4">
              <p className="text-xs sm:text-sm font-semibold text-gray-800 mb-2 sm:mb-3 flex items-center gap-2">
                <Building className="w-4 h-4 text-blue-600" />
                Account Information
              </p>
              {profile.createdBy && (profile.createdBy.type || profile.createdBy.name) && (
                <div className="mb-2">
                  <p className="text-xs text-gray-600 mb-1">Created By:</p>
                  <p className="text-sm font-medium text-blue-800">
                    {profile.createdBy.type === 'teacher' && '👨‍🏫 '}
                    {profile.createdBy.type === 'organization' && '🏢 '}
                    {profile.createdBy.name || 'Unknown'}
                    {profile.createdBy.type && (
                      <span className="text-xs text-gray-600 ml-2">
                        ({profile.createdBy.type})
                      </span>
                    )}
                  </p>
                </div>
              )}
              {profile.managedBy && (profile.managedBy.type || profile.managedBy.name) && (
                <div>
                  <p className="text-xs text-gray-600 mb-1">Managed By:</p>
                  <p className="text-sm font-medium text-blue-800">
                    {profile.managedBy.type === 'teacher' && '👨‍🏫 '}
                    {profile.managedBy.type === 'organization' && '🏢 '}
                    {profile.managedBy.name || 'Unknown'}
                    {profile.managedBy.type && (
                      <span className="text-xs text-gray-600 ml-2">
                        ({profile.managedBy.type})
                      </span>
                    )}
                  </p>
                </div>
              )}
            </div>
          ) : null}

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
                      value={editedProfile.dateOfBirth ? new Date(editedProfile.dateOfBirth).toISOString().split('T')[0] : ''}
                      onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                      className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-900 bg-white"
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <svg className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  </div>
                ) : (
                  <div className="px-3 py-2 text-sm sm:text-base bg-gray-50 border border-gray-200 rounded-md text-gray-900">
                    {profile.dateOfBirth ? new Date(profile.dateOfBirth).toLocaleDateString() : 'Not provided'}
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
                    <select
                      value={editedProfile.location || ''}
                      onChange={(e) => handleInputChange('location', e.target.value)}
                      className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-900 bg-white appearance-none"
                    >
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
                    {profile.location || 'Not provided'}
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
                    value={editedProfile.guardianName || ''}
                    onChange={(e) => handleInputChange('guardianName', e.target.value)}
                    className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-900 bg-white"
                    placeholder="Enter guardian name"
                  />
                ) : (
                  <div className="px-3 py-2 text-sm sm:text-base bg-gray-50 border border-gray-200 rounded-md text-gray-900">
                    {profile.guardianName || 'Not provided'}
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
                    <select
                      value={editedProfile.gender || ''}
                      onChange={(e) => handleInputChange('gender', e.target.value)}
                      className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-900 bg-white appearance-none"
                    >
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
                    {profile.gender || 'Not provided'}
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
      )}

      {/* Security Tab Content - Password Change */}
      {activeTab === 'security' && (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 border border-blue-100">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Shield className="w-6 h-6 text-blue-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-1">Change Password</h3>
                <p className="text-sm text-gray-600">Update your password to keep your account secure.</p>
              </div>
            </div>
          </div>

          <div className="max-w-2xl space-y-6">
            {/* Current Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Current Password
              </label>
              <div className="relative">
                <input
                  type={showCurrentPassword ? 'text' : 'password'}
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-colors pr-12 bg-white text-gray-900 autofill:bg-white autofill:text-gray-900"
                  style={{ backgroundColor: 'white' }}
                  placeholder="Enter your current password"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showCurrentPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {/* New Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                New Password
              </label>
              <div className="relative">
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-colors pr-12 bg-white text-gray-900 autofill:bg-white autofill:text-gray-900"
                  style={{ backgroundColor: 'white' }}
                  placeholder="Enter new password (min. 6 characters)"
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showNewPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
              <p className="mt-1 text-xs text-gray-500">Must be at least 6 characters long</p>
            </div>

            {/* Confirm New Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Confirm New Password
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-colors pr-12 bg-white text-gray-900 autofill:bg-white autofill:text-gray-900"
                  style={{ backgroundColor: 'white' }}
                  placeholder="Confirm your new password"
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Password Change Button */}
            <div className="flex gap-3 pt-4">
              <button
                onClick={async () => {
                  setPasswordLoading(true);
                  setPasswordError(null);
                  setPasswordSuccess(null);

                  // Client-side validation
                  if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
                    setPasswordError('All fields are required');
                    setPasswordLoading(false);
                    return;
                  }

                  if (passwordData.newPassword.length < 6) {
                    setPasswordError('Password must be at least 6 characters long');
                    setPasswordLoading(false);
                    return;
                  }

                  if (passwordData.newPassword !== passwordData.confirmPassword) {
                    setPasswordError('New password and confirmation do not match');
                    setPasswordLoading(false);
                    return;
                  }

                  if (passwordData.currentPassword === passwordData.newPassword) {
                    setPasswordError('New password must be different from current password');
                    setPasswordLoading(false);
                    return;
                  }

                  try {
                    const response = await fetch('/api/auth/change-password', {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                      },
                      credentials: 'include',
                      body: JSON.stringify({
                        currentPassword: passwordData.currentPassword,
                        newPassword: passwordData.newPassword,
                        confirmPassword: passwordData.confirmPassword
                      }),
                    });

                    const data = await response.json();

                    if (!response.ok) {
                      throw new Error(data.error || 'Failed to change password');
                    }

                    setPasswordSuccess('Password changed successfully!');
                    setPasswordData({
                      currentPassword: '',
                      newPassword: '',
                      confirmPassword: ''
                    });

                    // Clear success message after 5 seconds
                    setTimeout(() => setPasswordSuccess(null), 5000);
                  } catch (err) {
                    console.error('Password change error:', err);
                    setPasswordError(err instanceof Error ? err.message : 'Failed to change password');
                  } finally {
                    setPasswordLoading(false);
                  }
                }}
                disabled={passwordLoading}
                className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-sm font-medium"
              >
                {passwordLoading && (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                )}
                {passwordLoading ? 'Changing Password...' : 'Change Password'}
              </button>
              <button
                onClick={() => {
                  setPasswordData({
                    currentPassword: '',
                    newPassword: '',
                    confirmPassword: ''
                  });
                  setPasswordError(null);
                  setPasswordSuccess(null);
                }}
                disabled={passwordLoading}
                className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed border border-gray-300 font-medium"
              >
                Clear
              </button>
            </div>

            {/* Security Note */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-800">
                  <p className="font-medium mb-1">Password Security Tips:</p>
                  <ul className="list-disc list-inside space-y-1 text-blue-700">
                    <li>Use at least 6 characters</li>
                    <li>Don't reuse your current password</li>
                    <li>Choose a password you haven't used before</li>
                    <li>Keep your password confidential</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons at Bottom - Only show for Profile tab */}
      {activeTab === 'profile' && (
      <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row gap-3 justify-center">
        {isEditing ? (
          <>
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
          </>
        ) : (
          <motion.button
            onClick={() => setIsEditing(true)}
            className="group bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-5 py-2.5 sm:px-6 sm:py-3 rounded-xl transition-all duration-300 flex items-center gap-2 shadow-lg hover:shadow-xl text-sm sm:text-base w-full sm:w-auto justify-center"
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
          >
            <Edit3 className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="hidden sm:inline">Edit Profile</span>
            <span className="sm:hidden">Edit</span>
          </motion.button>
        )}
      </div>
      )}
    </motion.div>
  );
} 