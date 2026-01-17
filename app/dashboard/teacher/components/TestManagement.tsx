'use client';

import { useState, useEffect } from 'react';
import { Dialog } from '@headlessui/react';
import { X, Plus, Edit, Trash2, Users, FileText, CheckCircle, Clock, AlertCircle, UserCheck } from 'lucide-react';
import QuestionEditor from './QuestionEditor';
import TestAssignment from './TestAssignment';
import TestEvaluation from './TestEvaluation';

interface Test {
  _id: string;
  title: string;
  description?: string;
  subject: string;
  grade?: string;
  classGrade?: string;
  status: 'draft' | 'published' | 'archived';
  totalPoints: number;
  passingScore: number;
  duration?: number;
  assignmentType: 'individual' | 'class' | 'all_students';
  assignedTo: {
    studentIds?: string[];
    classGrades?: string[];
  };
  startDate?: string;
  endDate?: string;
  questions: any[];
  createdAt: string;
}

interface TestManagementProps {
  onTestSelect?: (testId: string) => void;
}

export default function TestManagement({ onTestSelect }: TestManagementProps) {
  const [tests, setTests] = useState<Test[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedTest, setSelectedTest] = useState<Test | null>(null);
  const [testToAssign, setTestToAssign] = useState<string | null>(null);
  const [testToEvaluate, setTestToEvaluate] = useState<string | null>(null);
  const [filter, setFilter] = useState<{ status?: string; subject?: string }>({});
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTests();
  }, [filter]);

  const fetchTests = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filter.status) params.append('status', filter.status);
      if (filter.subject) params.append('subject', filter.subject);

      const response = await fetch(`/api/tests?${params.toString()}`);
      const data = await response.json();

      if (data.success) {
        setTests(data.tests || []);
      } else {
        setError(data.error || 'Failed to fetch tests');
      }
    } catch (err) {
      setError('Error loading tests');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (testId: string) => {
    if (!confirm('Are you sure you want to delete this test?')) return;

    try {
      const response = await fetch(`/api/tests/${testId}`, {
        method: 'DELETE'
      });

      const data = await response.json();
      if (data.success) {
        setTests(tests.filter(t => t._id !== testId));
      } else {
        alert(data.error || 'Failed to delete test');
      }
    } catch (err) {
      alert('Error deleting test');
      console.error(err);
    }
  };

  const handlePublish = async (testId: string) => {
    try {
      const response = await fetch(`/api/tests/${testId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'published' })
      });

      const data = await response.json();
      if (data.success) {
        fetchTests();
      } else {
        alert(data.error || 'Failed to publish test');
      }
    } catch (err) {
      alert('Error publishing test');
      console.error(err);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      draft: 'bg-gray-100 text-gray-800',
      published: 'bg-green-100 text-green-800',
      archived: 'bg-yellow-100 text-yellow-800'
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status as keyof typeof styles] || styles.draft}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
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
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Test Management</h2>
          <p className="text-gray-600 mt-1">Create and manage tests for your students</p>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Create Test
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <select
          value={filter.status || ''}
          onChange={(e) => setFilter({ ...filter, status: e.target.value || undefined })}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Status</option>
          <option value="draft">Draft</option>
          <option value="published">Published</option>
          <option value="archived">Archived</option>
        </select>
        <input
          type="text"
          placeholder="Filter by subject..."
          value={filter.subject || ''}
          onChange={(e) => setFilter({ ...filter, subject: e.target.value || undefined })}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Tests Grid */}
      {tests.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No tests found. Create your first test to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tests.map((test) => (
            <div
              key={test._id}
              className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => onTestSelect?.(test._id)}
            >
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-semibold text-gray-900">{test.title}</h3>
                {getStatusBadge(test.status)}
              </div>

              <div className="space-y-2 text-sm text-gray-600 mb-4">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  <span>{test.subject}</span>
                </div>
                {test.classGrade && (
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    <span>{test.classGrade}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  <span>{test.questions?.length || 0} questions</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <span>{test.totalPoints} points</span>
                </div>
              </div>

              <div className="flex gap-2 pt-4 border-t border-gray-200">
                {test.status === 'draft' && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePublish(test._id);
                    }}
                    className="flex-1 px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
                  >
                    Publish
                  </button>
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedTest(test);
                  }}
                  className="px-3 py-2 border border-gray-300 rounded hover:bg-gray-50 text-sm"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(test._id);
                  }}
                  className="px-3 py-2 border border-red-300 text-red-600 rounded hover:bg-red-50 text-sm"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Test Modal */}
      {showCreateForm && (
        <TestCreationModal
          onClose={() => setShowCreateForm(false)}
          onSuccess={() => {
            setShowCreateForm(false);
            fetchTests();
          }}
        />
      )}

      {/* Edit Test Modal */}
      {selectedTest && (
        <TestCreationModal
          test={selectedTest}
          onClose={() => setSelectedTest(null)}
          onSuccess={() => {
            setSelectedTest(null);
            fetchTests();
          }}
        />
      )}

      {/* Test Assignment Modal */}
      {testToAssign && (
        <TestAssignment
          testId={testToAssign}
          onClose={() => setTestToAssign(null)}
          onSuccess={() => {
            setTestToAssign(null);
            fetchTests();
          }}
        />
      )}

      {/* Test Evaluation Modal */}
      {testToEvaluate && (
        <TestEvaluation
          testId={testToEvaluate}
          onClose={() => setTestToEvaluate(null)}
        />
      )}
    </div>
  );
}

// Test Creation Modal Component
function TestCreationModal({ 
  test, 
  onClose, 
  onSuccess 
}: { 
  test?: Test; 
  onClose: () => void; 
  onSuccess: () => void;
}) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    title: test?.title || '',
    description: test?.description || '',
    subject: test?.subject || '',
    grade: test?.grade || '',
    classGrade: test?.classGrade || '',
    totalPoints: test?.totalPoints || 100,
    passingScore: test?.passingScore || 50,
    duration: test?.duration || undefined,
    instructions: '',
    assignmentType: test?.assignmentType || 'individual',
    assignedTo: test?.assignedTo || { studentIds: [], classGrades: [] },
    startDate: test?.startDate || '',
    endDate: test?.endDate || '',
    allowLateSubmission: false,
    showResultsImmediately: false,
    randomizeQuestions: false,
    randomizeOptions: false,
    attemptsAllowed: 1
  });

  const [questions, setQuestions] = useState<any[]>(test?.questions || []);
  const [currentQuestion, setCurrentQuestion] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  const handleSaveQuestion = (questionData: any) => {
    if (currentQuestion?.index !== undefined) {
      // Update existing question
      const updated = [...questions];
      updated[currentQuestion.index] = questionData;
      setQuestions(updated);
    } else {
      // Add new question
      setQuestions([...questions, questionData]);
    }
    setCurrentQuestion(null);
  };

  const handleSubmit = async () => {
    if (!formData.title || !formData.subject || questions.length === 0) {
      alert('Please fill in all required fields and add at least one question');
      return;
    }

    setSaving(true);
    try {
      const url = test ? `/api/tests/${test._id}` : '/api/tests';
      const method = test ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          questions: questions.map((q, idx) => ({
            ...q,
            order: idx + 1
          }))
        })
      });

      const data = await response.json();
      if (data.success) {
        onSuccess();
      } else {
        alert(data.error || 'Failed to save test');
      }
    } catch (err) {
      alert('Error saving test');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={true} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <Dialog.Title className="text-2xl font-bold">
                {test ? 'Edit Test' : 'Create New Test'}
              </Dialog.Title>
              <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Step Indicator */}
            <div className="flex items-center justify-center mb-6">
              <div className="flex items-center">
                {[1, 2, 3].map((s) => (
                  <div key={s} className="flex items-center">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        step >= s ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
                      }`}
                    >
                      {s}
                    </div>
                    {s < 3 && (
                      <div
                        className={`w-20 h-1 ${step > s ? 'bg-blue-600' : 'bg-gray-200'}`}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Step 1: Basic Information */}
            {step === 1 && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Test Title *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Mathematics Quiz - Chapter 5"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Subject *
                    </label>
                    <input
                      type="text"
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., Mathematics"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Grade
                    </label>
                    <input
                      type="text"
                      value={formData.grade}
                      onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., Grade 8"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Total Points
                    </label>
                    <input
                      type="number"
                      value={formData.totalPoints}
                      onChange={(e) => setFormData({ ...formData, totalPoints: parseInt(e.target.value) || 100 })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Passing Score
                    </label>
                    <input
                      type="number"
                      value={formData.passingScore}
                      onChange={(e) => setFormData({ ...formData, passingScore: parseInt(e.target.value) || 50 })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Questions */}
            {step === 2 && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">Questions ({questions.length})</h3>
                  <button
                    onClick={() => setCurrentQuestion({ questionType: 'mcq', questionText: '', points: 10, options: [] })}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Add Question
                  </button>
                </div>

                <div className="space-y-4">
                  {questions.map((q, idx) => (
                    <div key={idx} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-sm font-medium">Question {idx + 1} ({q.questionType?.toUpperCase()})</span>
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setCurrentQuestion({ ...q, index: idx });
                            }}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setQuestions(questions.filter((_, i) => i !== idx))}
                            className="text-red-600 hover:text-red-800"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      <p className="text-gray-700">{q.questionText}</p>
                      <p className="text-sm text-gray-500 mt-1">{q.points} points</p>
                    </div>
                  ))}
                </div>

                {questions.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No questions added yet. Click "Add Question" to get started.
                  </div>
                )}
              </div>
            )}

            {/* Question Editor Modal */}
            {currentQuestion && (
              <QuestionEditor
                question={currentQuestion}
                onSave={handleSaveQuestion}
                onClose={() => setCurrentQuestion(null)}
              />
            )}

            {/* Step 3: Settings & Assignment */}
            {step === 3 && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Duration (minutes)
                  </label>
                  <input
                    type="number"
                    value={formData.duration || ''}
                    onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) || undefined })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Assignment Type
                  </label>
                  <select
                    value={formData.assignmentType}
                    onChange={(e) => setFormData({ ...formData, assignmentType: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="individual">Individual Students</option>
                    <option value="class">By Class</option>
                    <option value="all_students">All Students</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Start Date
                    </label>
                    <input
                      type="datetime-local"
                      value={formData.startDate}
                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      End Date
                    </label>
                    <input
                      type="datetime-local"
                      value={formData.endDate}
                      onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.allowLateSubmission}
                      onChange={(e) => setFormData({ ...formData, allowLateSubmission: e.target.checked })}
                    />
                    <span className="text-sm">Allow late submission</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.showResultsImmediately}
                      onChange={(e) => setFormData({ ...formData, showResultsImmediately: e.target.checked })}
                    />
                    <span className="text-sm">Show results immediately (for MCQ)</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.randomizeQuestions}
                      onChange={(e) => setFormData({ ...formData, randomizeQuestions: e.target.checked })}
                    />
                    <span className="text-sm">Randomize question order</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.randomizeOptions}
                      onChange={(e) => setFormData({ ...formData, randomizeOptions: e.target.checked })}
                    />
                    <span className="text-sm">Randomize option order (MCQ)</span>
                  </label>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Attempts Allowed
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={formData.attemptsAllowed}
                    onChange={(e) => setFormData({ ...formData, attemptsAllowed: parseInt(e.target.value) || 1 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-6 pt-6 border-t border-gray-200">
              <button
                onClick={step > 1 ? () => setStep(step - 1) : onClose}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                {step > 1 ? 'Previous' : 'Cancel'}
              </button>
              <div className="flex gap-2">
                {step < 3 ? (
                  <button
                    onClick={() => setStep(step + 1)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Next
                  </button>
                ) : (
                  <button
                    onClick={handleSubmit}
                    disabled={saving}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                  >
                    {saving ? 'Saving...' : test ? 'Update Test' : 'Create Test'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}
