'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import ConsistentLoadingPage from '../components/ConsistentLoadingPage';
import { motion, AnimatePresence } from 'framer-motion';

interface InterestAssessmentData {
  // Step 1: Broad Interest Cluster Selection
  broadInterestClusters: string[];
  
  // Step 2: Cluster-specific Deep Dive
  clusterDeepDive: {
    technologyComputers?: {
      techInterests: string;
      codingExperience: string;
      buildingGoals: string;
    };
    scienceExperiments?: {
      scienceTopics: string;
      projectExperience: string;
      inventionIdeas: string;
    };
    artDesign?: {
      artTypes: string;
      creativeTime: string;
      artisticExpression: string;
    };
    languageCommunication?: {
      writingSpeaking: string;
      confidentLanguages: string;
      skillImprovement: string;
    };
    businessMoney?: {
      sellingExperience: string;
      businessIdeas: string;
      problemSolving: string;
    };
    performingArts?: {
      preferredArts: string;
      performanceExperience: string;
      performanceGoals: string;
    };
    cookingNutrition?: {
      favoriteDishes: string;
      nutritionKnowledge: string;
      culinaryAspirations: string;
    };
    sportsFitness?: {
      favoriteActivities: string;
      competitionParticipation: string;
      fitnessGoals: string;
    };
    farmingGardening?: {
      farmingExperience: string;
      naturePreferences: string;
      environmentalGoals: string;
    };
    socialWork?: {
      volunteerExperience: string;
      socialProblems: string;
      careerAspirations: string;
    };
    mechanicsDIY?: {
      repairExperience: string;
      machineInterests: string;
      learningGoals: string;
    };
    fashionTailoring?: {
      designInterests: string;
      wearableCreations: string;
      careerGoals: string;
    };
    animalCare?: {
      animalAffinity: string;
      careExperience: string;
      careerAspirations: string;
    };
    spiritualityMindfulness?: {
      quietTimeActivities: string;
      stressManagement: string;
      learningGoals: string;
    };
  };
  
  // Step 3: Cross-Cluster Personality Insights
  personalityInsights: {
    learningStyle: string[];
    challengeApproach: string;
    coreValues: string[];
  };
  
  // Step 4: Future Dream / Career Direction
  careerDirection: {
    dreamCareer: string;
    excitingCareerTypes: string[];
    careerAttraction: string;
  };
}

interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  role: string;
  uniqueId?: string;
  avatar?: string;
  age?: number;
  classGrade?: string;
}

const interestClusters = [
  'Technology & Computers',
  'Science & Experiments',
  'Art & Design',
  'Language & Communication',
  'Business & Money',
  'Performing Arts (Music/Dance/Acting)',
  'Cooking & Nutrition',
  'Sports & Fitness',
  'Farming, Gardening & Nature',
  'Social Work & Helping People',
  'Mechanics / DIY / Repairs',
  'Fashion & Tailoring',
  'Animal Care',
  'Spirituality / Mindfulness'
];

const learningStyles = [
  'I learn by doing or practicing',
  'I learn by watching or reading',
  'I learn by discussing or teaching',
  'I prefer learning alone',
  'I enjoy group learning'
];

const challengeApproaches = [
  'I enjoy trying it myself',
  'I break it into steps',
  'I seek help when stuck',
  'I avoid difficult tasks',
  'It depends on the topic'
];

const coreValues = [
  'Creativity',
  'Curiosity',
  'Empathy',
  'Discipline',
  'Leadership',
  'Spirituality',
  'Respect',
  'Innovation',
  'Teamwork'
];

const careerTypes = [
  'Scientist or Researcher',
  'Engineer or Technologist',
  'Teacher or Educator',
  'Doctor or Health Worker',
  'Artist or Designer',
  'Entrepreneur or Business Owner',
  'Athlete or Fitness Coach',
  'Actor, Dancer, or Performer',
  'Chef or Nutrition Expert',
  'Fashion Designer or Tailor',
  'Mechanic or Technician',
  'Farmer or Nature Expert',
  'Animal Care Specialist',
  'Social Worker or Leader',
  'Spiritual Guide or Wellness Coach',
  'I\'m still exploring'
];

