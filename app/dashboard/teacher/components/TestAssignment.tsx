'use client';

import { useState, useEffect } from 'react';
import { Dialog } from '@headlessui/react';
import { X, Users, CheckCircle } from 'lucide-react';

interface TestAssignmentProps {
  testId: string;
  onClose: () => void;
  onSuccess: () => void;
}

interface Student {
  id: string;
  uniqueId: string;
  fullName: string;
  classGrade: string;
  email?: string;
}

export default function TestAssignment({ testId, onClose, onSuccess }: TestAssignmentProps) {
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [selectedClasses, setSelectedClasses] = useState<string[]>([]);
  const [assignmentType, setAssignmentType] = useState<'individual' | 'class' | 'all_students'>('individual');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/teacher/students');
      const data = await response.json();

      if (data.success && data.students) {
        setStudents(data.students);
      }
    } catch (err) {
      console.error('Error fetching students:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStudent = (studentId: string) => {
    if (selectedStudents.includes(studentId)) {
      setSelectedStudents(selectedStudents.filter(id => id !== studentId));
    } else {
      setSelectedStudents([...selectedStudents, studentId]);
    }
  };

  const handleToggleClass = (classGrade: string) => {
    if (selectedClasses.includes(classGrade)) {
      setSelectedClasses(selectedClasses.filter(c => c !== classGrade));
    } else {
      setSelectedClasses([...selectedClasses, classGrade]);
    }
  };

  const getUniqueClasses = () => {
    const classes = new Set(students.map(s => s.classGrade));
    return Array.from(classes).sort();
  };

  const handleSubmit = async () => {
    if (assignmentType === 'individual' && selectedStudents.length === 0) {
      setError('Please select at least one student');
      return;
    }

    if (assignmentType === 'class' && selectedClasses.length === 0) {
      setError('Please select at least one class');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const response = await fetch(`/api/tests/${testId}/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assignmentType,
          studentIds: assignmentType === 'individual' ? selectedStudents : undefined,
          classGrades: assignmentType === 'class' ? selectedClasses : undefined
        })
      });

      const data = await response.json();
      if (data.success) {
        onSuccess();
      } else {
        setError(data.error || 'Failed to assign test');
      }
    } catch (err) {
      setError('Error assigning test');
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
        <Dialog.Panel className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <Dialog.Title className="text-2xl font-bold">Assign Test</Dialog.Title>
              <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-800 rounded-lg">
                {error}
              </div>
            )}

            <div className="space-y-6">
              {/* Assignment Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Assignment Type
                </label>
                <select
                  value={assignmentType}
                  onChange={(e) => setAssignmentType(e.target.value as any)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="individual">Individual Students</option>
                  <option value="class">By Class</option>
                  <option value="all_students">All Students</option>
                </select>
              </div>

              {/* Individual Student Selection */}
              {assignmentType === 'individual' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Students ({selectedStudents.length} selected)
                  </label>
                  <div className="border border-gray-300 rounded-lg max-h-64 overflow-y-auto">
                    {students.map((student) => (
                      <label
                        key={student.id}
                        className="flex items-center gap-3 p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                      >
                        <input
                          type="checkbox"
                          checked={selectedStudents.includes(student.uniqueId || student.id)}
                          onChange={() => handleToggleStudent(student.uniqueId || student.id)}
                          className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                        />
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">{student.fullName}</div>
                          <div className="text-sm text-gray-500">{student.classGrade}</div>
                        </div>
                        {selectedStudents.includes(student.uniqueId || student.id) && (
                          <CheckCircle className="w-5 h-5 text-green-600" />
                        )}
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Class Selection */}
              {assignmentType === 'class' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Classes ({selectedClasses.length} selected)
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {getUniqueClasses().map((classGrade) => (
                      <label
                        key={classGrade}
                        className="flex items-center gap-2 p-3 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={selectedClasses.includes(classGrade)}
                          onChange={() => handleToggleClass(classGrade)}
                          className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                        />
                        <span className="font-medium">{classGrade}</span>
                        <span className="text-sm text-gray-500 ml-auto">
                          ({students.filter(s => s.classGrade === classGrade).length} students)
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* All Students */}
              {assignmentType === 'all_students' && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center gap-2 text-blue-800">
                    <Users className="w-5 h-5" />
                    <span className="font-medium">All {students.length} students will be assigned this test</span>
                  </div>
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
                onClick={handleSubmit}
                disabled={saving}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? 'Assigning...' : 'Assign Test'}
              </button>
            </div>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}
