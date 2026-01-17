'use client';

import { useState, useEffect } from 'react';
import { Dialog } from '@headlessui/react';
import { X, CheckCircle, Clock, FileText } from 'lucide-react';

interface Submission {
  _id: string;
  testId: string;
  studentId: string;
  student: {
    id: string;
    name: string;
    classGrade: string;
    email?: string;
  };
  attemptNumber: number;
  status: string;
  totalScore?: number;
  percentage?: number;
  isPassed?: boolean;
  submittedAt: string;
  answers: Array<{
    questionId: string;
    questionType: string;
    answer: any;
    videoUrl?: string;
  }>;
}

interface TestEvaluationProps {
  testId: string;
  onClose: () => void;
}

export default function TestEvaluation({ testId, onClose }: TestEvaluationProps) {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [test, setTest] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [evaluations, setEvaluations] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, [testId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch test
      const testResponse = await fetch(`/api/tests/${testId}`);
      const testData = await testResponse.json();
      if (testData.success) {
        setTest(testData.test);
        setQuestions(testData.test.questions || []);
      }

      // Fetch submissions
      const submissionsResponse = await fetch(`/api/tests/${testId}/submissions`);
      const submissionsData = await submissionsResponse.json();
      if (submissionsData.success) {
        setSubmissions(submissionsData.submissions || []);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleEvaluate = (submission: Submission) => {
    setSelectedSubmission(submission);
    // Initialize evaluations for this submission
    const initialEvaluations = questions.map((q, idx) => {
      const answer = submission.answers.find(a => a.questionId === q._id);
      return {
        questionId: q._id,
        pointsAwarded: answer?.questionType === 'mcq' ? q.points : 0,
        maxPoints: q.points,
        feedback: ''
      };
    });
    setEvaluations({ [submission._id]: initialEvaluations });
  };

  const handleSaveEvaluation = async () => {
    if (!selectedSubmission) return;

    const questionEvaluations = evaluations[selectedSubmission._id] || [];
    const totalScore = questionEvaluations.reduce((sum: number, e: any) => sum + (e.pointsAwarded || 0), 0);
    const maxScore = questionEvaluations.reduce((sum: number, e: any) => sum + (e.maxPoints || 0), 0);
    const percentage = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;
    const isPassed = totalScore >= (test?.passingScore || 50);

    setSaving(true);
    try {
      const response = await fetch(`/api/tests/submissions/${selectedSubmission._id}/evaluate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionEvaluations,
          overallFeedback: `Total Score: ${totalScore}/${maxScore} (${percentage}%)`
        })
      });

      const data = await response.json();
      if (data.success) {
        setSelectedSubmission(null);
        fetchData();
      } else {
        alert(data.error || 'Failed to save evaluation');
      }
    } catch (err) {
      alert('Error saving evaluation');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Dialog open={true} onClose={onClose} className="relative z-50">
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="bg-white rounded-lg shadow-xl p-6">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>
    );
  }

  return (
    <Dialog open={true} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <Dialog.Title className="text-2xl font-bold">Evaluate Test Submissions</Dialog.Title>
              <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>

            {!selectedSubmission ? (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Submissions ({submissions.length})</h3>
                {submissions.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No submissions to evaluate
                  </div>
                ) : (
                  <div className="space-y-2">
                    {submissions.map((submission) => (
                      <div
                        key={submission._id}
                        className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                      >
                        <div className="flex items-center gap-4">
                          <FileText className="w-5 h-5 text-gray-400" />
                          <div>
                            <div className="font-medium">{submission.student?.name || 'Unknown'}</div>
                            <div className="text-sm text-gray-500">
                              {submission.student?.classGrade} • Attempt {submission.attemptNumber}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className={`px-3 py-1 rounded-full text-sm ${
                            submission.status === 'graded' 
                              ? 'bg-green-100 text-green-800'
                              : submission.status === 'submitted'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {submission.status}
                          </span>
                          {submission.status === 'submitted' && (
                            <button
                              onClick={() => handleEvaluate(submission)}
                              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                            >
                              Evaluate
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-semibold">{selectedSubmission.student?.name}</h3>
                    <p className="text-sm text-gray-500">
                      {selectedSubmission.student?.classGrade} • Submitted: {new Date(selectedSubmission.submittedAt).toLocaleString()}
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedSubmission(null)}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Back to List
                  </button>
                </div>

                <div className="space-y-6">
                  {questions.map((question, idx) => {
                    const answer = selectedSubmission.answers.find(a => a.questionId === question._id);
                    const evaluation = evaluations[selectedSubmission._id]?.[idx] || {
                      pointsAwarded: 0,
                      maxPoints: question.points,
                      feedback: ''
                    };

                    return (
                      <div key={question._id} className="border border-gray-200 rounded-lg p-4">
                        <div className="mb-4">
                          <div className="flex justify-between items-start mb-2">
                            <span className="text-sm font-medium text-gray-500">
                              Question {idx + 1} ({question.questionType.toUpperCase()})
                            </span>
                            <span className="text-sm font-medium">{question.points} points</span>
                          </div>
                          <h4 className="text-lg font-semibold">{question.questionText}</h4>
                        </div>

                        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                          <div className="text-sm font-medium text-gray-700 mb-1">Student Answer:</div>
                          {question.questionType === 'mcq' && (
                            <div>{answer?.answer || 'No answer'}</div>
                          )}
                          {question.questionType === 'written' && (
                            <div className="whitespace-pre-wrap">{answer?.answer || 'No answer'}</div>
                          )}
                          {question.questionType === 'video' && (
                            <div>
                              {answer?.videoUrl ? (
                                <a href={answer.videoUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                                  {answer.videoUrl}
                                </a>
                              ) : (
                                'No video submitted'
                              )}
                            </div>
                          )}
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center gap-4">
                            <label className="text-sm font-medium text-gray-700">
                              Points Awarded:
                            </label>
                            <input
                              type="number"
                              min="0"
                              max={question.points}
                              value={evaluation.pointsAwarded}
                              onChange={(e) => {
                                const newEvals = [...(evaluations[selectedSubmission._id] || [])];
                                newEvals[idx] = { ...evaluation, pointsAwarded: parseInt(e.target.value) || 0 };
                                setEvaluations({ ...evaluations, [selectedSubmission._id]: newEvals });
                              }}
                              className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <span className="text-sm text-gray-500">/ {question.points}</span>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Feedback:
                            </label>
                            <textarea
                              value={evaluation.feedback}
                              onChange={(e) => {
                                const newEvals = [...(evaluations[selectedSubmission._id] || [])];
                                newEvals[idx] = { ...evaluation, feedback: e.target.value };
                                setEvaluations({ ...evaluations, [selectedSubmission._id]: newEvals });
                              }}
                              rows={2}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="Provide feedback for this answer..."
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="flex justify-end gap-2 pt-6 border-t border-gray-200">
                  <button
                    onClick={() => setSelectedSubmission(null)}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveEvaluation}
                    disabled={saving}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                  >
                    {saving ? 'Saving...' : 'Save Evaluation'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}
