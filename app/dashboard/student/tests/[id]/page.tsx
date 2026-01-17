'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Clock, CheckCircle, AlertCircle } from 'lucide-react';

interface Test {
  _id: string;
  title: string;
  description?: string;
  subject: string;
  totalPoints: number;
  duration?: number;
  questions: Question[];
  showResultsImmediately: boolean;
}

interface Question {
  _id: string;
  questionType: 'mcq' | 'written' | 'video';
  questionText: string;
  points: number;
  order: number;
  options?: Array<{ id: string; text: string }>;
  explanation?: string;
}

export default function TakeTestPage() {
  const params = useParams();
  const router = useRouter();
  const testId = params?.id as string;

  const [test, setTest] = useState<Test | null>(null);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [startedAt, setStartedAt] = useState<Date | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTest();
  }, [testId]);

  useEffect(() => {
    if (test?.duration && startedAt) {
      const interval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startedAt.getTime()) / 1000);
        const remaining = (test.duration! * 60) - elapsed;
        setTimeRemaining(Math.max(0, remaining));

        if (remaining <= 0) {
          handleSubmit();
        }
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [test, startedAt]);

  const fetchTest = async () => {
    try {
      const response = await fetch(`/api/tests/${testId}`);
      const data = await response.json();
      if (data.success) {
        setTest(data.test);
        setStartedAt(new Date());
        if (data.test.duration) {
          setTimeRemaining(data.test.duration * 60);
        }
      }
    } catch (err) {
      console.error('Error fetching test:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerChange = (questionId: string, answer: any) => {
    setAnswers({ ...answers, [questionId]: answer });
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSubmit = async () => {
    if (!test) return;

    const answerArray = test.questions.map((q) => ({
      answer: answers[q._id]?.answer || '',
      videoUrl: answers[q._id]?.videoUrl
    }));

    setSubmitting(true);
    try {
      const timeSpent = startedAt ? Math.floor((Date.now() - startedAt.getTime()) / 1000) : 0;
      
      const response = await fetch(`/api/tests/${testId}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          answers: answerArray,
          timeSpent,
          startedAt: startedAt?.toISOString()
        })
      });

      const data = await response.json();
      if (data.success) {
        if (data.results && test.showResultsImmediately) {
          // Show results immediately
          alert(`Test submitted! Score: ${data.results.score}/${test.totalPoints} (${data.results.percentage}%)`);
        } else {
          alert('Test submitted successfully! Results will be available after evaluation.');
        }
        router.push('/dashboard/student');
      } else {
        alert(data.error || 'Failed to submit test');
      }
    } catch (err) {
      alert('Error submitting test');
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!test) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-gray-600">Test not found</p>
        </div>
      </div>
    );
  }

  const question = test.questions[currentQuestion];
  const progress = ((currentQuestion + 1) / test.questions.length) * 100;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{test.title}</h1>
              <p className="text-gray-600 mt-1">{test.subject}</p>
            </div>
            {timeRemaining !== null && (
              <div className="flex items-center gap-2 px-4 py-2 bg-red-50 border border-red-200 rounded-lg">
                <Clock className="w-5 h-5 text-red-600" />
                <span className="font-bold text-red-600">{formatTime(timeRemaining)}</span>
              </div>
            )}
          </div>
          
          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-sm text-gray-600 mt-2">
            Question {currentQuestion + 1} of {test.questions.length}
          </p>
        </div>

        {/* Question */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-500">
                Question {currentQuestion + 1} ({question.questionType.toUpperCase()})
              </span>
              <span className="text-sm font-medium text-gray-700">{question.points} points</span>
            </div>
            <h2 className="text-xl font-semibold text-gray-900">{question.questionText}</h2>
          </div>

          {/* MCQ Options */}
          {question.questionType === 'mcq' && question.options && (
            <div className="space-y-3">
              {question.options.map((option) => (
                <label
                  key={option.id}
                  className={`flex items-center gap-3 p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                    answers[question._id]?.answer === option.id
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name={`question-${question._id}`}
                    value={option.id}
                    checked={answers[question._id]?.answer === option.id}
                    onChange={() => handleAnswerChange(question._id, { answer: option.id })}
                    className="w-5 h-5 text-blue-600"
                  />
                  <span className="flex-1">{option.text}</span>
                </label>
              ))}
            </div>
          )}

          {/* Written Answer */}
          {question.questionType === 'written' && (
            <textarea
              value={answers[question._id]?.answer || ''}
              onChange={(e) => handleAnswerChange(question._id, { answer: e.target.value })}
              rows={8}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Type your answer here..."
            />
          )}

          {/* Video Submission */}
          {question.questionType === 'video' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Video URL
                </label>
                <input
                  type="url"
                  value={answers[question._id]?.videoUrl || ''}
                  onChange={(e) => handleAnswerChange(question._id, { 
                    answer: e.target.value,
                    videoUrl: e.target.value 
                  })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="https://example.com/video.mp4"
                />
              </div>
              <p className="text-sm text-gray-600">
                Upload your video to a hosting service (YouTube, Vimeo, etc.) and paste the URL here.
              </p>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex justify-between items-center">
          <button
            onClick={() => setCurrentQuestion(Math.max(0, currentQuestion - 1))}
            disabled={currentQuestion === 0}
            className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>

          <div className="flex gap-2">
            {currentQuestion < test.questions.length - 1 ? (
              <button
                onClick={() => setCurrentQuestion(currentQuestion + 1)}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Next
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                {submitting ? 'Submitting...' : 'Submit Test'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
