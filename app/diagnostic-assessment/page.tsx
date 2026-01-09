'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import ResultSummaryModal from '../components/ResultSummaryModal';
import { useAssessmentState } from '@/lib/hooks/useAssessmentState';
import { useNavigationWithState } from '@/lib/hooks/useNavigationWithState';
import ConsistentLoadingPage from '../components/ConsistentLoadingPage';

// SVG Icon Components
const TargetIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm0-14c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6zm0 10c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm0-6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
  </svg>
);

const CheckIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
  </svg>
);

const WarningIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/>
  </svg>
);

const PartyIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
    <circle cx="7" cy="7" r="1.5"/>
    <circle cx="17" cy="7" r="1.5"/>
    <circle cx="7" cy="17" r="1.5"/>
    <circle cx="17" cy="17" r="1.5"/>
  </svg>
);

const SparklesIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
  </svg>
);

const ConfettiIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
    <circle cx="5" cy="5" r="1"/>
    <circle cx="19" cy="5" r="1"/>
    <circle cx="5" cy="19" r="1"/>
    <circle cx="19" cy="19" r="1"/>
  </svg>
);

const StarIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
  </svg>
);

const ChartIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path d="M5 9.2h3V19H5zM10.6 5h2.8v14h-2.8zm5.6 8H19v6h-2.8z"/>
  </svg>
);

const TrophyIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path d="M19 5h-2V3H7v2H5c-1.1 0-2 .9-2 2v1c0 2.55 1.92 4.63 4.39 4.94A5.01 5.01 0 0 0 11 15.9V19H7v2h10v-2h-4v-3.1a5.01 5.01 0 0 0 3.61-2.96C19.08 12.63 21 10.55 21 8V7c0-1.1-.9-2-2-2zM5 8V7h2v3.82C5.84 10.4 5 9.3 5 8zm14 0c0 1.3-.84 2.4-2 2.82V7h2v1z"/>
  </svg>
);

const RocketIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path d="M9.19 6.35c-2.04 2.29-3.44 5.58-3.57 9.11-.02.27.18.49.45.49s.47-.19.49-.45c.12-3.25 1.42-6.23 3.25-8.28l-.62-.87zm5.62 0l-.62.87c1.83 2.05 3.13 5.03 3.25 8.28.02.27.22.45.49.45s.47-.22.45-.49c-.13-3.53-1.53-6.82-3.57-9.11zM12 2.01c-1.33 0-2.41 1.08-2.41 2.41 0 1.33 1.08 2.41 2.41 2.41s2.41-1.08 2.41-2.41c0-1.33-1.08-2.41-2.41-2.41zm0 5.16c-1.52 0-2.75-1.23-2.75-2.75S10.48 1.67 12 1.67s2.75 1.23 2.75 2.75-1.23 2.75-2.75 2.75zm-6.5 11.75c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm13 0c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm-6.5-2c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1z"/>
  </svg>
);

const FlexIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path d="M20.57 14.86L22 13.43 20.57 12 17 15.57 8.43 7 12 3.43 10.57 2 9.14 3.43 7.71 2 5.57 4.14 4.14 2.71 2.71 4.14l1.43 1.43L2 7.71l1.43 1.43L2 10.57 3.43 12l7-7 8.57 8.57 1.43-1.43-1.43-1.43 1.43-1.43 1.43 1.43 1.43-1.43-1.43-1.43L22 12l-1.43 1.43-1.43-1.43-1.43 1.43 1.43 1.43L17 15.57l3.57-3.57z"/>
  </svg>
);

const ChartUpIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path d="M16 6l2.29 2.29-4.88 4.88-4-4L2 16.59 3.41 18l6-6 4 4 6.3-6.29L22 12V6z"/>
  </svg>
);

const DizzyStarIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2zm0 2.74L9.5 8.5 3.5 9.27l4.5 4.38-1.06 6.18L12 16.23l5.06 2.6-1.06-6.18L20.5 9.27l-6-1.03L12 4.74z"/>
    <circle cx="8" cy="8" r="1"/>
    <circle cx="16" cy="8" r="1"/>
    <circle cx="8" cy="16" r="1"/>
    <circle cx="16" cy="16" r="1"/>
  </svg>
);

const LightbulbIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path d="M9 21c0 .5.4 1 1 1h4c.6 0 1-.5 1-1v-1H9v1zm3-19C8.1 2 5 5.1 5 9c0 2.4 1.2 4.5 3 5.7V17c0 .5.4 1 1 1h6c.6 0 1-.5 1-1v-2.3c1.8-1.3 3-3.4 3-5.7 0-3.9-3.1-7-7-7z"/>
  </svg>
);

