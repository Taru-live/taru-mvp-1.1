'use client';


import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import { useNavigationWithState } from '@/lib/hooks/useNavigationWithState';
import { useCareerState } from '@/lib/hooks/useCareerState';
import { useEnhancedSession } from '@/lib/hooks/useEnhancedSession';
import ConsistentLoadingPage from '../components/ConsistentLoadingPage';
import RazorpayPaymentModal from '@/components/RazorpayPaymentModal';

interface Chapter {
  title: string;
}

interface Submodule {
  title: string;
  description: string;
  chapters: Chapter[];
}

interface LearningModule {
  module: string;
  description: string;
  submodules?: Submodule[];
}

interface CareerDetails {
  _id?: { $oid: string };
  id?: string;
  uniqueid?: string;
  output?: {
    greeting: string;
    overview: string[];
    timeRequired: string;
    focusAreas: string[];
    learningPath: LearningModule[];
    finalTip: string;
    modules?: LearningModule[]; // Optional modules field from API
    // Possible student name fields from N8N API
    studentName?: string;
    student_name?: string;
    name?: string;
    userName?: string;
    user_name?: string;
  };
}

function CareerDetailsContent() {
  const [careerDetails, setCareerDetails] = useState<CareerDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [expandedModules, setExpandedModules] = useState<Set<number>>(new Set());
  const [userInfo, setUserInfo] = useState<{
    name: string;
    id: string;
    avatar: string;
  } | null>(null);
  const [userInfoLoading, setUserInfoLoading] = useState(true);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [hasFetchedCareerDetails, setHasFetchedCareerDetails] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [savedPathId, setSavedPathId] = useState<string | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [requiresPayment, setRequiresPayment] = useState(false);
  const fetchingRef = React.useRef(false); // Use ref to prevent duplicate calls
  const router = useRouter();
  const searchParams = useSearchParams();
  const careerPath = searchParams?.get('careerPath') || null;
  const description = searchParams?.get('description') || null;
  const learningPathId = searchParams?.get('learningPathId') || null;

  useEffect(() => {
    // Track mouse position for interactive effects
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY })
    }

    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  const toggleModule = (index: number) => {
    const newExpanded = new Set(expandedModules);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedModules(newExpanded);
  };

  // Save learning path function
  const saveLearningPath = async () => {
    if (!careerDetails?.output || !userInfo?.id || isSaved || isSaving) return;
    
    try {
      setIsSaving(true);
      
      // Transform modules to learningPath if needed for learning-paths/save
      let learningModulesForSave = careerDetails.output.learningPath || [];
      
      // If learningPath is empty but modules exists, transform it
      if ((!learningModulesForSave || learningModulesForSave.length === 0) && 
          Array.isArray(careerDetails.output.modules) && 
          careerDetails.output.modules.length > 0) {
        console.log('🔍 Transforming modules to learningPath for save');
        learningModulesForSave = careerDetails.output.modules.map((module: any) => ({
          module: module.moduleTitle || module.module || '',
          description: module.moduleDescription || module.description || '',
          submodules: Array.isArray(module.submodules) ? module.submodules.map((submodule: any) => ({
            title: submodule.submoduleTitle || submodule.title || '',
            description: submodule.submoduleDescription || submodule.description || '',
            chapters: Array.isArray(submodule.chapters) ? submodule.chapters.map((chapter: any) => ({
              title: chapter.chapterTitle || chapter.title || ''
            })) : []
          })) : []
        }));
        console.log('🔍 Transformed learningModulesForSave length:', learningModulesForSave.length);
      }
      
      // Save learning path
      const response = await fetch('/api/learning-paths/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          studentId: userInfo.id,
          careerPath: searchParams?.get('careerPath') || 'Unknown Career',
          description: careerDetails.output.overview?.join(' ') || 'Career learning path',
          learningModules: learningModulesForSave,
          timeRequired: careerDetails.output.timeRequired || 'Not specified',
          focusAreas: careerDetails.output.focusAreas || []
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setIsSaved(true);
        setSavedPathId(data.learningPath?._id || 'unknown');
        
      } else {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error || 'Failed to save learning path';
        const paymentRequired = errorData.requiresPayment || false;
        
        if (paymentRequired) {
          setRequiresPayment(true);
          setSaveError('You have reached the limit for saving learning paths. Please make a payment to save additional paths.');
          setShowPaymentModal(true);
        } else {
          setRequiresPayment(false);
          setSaveError(errorMessage);
        }
      }
    } catch (err) {
      console.error('Error saving learning path:', err);
      setSaveError('Failed to save learning path');
    } finally {
      setIsSaving(false);
    }
  };

  const fetchUserInfo = async () => {
    setUserInfoLoading(true);
    try {
      console.log('🔍 Fetching user info...', { sessionData: sessionData?.student });
      
      // First try to get user info from session data
      if (sessionData?.student) {
        const student = sessionData.student;
        const userName = student.name || student.firstName || student.fullName || 'Student';
        const userId = student.studentId || student.uniqueId || student.id || '0000';
        const userAvatar = userName.charAt(0).toUpperCase();
        
        console.log('🔍 Using session data:', { userName, userId, userAvatar });
        
        setUserInfo({
          name: userName,
          id: userId,
          avatar: userAvatar
        });
        setUserInfoLoading(false);
        return;
      }

      // If no session data, try API call
      console.log('🔍 No session data, trying API call...');
      const response = await fetch('/api/auth/me', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      });
      
      console.log('🔍 API response status:', response.status, response.statusText);
      
      if (response.ok) {
        const userData = await response.json();
        console.log('🔍 Full API response:', JSON.stringify(userData, null, 2));
        
        if (userData.success && userData.user) {
          const user = userData.user;
          const userName = user.name || user.firstName || user.fullName || 'User';
          const userId = user.studentId || user.id || user.uniqueId || '0000';
          const userAvatar = user.avatar || user.profilePicture || userName.charAt(0).toUpperCase();
          
          console.log('🔍 Using API data:', { userName, userId, userAvatar });
          
          setUserInfo({
            name: userName,
            id: userId,
            avatar: userAvatar
          });
        } else {
          console.log('🔍 API call succeeded but no user data, trying localStorage fallback');
          await tryLocalStorageFallback();
        }
      } else {
        console.log('🔍 API call failed, trying localStorage fallback');
        await tryLocalStorageFallback();
      }
    } catch (error) {
      console.error('Error fetching user info:', error);
      await tryLocalStorageFallback();
    } finally {
      setUserInfoLoading(false);
    }
  };

  const tryLocalStorageFallback = async () => {
    try {
      console.log('🔍 Trying localStorage fallback...');
      
      // Check for registration data first
      const registrationData = localStorage.getItem('registrationData');
      if (registrationData) {
        const parsed = JSON.parse(registrationData);
        if (parsed.fullName && parsed.fullName !== 'Student') {
          console.log('🔍 Found student name in registration data:', parsed.fullName);
          setUserInfo({
            name: parsed.fullName,
            id: parsed.email || '0000',
            avatar: parsed.fullName.charAt(0).toUpperCase()
          });
          return;
        }
      }

      // Check for other possible localStorage keys
      const possibleKeys = ['userName', 'studentName', 'userData', 'studentData', 'userInfo'];
      for (const key of possibleKeys) {
        const data = localStorage.getItem(key);
        if (data) {
          try {
            const parsed = JSON.parse(data);
            const name = parsed.name || parsed.fullName || parsed.firstName;
            if (name && name !== 'Student') {
              console.log(`🔍 Found student name in ${key}:`, name);
              setUserInfo({
                name: name,
                id: parsed.id || parsed.studentId || '0000',
                avatar: name.charAt(0).toUpperCase()
              });
              return;
            }
          } catch (e) {
            // If it's not JSON, try as plain string
            if (data && data !== 'Student') {
              console.log(`🔍 Found student name as string in ${key}:`, data);
              setUserInfo({
                name: data,
                id: '0000',
                avatar: data.charAt(0).toUpperCase()
              });
              return;
            }
          }
        }
      }

      // If no name found anywhere, use generic fallback
      console.log('🔍 No student name found, using generic fallback');
      setUserInfo({
        name: 'Student',
        id: '0000',
        avatar: 'S'
      });
    } catch (error) {
      console.error('🔍 Error in localStorage fallback:', error);
      setUserInfo({
        name: 'Student',
        id: '0000',
        avatar: 'S'
      });
    }
  };
  
  // Session management hooks
  const { navigateWithState, loadPageState, savePageState } = useNavigationWithState();
  const { state: careerState, addCareerPath, selectCareerPath } = useCareerState();
  const { 
    sessionData, 
    isLoading: sessionLoading, 
    isInitialized: sessionInitialized,
    getCareerPathData,
    migrateExistingData 
  } = useEnhancedSession();

  // Note: All data is now dynamically generated from N8N API

  // Fetch saved learning path by ID
  const fetchSavedLearningPath = async (pathId: string) => {
    if (hasFetchedCareerDetails) {
      console.log('🔍 Career details already fetched, skipping...');
      return;
    }
    
    try {
      console.log('🔍 Fetching saved learning path by ID:', pathId);
      setHasFetchedCareerDetails(true);
      setLoading(true);
      const response = await fetch(`/api/learning-paths/${pathId}`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      console.log('🔍 Saved learning path API response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Saved learning path data:', data);
        
        if (data.success && data.careerDetails) {
          const careerData = data.careerDetails;
          console.log('🔍 Career data structure:', careerData);
          console.log('🔍 Career data output:', careerData.output);
          
          if (careerData.output && typeof careerData.output === 'object') {
            // Data is in the correct format: { output: {...}, uniqueid: "..." }
            setCareerDetails(careerData);
            
            // Extract career path from greeting or use description
            const extractedCareerPath = careerData.output.greeting?.replace(/^Hi\s+[^!]+!\s*/, '') || 
                                       careerPath || 
                                       'Career Path';
            
            // Save to career state and page state
            await selectCareerPath(extractedCareerPath, careerData);
            await savePageState(window.location.pathname, { careerDetails: careerData });
          } else {
            console.error('Invalid career details structure:', careerData);
            setError('Invalid career details format received from server');
          }
        } else {
          console.error('No career details in response:', data);
          setError(data.error || 'Failed to load saved learning path');
        }
      } else {
        let errorMessage = 'Failed to load saved learning path';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch {
          errorMessage = `Server error: ${response.status} ${response.statusText}`;
        }
        console.error('Failed to fetch saved learning path:', response.status, errorMessage);
        setError(errorMessage);
      }
    } catch (err) {
      console.error('Error fetching saved learning path:', err);
      setError('Failed to load saved learning path');
    } finally {
      setLoading(false);
    }
  };

  const fetchCareerDetails = async () => {
    // Prevent duplicate calls using ref (works even in React Strict Mode)
    if (hasFetchedCareerDetails || fetchingRef.current) {
      console.log('🔍 Career details already fetched or fetching in progress, skipping...');
      return;
    }
    
    try {
      fetchingRef.current = true;
      console.log('🔍 Fetching career details for:', { careerPath, description });
      setHasFetchedCareerDetails(true);
      setLoading(true);
      const response = await fetch('/api/career-details', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ careerPath, description }),
      });
      
      console.log('🔍 Career details API response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Career details data:', data);
        
        if (data.success && data.careerDetails) {
          // Validate the career details structure
          const careerData = data.careerDetails;
          console.log('🔍 Career data structure:', careerData);
          console.log('🔍 Career data output:', careerData.output);
          console.log('🔍 Overview array:', careerData.output?.overview);
          console.log('🔍 Focus areas array:', careerData.output?.focusAreas);
          console.log('🔍 Learning path array:', careerData.output?.learningPath);
          
          if (careerData.output && typeof careerData.output === 'object') {
            // Data is in the correct format: { output: {...}, uniqueid: "..." }
            setCareerDetails(careerData);
            
            // Save to career state and page state
            await selectCareerPath(careerPath || '', careerData);
            await savePageState(window.location.pathname, { careerDetails: careerData });
          } else if (careerData && typeof careerData === 'object' && !careerData.output) {
            // Data might be directly the output object
            console.log('🔍 Treating careerData as direct output object');
            const formattedData = { output: careerData, uniqueid: 'unknown' };
            setCareerDetails(formattedData);
            
            // Save to career state and page state
            await selectCareerPath(careerPath || '', formattedData);
            await savePageState(window.location.pathname, { careerDetails: formattedData });
          } else {
            console.error('Invalid career details structure:', careerData);
            setError('Invalid career details format received from server');
          }
        } else {
          console.error('No career details in response:', data);
          setError(data.error || 'Failed to load career details');
        }
      } else {
        let errorMessage = 'Failed to load career details';
        let requiresPayment = false;
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
          requiresPayment = errorData.requiresPayment || false;
        } catch {
          // If we can't parse the error response, use the status text
          errorMessage = `Server error: ${response.status} ${response.statusText}`;
        }
        console.error('Failed to fetch career details:', response.status, errorMessage);
        
        if (requiresPayment) {
          // Redirect to career exploration page with payment prompt
          setError('Payment required to access career details. Please complete payment first.');
          // Optionally redirect after showing error
          setTimeout(() => {
            router.push('/career-exploration?payment_required=true');
          }, 2000);
          return;
        }
        
        setError(errorMessage);
      }
    } catch (err) {
      console.error('Error fetching career details:', err);
      setError('Failed to load career details');
      setHasFetchedCareerDetails(false); // Reset on error so it can be retried
    } finally {
      setLoading(false);
      fetchingRef.current = false; // Reset ref when done
    }
  };

  useEffect(() => {
    const initializePage = async () => {
      console.log('🔍 Career details page initializing...', { careerPath, learningPathId, sessionInitialized });
      
      // Fetch user info first
      await fetchUserInfo();
      
      // If we have a learning path ID, fetch the saved learning path (don't call n8n)
      if (learningPathId) {
        console.log('🔍 Learning path ID found, fetching saved learning path...');
        await fetchSavedLearningPath(learningPathId);
        return;
      }
      
      // If we have a career path, always try to fetch details (this ensures webhook is called)
      if (careerPath) {
        console.log('🔍 Career path found, fetching career details...');
        await fetchCareerDetails();
        return;
      }

      // Wait for session to initialize only if no career path
      if (!sessionInitialized) {
        console.log('🔍 Waiting for session to initialize...');
        return;
      }

      // Try to load saved state first
      const savedState = await loadPageState(window.location.pathname);
      if (savedState && savedState.careerDetails) {
        console.log('🔍 Loading saved career details...');
        setCareerDetails(savedState.careerDetails);
        setLoading(false);
        return;
      }

      // Try to load from enhanced session data
      const careerPathData = getCareerPathData();
      if (careerPathData) {
        console.log('🔍 Loading career data from session...');
        setCareerDetails(careerPathData);
        setLoading(false);
        return;
      }

      // Migrate existing data if available
      if (sessionData.student && !sessionData.careerPath) {
        console.log('🔍 Migrating existing data...');
        await migrateExistingData();
      }

      // This section is no longer needed since we handle career path above

      console.log('🔍 No career path or learning path ID specified, showing error...');
      setError('Career path or learning path ID not specified');
      setLoading(false);
    };

    initializePage();
  }, [careerPath, learningPathId, loadPageState, sessionInitialized, getCareerPathData, sessionData, migrateExistingData]);

  // Reset fetch flag when career path or learning path ID changes
  useEffect(() => {
    setHasFetchedCareerDetails(false);
    fetchingRef.current = false; // Also reset the ref
  }, [careerPath, learningPathId]);

  // Fetch user info when session data changes or on initial load
  useEffect(() => {
    if (sessionData?.student && !userInfo && !userInfoLoading) {
      fetchUserInfo();
    } else if (!sessionData?.student && !userInfo && !userInfoLoading) {
      // If no session data, still try to fetch user info
      fetchUserInfo();
    }
  }, [sessionData, userInfo, userInfoLoading]);

  // Also fetch user info on component mount if not already loaded
  useEffect(() => {
    if (!userInfo && !userInfoLoading) {
      fetchUserInfo();
    }
  }, []);

  // Try to extract student name from career details if user info is not available
  useEffect(() => {
    if (!userInfo && careerDetails && !userInfoLoading) {
      console.log('🔍 Trying to extract student name from career details...', careerDetails);
      
      // Check if career details contain student information
      const careerData = careerDetails.output;
      if (careerData) {
        // Look for student name in various possible fields
        const possibleNameFields = [
          careerData.studentName,
          careerData.student_name,
          careerData.name,
          careerData.userName,
          careerData.user_name
        ];
        
        const studentName = possibleNameFields.find(name => name && typeof name === 'string' && name.trim().length > 0);
        
        if (studentName) {
          console.log('🔍 Found student name in career details:', studentName);
          setUserInfo({
            name: studentName.trim(),
            id: careerDetails.uniqueid || '0000',
            avatar: studentName.trim().charAt(0).toUpperCase()
          });
        } else {
          // Try to extract name from greeting text
          if (careerData.greeting) {
            const greetingMatch = careerData.greeting.match(/Hi\s+([^!]+)!/i);
            if (greetingMatch && greetingMatch[1]) {
              const extractedName = greetingMatch[1].trim();
              if (extractedName && extractedName !== 'Student') {
                console.log('🔍 Extracted student name from greeting:', extractedName);
                setUserInfo({
                  name: extractedName,
                  id: careerDetails.uniqueid || '0000',
                  avatar: extractedName.charAt(0).toUpperCase()
                });
              }
            }
          }
        }
      }
    }
  }, [careerDetails, userInfo, userInfoLoading]);

  // Try to get student name from localStorage as final fallback
  useEffect(() => {
    if (!userInfo && !userInfoLoading) {
      console.log('🔍 Trying to get student name from localStorage...');
      
      try {
        // Check for registration data
        const registrationData = localStorage.getItem('registrationData');
        if (registrationData) {
          const parsed = JSON.parse(registrationData);
          if (parsed.fullName && parsed.fullName !== 'Student') {
            console.log('🔍 Found student name in registration data:', parsed.fullName);
            setUserInfo({
              name: parsed.fullName,
              id: parsed.email || '0000',
              avatar: parsed.fullName.charAt(0).toUpperCase()
            });
            return;
          }
        }

        // Check for other possible localStorage keys
        const possibleKeys = ['userName', 'studentName', 'userData', 'studentData'];
        for (const key of possibleKeys) {
          const data = localStorage.getItem(key);
          if (data) {
            try {
              const parsed = JSON.parse(data);
              const name = parsed.name || parsed.fullName || parsed.firstName;
              if (name && name !== 'Student') {
                console.log(`🔍 Found student name in ${key}:`, name);
                setUserInfo({
                  name: name,
                  id: parsed.id || parsed.studentId || '0000',
                  avatar: name.charAt(0).toUpperCase()
                });
                return;
              }
            } catch (e) {
              // If it's not JSON, try as plain string
              if (data && data !== 'Student') {
                console.log(`🔍 Found student name as string in ${key}:`, data);
                setUserInfo({
                  name: data,
                  id: '0000',
                  avatar: data.charAt(0).toUpperCase()
                });
                return;
              }
            }
          }
        }
      } catch (error) {
        console.error('🔍 Error checking localStorage:', error);
      }
    }
  }, [userInfo, userInfoLoading]);

  if (loading) {
    return (
      <ConsistentLoadingPage
        type="general"
        title="Generating Your Career Path"
        subtitle="We're analyzing your profile and creating a personalized career exploration guide tailored just for you..."
        tips={[
          'Analyzing your interests and skills',
          'Matching you with relevant career paths',
          'Preparing detailed career information'
        ]}
      />
    );
  }

  if (error || !careerDetails) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="text-red-500 text-8xl mb-6">⚠️</div>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Oops! Something went wrong</h2>
          <p className="text-gray-600 mb-6">{error || 'Career details not found'}</p>
          <button
            onClick={() => router.push('/career-exploration')}
            className="px-8 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl hover:from-purple-700 hover:to-blue-700 transition-all duration-300 transform hover:scale-105 shadow-lg"
          >
            Back to Career Options
          </button>
        </div>
      </div>
    );
  }

  // Extract output dynamically from N8N API response
  // Monitoring: Log career details for debugging and monitoring
  console.log('[CareerDetails] Career details state:', {
    hasOutput: !!careerDetails?.output,
    uniqueid: careerDetails?.uniqueid,
    _id: careerDetails?._id,
  });
  
  if (careerDetails?.output) {
    console.log('[CareerDetails] Extracted career details:', {
      output: careerDetails.output,
      uniqueid: careerDetails.uniqueid,
      _id: careerDetails._id,
      id: careerDetails.id,
    });
    
    console.log('[CareerDetails] Career details structure:', {
      greeting: careerDetails.output.greeting,
      overviewLength: Array.isArray(careerDetails.output.overview) ? careerDetails.output.overview.length : 0,
      focusAreasLength: Array.isArray(careerDetails.output.focusAreas) ? careerDetails.output.focusAreas.length : 0,
      learningPathLength: Array.isArray(careerDetails.output.learningPath) ? careerDetails.output.learningPath.length : undefined,
      modulesLength: Array.isArray(careerDetails.output.modules) ? careerDetails.output.modules.length : undefined,
      timeRequired: careerDetails.output.timeRequired,
      finalTip: careerDetails.output.finalTip,
    });
    
    if (Array.isArray(careerDetails.output.overview)) {
      console.log('[CareerDetails] Overview array:', careerDetails.output.overview);
    }
    if (Array.isArray(careerDetails.output.focusAreas)) {
      console.log('[CareerDetails] Focus areas array:', careerDetails.output.focusAreas);
    }
    if (Array.isArray(careerDetails.output.modules)) {
      console.log('[CareerDetails] Modules array:', careerDetails.output.modules);
    }
    if (Array.isArray(careerDetails.output.learningPath)) {
      console.log('[CareerDetails] Learning path array:', careerDetails.output.learningPath);
    }
  }
  
  // Minimal fallback data (only used if N8N API completely fails)
  const defaultOutput = {
    greeting: "🌟 Welcome to your career exploration!",
    overview: ["Loading your personalized career information..."],
    timeRequired: "Loading...",
    focusAreas: ["Loading career focus areas..."],
    learningPath: [
      {
        module: "Loading career path...",
        description: "Please wait while we generate your personalized learning journey.",
        submodules: []
      }
    ],
    finalTip: "🚀 Your personalized career guidance is being prepared!"
  };

  // Use dynamic data from N8N API or fallback to defaults
  let output: {
    greeting: string;
    overview: string[];
    timeRequired: string;
    focusAreas: string[];
    learningPath: LearningModule[];
    finalTip: string;
  } = defaultOutput;
  
  // Extract data from N8N API response
  if (careerDetails?.output) {
    console.log('[CareerDetails] Using N8N career details data');
    const apiOutput = careerDetails.output;
    
    // Transform modules array to learningPath format
    let learningPath: LearningModule[] = defaultOutput.learningPath;
    
    if (Array.isArray(apiOutput.modules) && apiOutput.modules.length > 0) {
      console.log('🔍 Transforming modules to learningPath format');
      learningPath = apiOutput.modules.map((module: any) => ({
        module: module.moduleTitle || module.module || '',
        description: module.moduleDescription || module.description || '',
        submodules: Array.isArray(module.submodules) ? module.submodules.map((submodule: any) => ({
          title: submodule.submoduleTitle || submodule.title || '',
          description: submodule.submoduleDescription || submodule.description || '',
          chapters: Array.isArray(submodule.chapters) ? submodule.chapters.map((chapter: any) => ({
            title: chapter.chapterTitle || chapter.title || ''
          })) : []
        })) : []
      }));
      console.log('🔍 Transformed learningPath:', learningPath);
    } else if (Array.isArray(apiOutput.learningPath)) {
      // Fallback to learningPath if modules doesn't exist
      learningPath = apiOutput.learningPath;
    }
    
    output = {
      greeting: apiOutput.greeting || defaultOutput.greeting,
      overview: Array.isArray(apiOutput.overview) ? apiOutput.overview : defaultOutput.overview,
      timeRequired: apiOutput.timeRequired || defaultOutput.timeRequired,
      focusAreas: Array.isArray(apiOutput.focusAreas) ? apiOutput.focusAreas : defaultOutput.focusAreas,
      learningPath: learningPath,
      finalTip: apiOutput.finalTip || defaultOutput.finalTip
    };
  } else {
    console.log('⚠️ No N8N data available, using fallback');
  }

  // Only use fallback if we have completely empty data (API failed)
  if (!output.overview || output.overview.length === 0) {
    console.log('⚠️ No overview data available, using default fallback');
    output.overview = defaultOutput.overview;
  }
  
  if (!output.focusAreas || output.focusAreas.length === 0) {
    console.log('⚠️ No focus areas data available, using default fallback');
    output.focusAreas = defaultOutput.focusAreas;
  }
  
  if (!output.learningPath || output.learningPath.length === 0) {
    console.log('⚠️ No learning path data available, using default fallback');
    output.learningPath = defaultOutput.learningPath;
  }
  
  console.log('🔍 Career data loaded:', {
    source: careerDetails?.output ? 'N8N API' : 'Fallback',
    overview: output.overview?.length || 0,
    focusAreas: output.focusAreas?.length || 0,
    learningPath: output.learningPath?.length || 0
  });

  return (
    <>
      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
      <motion.div 
        className="h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 relative overflow-hidden flex flex-col"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        {/* Enhanced Interactive Background Elements */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Mouse-following gradient orbs */}
          <motion.div
            className="absolute w-96 h-96 rounded-full bg-gradient-to-r from-purple-400/10 to-pink-400/10 blur-3xl"
            animate={{
              x: mousePosition.x * 0.05 - 200,
              y: mousePosition.y * 0.05 - 200,
            }}
            transition={{ type: "spring", stiffness: 30, damping: 20 }}
          />
          <motion.div
            className="absolute w-64 h-64 rounded-full bg-gradient-to-r from-blue-400/10 to-indigo-400/10 blur-2xl"
            animate={{
              x: mousePosition.x * -0.03 + 100,
              y: mousePosition.y * -0.03 + 100,
            }}
            transition={{ type: "spring", stiffness: 20, damping: 25 }}
          />
          
          {/* Floating particles */}
          {[...Array(12)].map((_, i) => {
            // Use deterministic positioning based on index to avoid hydration mismatch
            const basePosition = (i * 137.5) % 100; // Golden ratio for better distribution
            const left = (basePosition + (i * 23.7)) % 100;
            const top = (basePosition * 1.618 + (i * 31.2)) % 100;
            
            return (
              <motion.div
                key={`particle-${i}`}
                className="absolute w-2 h-2 bg-gradient-to-r from-purple-400/30 to-pink-400/30 rounded-full"
                style={{
                  left: `${left}%`,
                  top: `${top}%`,
                }}
                animate={{
                  y: [0, -30, 0],
                  x: [0, (i % 3 - 1) * 10, 0],
                  scale: [1, 1.5, 1],
                  opacity: [0.2, 0.7, 0.2],
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
          {[...Array(6)].map((_, i) => {
            // Use deterministic positioning based on index to avoid hydration mismatch
            const basePosition = (i * 89.3) % 100; // Different multiplier for variety
            const left = (basePosition + (i * 41.7)) % 100;
            const top = (basePosition * 2.414 + (i * 19.8)) % 100;
            
            return (
              <motion.div
                key={`shape-${i}`}
                className="absolute w-3 h-3 bg-gradient-to-r from-blue-400/20 to-purple-400/20 rounded-full"
                style={{
                  left: `${left}%`,
                  top: `${top}%`,
                }}
                animate={{
                  y: [0, -40, 0],
                  x: [0, (i % 5 - 2) * 8, 0],
                  scale: [1, 1.3, 1],
                  opacity: [0.3, 0.6, 0.3],
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
      {/* Enhanced Header */}
      <motion.header 
        className="bg-white/90 backdrop-blur-2xl border-b border-purple-200/50 sticky top-0 z-50 shadow-lg"
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-center items-center h-20">

            {/* Progress Steps with Labels */}
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-2xl px-6 py-3 border border-purple-200/50">
                {[
                  { step: 1, label: "Assessment", completed: true },
                  { step: 2, label: "Career Exploration", completed: true },
                  { step: 3, label: "Learning Path", completed: true, current: true }
                ].map((item, index) => (
                  <motion.div
                    key={item.step}
                    className="flex items-center space-x-3"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.2 }}
                  >
                    <motion.div 
                      className={`w-10 h-10 rounded-full flex items-center justify-center shadow-lg ${
                        item.current
                          ? 'bg-gradient-to-r from-purple-500 to-blue-500' 
                          : item.completed
                          ? 'bg-gradient-to-r from-green-500 to-emerald-500'
                          : 'bg-gradient-to-r from-purple-300 to-blue-300'
                      }`}
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      transition={{ type: "spring", stiffness: 300 }}
                    >
                      {item.completed && !item.current ? (
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <span className="text-white font-bold text-sm">{item.step}</span>
                      )}
                    </motion.div>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-gray-700">{item.label}</span>
                      <span className="text-xs text-gray-500">
                        {item.current ? 'Current Step' : item.completed ? 'Completed' : 'Upcoming'}
                      </span>
                    </div>
                    {index < 2 && (
                      <motion.div 
                        className="w-8 h-0.5 bg-gradient-to-r from-purple-300 to-blue-300"
                        initial={{ scaleX: 0 }}
                        animate={{ scaleX: 1 }}
                        transition={{ delay: 0.5 + index * 0.2, duration: 0.5 }}
                      />
                    )}
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Enhanced Hero Section */}
        <motion.div 
          className="text-center mb-16"
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.8 }}
        >
          <motion.div 
            className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 rounded-3xl mb-8 shadow-2xl"
            whileHover={{ scale: 1.1, rotate: 5 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <span className="text-4xl">🧑🏻‍🎓</span>
          </motion.div>
          
          <motion.h1 
            className="text-5xl md:text-6xl font-bold mb-6"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.6 }}
          >
            <span className="bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 bg-clip-text text-transparent">
            {careerPath || (careerDetails?.output?.greeting?.replace(/^Hi\s+[^!]+!\s*/, '') || 'Career Explorer')}
            </span>
          </motion.h1>
          
          <motion.p 
            className="text-xl md:text-2xl text-gray-600 max-w-4xl mx-auto leading-relaxed mb-8"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.7, duration: 0.6 }}
          >
            {userInfoLoading ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-32 h-6 bg-gray-200 rounded animate-pulse"></div>
                <span>{output.greeting}</span>
              </div>
            ) : userInfo?.name && userInfo.name !== 'Student' ? (
              <>
                <span className="text-purple-600 font-semibold">Hi {userInfo.name}!</span>{' '}
                {output.greeting}
              </>
            ) : (
              output.greeting
            )}
          </motion.p>

          {/* Status Indicators */}
          <motion.div 
            className="flex flex-wrap justify-center gap-4 mb-8"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.9, duration: 0.6 }}
          >
            <div className="flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-full text-sm font-medium border border-blue-200">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
              Personalized Learning Path
            </div>
            <div className="flex items-center gap-2 bg-green-50 text-green-700 px-4 py-2 rounded-full text-sm font-medium border border-green-200">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              AI-Powered Insights
            </div>
            <div className="flex items-center gap-2 bg-purple-50 text-purple-700 px-4 py-2 rounded-full text-sm font-medium border border-purple-200">
              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
              Interactive Timeline
            </div>
          </motion.div>

          {isSaved && (
            <motion.div 
              className="inline-flex items-center gap-3 bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 px-6 py-3 rounded-2xl text-sm font-semibold border border-green-200 shadow-lg"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Learning path saved successfully!
            </motion.div>
          )}
        </motion.div>

        {/* Why This Career Fits You */}
        <motion.section 
          className="mb-16"
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.8 }}
        >
          <div className="bg-white rounded-3xl shadow-2xl p-8 md:p-12 border border-gray-100 overflow-hidden relative">
            {/* Decorative background elements */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-100 to-blue-100 rounded-full -translate-y-16 translate-x-16"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-blue-100 to-purple-100 rounded-full translate-y-12 -translate-x-12"></div>
            
            <motion.h2 
              className="text-4xl font-bold text-gray-900 mb-12 text-center relative z-10"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.6, duration: 0.6 }}
            >
              <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              Why this career fits you
              </span>
            </motion.h2>
            
            <div className="grid md:grid-cols-2 gap-12 relative z-10">
              <motion.div 
                className="space-y-8"
                initial={{ x: -30, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.8, duration: 0.6 }}
              >
              {output.overview && output.overview.length > 0 ? (
                output.overview.map((item, index) => (
                    <motion.div 
                      key={index} 
                      className="flex items-start space-x-6 group"
                      initial={{ x: -20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: 1 + (index * 0.1), duration: 0.5 }}
                    >
                      <motion.div 
                        className="w-8 h-8 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1 shadow-lg group-hover:scale-110 transition-transform duration-200"
                        whileHover={{ rotate: 360 }}
                        transition={{ duration: 0.6 }}
                      >
                      <span className="text-white text-sm font-bold">{index + 1}</span>
                      </motion.div>
                      <p className="text-gray-700 leading-relaxed text-lg group-hover:text-gray-900 transition-colors duration-200">
                        {item}
                      </p>
                    </motion.div>
                ))
              ) : (
                  <div className="text-gray-500 italic text-center py-8">No overview data available</div>
                )}
              </motion.div>
              
              <motion.div 
                className="bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 rounded-2xl p-8 border border-purple-100 shadow-lg"
                initial={{ x: 30, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 1, duration: 0.6 }}
                whileHover={{ scale: 1.02 }}
              >
                <div className="text-center">
                  <motion.div 
                    className="text-6xl mb-6"
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                  >
                    ⏱️
                  </motion.div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">Time to Master</h3>
                  <motion.p 
                    className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent"
                    initial={{ scale: 0.8 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 1.2, duration: 0.5, type: "spring" }}
                  >
                    {output.timeRequired}
                  </motion.p>
                  <div className="mt-6 w-full bg-gray-200 rounded-full h-2">
                    <motion.div 
                      className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: "75%" }}
                      transition={{ delay: 1.4, duration: 1.5, ease: "easeOut" }}
                    ></motion.div>
                </div>
                  <p className="text-sm text-gray-600 mt-2">Learning Progress</p>
              </div>
              </motion.div>
            </div>
          </div>
        </motion.section>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-2 gap-8 mb-16">
          {/* Activities to Start Now */}
          <section className="bg-white rounded-2xl shadow-xl p-8">
            <div className="flex items-center space-x-3 mb-8">
              <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
                <span className="text-white text-xl">🚀</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900">Activities to Start Now</h3>
            </div>
            <div className="space-y-4">
              {output.focusAreas && output.focusAreas.length > 0 ? (
                output.focusAreas.slice(0, 4).map((activity, index) => {
                const colors = [
                  'from-green-500 to-emerald-500',
                  'from-orange-500 to-red-500',
                  'from-purple-500 to-pink-500',
                  'from-blue-500 to-cyan-500'
                ];
                return (
                  <div key={index} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors duration-200">
                    <div className={`w-4 h-4 bg-gradient-to-r ${colors[index % colors.length]} rounded-full`}></div>
                    <span className="text-gray-800 font-medium">{activity}</span>
                  </div>
                );
                })
              ) : (
                <div className="text-gray-500 italic">No focus areas data available</div>
              )}
            </div>
          </section>

          {/* Tools & Resources */}
          <section className="bg-white rounded-2xl shadow-xl p-8">
            <div className="flex items-center space-x-3 mb-8">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center">
                <span className="text-white text-xl">🛠️</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900">Tools & Resources</h3>
            </div>
            <div className="space-y-4">
              {output.focusAreas && output.focusAreas.length > 3 ? (
                output.focusAreas.slice(3, 6).map((resource, index) => {
                const colors = [
                  'from-green-500 to-emerald-500',
                  'from-orange-500 to-red-500',
                  'from-purple-500 to-pink-500'
                ];
                return (
                  <div key={index} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors duration-200">
                    <span className="text-gray-800 font-medium">{resource}</span>
                    <div className={`w-4 h-4 bg-gradient-to-r ${colors[index % colors.length]} rounded-full ml-auto`}></div>
                  </div>
                );
                })
              ) : (
                <div className="text-gray-500 italic">No additional resources data available</div>
              )}
            </div>
          </section>
        </div>

        {/* 3-Year Growth Timeline */}
        <section className="mb-16">
          <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12">
            <div className="text-center mb-12">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl mb-4">
                <span className="text-white text-2xl">📈</span>
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">{output.timeRequired} Growth Timeline</h2>
              <p className="text-gray-600 max-w-2xl mx-auto">
                Your personalized learning journey to master this career path
              </p>
            </div>
            
            <div className="space-y-8">
              {output.learningPath && output.learningPath.length > 0 ? (
                output.learningPath.map((module, index) => {
                const colors = [
                  'from-green-500 to-emerald-500',
                  'from-orange-500 to-red-500',
                  'from-purple-500 to-pink-500',
                  'from-blue-500 to-cyan-500',
                  'from-indigo-500 to-purple-500',
                  'from-yellow-500 to-orange-500',
                  'from-teal-500 to-green-500',
                  'from-pink-500 to-rose-500'
                ];
                const hasSubmodules = module.submodules && Array.isArray(module.submodules);
                
                const isExpanded = expandedModules.has(index);
                
                return (
                  <div key={index} className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl hover:shadow-lg transition-all duration-300 overflow-hidden">
                    <div className="flex items-start space-x-6 p-6">
                      <div className={`w-12 h-12 bg-gradient-to-r ${colors[index % colors.length]} rounded-xl flex items-center justify-center flex-shrink-0`}>
                        <span className="text-white font-bold text-lg">{index + 1}</span>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="text-xl font-bold text-gray-900">
                            {module.module}
                          </h3>
                          {hasSubmodules && (
                            <button
                              onClick={() => toggleModule(index)}
                              className="flex items-center space-x-2 text-purple-600 hover:text-purple-700 transition-colors duration-200"
                            >
                              <span className="text-sm font-medium">
                                {isExpanded ? 'Hide Details' : 'Show Details'}
                              </span>
                              <svg
                                className={`w-5 h-5 transform transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              </svg>
                            </button>
                          )}
                        </div>
                        <p className="text-gray-600 leading-relaxed mb-4">{module.description}</p>
                        
                        {/* Submodules */}
                        {hasSubmodules && isExpanded && (
                          <div className="space-y-4 animate-fadeIn">
                            {module.submodules?.map((submodule: Submodule, subIndex: number) => (
                              <div key={subIndex} className="bg-white rounded-lg p-4 border border-gray-200">
                                <h4 className="font-semibold text-gray-800 mb-2">{submodule.title}</h4>
                                <p className="text-sm text-gray-600 mb-3">{submodule.description}</p>
                                
                                {/* Chapters */}
                                {submodule.chapters && Array.isArray(submodule.chapters) && (
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                    {submodule.chapters.map((chapter: Chapter, chapterIndex: number) => (
                                      <div key={chapterIndex} className="flex items-center space-x-2 text-sm text-gray-700">
                                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                        <span>{chapter.title}</span>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
              ) : (
                <div className="text-gray-500 italic text-center py-8">No learning path data available</div>
              )}
            </div>
          </div>
        </section>

        {/* Motivational Messages */}
        <div className="grid md:grid-cols-3 gap-6 mb-16">
          {output.overview.slice(0, 3).map((message, index) => {
            const messages = [
              { emoji: '🎉', prefix: 'Great job!' },
              { emoji: '🌟', prefix: 'Amazing!' },
              { emoji: '💪', prefix: 'Excellent!' }
            ];
            const msg = messages[index] || messages[0];
            return (
              <div key={index} className="bg-gradient-to-br from-purple-100 to-blue-100 rounded-xl p-6 text-center">
                <div className="text-3xl mb-3">{msg.emoji}</div>
                <p className="text-gray-800 font-medium">
                  {msg.prefix} {message}
                </p>
              </div>
            );
          })}
        </div>

        {/* Footer CTA */}
        <section className="text-center">
          <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl p-12 text-white">
            <h2 className="text-3xl font-bold mb-4">Your Future is Bright! ✨</h2>
            <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
              {output.finalTip}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => router.push('/career-exploration')}
                className="px-8 py-3 bg-white text-purple-600 rounded-xl font-semibold hover:bg-gray-100 transition-colors duration-200"
              >
                Explore More Careers
              </button>
              <button
                onClick={saveLearningPath}
                disabled={isSaving || isSaved}
                className={`px-8 py-3 rounded-xl font-semibold transition-colors duration-200 flex items-center gap-2 ${
                  isSaving 
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : isSaved
                    ? 'bg-green-600 text-white cursor-default'
                    : 'bg-purple-700 text-white hover:bg-purple-800'
                }`}
              >
                {isSaving ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Saving Learning Path...
                  </>
                ) : isSaved ? (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Saved! Redirecting...
                  </>
                ) : (
                  'Save Learning Path'
                )}
              </button>
            </div>
            {saveError && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`mt-4 p-4 rounded-xl border-2 ${
                  requiresPayment
                    ? 'bg-gradient-to-r from-orange-50 to-yellow-50 border-orange-300'
                    : 'bg-red-100 border-red-400'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                    requiresPayment ? 'bg-orange-100' : 'bg-red-100'
                  }`}>
                    {requiresPayment ? (
                      <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    ) : (
                      <X className="w-5 h-5 text-red-600" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className={`text-sm font-medium ${
                      requiresPayment ? 'text-orange-800' : 'text-red-700'
                    }`}>
                      {saveError}
                    </p>
                    {requiresPayment && (
                      <div className="mt-3 flex gap-2">
                        <button
                          onClick={() => setShowPaymentModal(true)}
                          className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all font-medium text-sm"
                        >
                          Make Payment
                        </button>
                        <button
                          onClick={() => {
                            setSaveError(null);
                            setRequiresPayment(false);
                          }}
                          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-all font-medium text-sm"
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                    {!requiresPayment && (
                      <button
                        onClick={() => setSaveError(null)}
                        className="text-xs underline hover:no-underline mt-2 text-red-600"
                      >
                        Dismiss
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </section>
        </div>
      </main>

      {/* Success Modal - Learning Path Saved */}
      {isSaved && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 max-w-md mx-4 text-center animate-in zoom-in-95 duration-300">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Learning Path Saved! 🎉</h3>
            <p className="text-gray-600 mb-4">
              Your personalized learning path for <strong>{careerPath}</strong> has been successfully saved to your dashboard.
            </p>
            <div className="bg-gray-50 rounded-lg p-3 mb-4">
              <p className="text-sm text-gray-500">Path ID: {savedPathId}</p>
            </div>
            <div className="flex justify-center">
              <button
                onClick={() => {
                  // Only navigate to dashboard, do not trigger any save functionality
                  router.push('/dashboard/student');
                }}
                className="px-6 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors"
              >
                Go to Dashboard Now
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-3">
              Redirecting to dashboard in 3 seconds...
            </p>
          </div>
        </div>
      )}

      </motion.div>

      {/* Payment Modal for Learning Path Save */}
      <RazorpayPaymentModal
        isOpen={showPaymentModal}
        onClose={() => {
          setShowPaymentModal(false);
          setRequiresPayment(false);
        }}
        onSuccess={async () => {
          setShowPaymentModal(false);
          setRequiresPayment(false);
          setSaveError(null);
          
          // Wait for subscription to be created after payment verification
          // Payment verification creates subscription, but it may take a moment
          let retries = 0;
          const maxRetries = 5;
          const retryDelay = 1000; // 1 second
          
          const waitForSubscriptionAndSave = async () => {
            if (!careerDetails?.output || !userInfo?.id) return;
            
            // Check subscription status first (using GET with query params)
            try {
              const statusResponse = await fetch('/api/payments/subscription-status?learningPathId=null', {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include'
              });
              
              const statusData = await statusResponse.json();
              
              // If subscription is available, try saving
              if (statusData.hasSubscription || statusData.hasActiveSubscription) {
                console.log('✅ Subscription available, attempting to save learning path...');
                await saveLearningPath();
              } else if (retries < maxRetries) {
                // Wait and retry
                retries++;
                console.log(`⏳ Waiting for subscription... (attempt ${retries}/${maxRetries})`);
                setTimeout(waitForSubscriptionAndSave, retryDelay);
              } else {
                // Max retries reached, show error
                setSaveError('Payment completed but subscription is not ready yet. Please try saving again in a moment.');
                setRequiresPayment(false);
              }
            } catch (err) {
              console.error('Error checking subscription status:', err);
              if (retries < maxRetries) {
                retries++;
                setTimeout(waitForSubscriptionAndSave, retryDelay);
              } else {
                setSaveError('Failed to verify subscription. Please try saving again.');
              }
            }
          };
          
          // Start waiting for subscription
          setTimeout(waitForSubscriptionAndSave, 500); // Initial delay
        }}
        planType="basic"
        paymentFor="learning_path_save"
        amount={99}
      />
    </>
  );
}

export default function CareerDetailsPage() {
  return (
    <Suspense fallback={
      <ConsistentLoadingPage
        type="webhook"
        title="Loading Career Details"
        subtitle="Please wait while we load your personalized career exploration guide..."
        tips={[
          'Fetching your career information',
          'Preparing detailed learning paths',
          'Setting up your exploration guide'
        ]}
      />
    }>
      <CareerDetailsContent />
    </Suspense>
  );
}
