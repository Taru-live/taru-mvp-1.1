'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FileText, Clock, CheckCircle, AlertCircle, Play } from 'lucide-react';

interface Test {
  _id: string;
  title: string;
  description?: string;
  subject: string;
  grade?: string;
  status: string;
  totalPoints: number;
  duration?: number;
  startDate?: string;
  endDate?: string;
  attemptsAllowed: number;
}

interface Submission {
  testId: string;
  attemptNumber: number;
  status: string;
  totalScore?: number;
  percentage?: number;
  isPassed?: boolean;
  submittedAt?: string;
}

export default function TestList() {
  const [tests, setTests] = useState<Test[]>([]);
  const [submissions, setSubmissions] = useState<Record<string, Submission>>({});
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchTests();
    fetchSubmissions();
  }, []);

  const fetchTests = async () => {
    try {
      const response = await fetch('/api/tests?status=published');
      const data = await response.json();
      if (data.success) {
        setTests(data.tests || []);
      }
    } catch (err) {
      console.error('Error fetching tests:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSubmissions = async () => {
    try {
      const submissionsMap: Record<string, Submission> = {};
      
      // Fetch submissions for each test
      for (const test of tests) {
        try {
          const response = await fetch(`/api/tests/${test._id}/submissions`);
          const data = await response.json();
          if (data.success && data.submissions && data.submissions.length > 0) {
            // Get the latest submission
            const latest = data.submissions[0];
            submissionsMap[test._id] = latest;
          }
        } catch (err) {
          // Ignore errors for individual test submissions
        }
      }
      
      setSubmissions(submissionsMap);
    } catch (err) {
      console.error('Error fetching submissions:', err);
    }
  };

  useEffect(() => {
    if (tests.length > 0) {
      fetchSubmissions();
    }
  }, [tests]);

  const getTestStatus = (test: Test): { status: string; color: string; icon: any } => {
    const submission = submissions[test._id];
    const now = new Date();
    
    if (test.startDate && now < new Date(test.startDate)) {
      return { status: 'Not Started', color: 'text-gray-600', icon: Clock };
    }
    
    if (test.endDate && now > new Date(test.endDate)) {
      return { status: 'Closed', color: 'text-red-600', icon: AlertCircle };
    }
    
    if (submission) {
      if (submission.status === 'graded') {
        return { 
          status: submission.isPassed ? 'Passed' : 'Failed', 
          color: submission.isPassed ? 'text-green-600' : 'text-red-600',
          icon: CheckCircle
        };
      }
      if (submission.status === 'submitted') {
        return { status: 'Submitted', color: 'text-yellow-600', icon: Clock };
      }
      return { status: 'In Progress', color: 'text-blue-600', icon: Clock };
    }
    
    return { status: 'Available', color: 'text-green-600', icon: Play };
  };

  const canTakeTest = (test: Test): boolean => {
    const submission = submissions[test._id];
    const now = new Date();
    
    if (test.startDate && now < new Date(test.startDate)) return false;
    if (test.endDate && now > new Date(test.endDate)) return false;
    
    if (submission) {
      const attemptsUsed = submission.attemptNumber || 0;
      if (attemptsUsed >= test.attemptsAllowed) return false;
      if (submission.status === 'in_progress') return true;
    }
    
    return true;
  };

  const handleTakeTest = (testId: string) => {
    router.push(`/dashboard/student/tests/${testId}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">My Tests</h2>
        <p className="text-gray-600 mt-1">Tests assigned to you</p>
      </div>

      {tests.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No tests assigned yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tests.map((test) => {
            const testStatus = getTestStatus(test);
            const submission = submissions[test._id];
            const StatusIcon = testStatus.icon;

            return (
              <div
                key={test._id}
                className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">{test.title}</h3>
                  <StatusIcon className={`w-5 h-5 ${testStatus.color}`} />
                </div>

                <div className="space-y-2 text-sm text-gray-600 mb-4">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    <span>{test.subject}</span>
                  </div>
                  {test.duration && (
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      <span>{test.duration} minutes</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{test.totalPoints} points</span>
                  </div>
                  {submission && submission.status === 'graded' && (
                    <div className="pt-2 border-t border-gray-200">
                      <div className="flex justify-between">
                        <span>Score:</span>
                        <span className="font-semibold">
                          {submission.totalScore || 0}/{test.totalPoints} ({submission.percentage || 0}%)
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <span className={`text-sm font-medium ${testStatus.color}`}>
                      {testStatus.status}
                    </span>
                    {canTakeTest(test) && (
                      <button
                        onClick={() => handleTakeTest(test._id)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                      >
                        {submission?.status === 'in_progress' ? 'Continue' : 'Take Test'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
