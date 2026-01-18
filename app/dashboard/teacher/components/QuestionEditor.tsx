'use client';

import { useState } from 'react';
import { Dialog } from '@headlessui/react';
import { X, Plus, Trash2 } from 'lucide-react';

interface QuestionEditorProps {
  question: any;
  onSave: (question: any) => void;
  onClose: () => void;
}

export default function QuestionEditor({ question, onSave, onClose }: QuestionEditorProps) {
  const [formData, setFormData] = useState({
    questionType: question?.questionType || 'mcq',
    questionText: question?.questionText || '',
    points: question?.points || 10,
    options: question?.options || [],
    correctAnswer: question?.correctAnswer || '',
    correctAnswers: question?.correctAnswers || [],
    expectedAnswer: question?.expectedAnswer || '',
    evaluationCriteria: question?.evaluationCriteria || [],
    minWords: question?.minWords || undefined,
    maxWords: question?.maxWords || undefined,
    videoUrl: question?.videoUrl || '',
    videoDuration: question?.videoDuration || undefined,
    prompt: question?.prompt || '',
    explanation: question?.explanation || ''
  });

  const [newOption, setNewOption] = useState({ text: '', isCorrect: false });
  const [newCriterion, setNewCriterion] = useState({ keyword: '', points: 0, description: '' });

  const handleAddOption = () => {
    if (!newOption.text.trim()) return;
    
    const option = {
      id: `opt${Date.now()}`,
      text: newOption.text,
      isCorrect: newOption.isCorrect
    };

    setFormData({
      ...formData,
      options: [...formData.options, option]
    });
    setNewOption({ text: '', isCorrect: false });
  };

  const handleRemoveOption = (index: number) => {
    setFormData({
      ...formData,
      options: formData.options.filter((_: any, i: number) => i !== index)
    });
  };

  const handleAddCriterion = () => {
    if (!newCriterion.keyword.trim()) return;
    
    setFormData({
      ...formData,
      evaluationCriteria: [...formData.evaluationCriteria, { ...newCriterion }]
    });
    setNewCriterion({ keyword: '', points: 0, description: '' });
  };

  const handleRemoveCriterion = (index: number) => {
    setFormData({
      ...formData,
      evaluationCriteria: formData.evaluationCriteria.filter((_: any, i: number) => i !== index)
    });
  };

  const handleSave = () => {
    if (!formData.questionText.trim()) {
      alert('Question text is required');
      return;
    }

    if (formData.questionType === 'mcq' && formData.options.length < 2) {
      alert('MCQ questions must have at least 2 options');
      return;
    }

    if (formData.questionType === 'mcq' && !formData.correctAnswer && formData.correctAnswers.length === 0) {
      alert('Please mark at least one correct answer');
      return;
    }

    onSave(formData);
  };

  return (
    <Dialog open={true} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <Dialog.Title className="text-2xl font-bold">Edit Question</Dialog.Title>
              <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Question Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Question Type *
                </label>
                <select
                  value={formData.questionType}
                  onChange={(e) => setFormData({ ...formData, questionType: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="mcq">Multiple Choice (MCQ)</option>
                  <option value="written">Written Answer</option>
                  <option value="video">Video Submission</option>
                </select>
              </div>

              {/* Question Text */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Question Text *
                </label>
                <textarea
                  value={formData.questionText}
                  onChange={(e) => setFormData({ ...formData, questionText: e.target.value })}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter your question here..."
                />
              </div>

              {/* Points */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Points *
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.points}
                  onChange={(e) => setFormData({ ...formData, points: parseInt(e.target.value) || 10 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* MCQ Options */}
              {formData.questionType === 'mcq' && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <label className="block text-sm font-medium text-gray-700">
                      Options *
                    </label>
                    <span className="text-sm text-gray-500">{formData.options.length} options</span>
                  </div>

                  {/* Existing Options */}
                  <div className="space-y-2">
                    {formData.options.map((opt: any, idx: number) => (
                      <div key={idx} className="flex items-center gap-2 p-3 border border-gray-200 rounded-lg">
                        <input
                          type="radio"
                          name="correctAnswer"
                          checked={formData.correctAnswer === opt.id}
                          onChange={() => setFormData({ ...formData, correctAnswer: opt.id })}
                          className="w-4 h-4 text-blue-600"
                        />
                        <span className="flex-1">{opt.text}</span>
                        {opt.isCorrect && (
                          <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">Correct</span>
                        )}
                        <button
                          onClick={() => handleRemoveOption(idx)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Add New Option */}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newOption.text}
                      onChange={(e) => setNewOption({ ...newOption, text: e.target.value })}
                      placeholder="Option text"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      onKeyPress={(e) => e.key === 'Enter' && handleAddOption()}
                    />
                    <label className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg">
                      <input
                        type="checkbox"
                        checked={newOption.isCorrect}
                        onChange={(e) => setNewOption({ ...newOption, isCorrect: e.target.checked })}
                      />
                      <span className="text-sm">Correct</span>
                    </label>
                    <button
                      onClick={handleAddOption}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              )}

              {/* Written Answer Fields */}
              {formData.questionType === 'written' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Expected Answer (for reference)
                    </label>
                    <textarea
                      value={formData.expectedAnswer}
                      onChange={(e) => setFormData({ ...formData, expectedAnswer: e.target.value })}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Sample answer for evaluators..."
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Minimum Words
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={formData.minWords || ''}
                        onChange={(e) => setFormData({ ...formData, minWords: parseInt(e.target.value) || undefined })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Maximum Words
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={formData.maxWords || ''}
                        onChange={(e) => setFormData({ ...formData, maxWords: parseInt(e.target.value) || undefined })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  {/* Evaluation Criteria */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Evaluation Criteria
                    </label>
                    <div className="space-y-2 mb-2">
                      {formData.evaluationCriteria.map((criterion: any, idx: number) => (
                        <div key={idx} className="flex items-center gap-2 p-2 border border-gray-200 rounded-lg">
                          <span className="flex-1 text-sm">
                            <strong>{criterion.keyword}</strong> - {criterion.points} points
                            {criterion.description && `: ${criterion.description}`}
                          </span>
                          <button
                            onClick={() => handleRemoveCriterion(idx)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newCriterion.keyword}
                        onChange={(e) => setNewCriterion({ ...newCriterion, keyword: e.target.value })}
                        placeholder="Keyword"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <input
                        type="number"
                        min="0"
                        value={newCriterion.points}
                        onChange={(e) => setNewCriterion({ ...newCriterion, points: parseInt(e.target.value) || 0 })}
                        placeholder="Points"
                        className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <button
                        onClick={handleAddCriterion}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                      >
                        <Plus className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Video Submission Fields */}
              {formData.questionType === 'video' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Video URL (optional - for reference)
                    </label>
                    <input
                      type="url"
                      value={formData.videoUrl}
                      onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="https://example.com/video.mp4"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Expected Duration (seconds)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formData.videoDuration || ''}
                      onChange={(e) => setFormData({ ...formData, videoDuration: parseInt(e.target.value) || undefined })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Prompt for Students
                    </label>
                    <textarea
                      value={formData.prompt}
                      onChange={(e) => setFormData({ ...formData, prompt: e.target.value })}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="What should students demonstrate in the video?"
                    />
                  </div>
                </div>
              )}

              {/* Explanation (for MCQ) */}
              {formData.questionType === 'mcq' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Explanation (shown after submission)
                  </label>
                  <textarea
                    value={formData.explanation}
                    onChange={(e) => setFormData({ ...formData, explanation: e.target.value })}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Explain why this answer is correct..."
                  />
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-2 mt-6 pt-6 border-t border-gray-200">
              <button
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Save Question
              </button>
            </div>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}