interface AssessmentQuestion {
  id: string;
  question: string;
  type: 'SINGLE_CHOICE' | 'MULTIPLE_CHOICE';
  options?: string[];
  category?: string;
  section?: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

interface AssessmentResult {
  type: string;
  description: string;
  score: number;
  learningStyle?: string;
  recommendations?: { title: string; description: string; xp: number }[];
  totalQuestions?: number;
  n8nResults?: {
    'Total Questions'?: number;
    Score?: number;
    Summery?: string;
    [key: string]: any;
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

interface CollectedAnswer {
  Q: string;
  section: string;
  question: string;
  studentAnswer: string;
  type: string;
}

export default function DiagnosticAssessment() {
  const [currentQuestion, setCurrentQuestion] = useState<AssessmentQuestion | null>(null);
  const [currentQuestionNumber, setCurrentQuestionNumber] = useState(1);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [progress, setProgress] = useState(0);
  const [answer, setAnswer] = useState('');
  const [selectedOption, setSelectedOption] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPreviousLoading, setIsPreviousLoading] = useState(false);
  const [isSkipLoading, setIsSkipLoading] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [result, setResult] = useState<AssessmentResult | null>(null);
  const [error, setError] = useState('');
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [collectedAnswers, setCollectedAnswers] = useState<CollectedAnswer[]>([]);
  const [isResetting, setIsResetting] = useState(false);
  const [isFromInterestAssessment, setIsFromInterestAssessment] = useState(false);
  const [showResultModal, setShowResultModal] = useState(false);
  const router = useRouter();

  // Helper function to generate motivating appreciation message
  const getAppreciationMessage = (result: AssessmentResult): string => {
    const score = result.n8nResults?.Score || result.score || 0;
    const resultType = result.type || '';
    
    // Score-based motivational adjectives that inspire and encourage students
    let adjectives: string[] = [];
    if (score >= 90) {
      adjectives = [
        'absolutely amazing', 
        'incredibly talented', 
        'truly exceptional', 
        'remarkably skilled', 
        'phenomenally bright',
        'outstandingly brilliant',
        'extraordinarily gifted',
        'spectacularly smart'
      ];
    } else if (score >= 80) {
      adjectives = [
        'doing fantastic', 
        'really impressive', 
        'truly excellent', 
        'wonderfully capable', 
        'amazingly talented',
        'incredibly smart',
        'remarkably strong',
        'exceptionally bright'
      ];
    } else if (score >= 70) {
      adjectives = [
        'doing great', 
        'really capable', 
        'truly talented', 
        'wonderfully determined', 
        'impressively focused',
        'remarkably dedicated',
        'genuinely skilled',
        'truly promising'
      ];
    } else if (score >= 60) {
      adjectives = [
        'working hard', 
        'staying determined', 
        'being persistent', 
        'showing resilience', 
        'staying committed',
        'being courageous',
        'staying focused',
        'showing dedication'
      ];
    } else {
      adjectives = [
        'being brave', 
        'staying strong', 
        'showing courage', 
        'being persistent', 
        'staying determined',
        'showing resilience',
        'being committed',
        'staying motivated'
      ];
    }
    
    // Type-based motivational adjectives (if result type contains specific keywords)
    const typeLower = resultType.toLowerCase();
    if (typeLower.includes('visual') || typeLower.includes('superstar')) {
      adjectives = [
        'incredibly creative', 
        'wonderfully imaginative', 
        'truly visionary', 
        'remarkably artistic',
        ...adjectives
      ];
    } else if (typeLower.includes('auditory') || typeLower.includes('listener')) {
      adjectives = [
        'deeply attentive', 
        'wonderfully focused', 
        'truly perceptive', 
        'remarkably observant',
        ...adjectives
      ];
    } else if (typeLower.includes('kinesthetic') || typeLower.includes('hands-on')) {
      adjectives = [
        'incredibly active', 
        'wonderfully energetic', 
        'truly dynamic', 
        'remarkably vibrant',
        ...adjectives
      ];
    } else if (typeLower.includes('analytical') || typeLower.includes('thinker')) {
      adjectives = [
        'deeply thoughtful', 
        'wonderfully analytical', 
        'truly insightful', 
        'remarkably intelligent',
        ...adjectives
      ];
    }
    
    // Select a random adjective from the list
    const selectedAdjective = adjectives[Math.floor(Math.random() * adjectives.length)];
    
    return `You're ${selectedAdjective}!`;
  };

  // Session management hooks
  const { navigateWithState, loadPageState, savePageState } = useNavigationWithState();
  const { 
    state: assessmentState, 
    addAnswer, 
    updateProgress, 
    completeAssessment, 
    resetAssessment: resetAssessmentState 
  } = useAssessmentState('diagnostic');

  // Helper function to set assessment as completed and store in localStorage
  const setAssessmentCompleted = (resultData: AssessmentResult) => {
    setIsCompleted(true);
    setResult(resultData);
    
    // Store in localStorage as backup
    try {
      localStorage.setItem('diagnostic_assessment_completed', 'true');
      localStorage.setItem('diagnostic_assessment_result', JSON.stringify(resultData));
    } catch (error) {
      console.warn('Failed to store assessment result in localStorage:', error);
    }
  };

  // Fetch user profile data
  const fetchUserProfile = async () => {
    try {
        const response = await fetch('/api/user/profile');
      
      if (!response.ok) {
        let errorMessage = 'Failed to fetch user profile';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch (parseError) {
          console.error('Failed to parse profile error response:', parseError);
          errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        }
        console.error('Failed to fetch user profile:', errorMessage);
        return;
      }
      
      let data;
      try {
        data = await response.json();
      } catch (parseError) {
        console.error('Failed to parse profile response as JSON:', parseError);
        return;
      }

      if (data.success && data.user) {
        setUserProfile(data.user);
      } else {
        console.error('Invalid profile response format:', data);
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };

  // Load current question
  const loadQuestion = async () => {
    try {
      setIsLoading(true);
      setError('');
      
      const response = await fetch('/api/assessment/questions');
      
      // Check if response is ok before trying to parse JSON
      if (!response.ok) {
        let errorMessage = 'Failed to load question';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch (parseError) {
          console.error('Failed to parse error response:', parseError);
          errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }
      
      // Try to parse JSON response
      let data;
      try {
        data = await response.json();
      } catch (parseError) {
        console.error('Failed to parse response as JSON:', parseError);
        throw new Error('Invalid response format from server');
      }

      if (data.completed) {
        console.log('🔍 Assessment marked as completed, checking result data...', data.result);
        
        // Check if this is a premature completion (user hasn't actually taken the assessment)
        // Look for either totalQuestions > 0 OR n8nResults data OR responses data
        const hasActualAnswers = data.result && (
          (data.result.totalQuestions && data.result.totalQuestions > 0) ||
          (data.result.n8nResults && Object.keys(data.result.n8nResults).length > 0) ||
          (data.responses && data.responses.length > 0)
        );
        
        console.log('🔍 Has actual answers check:', {
          totalQuestions: data.result?.totalQuestions,
          hasN8nResults: !!(data.result?.n8nResults && Object.keys(data.result.n8nResults).length > 0),
          responsesCount: data.responses?.length || 0,
          hasActualAnswers
        });
        
        if (!hasActualAnswers) {
          // User is coming from interest assessment, mark this
          console.log('🔍 No actual answers found, checking if questions exist...');
          setIsFromInterestAssessment(true);
          setIsCompleted(false);
          setResult(null);
          
          // Check if questions already exist before generating
          const questionCheckResponse = await fetch('/api/assessment/questions');
          if (questionCheckResponse.ok) {
            const questionCheckData = await questionCheckResponse.json();
            if (questionCheckData.totalQuestions > 0) {
              console.log('🎯 Questions already exist, using them:', questionCheckData.totalQuestions);
              // Questions exist, just load them
              await loadQuestion();
              return;
            }
          }
          
          // Only generate if questions don't exist
          console.log('🔍 No questions found, generating new ones...');
          await generateN8NQuestions();
          await loadQuestion();
          return;
        }
        
        console.log('🔍 Setting assessment as completed with result:', data.result);
        const resultData = data.result || {
          type: 'Assessment Completed',
          description: 'You have already completed the diagnostic assessment.',
          score: 0,
          learningStyle: 'Not Available',
          recommendations: []
        };
        setAssessmentCompleted(resultData);
        
        return;
      }

      if (!data.question) {
        throw new Error('No question data received from server');
      }

      

      // Map question types to standardized format
      let mappedType: 'SINGLE_CHOICE' | 'MULTIPLE_CHOICE';
      if (data.question.type === 'MCQ' || data.question.type === 'Single Choice') {
        mappedType = 'SINGLE_CHOICE';
      } else if (data.question.type === 'OPEN' || data.question.type === 'Multiple Choice') {
        mappedType = 'MULTIPLE_CHOICE';
      } else {
        // Default to single choice if unknown type
        mappedType = 'SINGLE_CHOICE';
      }
      
      const mappedQuestion = {
        ...data.question,
        type: mappedType
      };
      
      
      setCurrentQuestion(mappedQuestion);
      setCurrentQuestionNumber(data.currentQuestion);
      setTotalQuestions(data.totalQuestions);
      setProgress(data.progress);
      
              // Load previous answer from collected answers (ignore skipped)
        const previousAnswer = collectedAnswers.find(answer => answer.Q === data.question.id);
        if (previousAnswer && previousAnswer.studentAnswer !== 'Skipped') {
          if (mappedQuestion.type === 'SINGLE_CHOICE') {
            setSelectedOption([previousAnswer.studentAnswer]);
            setAnswer('');
          } else if (mappedQuestion.type === 'MULTIPLE_CHOICE') {
            // For multiple choice, split by comma if stored as comma-separated string
            const options = previousAnswer.studentAnswer.includes(',') 
              ? previousAnswer.studentAnswer.split(',').map(s => s.trim())
              : [previousAnswer.studentAnswer];
            setSelectedOption(options);
            setAnswer('');
          } else {
            setAnswer(previousAnswer.studentAnswer);
            setSelectedOption([]);
          }
        } else {
          setAnswer('');
          setSelectedOption([]);
        }
    } catch (err) {
      console.error('Error loading question:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to load question';
      setError(errorMessage);
      
      // If there's an error, check if it's because assessment is completed
      if (err instanceof Error && err.message.includes('completed')) {
        setAssessmentCompleted({
          type: 'Assessment Completed',
          description: 'You have already completed the diagnostic assessment.',
          score: 0,
          learningStyle: 'Not Available',
          recommendations: []
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Load previous answers from database
  const loadPreviousAnswers = async () => {
    try {
      console.log('🔍 Loading previous answers from database...');
      const response = await fetch('/api/assessment/questions');
      
      if (!response.ok) {
        console.error('Failed to load previous answers');
        return;
      }

      const data = await response.json();
      
      if (data.responses && Array.isArray(data.responses)) {
        const answers: CollectedAnswer[] = data.responses.map((response: any) => ({
          Q: response.questionId,
          section: response.category,
          question: response.question,
          studentAnswer: response.answer,
          type: response.questionType === 'SINGLE_CHOICE' ? 'Single Choice' : 
                response.questionType === 'MULTIPLE_CHOICE' ? 'Multiple Choice' : 'Unknown'
        }));
        
        setCollectedAnswers(answers);
        console.log('🔍 Loaded previous answers:', answers.length);
      }
    } catch (error) {
      console.error('Error loading previous answers:', error);
    }
  };

  // Generate N8N questions if not already generated
  const generateN8NQuestions = async (forceRegenerate = false) => {
    try {
      console.log('🔍 Generating N8N questions...', forceRegenerate ? '(forced)' : '(cached)');
      const url = forceRegenerate 
        ? '/api/assessment/generate-questions?type=diagnostic&forceRegenerate=true'
        : '/api/assessment/generate-questions?type=diagnostic';
      
      const response = await fetch(url);
      
      if (!response.ok) {
        console.error('Failed to generate N8N questions');
        return false;
      }

      const data = await response.json();
      console.log('🔍 N8N questions response:', data);
      
      if (data.success && data.questions && data.questions.length > 0) {
        if (data.cached) {
          console.log('🎯 Using cached questions:', data.questions.length, 'questions');
        } else {
          console.log('🔄 Generated new questions:', data.questions.length, 'questions');
        }
        return true;
      } else {
        console.log('🔍 No N8N questions generated, using fallback');
        return false;
      }
    } catch (error) {
      console.error('Error generating N8N questions:', error);
      return false;
    }
  };

  // Go to previous question
  const goToPreviousQuestion = async () => {
    if (currentQuestionNumber <= 1) return;

    try {
      setIsPreviousLoading(true);
      setError('');

      // Save current answer if any
      if (currentQuestion) {
        let currentAnswer: string;
        if (currentQuestion.type === 'SINGLE_CHOICE') {
          currentAnswer = selectedOption.length > 0 ? selectedOption[0] : '';
        } else if (currentQuestion.type === 'MULTIPLE_CHOICE') {
          currentAnswer = selectedOption.join(', ');
        } else {
          currentAnswer = answer;
        }
        
      }

      // Load previous question
      const response = await fetch(`/api/assessment/questions?previous=true&currentQuestion=${currentQuestionNumber}`);
      
      if (!response.ok) {
        throw new Error('Failed to load previous question');
      }

      const data = await response.json();

      if (data.question) {
        // Map question types to standardized format
        let mappedType: 'SINGLE_CHOICE' | 'MULTIPLE_CHOICE';
        if (data.question.type === 'MCQ' || data.question.type === 'Single Choice') {
          mappedType = 'SINGLE_CHOICE';
        } else if (data.question.type === 'OPEN' || data.question.type === 'Multiple Choice') {
          mappedType = 'MULTIPLE_CHOICE';
        } else {
          // Default to single choice if unknown type
          mappedType = 'SINGLE_CHOICE';
        }
        
        const mappedQuestion = {
          ...data.question,
          type: mappedType
        };
        
        console.log('🔍 Previous question - mapped type from', data.question.type, 'to', mappedType);
        
        setCurrentQuestion(mappedQuestion);
        setCurrentQuestionNumber(data.currentQuestion);
        setTotalQuestions(data.totalQuestions);
        setProgress(data.progress);
        
        // Reset answer state for new question
        setAnswer('');
        setSelectedOption([]);
      }
    } catch (err) {
      console.error('Error loading previous question:', err);
      setError(err instanceof Error ? err.message : 'Failed to load previous question');
    } finally {
      setIsPreviousLoading(false);
    }
  };

  // Submit answer and move to next question
  const submitAnswer = async () => {
    if (!currentQuestion) return;

    let answerToSubmit: string;
    if (currentQuestion.type === 'SINGLE_CHOICE') {
      answerToSubmit = selectedOption.length > 0 ? selectedOption[0] : '';
    } else if (currentQuestion.type === 'MULTIPLE_CHOICE') {
      answerToSubmit = selectedOption.join(', ');
    } else {
      answerToSubmit = answer;
    }
    
    if (!answerToSubmit.trim()) {
      setError('Please provide an answer');
      return;
    }

    try {
      setIsSubmitting(true);
      setError('');

      // Collect the current answer
      const currentAnswer: CollectedAnswer = {
        Q: currentQuestion.id,
        section: currentQuestion.section || currentQuestion.category || 'General',
        question: currentQuestion.question,
        studentAnswer: answerToSubmit,
        type: currentQuestion.type === 'SINGLE_CHOICE' ? 'Single Choice' : 
              currentQuestion.type === 'MULTIPLE_CHOICE' ? 'Multiple Choice' : 'Unknown'
      };

      // Add to collected answers
      setCollectedAnswers(prev => [...prev, currentAnswer]);
      

      console.log('🔍 Submitting answer:', {
        questionId: currentQuestion.id,
        answer: answerToSubmit,
        questionNumber: currentQuestionNumber,
        questionType: currentQuestion.type
      });

      // Build URL with query parameters
      const params = new URLSearchParams({
        questionId: currentQuestion.id,
        answer: answerToSubmit,
        questionNumber: currentQuestionNumber.toString()
      });

      const response = await fetch(`/api/assessment/questions?${params}`, {
        method: 'GET',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit answer');
      }

      if (data.completed) {
        console.log('🔍 Assessment completed! Getting N8N results...');
        
        // Save all collected answers to database
        await storeAnswersInDatabase([...collectedAnswers, currentAnswer]);
        
        // Get N8N results
        try {
          const resultResponse = await fetch('/api/assessment/result', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            }
          });

          if (resultResponse.ok) {
            let resultData;
            try {
              const responseText = await resultResponse.text();
              
              if (!responseText || responseText.trim() === '') {
                setAssessmentCompleted(data.result);
                return;
              }
              
              resultData = JSON.parse(responseText);
            } catch (parseError) {
              console.error('Failed to parse result response as JSON:', parseError);
              // Still show completion with default result
              setIsCompleted(true);
              setResult(data.result);
              return;
            }
            
            // Handle cached vs new results
            if (resultData.cached) {
              console.log('🎯 Using cached assessment results');
              const updatedResult = {
                ...data.result,
                ...resultData.result,
                cached: true
              };
              setAssessmentCompleted(updatedResult);
              return;
            }
            
            // Update the result with N8N data - Enhanced mapping for actual N8N structure
            const n8nData = resultData.output?.[0] || resultData.result || resultData;
            console.log('🔍 Raw N8N data structure:', n8nData);
            
            const updatedResult = {
              ...data.result,
              totalQuestions: parseInt(n8nData?.['Total Questions']) || n8nData?.totalQuestions || n8nData?.['total_questions'] || 0,
              score: parseInt(n8nData?.Score) || n8nData?.score || n8nData?.['score'] || 0,
              description: n8nData?.Summery || n8nData?.summary || n8nData?.['summary'] || n8nData?.['description'] || data.result.description,
              n8nResults: n8nData,
              cached: false
            };
            
            console.log('🔍 Updated result with N8N data:', updatedResult);
            setAssessmentCompleted(updatedResult);
          } else {
            console.error('🔍 Failed to get N8N results:', resultResponse.status);
            // Still show completion with default result
            setIsCompleted(true);
            setResult(data.result);
          }
        } catch (resultError) {
          console.error('Error getting N8N results:', resultError);
          // Still show completion with default result
          setIsCompleted(true);
          setResult(data.result);
        }
      } else {
        // Load next question
        await loadQuestion();
      }
    } catch (err) {
      console.error('Error submitting answer:', err);
      setError(err instanceof Error ? err.message : 'Failed to submit answer');
    } finally {
      setIsSubmitting(false);
    }
  };


  // Skip current question without providing an answer
  const skipQuestion = async () => {
    if (!currentQuestion) return;

    try {
      setIsSkipLoading(true);
      setError('');

      // Collect the skipped answer for analytics/N8N, but do not prefill on revisit
      const skippedAnswer: CollectedAnswer = {
        Q: currentQuestion.id,
        section: currentQuestion.section || currentQuestion.category || 'General',
        question: currentQuestion.question,
        studentAnswer: 'Skipped',
        type: currentQuestion.type === 'SINGLE_CHOICE' ? 'Single Choice' : 
              currentQuestion.type === 'MULTIPLE_CHOICE' ? 'Multiple Choice' : 'Unknown'
      };

      setCollectedAnswers(prev => [...prev, skippedAnswer]);

      // Build URL with query parameters using a sentinel value for skipped
      const params = new URLSearchParams({
        questionId: currentQuestion.id,
        answer: 'Skipped',
        questionNumber: currentQuestionNumber.toString()
      });

      const response = await fetch(`/api/assessment/questions?${params}`, {
        method: 'GET',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to skip question');
      }

      if (data.completed) {
        // Save all collected answers to database
        await storeAnswersInDatabase([...collectedAnswers, skippedAnswer]);

        // Get N8N results
        try {
          const resultResponse = await fetch('/api/assessment/result', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            }
          });

          if (resultResponse.ok) {
            let resultData;
            try {
              const responseText = await resultResponse.text();
              
              if (!responseText || responseText.trim() === '') {
                setAssessmentCompleted(data.result);
                return;
              }
              
              resultData = JSON.parse(responseText);
            } catch (parseError) {
              console.error('Failed to parse result response as JSON:', parseError);
              // Fallback to default result if N8N fails
              setIsCompleted(true);
              setResult(data.result);
              return;
            }
            
            const n8nData = resultData.output?.[0] || resultData.result || resultData;

            const updatedResult = {
              ...data.result,
              totalQuestions: parseInt(n8nData?.['Total Questions']) || n8nData?.totalQuestions || n8nData?.['total_questions'] || 0,
              score: parseInt(n8nData?.Score) || n8nData?.score || n8nData?.['score'] || 0,
              description: n8nData?.Summery || n8nData?.summary || n8nData?.['summary'] || n8nData?.['description'] || data.result?.description,
              n8nResults: n8nData
            } as AssessmentResult;

            setAssessmentCompleted(updatedResult);
          } else {
            // Fallback to default result if N8N fails
            setIsCompleted(true);
            setResult(data.result);
          }
        } catch {
          setIsCompleted(true);
          setResult(data.result);
        }
      } else {
        // Load next question
        await loadQuestion();
      }
    } catch (err) {
      console.error('Error skipping question:', err);
      setError(err instanceof Error ? err.message : 'Failed to skip question');
    } finally {
      setIsSkipLoading(false);
    }
  };



  // Function to store answers in database
  const storeAnswersInDatabase = async (answers: CollectedAnswer[]) => {
    try {
      console.log('🔍 Storing answers in database:', answers.length, 'answers');
      
      const response = await fetch('/api/assessment/store-answers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ answers }),
      });

      if (!response.ok) {
        console.error('🔍 Failed to store answers in database:', response.status);
        const errorData = await response.json();
        console.error('🔍 Error details:', errorData);
      } else {
        console.log('🔍 Answers stored in database successfully');
      }
    } catch (error) {
      console.error('🔍 Error storing answers in database:', error);
    }
  };

  // Function to reset assessment and start fresh
  const resetAssessment = async () => {
    try {
      console.log('🔍 Resetting assessment...');
      setIsResetting(true);
      
      // Call the API to reset the assessment
      const response = await fetch('/api/assessment/diagnostic/reset', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      if (response.ok) {
        const resetData = await response.json();
        console.log('🔍 Assessment reset successfully:', resetData.message);
        
        // Reset all state variables
        setCurrentQuestion(null);
        setCurrentQuestionNumber(1);
        setTotalQuestions(0);
        setProgress(0);
        setAnswer('');
        setSelectedOption([]);
        setIsLoading(true);
        setIsSubmitting(false);
        setIsCompleted(false);
        setResult(null);
        setError('');
        setCollectedAnswers([]);
        
        // Clear localStorage
        try {
          localStorage.removeItem('diagnostic_assessment_completed');
          localStorage.removeItem('diagnostic_assessment_result');
        } catch (error) {
          console.warn('Failed to clear localStorage:', error);
        }
        
        // Reload the first question
        await loadQuestion();
      } else {
        const errorData = await response.json();
        console.error('Failed to reset assessment:', errorData.error);
        // If reset fails, just reload the page as fallback
        window.location.reload();
      }
    } catch (error) {
      console.error('🔍 Error resetting assessment:', error);
      // If there's an error, reload the page as fallback
      window.location.reload();
    } finally {
      setIsResetting(false);
    }
  };

  // Load user profile and first question on component mount
  useEffect(() => {
    const initializeAssessment = async () => {
      try {
        console.log('🔍 Initializing diagnostic assessment...');
        
        // First check if user is authenticated by trying to fetch profile
        await fetchUserProfile();
        
        // Load previous answers from database
        await loadPreviousAnswers();
        
        // First, try to load a question to check if questions already exist
        // This will use existing questions if they're stored in the database
        try {
          const questionResponse = await fetch('/api/assessment/questions');
          if (questionResponse.ok) {
            const questionData = await questionResponse.json();
            
            // If assessment is completed, don't generate new questions
            if (questionData.completed) {
              console.log('🔍 Assessment already completed, skipping question generation');
              setAssessmentCompleted(questionData.result || {
                type: 'Assessment Completed',
                description: 'You have already completed the diagnostic assessment.',
                score: 0,
                learningStyle: 'Not Available',
                recommendations: []
              });
              return;
            }
            
            // If questions exist (totalQuestions > 0), use them without generating new ones
            if (questionData.totalQuestions > 0) {
              console.log('🎯 Questions already exist in database:', questionData.totalQuestions, 'questions');
              // Load the question normally
              await loadQuestion();
              return;
            }
          }
        } catch (questionError) {
          console.log('🔍 Could not check for existing questions, will try to generate:', questionError);
        }
        
        // Only generate N8N questions if no questions exist
        // This function now checks internally if questions exist before generating
        await generateN8NQuestions();
        
        // Load the question (this will use newly generated questions or existing ones)
        await loadQuestion();
        
        console.log('🔍 Assessment initialization completed');
      } catch (error) {
        console.error('Failed to initialize assessment:', error);
        
        // Fallback: Check localStorage for completion status
        try {
          const isCompletedFromStorage = localStorage.getItem('diagnostic_assessment_completed');
          const resultFromStorage = localStorage.getItem('diagnostic_assessment_result');
          
          if (isCompletedFromStorage === 'true' && resultFromStorage) {
            console.log('🔍 Fallback: Loading assessment result from localStorage');
            const parsedResult = JSON.parse(resultFromStorage);
            setIsCompleted(true);
            setResult(parsedResult);
            setIsLoading(false);
            return;
          }
        } catch (storageError) {
          console.warn('Failed to read from localStorage:', storageError);
        }
        
        // If there's an authentication error, redirect to login
        if (error instanceof Error && error.message.includes('401')) {
          router.push('/login');
        }
      }
    };
    
    initializeAssessment();
  }, [router]);

  // Auto-reset assessment if user comes from interest assessment and sees completion screen
  useEffect(() => {
    if (isCompleted && result && result.type === 'Assessment Completed' && result.description.includes('already completed')) {
      console.log('🔍 Detected premature completion from interest assessment, showing manual reset option...');
      // Don't auto-reset, let user choose to start the assessment
      // The yellow notice box will guide them
    }
  }, [isCompleted, result]);

  // Welcome screen for users coming from interest assessment
  if (isFromInterestAssessment && !isCompleted) {
    return (
      <motion.main 
        className="min-h-screen bg-gradient-to-br from-purple-50 to-purple-100 flex flex-col"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        {/* Header */}
        <header className="bg-white shadow-sm px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Image src="/icons/logo.svg" alt="Logo" width={40} height={40} className="rounded-full" />
            <span className="font-semibold text-gray-800">Taru Learning</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-gray-600">
              {userProfile ? `${userProfile.fullName} ${userProfile.uniqueId ? `#${userProfile.uniqueId}` : ''}` : 'Loading...'}
            </span>
            <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
              {userProfile ? userProfile.fullName.charAt(0).toUpperCase() : 'U'}
            </div>
          </div>
        </header>

        {/* Welcome Content */}
        <div className="flex-1 flex items-center justify-center px-6 py-8">
          <motion.div 
            className="bg-white rounded-2xl p-8 text-center max-w-4xl mx-auto shadow-lg"
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
          >
            <motion.div
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.5 }}
            >
              <div className="text-6xl mb-6 flex items-center justify-center">
                <TargetIcon className="w-16 h-16 text-purple-600" />
              </div>
              <h1 className="text-4xl font-bold text-purple-600 mb-4">
                Welcome to Your Diagnostic Assessment!
              </h1>
              
              <p className="text-xl text-gray-700 mb-8 leading-relaxed">
                Great job completing your interest assessment! Now it&apos;s time to take your personalized diagnostic assessment. 
                This will help us understand your current knowledge and skills in your areas of interest.
              </p>

              <div className="bg-purple-50 rounded-xl p-6 mb-8 text-left">
                <h3 className="text-lg font-semibold text-purple-700 mb-3">What to expect:</h3>
                <ul className="space-y-2 text-gray-700">
                  <li className="flex items-center gap-2">
                    <CheckIcon className="text-purple-500 flex-shrink-0" />
                    Personalized questions based on your interests
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckIcon className="text-purple-500 flex-shrink-0" />
                    Single choice and multiple choice questions
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckIcon className="text-purple-500 flex-shrink-0" />
                    AI-generated content tailored to your learning style
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckIcon className="text-purple-500 flex-shrink-0" />
                    Detailed results and recommendations
                  </li>
                </ul>
              </div>

              <button
                onClick={() => {
                  setIsFromInterestAssessment(false);
                  loadQuestion();
                }}
                className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white px-8 py-4 rounded-full font-semibold text-lg transition-all duration-300 shadow-lg hover:shadow-xl"
              >
                Start Diagnostic Assessment
              </button>
            </motion.div>
          </motion.div>
        </div>
      </motion.main>
    );
  }


  // Completion screen - Trendy Modern Design
  if (isCompleted && result) {
    return (
      <>
        <motion.main 
          className="h-screen bg-gradient-to-br from-violet-400 via-purple-500 to-fuchsia-500 flex flex-col overflow-hidden relative"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          {/* Animated Background Particles */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {[...Array(20)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute rounded-full"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  width: `${Math.random() * 10 + 5}px`,
                  height: `${Math.random() * 10 + 5}px`,
                  background: `rgba(255, 255, 255, ${Math.random() * 0.5 + 0.2})`,
                }}
                animate={{
                  y: [0, -30, 0],
                  x: [0, Math.random() * 20 - 10, 0],
                  opacity: [0.3, 0.8, 0.3],
                }}
                transition={{
                  duration: Math.random() * 3 + 2,
                  repeat: Infinity,
                  delay: Math.random() * 2,
                }}
              />
            ))}
          </div>

          {/* Compact Glassmorphism Header */}
          <header className="backdrop-blur-xl bg-white/10 border-b border-white/20 px-3 sm:px-4 py-2 flex items-center justify-between flex-shrink-0 relative z-10">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl flex items-center justify-center shadow-lg">
                <Image src="/icons/logo.svg" alt="Logo" width={24} height={24} className="sm:w-7 sm:h-7 rounded-full" />
              </div>
              <span className="font-bold text-white text-xs sm:text-sm drop-shadow-lg">Taru Learning</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-white/90 text-xs hidden sm:inline drop-shadow-md">
                {userProfile ? `${userProfile.fullName} ${userProfile.uniqueId ? `#${userProfile.uniqueId}` : ''}` : 'Loading...'}
              </span>
              <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-br from-pink-400 to-purple-500 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-lg ring-2 ring-white/30">
                {userProfile ? userProfile.fullName.charAt(0).toUpperCase() : 'U'}
              </div>
            </div>
          </header>

          {/* Special notice - Compact */}
          {result && result.type === 'Assessment Completed' && result.description.includes('already completed') && (
            <motion.div 
              className="backdrop-blur-xl bg-yellow-400/20 border border-yellow-300/30 rounded-xl p-2 mx-3 sm:mx-4 mb-2 flex-shrink-0 relative z-10 shadow-xl"
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
            >
              <div className="flex items-center gap-2">
                <div className="text-lg flex-shrink-0">
                  <WarningIcon className="w-5 h-5 text-yellow-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-xs sm:text-sm font-bold text-white mb-0.5 drop-shadow-md">
                    Welcome from Interest Assessment!
                  </h3>
                  <button
                    onClick={resetAssessment}
                    disabled={isResetting}
                    className="bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-white px-3 sm:px-4 py-1 rounded-lg text-xs font-bold transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isResetting ? 'Starting...' : 'Start Assessment'}
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* Main Content - Compact Single Page */}
          <div className="flex-1 flex items-center justify-center px-3 sm:px-4 py-2 relative overflow-hidden min-h-0">
            <motion.div 
              className="backdrop-blur-2xl bg-white/10 rounded-2xl sm:rounded-3xl p-3 sm:p-4 md:p-6 w-full max-w-7xl mx-auto relative overflow-hidden shadow-2xl border-2 border-white/20 h-full flex flex-col group"
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              transition={{ duration: 0.5, type: "spring" }}
              whileHover={{ 
                borderColor: "rgba(255, 255, 255, 0.4)",
                boxShadow: "0 25px 50px rgba(0, 0, 0, 0.3)"
              }}
            >
              {/* Dynamic Animated Gradient Border */}
              <motion.div 
                className="absolute inset-0 rounded-2xl sm:rounded-3xl bg-gradient-to-r from-yellow-400/50 via-pink-400/50 to-purple-400/50 blur-xl -z-10"
                animate={{ 
                  opacity: [0.5, 0.8, 0.5],
                  scale: [1, 1.02, 1],
                  rotate: [0, 180, 360]
                }}
                transition={{ 
                  duration: 8, 
                  repeat: Infinity,
                  ease: "linear"
                }}
              />
              
              {/* Dynamic Floating Decorative Elements */}
              <motion.div 
                className="absolute top-4 right-4 w-20 h-20 bg-gradient-to-br from-yellow-400/30 to-pink-400/30 rounded-full blur-2xl"
                animate={{ 
                  scale: [1, 1.3, 1],
                  opacity: [0.3, 0.6, 0.3],
                  x: [0, 10, 0],
                  y: [0, -10, 0]
                }}
                transition={{ 
                  duration: 4, 
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />
              <motion.div 
                className="absolute bottom-4 left-4 w-24 h-24 bg-gradient-to-br from-purple-400/30 to-blue-400/30 rounded-full blur-2xl"
                animate={{ 
                  scale: [1, 1.4, 1],
                  opacity: [0.3, 0.6, 0.3],
                  x: [0, -10, 0],
                  y: [0, 10, 0]
                }}
                transition={{ 
                  duration: 4, 
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: 1
                }}
              />
              
              {/* Compact Celebration Header */}
              <div className="text-center mb-2 sm:mb-3 relative z-10 flex-shrink-0">
                <motion.div
                  className="inline-block mb-1"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, duration: 0.4 }}
                >
                  <div className="text-3xl sm:text-4xl md:text-5xl flex items-center justify-center gap-2">
                    <PartyIcon className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 text-yellow-300" />
                    <SparklesIcon className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 text-pink-300" />
                    <ConfettiIcon className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 text-purple-300" />
                  </div>
                </motion.div>
                
                <motion.h1 
                  className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-black mb-1 bg-gradient-to-r from-yellow-200 via-pink-200 to-purple-200 bg-clip-text text-transparent drop-shadow-2xl"
                  initial={{ y: -10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3, duration: 0.4 }}
                >
                  Congratulations!
                </motion.h1>
                
                <motion.div 
                  className="text-sm sm:text-base md:text-lg lg:text-xl font-bold"
                  initial={{ y: 5, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.4, duration: 0.4 }}
                >
                  <span className="bg-gradient-to-r from-yellow-300 via-orange-300 to-pink-300 bg-clip-text text-transparent drop-shadow-lg">
                    {getAppreciationMessage(result)}
                  </span>
                  {result.type && result.type !== 'Assessment Completed' && (
                    <span className="text-white/95 block mt-1">
                      You&apos;re a <span className="bg-gradient-to-r from-yellow-300 to-orange-300 bg-clip-text text-transparent font-extrabold text-base sm:text-lg md:text-xl">{result.type}</span>! <StarIcon className="inline-block w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-yellow-300 ml-1" />
                    </span>
                  )}
                </motion.div>
              </div>

              {/* Stats Grid - Dynamic Cards */}
              {result.n8nResults && (
                <div className="grid grid-cols-3 gap-2 sm:gap-3 md:gap-4 mb-2 sm:mb-3 flex-shrink-0">
                  {/* Total Questions Card */}
                  <motion.div 
                    className="backdrop-blur-xl bg-gradient-to-br from-blue-500/40 to-cyan-500/40 rounded-xl sm:rounded-2xl p-2 sm:p-3 md:p-4 text-center border-2 border-blue-300/50 shadow-xl relative overflow-hidden group cursor-pointer"
                    initial={{ y: 20, opacity: 0, scale: 0.9 }}
                    animate={{ y: 0, opacity: 1, scale: 1 }}
                    transition={{ delay: 0.5, duration: 0.4, type: "spring" }}
                    whileHover={{ 
                      scale: 1.05, 
                      y: -5,
                      boxShadow: "0 20px 40px rgba(59, 130, 246, 0.4)"
                    }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {/* Dynamic Animated Background */}
                    <motion.div 
                      className="absolute inset-0 bg-gradient-to-br from-blue-400/30 to-cyan-400/30"
                      animate={{ 
                        opacity: [0.3, 0.6, 0.3],
                        scale: [1, 1.1, 1]
                      }}
                      transition={{ 
                        duration: 3, 
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-400/20 to-cyan-400/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    
                    {/* Glowing Border Effect */}
                    <motion.div
                      className="absolute inset-0 rounded-xl sm:rounded-2xl"
                      style={{
                        background: "linear-gradient(45deg, rgba(59, 130, 246, 0.3), rgba(6, 182, 212, 0.3))",
                        filter: "blur(8px)",
                        opacity: 0
                      }}
                      animate={{
                        opacity: [0, 0.5, 0],
                        scale: [1, 1.05, 1]
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                    />
                    
                    <motion.div 
                      className="text-2xl sm:text-3xl md:text-4xl mb-1 relative z-10 flex items-center justify-center"
                      animate={{ 
                        rotate: [0, 10, -10, 0],
                        scale: [1, 1.1, 1]
                      }}
                      transition={{ duration: 3, repeat: Infinity }}
                      whileHover={{ scale: 1.2, rotate: 360 }}
                    >
                      <ChartIcon className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 text-blue-100" />
                    </motion.div>
                    <motion.h3 
                      className="text-xs sm:text-sm font-bold mb-1 text-blue-100 relative z-10"
                      animate={{ opacity: [0.8, 1, 0.8] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      Questions
                    </motion.h3>
                    <motion.p 
                      className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-black text-blue-50 relative z-10"
                      animate={{ 
                        scale: [1, 1.05, 1],
                        textShadow: ["0 0 0px", "0 0 10px rgba(191, 219, 254, 0.5)", "0 0 0px"]
                      }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      {result.n8nResults?.['Total Questions'] || result.totalQuestions || 0}
                    </motion.p>
                  </motion.div>
                  
                  {/* Score Card */}
                  <motion.div 
                    className="backdrop-blur-xl bg-gradient-to-br from-yellow-500/40 to-orange-500/40 rounded-xl sm:rounded-2xl p-2 sm:p-3 md:p-4 text-center border-2 border-yellow-300/50 shadow-xl relative overflow-hidden group cursor-pointer"
                    initial={{ y: 20, opacity: 0, scale: 0.9 }}
                    animate={{ y: 0, opacity: 1, scale: 1 }}
                    transition={{ delay: 0.6, duration: 0.4, type: "spring" }}
                    whileHover={{ 
                      scale: 1.05, 
                      y: -5,
                      boxShadow: "0 20px 40px rgba(234, 179, 8, 0.4)"
                    }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {/* Dynamic Animated Background */}
                    <motion.div 
                      className="absolute inset-0 bg-gradient-to-br from-yellow-400/30 to-orange-400/30"
                      animate={{ 
                        opacity: [0.3, 0.6, 0.3],
                        scale: [1, 1.1, 1]
                      }}
                      transition={{ 
                        duration: 3, 
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-br from-yellow-400/20 to-orange-400/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    
                    {/* Glowing Border Effect */}
                    <motion.div
                      className="absolute inset-0 rounded-xl sm:rounded-2xl"
                      style={{
                        background: "linear-gradient(45deg, rgba(234, 179, 8, 0.3), rgba(249, 115, 22, 0.3))",
                        filter: "blur(8px)",
                        opacity: 0
                      }}
                      animate={{
                        opacity: [0, 0.5, 0],
                        scale: [1, 1.05, 1]
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                    />
                    
                    <motion.div 
                      className="text-2xl sm:text-3xl md:text-4xl mb-1 relative z-10 flex items-center justify-center"
                      animate={{ 
                        y: [0, -8, 0],
                        rotate: [0, 5, -5, 0]
                      }}
                      transition={{ duration: 2, repeat: Infinity }}
                      whileHover={{ scale: 1.2, y: -15 }}
                    >
                      <TrophyIcon className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 text-yellow-100" />
                    </motion.div>
                    <motion.h3 
                      className="text-xs sm:text-sm font-bold mb-1 text-yellow-100 relative z-10"
                      animate={{ opacity: [0.8, 1, 0.8] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      Score
                    </motion.h3>
                    <motion.p 
                      className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-black text-yellow-50 relative z-10"
                      animate={{ 
                        scale: [1, 1.05, 1],
                        textShadow: ["0 0 0px", "0 0 10px rgba(254, 240, 138, 0.5)", "0 0 0px"]
                      }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      {result.n8nResults?.Score || result.score || 0}%
                    </motion.p>
                  </motion.div>
                  
                  {/* Performance Card */}
                  <motion.div 
                    className="backdrop-blur-xl bg-gradient-to-br from-green-500/40 to-emerald-500/40 rounded-xl sm:rounded-2xl p-2 sm:p-3 md:p-4 text-center border-2 border-green-300/50 shadow-xl relative overflow-hidden group cursor-pointer"
                    initial={{ y: 20, opacity: 0, scale: 0.9 }}
                    animate={{ y: 0, opacity: 1, scale: 1 }}
                    transition={{ delay: 0.7, duration: 0.4, type: "spring" }}
                    whileHover={{ 
                      scale: 1.05, 
                      y: -5,
                      boxShadow: "0 20px 40px rgba(34, 197, 94, 0.4)"
                    }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {/* Dynamic Animated Background */}
                    <motion.div 
                      className="absolute inset-0 bg-gradient-to-br from-green-400/30 to-emerald-400/30"
                      animate={{ 
                        opacity: [0.3, 0.6, 0.3],
                        scale: [1, 1.1, 1]
                      }}
                      transition={{ 
                        duration: 3, 
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-br from-green-400/20 to-emerald-400/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    
                    {/* Glowing Border Effect */}
                    <motion.div
                      className="absolute inset-0 rounded-xl sm:rounded-2xl"
                      style={{
                        background: "linear-gradient(45deg, rgba(34, 197, 94, 0.3), rgba(16, 185, 129, 0.3))",
                        filter: "blur(8px)",
                        opacity: 0
                      }}
                      animate={{
                        opacity: [0, 0.5, 0],
                        scale: [1, 1.05, 1]
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                    />
                    
                    <motion.div 
                      className="text-2xl sm:text-3xl md:text-4xl mb-1 relative z-10 flex items-center justify-center"
                      animate={{ 
                        rotate: [0, 15, -15, 0],
                        scale: [1, 1.1, 1]
                      }}
                      transition={{ duration: 3, repeat: Infinity }}
                      whileHover={{ scale: 1.2, rotate: 360 }}
                    >
                      <StarIcon className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 text-green-100" />
                    </motion.div>
                    <motion.h3 
                      className="text-xs sm:text-sm font-bold mb-1 text-green-100 relative z-10"
                      animate={{ opacity: [0.8, 1, 0.8] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      Performance
                    </motion.h3>
                    <motion.p 
                      className="text-xs sm:text-sm md:text-base font-black text-green-50 relative z-10"
                      animate={{ 
                        scale: [1, 1.05, 1],
                        textShadow: ["0 0 0px", "0 0 10px rgba(187, 247, 208, 0.5)", "0 0 0px"]
                      }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      <span className="flex items-center justify-center gap-1">
                        {(() => {
                          const scoreStr = String(result.n8nResults?.Score || result.score || 0);
                          const score = parseInt(scoreStr);
                          if (score >= 90) return (
                            <>
                              Excellent <TargetIcon className="w-4 h-4 inline" />
                            </>
                          );
                          if (score >= 80) return (
                            <>
                              Great <RocketIcon className="w-4 h-4 inline" />
                            </>
                          );
                          if (score >= 70) return (
                            <>
                              Good <FlexIcon className="w-4 h-4 inline" />
                            </>
                          );
                          if (score >= 60) return (
                            <>
                              Fair <ChartUpIcon className="w-4 h-4 inline" />
                            </>
                          );
                          return (
                            <>
                              Keep Going! <DizzyStarIcon className="w-4 h-4 inline" />
                            </>
                          );
                        })()}
                      </span>
                    </motion.p>
                  </motion.div>
                </div>
              )}

              {/* Summary Section - Dynamic */}
              <div className="flex-1 min-h-0 flex flex-col mb-2 sm:mb-3">
                {result.n8nResults ? (
                  <motion.div 
                    className="backdrop-blur-xl bg-gradient-to-br from-purple-500/30 via-pink-500/30 to-indigo-500/30 rounded-xl sm:rounded-2xl p-2 sm:p-3 md:p-4 border-2 border-purple-300/50 shadow-xl relative overflow-hidden group cursor-pointer"
                    initial={{ y: 20, opacity: 0, scale: 0.95 }}
                    animate={{ y: 0, opacity: 1, scale: 1 }}
                    transition={{ delay: 0.8, duration: 0.4, type: "spring" }}
                    whileHover={{ 
                      scale: 1.02,
                      boxShadow: "0 20px 40px rgba(168, 85, 247, 0.3)"
                    }}
                  >
                    {/* Dynamic Animated Background */}
                    <motion.div 
                      className="absolute top-0 right-0 w-32 h-32 sm:w-48 sm:h-48 bg-gradient-to-br from-yellow-400/20 to-pink-400/20 rounded-full blur-2xl"
                      animate={{ 
                        scale: [1, 1.2, 1],
                        opacity: [0.3, 0.6, 0.3],
                        x: [0, 10, 0],
                        y: [0, -10, 0]
                      }}
                      transition={{ 
                        duration: 4, 
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                    />
                    <motion.div 
                      className="absolute bottom-0 left-0 w-24 h-24 sm:w-32 sm:h-32 bg-gradient-to-tr from-blue-400/20 to-purple-400/20 rounded-full blur-xl"
                      animate={{ 
                        scale: [1, 1.3, 1],
                        opacity: [0.3, 0.6, 0.3],
                        x: [0, -10, 0],
                        y: [0, 10, 0]
                      }}
                      transition={{ 
                        duration: 4, 
                        repeat: Infinity,
                        ease: "easeInOut",
                        delay: 1
                      }}
                    />
                    
                    {/* Glowing Border Effect */}
                    <motion.div
                      className="absolute inset-0 rounded-xl sm:rounded-2xl"
                      style={{
                        background: "linear-gradient(45deg, rgba(168, 85, 247, 0.2), rgba(236, 72, 153, 0.2), rgba(99, 102, 241, 0.2))",
                        filter: "blur(10px)",
                        opacity: 0
                      }}
                      animate={{
                        opacity: [0, 0.4, 0],
                        scale: [1, 1.02, 1]
                      }}
                      transition={{
                        duration: 3,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                    />
                    
                    <div className="relative z-10">
                      <motion.div 
                        className="backdrop-blur-md bg-white/10 rounded-lg sm:rounded-xl p-3 sm:p-4 md:p-5 border-2 border-white/20 shadow-lg"
                        whileHover={{ 
                          borderColor: "rgba(255, 255, 255, 0.4)",
                          backgroundColor: "rgba(255, 255, 255, 0.15)"
                        }}
                        transition={{ duration: 0.3 }}
                      >
                        <div className="flex items-start gap-2 sm:gap-3 mb-2 sm:mb-3">
                          <motion.div 
                            className="w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-br from-yellow-400/50 to-orange-400/50 rounded-lg flex items-center justify-center border-2 border-yellow-300/50 shadow-md flex-shrink-0"
                            animate={{ 
                              rotate: [0, 5, -5, 0],
                              scale: [1, 1.05, 1]
                            }}
                            transition={{ duration: 3, repeat: Infinity }}
                            whileHover={{ scale: 1.2, rotate: 360 }}
                          >
                            <LightbulbIcon className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 text-yellow-300" />
                          </motion.div>
                          <div className="flex-1 min-w-0">
                            <motion.h4 
                              className="text-xs sm:text-sm font-bold text-white drop-shadow-md"
                              animate={{ opacity: [0.9, 1, 0.9] }}
                              transition={{ duration: 2, repeat: Infinity }}
                            >
                              Your Assessment Insights
                            </motion.h4>
                          </div>
                        </div>
                        
                        <motion.p 
                          className="text-xs sm:text-sm md:text-base leading-relaxed sm:leading-relaxed text-white/95 font-medium w-full text-left m-0"
                          animate={{ 
                            opacity: [0.9, 1, 0.9]
                          }}
                          transition={{ duration: 3, repeat: Infinity }}
                          style={{ 
                            wordBreak: 'break-word',
                            overflowWrap: 'break-word',
                            hyphens: 'auto',
                            WebkitHyphens: 'auto',
                            msHyphens: 'auto'
                          }}
                        >
                          <span className="block w-full first-letter:text-base sm:first-letter:text-lg first-letter:font-black first-letter:text-yellow-300 first-letter:mr-1">
                            {result.n8nResults?.Summery || result.description || 'Assessment completed successfully.'}
                          </span>
                        </motion.p>
                      </motion.div>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div 
                    className="backdrop-blur-xl bg-gradient-to-br from-purple-500/30 to-indigo-500/30 rounded-xl sm:rounded-2xl p-4 sm:p-5 border-2 border-purple-300/50 shadow-xl flex items-center justify-center flex-1 relative overflow-hidden group"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.5, type: "spring" }}
                    whileHover={{ scale: 1.02 }}
                  >
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-br from-purple-400/20 to-indigo-400/20"
                      animate={{ 
                        opacity: [0.3, 0.6, 0.3],
                        scale: [1, 1.1, 1]
                      }}
                      transition={{ 
                        duration: 3, 
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                    />
                    <p className="text-sm sm:text-base md:text-lg text-white/95 text-center font-medium relative z-10">
                      {result.description}
                    </p>
                  </motion.div>
                )}
              </div>

              {/* Dynamic CTA Button */}
              <motion.div 
                className="flex justify-center relative z-10 flex-shrink-0"
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.9, duration: 0.4 }}
              >
                <motion.button
                  onClick={() => router.push('/career-exploration')}
                  className="group relative overflow-hidden bg-gradient-to-r from-yellow-400 via-orange-500 to-pink-500 text-white px-6 sm:px-8 md:px-12 py-2.5 sm:py-3 md:py-4 rounded-xl sm:rounded-2xl font-black text-sm sm:text-base md:text-lg shadow-2xl border-2 border-white/30 backdrop-blur-sm"
                  whileHover={{ 
                    scale: 1.05,
                    y: -3,
                    boxShadow: "0 20px 40px rgba(234, 179, 8, 0.5)"
                  }}
                  whileTap={{ scale: 0.95 }}
                  animate={{
                    boxShadow: [
                      "0 10px 30px rgba(234, 179, 8, 0.3)",
                      "0 15px 35px rgba(249, 115, 22, 0.4)",
                      "0 10px 30px rgba(234, 179, 8, 0.3)"
                    ]
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                >
                  {/* Animated Gradient Overlay */}
                  <motion.div 
                    className="absolute inset-0 bg-gradient-to-r from-yellow-500 via-orange-600 to-pink-600"
                    animate={{
                      opacity: [0, 0.5, 0],
                      scale: [1, 1.1, 1]
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-yellow-500 via-orange-600 to-pink-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  
                  {/* Shimmer Effect */}
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                    animate={{
                      x: ["-100%", "100%"]
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      repeatDelay: 1,
                      ease: "easeInOut"
                    }}
                  />
                  
                  <div className="relative z-10 flex items-center gap-2 sm:gap-3">
                    <motion.span 
                      className="text-lg sm:text-xl md:text-2xl flex items-center"
                      animate={{ 
                        y: [0, -8, 0],
                        rotate: [0, 15, -15, 0],
                        scale: [1, 1.1, 1]
                      }}
                      transition={{ 
                        duration: 2, 
                        repeat: Infinity, 
                        ease: "easeInOut" 
                      }}
                    >
                      <RocketIcon className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8" />
                    </motion.span>
                    <span className="drop-shadow-lg">Get My Career Path</span>
                    <motion.span 
                      className="text-base sm:text-lg md:text-xl flex items-center"
                      animate={{ 
                        x: [0, 5, 0],
                        scale: [1, 1.2, 1],
                        rotate: [0, 180, 360]
                      }}
                      transition={{ 
                        duration: 2, 
                        repeat: Infinity, 
                        ease: "easeInOut" 
                      }}
                    >
                      <SparklesIcon className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7" />
                    </motion.span>
                  </div>
                </motion.button>
              </motion.div>
            </motion.div>
          </div>
        </motion.main>

        {/* Result Summary Modal */}
        <ResultSummaryModal
          isOpen={showResultModal}
          onClose={() => setShowResultModal(false)}
          score={result?.n8nResults?.Score || result?.score || 0}
          totalQuestions={result?.n8nResults?.['Total Questions'] || result?.totalQuestions || 0}
          summary={result?.n8nResults?.Summery || result?.description || 'Assessment completed successfully.'}
          onGetCareerPath={() => {
            setShowResultModal(false);
            router.push('/career-exploration');
          }}
        />
      </>
    );
  }

  // Loading screen
  if (isLoading) {
    return (
      <ConsistentLoadingPage
        type="assessment"
        title="Loading Assessment"
        subtitle="Preparing your personalized diagnostic test..."
        tips={[
          'Preparing personalized questions for you',
          'Calibrating difficulty to your level',
          'Setting up adaptive assessment engine'
        ]}
      />
    );
  }



  // Error screen
  if (error && !isCompleted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-purple-100 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md mx-auto">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Assessment Error</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            
            {/* Show additional error details in development */}
            {process.env.NODE_ENV === 'development' && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 text-left">
                <h3 className="font-semibold text-red-800 mb-2">Debug Information:</h3>
                <p className="text-sm text-red-700 mb-2">Error: {error}</p>
                <p className="text-sm text-red-700">Check browser console for more details.</p>
              </div>
            )}
            
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => {
                  setError('');
                  loadQuestion();
                }} 
                className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700"
              >
                Try Again
              </button>
              <button
                onClick={() => router.push('/login')} 
                className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700"
              >
                Go to Login
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Question screen (only if not completed)
  if (!isCompleted) {
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
          <span className="font-semibold text-gray-800">Taru Learning</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-gray-600">
            {userProfile ? `${userProfile.fullName} ${userProfile.uniqueId ? `#${userProfile.uniqueId}` : ''}` : 'Loading...'}
          </span>
          <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
            {userProfile ? userProfile.fullName.charAt(0).toUpperCase() : 'U'}
          </div>
        </div>
      </header>

      {/* Progress Bar */}
      <div className="bg-gradient-to-r from-purple-50 to-indigo-50 px-6 py-4 border-b border-purple-100">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-bold">{currentQuestionNumber}</span>
              </div>
              <div>
                <span className="text-sm font-semibold text-gray-800">
                  Question {currentQuestionNumber} of {totalQuestions}
                </span>
                <p className="text-xs text-gray-600">Diagnostic Assessment</p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-lg font-bold text-purple-600">
                {Math.round((currentQuestionNumber / totalQuestions) * 100)}%
              </span>
              <p className="text-xs text-gray-600">Complete</p>
            </div>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3 shadow-inner">
            <div 
              className="bg-gradient-to-r from-purple-500 via-purple-600 to-indigo-600 h-3 rounded-full transition-all duration-500 ease-out shadow-sm relative overflow-hidden"
              style={{ width: `${(currentQuestionNumber / totalQuestions) * 100}%` }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Question Content */}
      <div className="flex-1 px-6 py-8 overflow-y-auto">
        <div className="max-w-4xl mx-auto">
          
          <AnimatePresence mode="wait">
            {currentQuestion ? (
            <motion.div 
              key={currentQuestion.id}
                initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.3 }}
              >
                <div className="mb-8">
                  {/* Question Identifier */}
                  <div className="flex flex-col items-center mb-6">
                    <div className="w-16 h-16 bg-purple-600 rounded-lg flex items-center justify-center mb-2">
                      <span className="text-white text-2xl font-bold">
                        {currentQuestionNumber.toString().padStart(2, '0')}
                    </span>
                    </div>
                  </div>
                  
                  {/* Question Display */}
                  <div className="text-center mb-8">
                    <h2 className="text-2xl font-bold text-gray-800 leading-relaxed">
                    {currentQuestion.question}
                  </h2>
                  </div>
                </div>

                                {/* Single Choice Options */}
                {currentQuestion.type === 'SINGLE_CHOICE' && currentQuestion.options && (
                  <div className="mb-8">
                    <div className="space-y-4">
                      {currentQuestion.options.map((option, index) => {
                        const letter = String.fromCharCode(65 + index); // A, B, C, D...
                        const isSelected = selectedOption.includes(option);
                        
                        return (
                          <label
                            key={index}
                            className={`block cursor-pointer transition-all duration-200 ${
                              isSelected ? 'transform scale-105' : 'hover:scale-102'
                            }`}
                          >
                            <div className={`bg-white rounded-xl p-6 border-2 transition-all duration-200 ${
                              isSelected 
                                ? 'border-purple-500 shadow-lg shadow-purple-100' 
                                : 'border-gray-200 hover:border-purple-300 hover:shadow-md'
                            }`}>
                              <div className="flex items-start gap-4">
                                {/* Radio button indicator */}
                                <div className="flex items-center gap-3">
                                  <input
                                    type="radio"
                                    name="single-choice-option"
                                    value={option}
                                    checked={isSelected}
                                    onChange={(e) => setSelectedOption([e.target.value])}
                                    className="w-4 h-4 border-gray-300 focus:ring-purple-500 bg-white"
                                  />
                                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                                    isSelected 
                                      ? 'bg-purple-500 text-white' 
                                      : 'bg-gray-100 text-gray-600'
                                  }`}>
                                    {letter}
                                  </div>
                                </div>
                                <span 
                                  id={`option-${index}-description`}
                                  className="text-gray-800 font-medium text-lg leading-relaxed flex-1"
                                >
                                  {option}
                                </span>
                              </div>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Multiple Choice Options */}
                {currentQuestion.type === 'MULTIPLE_CHOICE' && currentQuestion.options && (
                  <div className="mb-8">
                    <div className="space-y-4">
                      {currentQuestion.options.map((option, index) => {
                        const letter = String.fromCharCode(65 + index); // A, B, C, D...
                        const isSelected = selectedOption.includes(option);
                        
                        return (
                          <label
                            key={index}
                            className={`block cursor-pointer transition-all duration-200 ${
                              isSelected ? 'transform scale-105' : 'hover:scale-102'
                            }`}
                          >
                            <div className={`bg-white rounded-xl p-6 border-2 transition-all duration-200 ${
                              isSelected 
                                ? 'border-purple-500 shadow-lg shadow-purple-100' 
                                : 'border-gray-200 hover:border-purple-300 hover:shadow-md'
                            }`}>
                              <div className="flex items-start gap-4">
                                {/* Checkbox indicator */}
                                <div className="flex items-center gap-3">
                                  <input
                                    type="checkbox"
                                    name="multiple-choice-option"
                                    value={option}
                                    checked={isSelected}
                                    onChange={(e) => {
                                      if (e.target.checked) {
                                        setSelectedOption([...selectedOption, option]);
                                      } else {
                                        setSelectedOption(selectedOption.filter(item => item !== option));
                                      }
                                    }}
                                    className="w-4 h-4 border-gray-300 rounded focus:ring-purple-500 bg-white"
                                  />
                                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                                    isSelected 
                                      ? 'bg-purple-500 text-white' 
                                      : 'bg-gray-100 text-gray-600'
                                  }`}>
                                    {letter}
                                  </div>
                                </div>
                                <span 
                                  id={`option-${index}-description`}
                                  className="text-gray-800 font-medium text-lg leading-relaxed flex-1"
                                >
                                  {option}
                                </span>
                              </div>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Error Message */}
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-4"
                  >
                    {error}
            </motion.div>
                )}

                {/* Navigation Buttons */}
                <div className="flex items-center justify-between gap-4">
                  {/* Previous Button */}
                  <button
                    onClick={goToPreviousQuestion}
                    disabled={isPreviousLoading || isSkipLoading || isSubmitting || currentQuestionNumber <= 1}
                    className="bg-gray-500 text-white px-8 py-3 rounded-lg font-semibold hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                  >
                    {isPreviousLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Loading...
                      </>
                    ) : (
                      <>
                        ← Previous Question
                      </>
                    )}
                  </button>

                  {/* Skip Button */}
                  <button
                    onClick={skipQuestion}
                    disabled={isSkipLoading || isPreviousLoading || isSubmitting}
                    className="bg-yellow-500 text-white px-8 py-3 rounded-lg font-semibold hover:bg-yellow-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                  >
                    {isSkipLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Skipping...
                      </>
                    ) : (
                      'Skip →'
                    )}
                  </button>

                  {/* Next/Complete Button */}
                  <button
                    onClick={submitAnswer}
                    disabled={isSubmitting || isPreviousLoading || isSkipLoading || (
                      (currentQuestion.type === 'SINGLE_CHOICE' && selectedOption.length === 0) ||
                      (currentQuestion.type === 'MULTIPLE_CHOICE' && selectedOption.length === 0)
                    )}
                    className="bg-purple-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Submitting...
                      </>
                    ) : currentQuestionNumber === totalQuestions ? (
                      'Complete Assessment'
                    ) : (
                      'Next Question →'
                    )}
                  </button>
                </div>
                    </motion.div>
            ) : (
              <div className="text-center">
                <p className="text-gray-600">No question available. Please try refreshing the page.</p>
            <button
                  onClick={() => loadQuestion()} 
                  className="mt-4 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700"
            >
                  Retry
            </button>
          </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.main>
  );
  }

  // If we reach here, something went wrong
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-purple-100 flex items-center justify-center">
      <div className="text-center">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md mx-auto">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Unexpected State</h2>
          <p className="text-gray-600 mb-6">Something went wrong. Please try refreshing the page.</p>
            <button
            onClick={() => window.location.reload()} 
            className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700"
            >
            Refresh Page
            </button>
          </div>
      </div>
    </div>
  );
} 