export default function InterestAssessment() {
  // Load form data and step from localStorage on mount
  const getInitialFormData = (): InterestAssessmentData => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('interest_assessment_formData');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {
          console.error('Error parsing saved form data:', e);
        }
      }
    }
    return {
      broadInterestClusters: [],
      clusterDeepDive: {},
      personalityInsights: {
        learningStyle: [],
        challengeApproach: '',
        coreValues: []
      },
      careerDirection: {
        dreamCareer: '',
        excitingCareerTypes: [],
        careerAttraction: ''
      }
    };
  };

  const getInitialStep = (): number => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('interest_assessment_currentStep');
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
  const [formData, setFormData] = useState<InterestAssessmentData>(getInitialFormData());

  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [lastSubmitTime, setLastSubmitTime] = useState<number>(0);
  const router = useRouter();

  useEffect(() => {
    const checkUserStatus = async () => {
      try {
        // Check if user is authenticated
        const response = await fetch('/api/auth/me');
        if (!response.ok) {
          router.push('/login');
          return;
        }

        const userData = await response.json();
        if (userData.user.role !== 'student') {
          router.push('/dashboard');
          return;
        }
        
        // Check if interest assessment is already completed
        const studentResponse = await fetch(`/api/student/${userData.user.uniqueId}`);
        if (studentResponse.ok) {
          const studentData = await studentResponse.json();
          if (studentData.interestAssessmentCompleted) {
            router.push('/diagnostic-assessment');
            return;
          }
        }

        // Set user profile
        setUserProfile({
          id: userData.user.id,
          email: userData.user.email,
          fullName: userData.user.fullName,
          role: userData.user.role,
          uniqueId: userData.user.uniqueId
        });
        
        setIsLoading(false);
      } catch (error) {
        console.error('Error checking user status:', error);
        router.push('/login');
      }
    };
    
    checkUserStatus();
  }, [router]);

  const handleMultiSelect = (field: string, value: string, maxSelections: number = 3) => {
    setFormData(prev => {
      let currentValues: string[];
      
      // Handle nested fields
      if (field === 'learningStyle' || field === 'challengeApproach' || field === 'coreValues') {
        currentValues = prev.personalityInsights[field as keyof typeof prev.personalityInsights] as string[];
      } else if (field === 'dreamCareer' || field === 'excitingCareerTypes' || field === 'careerAttraction') {
        currentValues = prev.careerDirection[field as keyof typeof prev.careerDirection] as string[];
      } else {
        currentValues = prev[field as keyof InterestAssessmentData] as string[];
      }
      
      if (Array.isArray(currentValues)) {
        if (currentValues.includes(value)) {
          const newValues = currentValues.filter(v => v !== value);
          // Update the appropriate nested field
          if (field === 'learningStyle' || field === 'challengeApproach' || field === 'coreValues') {
            return {
              ...prev,
              personalityInsights: {
                ...prev.personalityInsights,
                [field]: newValues
              }
            };
          } else if (field === 'dreamCareer' || field === 'excitingCareerTypes' || field === 'careerAttraction') {
            return {
              ...prev,
              careerDirection: {
                ...prev.careerDirection,
                [field]: newValues
              }
            };
          } else {
            return {
              ...prev,
              [field]: newValues
            };
          }
        } else if (currentValues.length < maxSelections) {
          const newValues = [...currentValues, value];
          // Update the appropriate nested field
          if (field === 'learningStyle' || field === 'challengeApproach' || field === 'coreValues') {
            return {
              ...prev,
              personalityInsights: {
                ...prev.personalityInsights,
                [field]: newValues
              }
            };
          } else if (field === 'dreamCareer' || field === 'excitingCareerTypes' || field === 'careerAttraction') {
            return {
              ...prev,
              careerDirection: {
                ...prev.careerDirection,
                [field]: newValues
              }
            };
          } else {
            return {
              ...prev,
              [field]: newValues
            };
          }
        }
      }
      return prev;
    });
  };

  const handleInputChange = (field: string, value: string | string[]) => {
    setFormData(prev => {
      // Handle nested fields
      if (field === 'learningStyle' || field === 'challengeApproach' || field === 'coreValues') {
        return {
          ...prev,
          personalityInsights: {
            ...prev.personalityInsights,
            [field]: value
          }
        };
      } else if (field === 'dreamCareer' || field === 'excitingCareerTypes' || field === 'careerAttraction') {
        return {
          ...prev,
          careerDirection: {
            ...prev.careerDirection,
            [field]: value
          }
        };
      } else {
        return {
          ...prev,
          [field]: value
        };
      }
    });
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const handleClusterInputChange = (cluster: string, field: string, value: string) => {
    // Map display names to interface keys
    const clusterKeyMap: { [key: string]: keyof typeof formData.clusterDeepDive } = {
      'Technology & Computers': 'technologyComputers',
      'Science & Experiments': 'scienceExperiments',
      'Art & Design': 'artDesign',
      'Language & Communication': 'languageCommunication',
      'Business & Money': 'businessMoney',
      'Performing Arts (Music/Dance/Acting)': 'performingArts',
      'Cooking & Nutrition': 'cookingNutrition',
      'Sports & Fitness': 'sportsFitness',
      'Farming, Gardening & Nature': 'farmingGardening',
      'Social Work & Helping People': 'socialWork',
      'Mechanics / DIY / Repairs': 'mechanicsDIY',
      'Fashion & Tailoring': 'fashionTailoring',
      'Animal Care': 'animalCare',
      'Spirituality / Mindfulness': 'spiritualityMindfulness'
    };
    
    const clusterKey = clusterKeyMap[cluster];
    
    setFormData(prev => ({
      ...prev,
      clusterDeepDive: {
        ...prev.clusterDeepDive,
        [clusterKey]: {
          ...(prev.clusterDeepDive[clusterKey] || {}),
          [field]: value
        }
      }
    }));
  };

  const getClusterData = (cluster: string) => {
    // Map display names to interface keys
    const clusterKeyMap: { [key: string]: keyof typeof formData.clusterDeepDive } = {
      'Technology & Computers': 'technologyComputers',
      'Science & Experiments': 'scienceExperiments',
      'Art & Design': 'artDesign',
      'Language & Communication': 'languageCommunication',
      'Business & Money': 'businessMoney',
      'Performing Arts (Music/Dance/Acting)': 'performingArts',
      'Cooking & Nutrition': 'cookingNutrition',
      'Sports & Fitness': 'sportsFitness',
      'Farming, Gardening & Nature': 'farmingGardening',
      'Social Work & Helping People': 'socialWork',
      'Mechanics / DIY / Repairs': 'mechanicsDIY',
      'Fashion & Tailoring': 'fashionTailoring',
      'Animal Care': 'animalCare',
      'Spirituality / Mindfulness': 'spiritualityMindfulness'
    };
    
    const clusterKey = clusterKeyMap[cluster];
    return formData.clusterDeepDive[clusterKey] || {};
  };

  const validateStep = (step: number): boolean => {
    const newErrors: {[key: string]: string} = {};
    
    switch (step) {
      case 1:
        if (formData.broadInterestClusters.length === 0) {
          newErrors.broadInterestClusters = 'Please select at least one interest area';
        }
        break;
      case 2:
        // Validate that deep dive questions are answered for selected clusters
        const clusterKeyMap: { [key: string]: keyof typeof formData.clusterDeepDive } = {
          'Technology & Computers': 'technologyComputers',
          'Science & Experiments': 'scienceExperiments',
          'Art & Design': 'artDesign',
          'Language & Communication': 'languageCommunication',
          'Business & Money': 'businessMoney',
          'Performing Arts (Music/Dance/Acting)': 'performingArts',
          'Cooking & Nutrition': 'cookingNutrition',
          'Sports & Fitness': 'sportsFitness',
          'Farming, Gardening & Nature': 'farmingGardening',
          'Social Work & Helping People': 'socialWork',
          'Mechanics / DIY / Repairs': 'mechanicsDIY',
          'Fashion & Tailoring': 'fashionTailoring',
          'Animal Care': 'animalCare',
          'Spirituality / Mindfulness': 'spiritualityMindfulness'
        };
        
        formData.broadInterestClusters.forEach(cluster => {
          const clusterKey = clusterKeyMap[cluster];
          const clusterData = formData.clusterDeepDive[clusterKey];
          if (!clusterData) {
            newErrors.clusterDeepDive = 'Please complete all questions for selected interest areas';
            return;
          }
        });
        break;
      case 3:
        if (formData.personalityInsights.learningStyle.length === 0) {
          newErrors.learningStyle = 'Please select at least one learning style';
        }
        if (!formData.personalityInsights.challengeApproach) {
          newErrors.challengeApproach = 'Please select how you approach challenges';
        }
        if (formData.personalityInsights.coreValues.length === 0) {
          newErrors.coreValues = 'Please select at least one core value';
        }
        break;
      case 4:
        if (!formData.careerDirection.dreamCareer.trim()) {
          newErrors.dreamCareer = 'Please tell us about your dream career';
        }
        if (formData.careerDirection.excitingCareerTypes.length === 0) {
          newErrors.excitingCareerTypes = 'Please select at least one exciting career type';
        }
        if (!formData.careerDirection.careerAttraction.trim()) {
          newErrors.careerAttraction = 'Please tell us why this career attracts you';
        }
        break;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Save formData to localStorage whenever it changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('interest_assessment_formData', JSON.stringify(formData));
    }
  }, [formData]);

  // Save currentStep to localStorage whenever it changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('interest_assessment_currentStep', currentStep.toString());
    }
  }, [currentStep]);

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 4));
    }
  };

  const handlePrevious = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    console.log('🔍 Frontend: handleSubmit called at:', new Date().toISOString());
    console.log('🔍 Frontend: isSubmitting state:', isSubmitting);
    
    if (!validateStep(currentStep)) {
      return;
    }
    
    if (isSubmitting) {
      console.log('🔍 Frontend: Already submitting, ignoring duplicate call');
      return;
    }

    // Debounce: prevent multiple submissions within 2 seconds
    const now = Date.now();
    if (now - lastSubmitTime < 2000) {
      console.log('🔍 Frontend: Too soon since last submission, ignoring');
      return;
    }
    setLastSubmitTime(now);
    
    setIsSubmitting(true);
    
    try {
      console.log('🔍 Frontend: Making API call to interest assessment');
      const response = await fetch('/api/student/interest-assessment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      
      if (!response.ok) {
        throw new Error('Failed to save interest assessment');
      }
      
      // Clear localStorage after successful submission
      if (typeof window !== 'undefined') {
        localStorage.removeItem('interest_assessment_formData');
        localStorage.removeItem('interest_assessment_currentStep');
      }
      
      // Redirect to diagnostic assessment
      router.push('/diagnostic-assessment');
    } catch (error) {
      console.error('Error saving interest assessment:', error);
      setErrors({ submit: 'Failed to save your responses. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStep1 = () => (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div>
        <h2 className="text-2xl font-bold text-purple-600 mb-4">Step 1: What Interests You?</h2>
        <p className="text-gray-700 mb-6">
          Which areas are you most interested in exploring or learning more about? 
          <span className="text-purple-700 font-semibold"> Choose up to 3 areas that excite you the most.</span>
        </p>
        
        <div className="grid grid-cols-2 gap-4">
          {interestClusters.map((cluster) => (
            <motion.button
              key={cluster}
              type="button"
              onClick={() => handleMultiSelect('broadInterestClusters', cluster, 3)}
              className={`p-4 rounded-lg border-2 transition-all duration-200 text-left ${
                formData.broadInterestClusters.includes(cluster)
                  ? 'border-purple-500 bg-purple-50 text-purple-700'
                  : 'border-gray-200 hover:border-purple-300 hover:bg-purple-25 text-gray-800'
              }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <span className="font-medium">{cluster}</span>
            </motion.button>
          ))}
        </div>
        
        {errors.broadInterestClusters && (
          <p className="text-red-500 text-sm mt-2">{errors.broadInterestClusters}</p>
        )}
        
        <div className="mt-4 text-sm text-gray-600">
          Selected: {formData.broadInterestClusters.length}/3
        </div>
      </div>
    </motion.div>
  );

  const renderStep2 = () => (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-8"
    >
      <div>
        <h2 className="text-2xl font-bold text-purple-600 mb-4">Step 2: Tell Us More About Your Interests</h2>
        <p className="text-gray-700 mb-6">
          For each area you selected, we'd like to understand your interests better. 
          This helps us create a personalized learning experience just for you.
        </p>
        
        {formData.broadInterestClusters.map((cluster, index) => {
          const clusterData = getClusterData(cluster);
          
          return (
            <div key={cluster} className="bg-gray-50 rounded-lg p-6 mb-6">
              <h3 className="text-xl font-semibold text-purple-700 mb-4">{cluster}</h3>
              
              {cluster === 'Technology & Computers' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-800 mb-2">
                      What kind of tech excites you the most?
                    </label>
                    <input
                      type="text"
                      value={(clusterData as any).techInterests || ''}
                      onChange={(e) => handleClusterInputChange(cluster, 'techInterests', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-800 bg-white"
                      placeholder="e.g., apps, robots, games, websites, AI"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-800 mb-2">
                      Have you ever tried coding, building something online, or fixing a gadget?
                    </label>
                    <input
                      type="text"
                      value={(clusterData as any).codingExperience || ''}
                      onChange={(e) => handleClusterInputChange(cluster, 'codingExperience', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-800 bg-white"
                      placeholder="Tell us about your experience"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-800 mb-2">
                      What would you like to build or invent with technology?
                    </label>
                    <input
                      type="text"
                      value={(clusterData as any).buildingGoals || ''}
                      onChange={(e) => handleClusterInputChange(cluster, 'buildingGoals', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-800 bg-white"
                      placeholder="Share your ideas and dreams"
                    />
                  </div>
                </div>
              )}

              {cluster === 'Science & Experiments' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-800 mb-2">
                      What type of science experiments or topics interest you the most?
                    </label>
                    <input
                      type="text"
                      value={(clusterData as any).scienceTopics || ''}
                      onChange={(e) => handleClusterInputChange(cluster, 'scienceTopics', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-800 bg-white"
                      placeholder="e.g., physics, biology, chemistry"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-800 mb-2">
                      Have you ever tried any science project at home or school?
                    </label>
                    <input
                      type="text"
                      value={(clusterData as any).projectExperience || ''}
                      onChange={(e) => handleClusterInputChange(cluster, 'projectExperience', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-800 bg-white"
                      placeholder="Tell us about your project"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-800 mb-2">
                      If you could invent a new scientific tool or machine, what would it do?
                    </label>
                    <input
                      type="text"
                      value={(clusterData as any).inventionIdeas || ''}
                      onChange={(e) => handleClusterInputChange(cluster, 'inventionIdeas', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-800 bg-white"
                      placeholder="Share your invention idea"
                    />
                  </div>
                </div>
              )}

              {/* Add similar blocks for other clusters */}
              {cluster !== 'Technology & Computers' && cluster !== 'Science & Experiments' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-800 mb-2">
                      What interests you most about {cluster}?
                    </label>
                    <input
                      type="text"
                      value={(clusterData as any).generalInterest || ''}
                      onChange={(e) => handleClusterInputChange(cluster, 'generalInterest', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-800 bg-white"
                      placeholder="Tell us what excites you"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-800 mb-2">
                      Have you had any experience with {cluster}?
                    </label>
                    <input
                      type="text"
                      value={(clusterData as any).experience || ''}
                      onChange={(e) => handleClusterInputChange(cluster, 'experience', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-800 bg-white"
                      placeholder="Share your experience"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-800 mb-2">
                      What would you like to learn or achieve in {cluster}?
                    </label>
                    <input
                      type="text"
                      value={(clusterData as any).goals || ''}
                      onChange={(e) => handleClusterInputChange(cluster, 'goals', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-800 bg-white"
                      placeholder="Share your goals"
                    />
                  </div>
                </div>
              )}
            </div>
          );
        })}
        
        {errors.clusterDeepDive && (
          <p className="text-red-500 text-sm mt-2">{errors.clusterDeepDive}</p>
        )}
      </div>
    </motion.div>
  );

  const renderStep3 = () => (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-8"
    >
      <div>
        <h2 className="text-2xl font-bold text-purple-600 mb-4">Step 3: Understanding You Better</h2>
        <p className="text-gray-700 mb-6">
          Help us understand your learning style, how you approach challenges, and what values matter most to you.
        </p>
        
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-3">What kind of learner are you? (Choose up to 2)</h3>
            <div className="space-y-3">
              {learningStyles.map((style) => (
                <label key={style} className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.personalityInsights.learningStyle.includes(style)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        if (formData.personalityInsights.learningStyle.length < 2) {
                          setFormData(prev => ({
                            ...prev,
                            personalityInsights: {
                              ...prev.personalityInsights,
                              learningStyle: [...prev.personalityInsights.learningStyle, style]
                            }
                          }));
                        }
                      } else {
                        setFormData(prev => ({
                          ...prev,
                          personalityInsights: {
                            ...prev.personalityInsights,
                            learningStyle: prev.personalityInsights.learningStyle.filter(s => s !== style)
                          }
                        }));
                      }
                    }}
                    className=""
                  />
                  <span className="text-gray-800">{style}</span>
                </label>
              ))}
            </div>
            {errors.learningStyle && <p className="text-red-500 text-sm mt-1">{errors.learningStyle}</p>}
            <div className="mt-2 text-sm text-gray-600">
              Selected: {formData.personalityInsights.learningStyle.length}/2
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-3">How do you usually face a challenge or new task?</h3>
            <div className="space-y-3">
              {challengeApproaches.map((approach) => (
                <label key={approach} className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="radio"
                    name="challengeApproach"
                    value={approach}
                    checked={formData.personalityInsights.challengeApproach === approach}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      personalityInsights: {
                        ...prev.personalityInsights,
                        challengeApproach: e.target.value
                      }
                    }))}
                    className=""
                  />
                  <span className="text-gray-800">{approach}</span>
                </label>
              ))}
            </div>
            {errors.challengeApproach && <p className="text-red-500 text-sm mt-1">{errors.challengeApproach}</p>}
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-3">Which of these values matter most to you? (Choose 3)</h3>
            <div className="space-y-3">
              {coreValues.map((value) => (
                <label key={value} className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.personalityInsights.coreValues.includes(value)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        if (formData.personalityInsights.coreValues.length < 3) {
                          setFormData(prev => ({
                            ...prev,
                            personalityInsights: {
                              ...prev.personalityInsights,
                              coreValues: [...prev.personalityInsights.coreValues, value]
                            }
                          }));
                        }
                      } else {
                        setFormData(prev => ({
                          ...prev,
                          personalityInsights: {
                            ...prev.personalityInsights,
                            coreValues: prev.personalityInsights.coreValues.filter(v => v !== value)
                          }
                        }));
                      }
                    }}
                    className=""
                  />
                  <span className="text-gray-800">{value}</span>
                </label>
              ))}
            </div>
            {errors.coreValues && <p className="text-red-500 text-sm mt-1">{errors.coreValues}</p>}
            <div className="mt-2 text-sm text-gray-600">
              Selected: {formData.personalityInsights.coreValues.length}/3
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );

  const renderStep4 = () => (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-8"
    >
      <div>
        <h2 className="text-2xl font-bold text-purple-600 mb-4">Step 4: Your Future Dreams</h2>
        <p className="text-gray-700 mb-6">
          Tell us about your vision for the future. This helps us guide you toward the right learning paths.
        </p>
        
        <div className="space-y-6">
          <div>
            <label className="block text-lg font-semibold text-gray-800 mb-3">
              What would you like to become when you grow up?
            </label>
            <textarea
              value={formData.careerDirection.dreamCareer}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                careerDirection: {
                  ...prev.careerDirection,
                  dreamCareer: e.target.value
                }
              }))}
              className="w-full h-24 px-4 py-3 border border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 resize-none text-gray-800 bg-white"
                              placeholder="e.g., 'I want to be an app developer' / 'I want to help animals' / 'I&apos;m not sure yet'"
            />
            {errors.dreamCareer && <p className="text-red-500 text-sm mt-1">{errors.dreamCareer}</p>}
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-3">Which of these career types sound exciting to you? (Choose up to 2)</h3>
            <div className="grid grid-cols-2 gap-3">
              {careerTypes.map((career) => (
                <label key={career} className="flex items-center space-x-3 cursor-pointer p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                  <input
                    type="checkbox"
                    checked={formData.careerDirection.excitingCareerTypes.includes(career)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        if (formData.careerDirection.excitingCareerTypes.length < 2) {
                          setFormData(prev => ({
                            ...prev,
                            careerDirection: {
                              ...prev.careerDirection,
                              excitingCareerTypes: [...prev.careerDirection.excitingCareerTypes, career]
                            }
                          }));
                        }
                      } else {
                        setFormData(prev => ({
                          ...prev,
                          careerDirection: {
                            ...prev.careerDirection,
                            excitingCareerTypes: prev.careerDirection.excitingCareerTypes.filter(c => c !== career)
                          }
                        }));
                      }
                    }}
                    className=""
                  />
                  <span className="text-gray-800 text-sm">{career}</span>
                </label>
              ))}
            </div>
            {errors.excitingCareerTypes && <p className="text-red-500 text-sm mt-1">{errors.excitingCareerTypes}</p>}
            <div className="mt-2 text-sm text-gray-600">
              Selected: {formData.careerDirection.excitingCareerTypes.length}/2
            </div>
          </div>

          <div>
            <label className="block text-lg font-semibold text-gray-800 mb-3">
              Why does this career or role attract you?
            </label>
            <textarea
              value={formData.careerDirection.careerAttraction}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                careerDirection: {
                  ...prev.careerDirection,
                  careerAttraction: e.target.value
                }
              }))}
              className="w-full h-24 px-4 py-3 border border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 resize-none text-gray-800 bg-white"
              placeholder="e.g., 'I like solving problems' / 'I enjoy creating things' / 'I want to help others'"
            />
            {errors.careerAttraction && <p className="text-red-500 text-sm mt-1">{errors.careerAttraction}</p>}
          </div>
        </div>
      </div>
    </motion.div>
  );

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return renderStep1();
      case 2:
        return renderStep2();
      case 3:
        return renderStep3();
      case 4:
        return renderStep4();
      default:
        return renderStep1();
    }
  };

  // Loading screen
  if (isLoading) {
    return (
      <ConsistentLoadingPage
        type="assessment"
        title="Loading Interest Assessment"
        subtitle="Preparing your personalized interest assessment..."
        tips={[
          'Loading assessment questions',
          'Setting up your profile',
          'Preparing personalized content'
        ]}
      />
    );
  }

  return (
    <motion.main 
      className="h-screen bg-white flex flex-col overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Header */}
      <header className="bg-white shadow-sm px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Image src="/icons/logo.svg" alt="Logo" width={40} height={40} className="rounded-full" />
          <span className="font-semibold text-gray-700">Taru Learning</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-gray-700">
            {userProfile && userProfile.fullName ? `${userProfile.fullName} ${userProfile.uniqueId ? `#${userProfile.uniqueId}` : ''}` : 'Loading...'}
          </span>
          <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
            {userProfile && userProfile.fullName ? userProfile.fullName.charAt(0).toUpperCase() : 'U'}
          </div>
        </div>
      </header>

      {/* Progress Bar */}
      <div className="bg-white px-6 py-6">
        <div className="max-w-7xl mx-auto">
          {/* Progress Steps Container */}
          <div className="relative">
            {/* Connecting Lines */}
            <div className="absolute top-5 left-0 right-0 h-1 bg-gradient-to-r from-gray-300 via-gray-400 to-gray-300 z-0"></div>
            
            {/* Progress Steps */}
            <div className="relative flex items-start justify-between w-full z-10 px-4">
              {Array.from({ length: 4 }, (_, index) => {
                const stepNumber = index + 1;
                const isCompleted = stepNumber < currentStep;
                const isCurrent = stepNumber === currentStep;
                const isPending = stepNumber > currentStep;
                
                return (
                  <div key={stepNumber} className="flex flex-col items-center relative flex-1 max-w-32">
                    {/* Step Circle */}
                    <div className="relative mb-6">
                      {isCompleted ? (
                        // Completed step
                        <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center shadow-lg border-2 border-purple-700">
                          <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                      ) : isCurrent ? (
                        // Current step
                        <div className="relative">
                          <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center shadow-xl border-2 border-purple-700">
                            <span className="text-white text-lg font-bold">{stepNumber}</span>
                          </div>
                          <div className="absolute -inset-3 bg-purple-100 rounded-full -z-10 animate-pulse"></div>
                        </div>
                      ) : (
                        // Pending step
                        <div className="w-10 h-10 border-3 border-gray-500 rounded-full flex items-center justify-center bg-white shadow-sm">
                          <span className="text-gray-600 text-lg font-bold">{stepNumber}</span>
                        </div>
                      )}
                    </div>
                    
                    {/* Step Label */}
                    <div className="text-center w-full">
                      <div className="text-xs text-gray-600 font-normal mb-2 leading-tight">
                        {stepNumber === 1 && 'Interest Selection'}
                        {stepNumber === 2 && 'Deep Dive'}
                        {stepNumber === 3 && 'Personality'}
                        {stepNumber === 4 && 'Career Dreams'}
                      </div>
                      <div className={`inline-block px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap shadow-sm ${
                        isCompleted 
                          ? 'bg-gradient-to-r from-green-200 to-green-100 text-green-800 border border-green-400' 
                          : isCurrent 
                            ? 'bg-gradient-to-r from-purple-200 to-purple-100 text-purple-800 border border-purple-400 shadow-md' 
                            : 'bg-gradient-to-r from-gray-200 to-gray-100 text-gray-700 border border-gray-400'
                      }`}>
                        {isCompleted ? 'Completed' : isCurrent ? 'In Progress' : 'Pending'}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          
          {/* Progress Percentage */}
          <div className="flex justify-center mt-8 pt-4 border-t border-gray-200">
            <div className="bg-purple-100 px-4 py-2 rounded-full">
              <span className="text-sm font-semibold text-purple-800">{Math.round((currentStep / 4) * 100)}% Complete</span>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 px-6 py-8 overflow-y-auto">
        <div className="max-w-4xl mx-auto">
          <AnimatePresence mode="wait">
            <motion.div 
              key={currentStep}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.3 }}
            >
              {/* Step Content */}
              {renderCurrentStep()}

              {/* Error Message */}
              {errors.submit && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-4"
                >
                  {errors.submit}
                </motion.div>
              )}

              {/* Navigation Buttons */}
              <div className="flex items-center justify-between gap-4 mt-8">
                {/* Previous Button */}
                <button
                  type="button"
                  onClick={handlePrevious}
                  disabled={currentStep <= 1}
                  className="bg-gray-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                >
                  ← Previous Step
                </button>

                {/* Next/Submit Button */}
                {currentStep < 4 ? (
                  <button
                    type="button"
                    onClick={handleNext}
                    className="bg-purple-700 text-white px-8 py-3 rounded-lg font-semibold hover:bg-purple-800 transition-colors flex items-center gap-2"
                  >
                    Next Step →
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="bg-green-700 text-white px-8 py-3 rounded-lg font-semibold hover:bg-green-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Submitting...
                      </>
                    ) : (
                      'Complete Assessment'
                    )}
                  </button>
                )}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </motion.main>
  );
}
