'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, Star, Brain, Trophy, Rocket, Sparkles, Zap, Palette, Puzzle, BookOpen, Heart, Smile, Lightbulb } from 'lucide-react';
import ConsistentLoadingPage from '../../../components/ConsistentLoadingPage';

interface DiagnosticQuestion {
  id: string;
  section: string;
  prompt: string;
  inputType: 'open_text' | 'multiple_choice' | 'pattern_choice' | 'fill_blanks' | 'image_text' | 'scenario_steps';
  options?: string[];
  category: string;
  points: number;
  timeLimit?: number;
}

interface AssessmentResults {
  overallScore: number;
  learningStyle: string;
  sectionScores: Record<string, number>;
  recommendations: string[];
  level: string;
  detailedAnalysis: {
    strengths: string[];
    areasForImprovement: string[];
    timeEfficiency: string;
  };
}

export default function DiagnosticTestTab() {
  // Load answers and progress from localStorage on mount
  const getInitialAnswers = (): Record<string, string | number | string[]> => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('diagnostic_test_answers');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {
          console.error('Error parsing saved answers:', e);
        }
      }
    }
    return {};
  };

  const getInitialQuestionIndex = (): number => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('diagnostic_test_currentIndex');
      if (saved) {
        try {
          return parseInt(saved, 10) || 0;
        } catch (e) {
          console.error('Error parsing saved index:', e);
        }
      }
    }
    return 0;
  };

  const getInitialTimeSpent = (): number => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('diagnostic_test_timeSpent');
      if (saved) {
        try {
          return parseInt(saved, 10) || 0;
        } catch (e) {
          console.error('Error parsing saved time:', e);
        }
      }
    }
    return 0;
  };

  const getInitialTestStarted = (): boolean => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('diagnostic_test_started');
      return saved === 'true';
    }
    return false;
  };

  const [questions, setQuestions] = useState<DiagnosticQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(getInitialQuestionIndex());
  const [answers, setAnswers] = useState<Record<string, string | number | string[]>>(getInitialAnswers());
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [totalTimeSpent, setTotalTimeSpent] = useState(getInitialTimeSpent());
  const [testStarted, setTestStarted] = useState(getInitialTestStarted());
  const [testCompleted, setTestCompleted] = useState(false);
  const [results, setResults] = useState<AssessmentResults | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Load questions on component mount
  useEffect(() => {
    loadDiagnosticQuestions();
  }, []);

  // Save answers to localStorage whenever they change
  useEffect(() => {
    if (typeof window !== 'undefined' && !testCompleted) {
      localStorage.setItem('diagnostic_test_answers', JSON.stringify(answers));
    }
  }, [answers, testCompleted]);

  // Save currentQuestionIndex to localStorage whenever it changes
  useEffect(() => {
    if (typeof window !== 'undefined' && !testCompleted) {
      localStorage.setItem('diagnostic_test_currentIndex', currentQuestionIndex.toString());
    }
  }, [currentQuestionIndex, testCompleted]);

  // Save totalTimeSpent to localStorage whenever it changes
  useEffect(() => {
    if (typeof window !== 'undefined' && !testCompleted) {
      localStorage.setItem('diagnostic_test_timeSpent', totalTimeSpent.toString());
    }
  }, [totalTimeSpent, testCompleted]);

  // Save testStarted to localStorage whenever it changes
  useEffect(() => {
    if (typeof window !== 'undefined' && !testCompleted) {
      localStorage.setItem('diagnostic_test_started', testStarted.toString());
    }
  }, [testStarted, testCompleted]);

  const completeTest = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/assessment/diagnostic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          answers,
          timeSpent: totalTimeSpent,
          completed: true
        })
      });

      if (!response.ok) {
        throw new Error('Failed to submit diagnostic test');
      }

      const data = await response.json();
      setResults(data.results);
      setTestCompleted(true);
      setTestStarted(false);
      
      // Clear localStorage after successful completion
      if (typeof window !== 'undefined') {
        localStorage.removeItem('diagnostic_test_answers');
        localStorage.removeItem('diagnostic_test_currentIndex');
        localStorage.removeItem('diagnostic_test_timeSpent');
        localStorage.removeItem('diagnostic_test_started');
      }
    } catch (err) {
      setError('Failed to submit test. Please try again.');
      console.error('Submit test error:', err);
    } finally {
      setLoading(false);
    }
  }, [answers, totalTimeSpent, setLoading, setResults, setTestCompleted, setTestStarted, setError]);

  const handleNextQuestion = useCallback(() => {
    if (currentQuestionIndex < (questions?.length || 0) - 1) {
      const nextIndex = currentQuestionIndex + 1;
      setCurrentQuestionIndex(nextIndex);
      setTimeRemaining(questions?.[nextIndex]?.timeLimit || 120);
    } else {
      completeTest();
    }
  }, [currentQuestionIndex, questions, setCurrentQuestionIndex, setTimeRemaining, completeTest]);

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (testStarted && !testCompleted && timeRemaining > 0) {
      interval = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            handleNextQuestion(); // Auto-advance when time runs out
            return 0;
          }
          return prev - 1;
        });
        setTotalTimeSpent(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [testStarted, testCompleted, timeRemaining, handleNextQuestion]);

  const loadDiagnosticQuestions = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/assessment/diagnostic');
      if (!response.ok) {
        throw new Error('Failed to load diagnostic questions');
      }
      const data = await response.json();
      
      setQuestions(data.questions);
      
      // Check if assessment already completed
      if (data.existingAssessment?.completed) {
        setTestCompleted(true);
        if (data.existingAssessment.results) {
          setResults(data.existingAssessment.results);
        }
      }
    } catch (err) {
      setError('Failed to load diagnostic test. Please try again.');
      console.error('Load questions error:', err);
    } finally {
      setLoading(false);
    }
  };

  const resetTest = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/assessment/diagnostic/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (!response.ok) {
        throw new Error('Failed to reset diagnostic test');
      }
      
      // Reset component state
      setTestCompleted(false);
      setTestStarted(false);
      setResults(null);
      setAnswers({});
      setCurrentQuestionIndex(0);
      setTimeRemaining(0);
      setTotalTimeSpent(0);
      setError('');
      
      // Clear localStorage when resetting
      if (typeof window !== 'undefined') {
        localStorage.removeItem('diagnostic_test_answers');
        localStorage.removeItem('diagnostic_test_currentIndex');
        localStorage.removeItem('diagnostic_test_timeSpent');
        localStorage.removeItem('diagnostic_test_started');
      }
      
      // Reload questions
      await loadDiagnosticQuestions();
    } catch (err) {
      setError('Failed to reset test. Please try again.');
      console.error('Reset test error:', err);
    } finally {
      setLoading(false);
    }
  };

  const startTest = () => {
    setTestStarted(true);
    setCurrentQuestionIndex(0);
    if (questions?.[0]?.timeLimit) {
      setTimeRemaining(questions[0].timeLimit);
    }
  };

  const handleAnswerChange = (value: string | number | string[]) => {
    const currentQuestion = questions?.[currentQuestionIndex];
    if (currentQuestion) {
      setAnswers(prev => ({
        ...prev,
        [currentQuestion.id]: value
      }));
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      const prevIndex = currentQuestionIndex - 1;
      setCurrentQuestionIndex(prevIndex);
      setTimeRemaining(questions?.[prevIndex]?.timeLimit || 120);
    }
  };

  const renderQuestionInput = (question: DiagnosticQuestion) => {
    const currentAnswer = answers[question?.id] || '';

    switch (question.inputType) {
      case 'multiple_choice':
      case 'pattern_choice':
        return (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {question.options?.map((option, index) => {
              const getIcon = (option: string) => {
                if (option.includes('story') || option.includes('watching')) return <BookOpen className="w-8 h-8" />;
                if (option.includes('puzzle') || option.includes('solving')) return <Puzzle className="w-8 h-8" />;
                if (option.includes('color') || option.includes('draw')) return <Palette className="w-8 h-8" />;
                if (option.includes('happy') || option.includes('excited')) return <Smile className="w-8 h-8" />;
                if (option.includes('calm') || option.includes('curious')) return <Heart className="w-8 h-8" />;
                return <Lightbulb className="w-8 h-8" />;
              };

              return (
                <motion.button
                  key={index}
                  onClick={() => handleAnswerChange(option)}
                  className={`relative p-6 rounded-2xl border-2 transition-all duration-300 ${
                    currentAnswer === option
                      ? 'border-[#6D18CE] bg-gradient-to-br from-purple-50 to-pink-50 shadow-lg scale-105'
                      : 'border-gray-200 bg-white hover:border-[#6D18CE] hover:shadow-md'
                  }`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1, duration: 0.4 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="text-center space-y-3">
                    <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center ${
                      currentAnswer === option ? 'bg-[#6D18CE] text-white' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {getIcon(option)}
                    </div>
                    <p className={`font-medium text-sm ${
                      currentAnswer === option ? 'text-[#6D18CE]' : 'text-gray-700'
                    }`}>
                      {option}
                    </p>
                  </div>
                  {currentAnswer === option && (
                    <motion.div
                      className="absolute -top-2 -right-2 w-6 h-6 bg-[#6D18CE] rounded-full flex items-center justify-center"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ duration: 0.2 }}
                    >
                      <CheckCircle className="w-4 h-4 text-white" />
                    </motion.div>
                  )}
                </motion.button>
              );
            })}
          </div>
        );

      case 'open_text':
        return (
          <div className="space-y-4">
            <textarea
              value={currentAnswer}
              onChange={(e) => handleAnswerChange(e.target.value)}
              placeholder="Tell me more about yourself..."
              className="w-full h-32 p-4 border-2 border-gray-200 rounded-2xl resize-none focus:ring-2 focus:ring-[#6D18CE] focus:border-[#6D18CE] text-gray-900 bg-white"
              maxLength={500}
            />
          </div>
        );

      default:
        return (
          <input
            type="text"
            value={currentAnswer}
            onChange={(e) => handleAnswerChange(e.target.value)}
            className="w-full p-4 border-2 border-gray-200 rounded-2xl focus:ring-2 focus:ring-[#6D18CE] focus:border-[#6D18CE] text-gray-900 bg-white"
          />
        );
    }
  };

  const renderProgressSteps = () => {
    const totalSteps = questions?.length || 0;
    return (
      <div className="flex items-center justify-between mb-8">
        {Array.from({ length: totalSteps }, (_, index) => (
          <div key={index} className="flex flex-col items-center">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${
              index <= currentQuestionIndex 
                ? 'bg-[#6D18CE] text-white' 
                : 'bg-gray-200 text-gray-500'
            }`}>
              {index + 1}
            </div>
            <span className="text-xs mt-1 text-gray-600">
              Step {index + 1}
            </span>
          </div>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <ConsistentLoadingPage
        type="assessment"
        title="Loading Diagnostic Test"
        subtitle="Preparing your personalized diagnostic test..."
        tips={[
          'Analyzing your learning profile',
          'Generating personalized questions',
          'Setting up adaptive assessment engine'
        ]}
      />
    );
  }

  if (error) {
    return (
      <motion.div 
        className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 flex items-center justify-center px-4 py-6 md:px-8 md:py-12"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="max-w-md lg:max-w-lg w-full">
          <div className="bg-white rounded-3xl shadow-xl p-8 text-center">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Zap className="w-10 h-10 text-red-500" />
            </div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">Oops! Magic Mishap</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <button
              onClick={loadDiagnosticQuestions}
              className="bg-[#6D18CE] text-white px-6 py-3 rounded-2xl font-medium hover:bg-purple-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </motion.div>
    );
  }

  // Results view
  if (testCompleted && results) {
    const getPersonalityType = (learningStyle: string) => {
      switch (learningStyle) {
        case 'visual-spatial': return { title: "Visual Superstar!", description: "You learn best with fun visuals and bright colors!", icon: <Palette className="w-8 h-8" /> };
        case 'logical-mathematical': return { title: "Puzzle Master!", description: "You love solving problems and thinking logically!", icon: <Puzzle className="w-8 h-8" /> };
        case 'reading-writing': return { title: "Story Explorer!", description: "You learn best through reading and writing adventures!", icon: <BookOpen className="w-8 h-8" /> };
        default: return { title: "Learning Champion!", description: "You have a balanced approach to learning!", icon: <Star className="w-8 h-8" /> };
      }
    };

    const personality = getPersonalityType(results.learningStyle || 'balanced');

    return (
      <motion.div 
        className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 flex items-center justify-center px-4 py-6 md:px-8 md:py-12"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="max-w-4xl w-full">
          <motion.div 
            className="bg-white rounded-3xl shadow-xl p-8"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            {/* Progress Steps - All Completed */}
            <div className="flex items-center justify-between mb-8">
              {Array.from({ length: questions?.length || 0 }, (_, index) => (
                <div key={index} className="flex flex-col items-center">
                  <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-sm font-bold text-white">
                    <CheckCircle className="w-5 h-5" />
                  </div>
                  <span className="text-xs mt-1 text-green-600 font-medium">Completed</span>
                </div>
              ))}
            </div>

            {/* Result Banner */}
            <motion.div 
              className="bg-gradient-to-r from-[#6D18CE] to-purple-600 rounded-3xl p-8 text-white text-center mb-8"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.5 }}
            >
              <div className="flex items-center justify-center gap-4 mb-4">
                <Sparkles className="w-8 h-8" />
                <h1 className="text-3xl font-bold">{personality.title}</h1>
                <Trophy className="w-8 h-8" />
              </div>
              <p className="text-xl opacity-90">{personality.description}</p>
            </motion.div>

            {/* Magical Suggestions */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">Magical Suggestions!</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {(results.recommendations || []).slice(0, 3).map((recommendation, index) => (
                  <motion.div 
                    key={index}
                    className="bg-white border-2 border-gray-200 rounded-2xl p-6 text-center hover:border-[#6D18CE] transition-colors"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 + index * 0.1, duration: 0.4 }}
                  >
                    <h3 className="font-bold text-gray-800 mb-2">{recommendation}</h3>
                    <div className="bg-[#6D18CE] text-white text-xs px-3 py-1 rounded-full inline-block">
                      {Math.floor(Math.random() * 50) + 30}+ XP
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 justify-center">
              <button
                onClick={resetTest}
                disabled={loading}
                className="bg-[#6D18CE] text-white px-6 py-3 rounded-2xl font-medium hover:bg-purple-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <motion.div
                      className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    />
                    Resetting...
                  </>
                ) : (
                  <>
                    <Rocket className="w-5 h-5" />
                    Try Again with Me!
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      </motion.div>
    );
  }

  // Pre-test info
  if (!testStarted) {
    return (
      <motion.div 
        className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 flex items-center justify-center px-4 py-6 md:px-8 md:py-12"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="max-w-md lg:max-w-lg w-full">
          <motion.div 
            className="bg-white rounded-3xl shadow-xl p-8"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            {/* Progress Steps - First Step */}
            <div className="flex items-center justify-between mb-8">
              <div className="flex flex-col items-center">
                <div className="w-10 h-10 bg-[#6D18CE] rounded-full flex items-center justify-center text-sm font-bold text-white">
                  1
                </div>
                <span className="text-xs mt-1 text-[#6D18CE] font-medium">In Progress</span>
              </div>
              {Array.from({ length: (questions?.length || 1) - 1 }, (_, index) => (
                <div key={index} className="flex flex-col items-center">
                  <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center text-sm font-bold text-gray-500">
                    {index + 2}
                  </div>
                  <span className="text-xs mt-1 text-gray-500">Pending</span>
                </div>
              ))}
            </div>

            {/* Robot and Stars */}
            <div className="text-center mb-8">
              <motion.div 
                className="w-24 h-24 bg-gradient-to-r from-[#6D18CE] to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4"
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Brain className="w-12 h-12 text-white" />
              </motion.div>
              <div className="flex justify-center gap-4 mb-4">
                <Star className="w-6 h-6 text-yellow-400" />
                <Star className="w-6 h-6 text-yellow-400" />
              </div>
            </div>

            {/* Heading */}
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-800 mb-3">
                Let&apos;s discover how you love to learn!
              </h1>
              <p className="text-gray-600 text-lg">
                Answer my magical questions and I&apos;ll find the perfect learning adventure for you!
              </p>
            </div>

            {/* Start Button */}
            <motion.button
              onClick={startTest}
              className="w-full bg-gradient-to-r from-[#6D18CE] to-purple-600 text-white px-8 py-4 rounded-2xl font-bold text-xl hover:from-purple-700 hover:to-purple-800 transition-all duration-300 flex items-center justify-center gap-3"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Rocket className="w-6 h-6" />
              Start the Magical Game
            </motion.button>

            {/* Decorative Star */}
            <div className="text-center mt-6">
              <Star className="w-6 h-6 text-yellow-400 mx-auto" />
            </div>
          </motion.div>
        </div>
      </motion.div>
    );
  }

  // Test in progress
  const currentQuestion = questions?.[currentQuestionIndex];
  if (!currentQuestion || !questions?.length) return null;

  return (
    <motion.div 
      className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 flex items-center justify-center px-4 py-6 md:px-8 md:py-12"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="max-w-4xl w-full">
        <motion.div 
          className="bg-white rounded-3xl shadow-xl p-8"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          {/* Progress Steps */}
          {renderProgressSteps()}

          {/* Robot and Stars */}
          <div className="text-center mb-8">
            <motion.div 
              className="w-20 h-20 bg-gradient-to-r from-[#6D18CE] to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4"
              animate={{ y: [0, -5, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Brain className="w-10 h-10 text-white" />
            </motion.div>
            <div className="flex justify-center gap-4 mb-4">
              <Star className="w-5 h-5 text-yellow-400" />
              <Star className="w-5 h-5 text-yellow-400" />
            </div>
          </div>

          {/* Question */}
          <AnimatePresence mode="wait">
            <motion.div 
              key={currentQuestion.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="text-center mb-8"
            >
              <h2 className="text-2xl font-bold text-gray-800 mb-4">
                {currentQuestion.prompt}
              </h2>
            </motion.div>
          </AnimatePresence>

          {/* Answer Options */}
          <div className="mb-8">
            {renderQuestionInput(currentQuestion)}
          </div>

          {/* Navigation Buttons */}
          <div className="flex justify-between items-center">
            <button
              onClick={handlePreviousQuestion}
              disabled={currentQuestionIndex === 0}
              className="bg-white border-2 border-[#6D18CE] text-[#6D18CE] px-6 py-3 rounded-2xl font-medium hover:bg-purple-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>

            <button
              onClick={handleNextQuestion}
              disabled={!answers[currentQuestion?.id]}
              className="bg-[#6D18CE] text-white px-6 py-3 rounded-2xl font-medium hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {currentQuestionIndex === (questions?.length || 0) - 1 ? 'Finish' : 'Next'}
            </button>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
} 