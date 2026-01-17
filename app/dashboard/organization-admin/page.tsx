'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useWindowSize } from '@/lib/hooks/useWindowSize';
import Sidebar from '../student/components/Sidebar';
import Link from 'next/link';
import Image from 'next/image';
import { Dialog } from '@headlessui/react';
import { saveAs } from 'file-saver';
import { motion, AnimatePresence } from 'framer-motion';
import { TypewriterText, StaggeredText, GradientText, CharacterAnimation } from '../../components/TextAnimations';
import { TiltCard, MagneticButton } from '../../components/InteractiveElements';
import { StaggerContainer, StaggerItem } from '../../components/PageTransitions';
import { ScrollFade, ScrollCounter, ParallaxScroll, ScrollProgress } from '../../components/ScrollAnimations';
import VantaBackground from '../../components/VantaBackground';
import ConsistentLoadingPage from '../../components/ConsistentLoadingPage';
import ReportsCenter from './components/ReportsCenter';
import NotificationCenter from '../../components/NotificationCenter';

interface Branch {
  _id: string;
  branchName: string;
  branchCode: string;
  address: string;
  city: string;
  state: string;
  phoneNumber: string;
  email: string;
  principalName: string;
  principalEmail: string;
  isActive: boolean;
  createdAt: string;
}

interface Teacher {
  id: string;
  fullName: string;
  email: string;
  subjectSpecialization: string;
  experienceYears: number;
  schoolName: string;
  isActive: boolean;
  createdAt: string;
}

interface Student {
  id: string;
  userId: string;
  fullName: string;
  email: string;
  password?: string; // Include password for credential display
  classGrade: string;
  schoolName: string;
  uniqueId: string;
  onboardingCompleted: boolean;
  isActive?: boolean; // Account active status
  joinedAt: string;
  totalModulesCompleted: number;
  totalXpEarned: number;
  learningStreak: number;
  badgesEarned: number;
  assessmentCompleted: boolean;
  diagnosticCompleted: boolean;
  diagnosticScore: number;
  createdBy?: {
    type?: 'teacher' | 'organization' | 'self';
    id?: string;
    name?: string;
  } | null;
  managedBy?: {
    type?: 'teacher' | 'organization' | 'self';
    id?: string;
    name?: string;
  } | null;
  teacherId?: string | null;
}

interface DashboardStats {
  totalBranches: number;
  totalTeachers: number;
  totalStudents: number;
  activeStudents: number;
  pendingStudents: number;
  studentsWithAssessments: number;
  studentsWithDiagnostic: number;
  assessmentCompletionRate: number;
  diagnosticCompletionRate: number;
  pendingInvitations: number;
}

// Module Management Interface Component
interface Module {
  _id: string;
  moduleId: string;
  title: string;
  subject: string;
  grade: string;
  difficulty: string;
  duration: number;
  points: number;
  description: string;
  content: string;
  learningObjectives: string[];
  prerequisites: string[];
  tags: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  completionStats?: {
    totalAttempts: number;
    completedAttempts: number;
    completionRate: number;
    avgScore: number;
  };
}

interface ModuleManagementState {
  modules: Module[];
  loading: boolean;
  searchTerm: string;
  subjectFilter: string;
  gradeFilter: string;
  difficultyFilter: string;
  statusFilter: string;
  currentPage: number;
  totalPages: number;
  selectedModules: string[];
  showCreateModal: boolean;
  showEditModal: boolean;
  editingModule: Module | null;
  showBulkActions: boolean;
}

function ModuleManagementInterface() {
  const [state, setState] = useState<ModuleManagementState>({
    modules: [],
    loading: true,
    searchTerm: '',
    subjectFilter: 'all',
    gradeFilter: 'all',
    difficultyFilter: 'all',
    statusFilter: 'all',
    currentPage: 1,
    totalPages: 1,
    selectedModules: [],
    showCreateModal: false,
    showEditModal: false,
    editingModule: null,
    showBulkActions: false
  });

  const [newModule, setNewModule] = useState({
    title: '',
    subject: '',
    grade: '',
    difficulty: '',
    duration: 30,
    points: 100,
    description: '',
    content: '',
    learningObjectives: [] as string[],
    prerequisites: [] as string[],
    tags: [] as string[],
    isActive: true
  });

  const [stats, setStats] = useState({
    totalModules: 0,
    activeModules: 0,
    totalPoints: 0,
    avgDuration: 0,
    subjectBreakdown: {} as Record<string, number>,
    gradeBreakdown: {} as Record<string, number>,
    difficultyBreakdown: {} as Record<string, number>
  });

  // Fetch modules data
  const fetchModules = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true }));
    try {
      const params = new URLSearchParams({
        page: state.currentPage.toString(),
        limit: '10',
        ...(state.subjectFilter !== 'all' && { subject: state.subjectFilter }),
        ...(state.gradeFilter !== 'all' && { grade: state.gradeFilter }),
        ...(state.difficultyFilter !== 'all' && { difficulty: state.difficultyFilter }),
        ...(state.statusFilter !== 'all' && { status: state.statusFilter })
      });

      const response = await fetch(`/api/admin/modules?${params}`);
      if (response.ok) {
        const data = await response.json();
        setState(prev => ({
          ...prev,
          modules: data.modules || [],
          totalPages: data.pagination.pages,
          loading: false
        }));
        setStats({
          totalModules: data.statistics.totalModules,
          activeModules: data.statistics.activeModules,
          totalPoints: data.statistics.totalPoints,
          avgDuration: data.statistics.avgDuration,
          subjectBreakdown: data.statistics.subjectBreakdown,
          gradeBreakdown: data.statistics.gradeBreakdown,
          difficultyBreakdown: data.statistics.difficultyBreakdown
        });
      }
    } catch (error) {
      console.error('Error fetching modules:', error);
      setState(prev => ({ ...prev, loading: false }));
    }
  }, [state.currentPage, state.subjectFilter, state.gradeFilter, state.difficultyFilter, state.statusFilter]);

  useEffect(() => {
    fetchModules();
  }, [fetchModules]);

  // Handle module actions
  const handleModuleAction = async (moduleId: string, action: string, data?: any) => {
    try {
      const response = await fetch('/api/admin/modules', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ moduleId, action, data })
      });

      if (response.ok) {
        await fetchModules(); // Refresh the list
        return true;
      }
    } catch (error) {
      console.error('Error performing module action:', error);
    }
    return false;
  };

  const handleDeleteModule = async (moduleId: string) => {
    if (confirm('Are you sure you want to delete this module? This action cannot be undone.')) {
      try {
        const response = await fetch(`/api/admin/modules?moduleId=${moduleId}`, {
          method: 'DELETE'
        });

        if (response.ok) {
          await fetchModules();
        }
      } catch (error) {
        console.error('Error deleting module:', error);
      }
    }
  };

  const handleCreateModule = async () => {
    try {
      const response = await fetch('/api/admin/modules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newModule)
      });

      if (response.ok) {
        setState(prev => ({ ...prev, showCreateModal: false }));
        setNewModule({
          title: '',
          subject: '',
          grade: '',
          difficulty: '',
          duration: 30,
          points: 100,
          description: '',
          content: '',
          learningObjectives: [],
          prerequisites: [],
          tags: [],
          isActive: true
        });
        await fetchModules();
      }
    } catch (error) {
      console.error('Error creating module:', error);
    }
  };

  const filteredModules = (state.modules || []).filter(module => 
    module.title.toLowerCase().includes(state.searchTerm.toLowerCase()) ||
    module.description.toLowerCase().includes(state.searchTerm.toLowerCase()) ||
    module.subject.toLowerCase().includes(state.searchTerm.toLowerCase())
  );

  const subjects = ['Mathematics', 'Science', 'English', 'History', 'Geography', 'Computer Science', 'Art', 'Music', 'Physical Education'];
  const grades = ['Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6', 'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12'];
  const difficulties = ['Beginner', 'Intermediate', 'Advanced', 'Expert'];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="space-y-6"
    >
      {/* Header Section */}
      <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-white/20">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Content Management</h2>
            <p className="text-gray-600 mt-1">Create, edit, and manage learning modules for your organization</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setState(prev => ({ ...prev, showBulkActions: !prev.showBulkActions }))}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Bulk Actions
            </button>
            <button
              onClick={() => setState(prev => ({ ...prev, showCreateModal: true }))}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              Create Module
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
            <div className="text-2xl font-bold text-blue-600">{stats.totalModules}</div>
            <div className="text-sm text-blue-700">Total Modules</div>
          </div>
          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
            <div className="text-2xl font-bold text-green-600">{stats.activeModules}</div>
            <div className="text-sm text-green-700">Active Modules</div>
          </div>
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 border border-purple-200">
            <div className="text-2xl font-bold text-purple-600">{stats.totalPoints}</div>
            <div className="text-sm text-purple-700">Total Points</div>
          </div>
          <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-4 border border-orange-200">
            <div className="text-2xl font-bold text-orange-600">{Math.round(stats.avgDuration)}</div>
            <div className="text-sm text-orange-700">Avg Duration (min)</div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <div className="md:col-span-2">
            <input
              type="text"
              placeholder="Search modules by title, description, or subject..."
              value={state.searchTerm}
              onChange={(e) => setState(prev => ({ ...prev, searchTerm: e.target.value }))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white text-gray-900 autofill:bg-white autofill:text-gray-900"
              style={{ backgroundColor: 'white' }}
            />
          </div>
          <select
            value={state.subjectFilter}
            onChange={(e) => setState(prev => ({ ...prev, subjectFilter: e.target.value, currentPage: 1 }))}
            className="px-4 py-3 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 text-gray-900"
          >
            <option value="all">All Subjects</option>
            {(subjects || []).map(subject => (
              <option key={subject} value={subject}>{subject}</option>
            ))}
          </select>
          <select
            value={state.gradeFilter}
            onChange={(e) => setState(prev => ({ ...prev, gradeFilter: e.target.value, currentPage: 1 }))}
            className="px-4 py-3 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 text-gray-900"
          >
            <option value="all">All Grades</option>
            {(grades || []).map(grade => (
              <option key={grade} value={grade}>{grade}</option>
            ))}
          </select>
          <select
            value={state.difficultyFilter}
            onChange={(e) => setState(prev => ({ ...prev, difficultyFilter: e.target.value, currentPage: 1 }))}
            className="px-4 py-3 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 text-gray-900"
          >
            <option value="all">All Levels</option>
            {(difficulties || []).map(difficulty => (
              <option key={difficulty} value={difficulty}>{difficulty}</option>
            ))}
          </select>
        </div>

        {/* Bulk Actions */}
        {state.showBulkActions && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-gray-50 rounded-lg p-4 mb-6 border border-gray-200"
          >
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-gray-700">
                {state.selectedModules.length} modules selected
              </span>
              <div className="flex gap-2">
                <button className="px-3 py-1 bg-blue-100 text-blue-700 rounded text-sm hover:bg-blue-200">
                  Export
                </button>
                <button className="px-3 py-1 bg-green-100 text-green-700 rounded text-sm hover:bg-green-200">
                  Activate
                </button>
                <button className="px-3 py-1 bg-red-100 text-red-700 rounded text-sm hover:bg-red-200">
                  Deactivate
                </button>
                <button className="px-3 py-1 bg-purple-100 text-purple-700 rounded text-sm hover:bg-purple-200">
                  Duplicate
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Modules Table */}
      <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-white/20 overflow-hidden">
        {state.loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
            <p className="text-gray-500 mt-2">Loading modules...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <input
                      type="checkbox"
                      className="rounded border-gray-300"
                      onChange={(e) => {
                        if (e.target.checked) {
                          setState(prev => ({ ...prev, selectedModules: filteredModules.map(m => m._id) }));
                        } else {
                          setState(prev => ({ ...prev, selectedModules: [] }));
                        }
                      }}
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Module</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subject</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Grade</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Difficulty</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Performance</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {(filteredModules || []).map((module) => (
                  <tr key={module._id || Math.random()}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        className="rounded border-gray-300"
                        checked={state.selectedModules.includes(module._id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setState(prev => ({ ...prev, selectedModules: [...prev.selectedModules, module._id] }));
                          } else {
                            setState(prev => ({ ...prev, selectedModules: prev.selectedModules.filter(id => id !== module._id) }));
                          }
                        }}
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{module.title}</div>
                        <div className="text-sm text-gray-500">{module.points} points • {module.duration} min</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                        {module.subject}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {module.grade}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        module.difficulty === 'Beginner' ? 'bg-green-100 text-green-800' :
                        module.difficulty === 'Intermediate' ? 'bg-yellow-100 text-yellow-800' :
                        module.difficulty === 'Advanced' ? 'bg-orange-100 text-orange-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {module.difficulty}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        module.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {module.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {module.completionStats ? (
                        <div>
                          <div>{module.completionStats.completionRate}% completion</div>
                          <div className="text-xs text-gray-500">{module.completionStats.totalAttempts} attempts</div>
                        </div>
                      ) : (
                        <span className="text-gray-400">No data</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex gap-2">
                        <button
                          onClick={() => setState(prev => ({ ...prev, showEditModal: true, editingModule: module }))}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleModuleAction(module.moduleId, module.isActive ? 'deactivate' : 'activate')}
                          className="text-green-600 hover:text-green-900"
                        >
                          {module.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                        <button
                          onClick={() => handleModuleAction(module.moduleId, 'duplicate')}
                          className="text-purple-600 hover:text-purple-900"
                        >
                          Duplicate
                        </button>
                        <button
                          onClick={() => handleDeleteModule(module.moduleId)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {state.totalPages > 1 && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => setState(prev => ({ ...prev, currentPage: Math.max(1, prev.currentPage - 1) }))}
                disabled={state.currentPage === 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() => setState(prev => ({ ...prev, currentPage: Math.min(prev.totalPages, prev.currentPage + 1) }))}
                disabled={state.currentPage === state.totalPages}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing page <span className="font-medium">{state.currentPage}</span> of{' '}
                  <span className="font-medium">{state.totalPages}</span>
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                  <button
                    onClick={() => setState(prev => ({ ...prev, currentPage: Math.max(1, prev.currentPage - 1) }))}
                    disabled={state.currentPage === 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setState(prev => ({ ...prev, currentPage: Math.min(prev.totalPages, prev.currentPage + 1) }))}
                    disabled={state.currentPage === state.totalPages}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Next
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Create Module Modal */}
      {state.showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto my-8 scroll-smooth">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Create New Module</h3>
            </div>
            <div className="p-6 space-y-4 pb-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-2">Title</label>
                  <input
                    type="text"
                    value={newModule.title}
                    onChange={(e) => setNewModule(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 placeholder-gray-400 text-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-2">Subject</label>
                  <select
                    value={newModule.subject}
                    onChange={(e) => setNewModule(prev => ({ ...prev, subject: e.target.value }))}
                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 placeholder-gray-400 text-gray-900"
                  >
                    <option value="">Select Subject</option>
                    {(subjects || []).map(subject => (
                      <option key={subject} value={subject}>{subject}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-2">Grade</label>
                  <select
                    value={newModule.grade}
                    onChange={(e) => setNewModule(prev => ({ ...prev, grade: e.target.value }))}
                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 placeholder-gray-400 text-gray-900"
                  >
                    <option value="">Select Grade</option>
                    {(grades || []).map(grade => (
                      <option key={grade} value={grade}>{grade}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-2">Difficulty</label>
                  <select
                    value={newModule.difficulty}
                    onChange={(e) => setNewModule(prev => ({ ...prev, difficulty: e.target.value }))}
                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 placeholder-gray-400 text-gray-900"
                  >
                    <option value="">Select Difficulty</option>
                    {(difficulties || []).map(difficulty => (
                      <option key={difficulty} value={difficulty}>{difficulty}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-2">Duration (minutes)</label>
                  <input
                    type="number"
                    value={newModule.duration}
                    onChange={(e) => setNewModule(prev => ({ ...prev, duration: parseInt(e.target.value) || 30 }))}
                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 placeholder-gray-400 text-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-2">Points</label>
                  <input
                    type="number"
                    value={newModule.points}
                    onChange={(e) => setNewModule(prev => ({ ...prev, points: parseInt(e.target.value) || 100 }))}
                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 placeholder-gray-400 text-gray-900"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">Description</label>
                <textarea
                  value={newModule.description}
                  onChange={(e) => setNewModule(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 placeholder-gray-400 text-gray-900"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">Content</label>
                <textarea
                  value={newModule.content}
                  onChange={(e) => setNewModule(prev => ({ ...prev, content: e.target.value }))}
                  rows={6}
                  className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 placeholder-gray-400 text-gray-900"
                  placeholder="Enter the module content here..."
                />
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={newModule.isActive}
                  onChange={(e) => setNewModule(prev => ({ ...prev, isActive: e.target.checked }))}
                  className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                />
                <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900">
                  Active (available to students)
                </label>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex gap-3">
              <button
                onClick={() => setState(prev => ({ ...prev, showCreateModal: false }))}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateModule}
                className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                Create Module
              </button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}

export default function OrganizationAdminDashboard() {
  const [user, setUser] = useState<any>(null);
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [showBranchForm, setShowBranchForm] = useState(false);
  const [showTeacherInviteForm, setShowTeacherInviteForm] = useState(false);
  const [branchFormData, setBranchFormData] = useState({
    branchName: '',
    branchCode: '',
    address: '',
    city: '',
    state: '',
    country: 'India',
    phoneNumber: '',
    email: '',
    principalName: '',
    principalEmail: '',
    principalPhone: ''
  });
  const [teacherInviteData, setTeacherInviteData] = useState({
    email: '',
    name: '',
    branchId: '',
    subjectSpecialization: '',
    experienceYears: '',
    qualification: '',
    gradeLevels: [] as string[],
    subjects: [] as string[]
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showStudentForm, setShowStudentForm] = useState(false);
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [newCredentials, setNewCredentials] = useState<any>(null);
  const [newStudentCredentials, setNewStudentCredentials] = useState<Student | null>(null);
  const [allStudentCredentials, setAllStudentCredentials] = useState<Student[]>([]);
  const [showRemoveConfirmModal, setShowRemoveConfirmModal] = useState(false);
  const [teacherToRemove, setTeacherToRemove] = useState<any>(null);
  const [showDeleteStudentModal, setShowDeleteStudentModal] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState<Student | null>(null);
  const [showStudentDetailsModal, setShowStudentDetailsModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [studentPerformanceData, setStudentPerformanceData] = useState<any>(null);
  const [performanceLoading, setPerformanceLoading] = useState(false);
  const [performanceError, setPerformanceError] = useState<string | null>(null);
  const [bulkImportData, setBulkImportData] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [userAvatar, setUserAvatar] = useState('/avatars/Group-1.svg');
  const [notifications, setNotifications] = useState<any[]>([]);
  const notificationRef = useRef<HTMLDivElement>(null);
  const [branchesLoading, setBranchesLoading] = useState(false);
  const [showQuickBranchForm, setShowQuickBranchForm] = useState(false);
  const [quickBranchData, setQuickBranchData] = useState({
    branchName: '',
    branchCode: '',
    city: '',
    state: '',
    principalName: '',
    principalEmail: ''
  });
  const [organizationSettings, setOrganizationSettings] = useState({
    name: '',
    type: 'school',
    description: '',
    contactEmail: '',
    contactPhone: '',
    website: '',
    address: '',
    city: '',
    state: '',
    country: 'India',
    twoFactorAuth: false,
    sessionTimeout: 60,
    passwordPolicy: true,
    emailNotifications: true,
    newUserNotifications: true,
    systemUpdateNotifications: true,
    googleWorkspace: false,
    microsoft365: false,
    slack: false,
    apiAccess: false
  });
  const [userSettings, setUserSettings] = useState({
    name: '',
    email: '',
    role: ''
  });
  const [settingsLoading, setSettingsLoading] = useState(false);
  const router = useRouter();
  const { width: windowWidth } = useWindowSize();
  const isMobile = windowWidth < 768;
  const logoutTriggered = useRef(false);

  // Fetch organization and user settings
  const fetchSettings = async () => {
    try {
      setSettingsLoading(true);
      const response = await fetch('/api/organization/settings', {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        
        // Update organization settings
        setOrganizationSettings(prev => ({
          ...prev,
          name: data.organization.name || '',
          type: data.organization.type || 'school',
          description: data.organization.description || '',
          contactEmail: data.organization.contactEmail || '',
          contactPhone: data.organization.contactPhone || '',
          website: data.organization.website || '',
          address: data.organization.address || '',
          city: data.organization.city || '',
          state: data.organization.state || '',
          country: data.organization.country || 'India'
        }));
        
        // Update user settings
        setUserSettings({
          name: data.user.name || '',
          email: data.user.email || '',
          role: data.user.role || ''
        });
      } else {
        console.error('Failed to fetch settings:', response.statusText);
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setSettingsLoading(false);
    }
  };

  // Fetch settings when settings tab is activated
  useEffect(() => {
    if (activeTab === 'settings') {
      fetchSettings();
    }
  }, [activeTab]);

  // Fetch students when users tab is activated
  useEffect(() => {
    if (activeTab === 'users') {
      fetchStudents();
    }
  }, [activeTab]);

  // Handle logout
  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
    } catch (error) {
      console.error('Logout error:', error);
      // Still redirect to login even if logout API fails
      router.push('/login');
    }
  };

  // Fix React Hook dependency - handle logout tab change
  useEffect(() => {
    if (activeTab === 'logout' && !logoutTriggered.current) {
      logoutTriggered.current = true;
      handleLogout();
    }
    if (activeTab !== 'logout') {
      logoutTriggered.current = false;
    }
  }, [activeTab]);

  // Save organization and user settings
  const saveSettings = async () => {
    try {
      setSettingsLoading(true);
      const response = await fetch('/api/organization/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          // Organization settings
          name: organizationSettings.name,
          type: organizationSettings.type,
          description: organizationSettings.description,
          contactEmail: organizationSettings.contactEmail,
          contactPhone: organizationSettings.contactPhone,
          website: organizationSettings.website,
          address: organizationSettings.address,
          city: organizationSettings.city,
          state: organizationSettings.state,
          country: organizationSettings.country,
          // User settings
          userName: userSettings.name,
          userEmail: userSettings.email
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('Settings saved successfully:', data);
        alert('Settings saved successfully!');
      } else {
        console.error('Failed to save settings:', response.statusText);
        alert('Failed to save settings. Please try again.');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Error saving settings. Please try again.');
    } finally {
      setSettingsLoading(false);
    }
  };

  // Avatar utility functions
  const AVAILABLE_AVATARS = [
    '/avatars/Group.svg',
    '/avatars/Group-1.svg',
    '/avatars/Group-2.svg',
    '/avatars/Group-3.svg',
    '/avatars/Group-4.svg',
    '/avatars/Group-5.svg',
    '/avatars/Group-6.svg',
    '/avatars/Group-7.svg',
    '/avatars/Group-8.svg'
  ];

  function getRandomAvatar(userId?: string): string {
    if (!userId) return AVAILABLE_AVATARS[0];
    
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      const char = userId.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    const randomIndex = Math.abs(hash) % AVAILABLE_AVATARS.length;
    return AVAILABLE_AVATARS[randomIndex];
  }

  // Organization Admin navigation items
  const navItems = [
    { id: 'overview', label: 'Overview', icon: '/icons/overview.png' },
    { id: 'users', label: 'Users', icon: '/icons/profile.png' },
    { id: 'content', label: 'Content Management', icon: '/icons/modules.png' },
    { id: 'branches', label: 'Branches', icon: '/icons/rewards.png' },
    { id: 'teachers', label: 'Teachers', icon: '/icons/teacher.png' },
    { id: 'reports', label: 'Reports', icon: '/icons/report.png' },
    { id: 'analytics', label: 'Analytics', icon: '/icons/analytics.png' },
    { id: 'audit-logs', label: 'Audit Logs', icon: '/icons/audit.png' },
    { id: 'announcements', label: 'Announcements', icon: '/icons/bot.png' },
    { id: 'settings', label: 'Settings', icon: '/icons/settings.png' },
  ];

  // Handle escape key to close modals
  useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (showQuickBranchForm) {
          setShowQuickBranchForm(false);
        }
        if (showRemoveConfirmModal) {
          setShowRemoveConfirmModal(false);
          setTeacherToRemove(null);
        }
      }
    };

    if (showQuickBranchForm || showRemoveConfirmModal) {
      document.addEventListener('keydown', handleEscapeKey);
      return () => document.removeEventListener('keydown', handleEscapeKey);
    }
  }, [showQuickBranchForm, showRemoveConfirmModal]);


  useEffect(() => {
    const fetchUserAndDashboard = async () => {
      try {
        const response = await fetch('/api/auth/me');
        if (response.ok) {
          const userData = await response.json();
          if (userData.user.role !== 'organization') {
            router.push('/login');
            return;
          }
          setUser(userData.user);
          
          // Load dashboard data (stats, teachers, branches)
          await loadDashboardData();
        } else {
          router.push('/login');
        }
      } catch (error) {
        console.error('Error fetching user:', error);
        router.push('/login');
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserAndDashboard();
  }, [router]);

  const handleBranchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/organization/branches', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(branchFormData),
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setBranches(prev => [data.branch, ...prev]);
        setShowBranchForm(false);
        setBranchFormData({
          branchName: '',
          branchCode: '',
          address: '',
          city: '',
          state: '',
          country: 'India',
          phoneNumber: '',
          email: '',
          principalName: '',
          principalEmail: '',
          principalPhone: ''
        });
        alert('Branch created successfully!');
        
        // Refresh only stats and teachers, not branches (to avoid overwriting the new branch)
        try {
          // Load dashboard statistics
          const statsResponse = await fetch('/api/organization/dashboard-stats', {
            credentials: 'include'
          });
          if (statsResponse.ok) {
            const statsData = await statsResponse.json();
            setDashboardStats(statsData);
          }
          
          // Load teachers
          const teachersResponse = await fetch('/api/organization/teachers', {
            credentials: 'include'
          });
          if (teachersResponse.ok) {
            const teachersData = await teachersResponse.json();
            setTeachers(teachersData.teachers || []);
          }
        } catch (error) {
          console.error('Error refreshing dashboard data:', error);
        }
      } else {
        const errorData = await response.json();
        alert(`Error: ${errorData.error}`);
      }
    } catch (error) {
      console.error('Error creating branch:', error);
      alert('Error creating branch');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickBranchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Create a complete branch data object with defaults
      const completeBranchData = {
        ...quickBranchData,
        address: `${quickBranchData.city}, ${quickBranchData.state}`,
        country: 'India',
        phoneNumber: '0000000000', // Default phone
        email: quickBranchData.principalEmail, // Use principal email as branch email
        principalPhone: '0000000000' // Default phone
      };

      const response = await fetch('/api/organization/branches', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(completeBranchData),
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setBranches(prev => [data.branch, ...prev]);
        setShowQuickBranchForm(false);
        setQuickBranchData({
          branchName: '',
          branchCode: '',
          city: '',
          state: '',
          principalName: '',
          principalEmail: ''
        });
        
        // Auto-select the newly created branch
        setTeacherInviteData(prev => ({ ...prev, branchId: data.branch._id }));
        
        // Refresh only stats and teachers, not branches (to avoid overwriting the new branch)
        try {
          // Load dashboard statistics
          const statsResponse = await fetch('/api/organization/dashboard-stats', {
            credentials: 'include'
          });
          if (statsResponse.ok) {
            const statsData = await statsResponse.json();
            setDashboardStats(statsData);
          }
          
          // Load teachers
          const teachersResponse = await fetch('/api/organization/teachers', {
            credentials: 'include'
          });
          if (teachersResponse.ok) {
            const teachersData = await teachersResponse.json();
            setTeachers(teachersData.teachers || []);
          }
        } catch (error) {
          console.error('Error refreshing dashboard data:', error);
        }
        
        alert('Branch created and selected successfully!');
      } else {
        const errorData = await response.json();
        alert(`Error: ${errorData.error}`);
      }
    } catch (error) {
      console.error('Error creating quick branch:', error);
      alert('Error creating branch');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Function to load dashboard data (similar to teacher dashboard)
  const unreadCount = notifications.filter((n: any) => !n.read).length;

  const handleNotificationClick = () => {
    setIsNotificationOpen(!isNotificationOpen);
  };

  const loadDashboardData = async () => {
    try {
      console.log('Loading dashboard data...');
      
      // Load dashboard statistics
      try {
        const statsResponse = await fetch('/api/organization/dashboard-stats', {
          credentials: 'include'
        });
        if (statsResponse.ok) {
          const statsData = await statsResponse.json();
          setDashboardStats(statsData);
        } else {
          console.error('Failed to load dashboard stats:', statsResponse.status);
        }
      } catch (error) {
        console.error('Error loading dashboard stats:', error);
      }
      
      // Load teachers
      try {
        const teachersResponse = await fetch('/api/organization/teachers', {
          credentials: 'include'
        });
        if (teachersResponse.ok) {
          const teachersData = await teachersResponse.json();
          console.log('Teachers fetched:', teachersData.teachers);
          setTeachers(teachersData.teachers || []);
        } else {
          console.error('Failed to load teachers:', teachersResponse.status);
        }
      } catch (error) {
        console.error('Error loading teachers:', error);
      }
      
      // Load branches
      try {
        const branchesResponse = await fetch('/api/organization/branches', {
          credentials: 'include'
        });
        if (branchesResponse.ok) {
          const branchesData = await branchesResponse.json();
          setBranches(branchesData.branches || []);
        } else {
          console.error('Failed to load branches:', branchesResponse.status);
        }
      } catch (error) {
        console.error('Error loading branches:', error);
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    }
  };

  // Fetch students from organization
  const fetchStudents = async () => {
    try {
      setStudentsLoading(true);
      const response = await fetch('/api/organization/students', {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setStudents(data.students || []);
      } else {
        console.error('Failed to load students:', response.status);
      }
    } catch (error) {
      console.error('Error loading students:', error);
    } finally {
      setStudentsLoading(false);
    }
  };

  const handleTeacherInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/organization/invite-teacher', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(teacherInviteData),
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setShowTeacherInviteForm(false);
        
        // Update teachers list immediately (like teacher dashboard does)
        if (data.teacher) {
          setTeachers(prev => [...prev, data.teacher]);
        }
        
        // Refresh only stats and branches, not teachers (to avoid overwriting the new teacher)
        try {
          // Load dashboard statistics
          const statsResponse = await fetch('/api/organization/dashboard-stats', {
            credentials: 'include'
          });
          if (statsResponse.ok) {
            const statsData = await statsResponse.json();
            setDashboardStats(statsData);
          }
          
          // Load branches
          const branchesResponse = await fetch('/api/organization/branches', {
            credentials: 'include'
          });
          if (branchesResponse.ok) {
            const branchesData = await branchesResponse.json();
            setBranches(branchesData.branches || []);
          }
        } catch (error) {
          console.error('Error refreshing dashboard data:', error);
        }
        
        // Show credentials if provided
        if (data.credentials) {
          // Display credentials in alert as primary method
          const credentialsText = `Teacher Created Successfully!

Name: ${data.credentials.name}
Email: ${data.credentials.email}
User ID: ${data.credentials.id}
Password: ${data.credentials.password}
Login URL: ${data.credentials.loginUrl}

Please share these credentials with the teacher. They can use this password permanently or change it later if desired.`;

          alert(credentialsText);
          
          // Also set modal state as backup
          setNewCredentials({
            type: 'teacher',
            name: data.credentials.name,
            email: data.credentials.email,
            id: data.credentials.id,
            password: data.credentials.password,
            loginUrl: data.credentials.loginUrl
          });
        }
        
        setTeacherInviteData({
          email: '',
          name: '',
          branchId: '',
          subjectSpecialization: '',
          experienceYears: '',
          qualification: '',
          gradeLevels: [],
          subjects: []
        });
      } else {
        const errorData = await response.json();
        alert(`Error: ${errorData.error}`);
      }
    } catch (error) {
      console.error('Error inviting teacher:', error);
      alert('Error inviting teacher');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleShowTeacherCredentials = async (teacherId: string) => {
    try {
      console.log('handleShowTeacherCredentials called with teacherId:', teacherId);
      const response = await fetch(`/api/organization/teacher-credentials?teacherId=${teacherId}`, {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        
        if (data.credentials) {
          console.log('Setting teacher credentials for display below table');
          setNewCredentials({
            type: 'teacher',
            name: data.credentials.name,
            email: data.credentials.email,
            id: data.credentials.id,
            password: data.credentials.password,
            loginUrl: data.credentials.loginUrl
          });
        } else {
          alert('No credentials found for this teacher');
        }
      } else {
        let errorData;
        try {
          errorData = await response.json();
        } catch (jsonError) {
          errorData = { error: 'Failed to parse error response' };
        }
        alert(`Error: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error fetching teacher credentials:', error);
      alert('Error fetching teacher credentials');
    }
  };

  const handleRemoveTeacher = (teacher: any) => {
    setTeacherToRemove(teacher);
    setShowRemoveConfirmModal(true);
  };

  const confirmRemoveTeacher = async () => {
    if (!teacherToRemove) return;

    try {
      console.log('Removing teacher:', teacherToRemove._id);
      const response = await fetch(`/api/organization/remove-teacher?teacherId=${teacherToRemove._id}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('Teacher removed successfully:', data);
        
        // Update the teachers list by removing the teacher
        setTeachers(prevTeachers => 
          prevTeachers.filter(teacher => teacher.id !== teacherToRemove.id)
        );
        
        // Update dashboard stats
        setDashboardStats(prevStats => 
          prevStats ? { ...prevStats, totalTeachers: prevStats.totalTeachers - 1 } : null
        );
        
        alert(`Teacher ${teacherToRemove.fullName} has been removed successfully`);
      } else {
        const errorData = await response.json();
        console.error('Error removing teacher:', errorData);
        alert(`Error: ${errorData.error}`);
      }
    } catch (error) {
      console.error('Error removing teacher:', error);
      alert('Error removing teacher');
    } finally {
      setShowRemoveConfirmModal(false);
      setTeacherToRemove(null);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      alert('Copied to clipboard!');
    } catch (err) {
      console.error('Failed to copy: ', err);
      alert('Failed to copy to clipboard');
    }
  };

  const handleShowStudentCredentials = async (studentId: string) => {
    try {
      console.log('Fetching credentials for student:', studentId);
      const response = await fetch(`/api/organization/student-credentials?studentId=${studentId}`, {
        credentials: 'include'
      });
      
      console.log('Response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Credentials data:', data);
        
        if (data.credentials) {
          console.log('Setting credentials for display below table');
          setNewStudentCredentials(data.credentials);
        } else {
          alert('No credentials found for this student');
        }
      } else {
        const errorData = await response.json();
        console.error('API Error:', errorData);
        alert(`Error: ${errorData.error || 'Failed to fetch credentials'}`);
      }
    } catch (error) {
      console.error('Error fetching student credentials:', error);
      alert('Error fetching student credentials');
    }
  };

  const handleDeleteStudent = (student: Student) => {
    setStudentToDelete(student);
    setShowDeleteStudentModal(true);
  };

  const confirmDeleteStudent = async () => {
    if (!studentToDelete) return;

    try {
      const response = await fetch(`/api/organization/students/${studentToDelete.id}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (response.ok) {
        // Remove student from list
        setStudents(prevStudents => 
          prevStudents.filter(student => student.id !== studentToDelete.id)
        );

        // Update dashboard stats
        setDashboardStats(prevStats => 
          prevStats ? { ...prevStats, totalStudents: prevStats.totalStudents - 1 } : null
        );

        alert(`Student ${studentToDelete.fullName} has been deleted successfully`);
        setShowDeleteStudentModal(false);
        setStudentToDelete(null);
      } else {
        const errorData = await response.json();
        alert(`Error: ${errorData.error || 'Failed to delete student'}`);
      }
    } catch (error) {
      console.error('Error deleting student:', error);
      alert('Error deleting student');
    }
  };

  const handleToggleStudentStatus = async (student: Student) => {
    try {
      const newStatus = !student.isActive;
      const response = await fetch(`/api/organization/students/${student.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ isActive: newStatus }),
        credentials: 'include'
      });

      if (response.ok) {
        // Update student in list
        setStudents(prevStudents => 
          prevStudents.map(s => 
            s.id === student.id ? { ...s, isActive: newStatus } : s
          )
        );

        alert(`Student ${student.fullName} has been ${newStatus ? 'enabled' : 'disabled'} successfully`);
      } else {
        const errorData = await response.json();
        alert(`Error: ${errorData.error || 'Failed to update student status'}`);
      }
    } catch (error) {
      console.error('Error toggling student status:', error);
      alert('Error updating student status');
    }
  };

  const handleViewStudentDetails = async (student: Student) => {
    setSelectedStudent(student);
    setShowStudentDetailsModal(true);
    setPerformanceLoading(true);
    setPerformanceError(null);
    setStudentPerformanceData(null);

    try {
      const response = await fetch(`/api/organization/students/${student.id}/performance`, {
        credentials: 'include'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch student performance');
      }

      const data = await response.json();
      setStudentPerformanceData(data);
    } catch (error) {
      console.error('Error fetching student performance:', error);
      setPerformanceError(error instanceof Error ? error.message : 'Failed to load student performance');
    } finally {
      setPerformanceLoading(false);
    }
  };

  const handleStudentSubmit = async (studentData: any) => {
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/organization/students', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: studentData.name,
          email: studentData.email,
          classGrade: studentData.classGrade,
          schoolName: studentData.schoolName
        }),
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setShowStudentForm(false);
        
        // Show credentials if provided
        if (data.student && data.student.password) {
          setNewStudentCredentials(data.student);
        }
        
        // Refresh students list
        fetchStudents();
      } else {
        const errorData = await response.json();
        alert(`Error: ${errorData.error}`);
      }
    } catch (error) {
      console.error('Error creating student:', error);
      alert('Error creating student');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBulkImport = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/teacher/bulk-import-students', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ csvData: bulkImportData }),
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setShowBulkImport(false);
        setBulkImportData('');
        alert(`Successfully imported ${data.importedCount} students!`);
        
        // Refresh students list
        fetchStudents();
      } else {
        const errorData = await response.json();
        alert(`Error: ${errorData.error}`);
      }
    } catch (error) {
      console.error('Error importing students:', error);
      alert('Error importing students');
    } finally {
      setIsSubmitting(false);
    }
  };

  const exportCredentials = async () => {
    try {
      const response = await fetch('/api/teacher/students/export-credentials', {
        credentials: 'include'
      });

      if (response.ok) {
        const blob = await response.blob();
        saveAs(blob, 'student-credentials.csv');
      } else {
        alert('Error exporting credentials');
      }
    } catch (error) {
      console.error('Error exporting credentials:', error);
      alert('Error exporting credentials');
    }
  };

  if (isLoading) {
    return (
      <ConsistentLoadingPage
        type="dashboard"
        title="Loading Organization Dashboard"
        subtitle="Setting up your organization management interface..."
        tips={[
          'Loading organization data',
          'Preparing user management tools',
          'Setting up analytics dashboard'
        ]}
      />
    );
  }

  return (
    <div 
      className="dashboard-container min-h-screen relative"
    >
      {/* Background Elements */}
      {/* Temporarily disabled for debugging */}
      {/* <VantaBackground>
        <ScrollProgress /> */}
      
      {/* Sidebar Component - Let it handle its own responsive behavior */}
      <Sidebar 
        activeTab={activeTab} 
        onTabChange={setActiveTab}
        isOpen={isSidebarOpen}
        onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
        navItems={navItems}
        role="admin"
      />
      
      {/* Main Content Area */}
      <div className={`dashboard-main relative min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 transition-all duration-300 ${
        isMobile ? (isSidebarOpen ? 'ml-0' : 'ml-0') : 'ml-20'
      }`}>
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%239C92AC%22%20fill-opacity%3D%220.05%22%3E%3Ccircle%20cx%3D%2230%22%20cy%3D%2230%22%20r%3D%222%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-40 pointer-events-none"></div>
        
        {/* Enhanced Top Bar */}
        <div className={`flex items-center justify-between w-full px-4 sm:px-6 py-3 sm:py-4 bg-white/80 backdrop-blur-md border-b border-gray-200/50 relative shadow-sm transition-all duration-300 ${isNotificationOpen ? 'blur-sm pointer-events-none' : ''}`}>
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 via-transparent to-blue-500/5 pointer-events-none" />
          
          {/* Animated Border */}
          <motion.div
            className="absolute bottom-0 left-4 h-0.5 bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500"
            initial={{ width: 0 }}
            animate={{ width: "calc(100% - 2rem)" }}
            transition={{ duration: 2, ease: "easeOut" }}
          />
          {/* Enhanced Search Bar - Hidden on mobile, shown on tablet+ */}
          <div className="hidden sm:flex flex-1 items-center max-w-md">
            <motion.div 
              className="relative w-full"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
              transition={{ duration: 0.2 }}
            >
              {/* Animated Background Gradient */}
              <motion.div
                className="absolute inset-0 rounded-2xl bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 opacity-20 blur-xl"
                animate={{
                  opacity: [0.15, 0.25, 0.15],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />
              
              {/* Search Icon */}
              <div className="absolute left-4 top-1/2 -translate-y-1/2 z-10 pointer-events-none">
                <svg 
                  className="w-5 h-5 text-purple-600" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && searchQuery.trim()) {
                    console.log('Searching for:', searchQuery);
                  }
                }}
                placeholder="Search branches, teachers, students..."
                className="relative w-full pl-11 pr-16 py-4 rounded-[135px] border-2 border-purple-200 bg-white/90 backdrop-blur-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-purple-500 focus:bg-white focus:ring-4 focus:ring-purple-200/50 transition-all duration-300 text-sm font-medium shadow-lg hover:shadow-xl hover:border-purple-300"
              />
              
              {/* Fun Decorative Elements */}
              <motion.div
                className="absolute right-4 top-1/2 transform -translate-y-1/2 flex items-center gap-1"
                initial={{ opacity: 0.5 }}
                whileHover={{ opacity: 1 }}
              >
                <span className="text-xs font-semibold text-purple-600 bg-purple-100 px-2 py-1 rounded-full">
                  Press Enter
                </span>
              </motion.div>
              
              {/* Animated Glow Effect */}
              <motion.div
                className="absolute inset-0 rounded-[135px] bg-gradient-to-r from-purple-400/30 via-pink-400/30 to-purple-400/30 opacity-0 pointer-events-none blur-md"
                animate={{
                  opacity: [0, 0.3, 0],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />
            </motion.div>
          </div>
          
          {/* Mobile: Logo and User Info */}
          <div className="flex sm:hidden items-center flex-1 justify-center ml-12">
            <span className="text-lg font-bold text-gray-800">Dashboard</span>
          </div>
          
          {/* User Actions */}
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Refresh Button */}
            <motion.button
              onClick={loadDashboardData}
              className="p-2 rounded-full bg-white border border-gray-200/50 hover:bg-gray-50 transition-all duration-200 shadow-sm"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              title="Refresh Data"
            >
              <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </motion.button>

            
             {/* Enhanced User Profile Section */}
             <div 
               className="bg-white/80 backdrop-blur-sm rounded-xl p-1.5 sm:p-3 shadow-lg border border-gray-200/50 flex items-center gap-1.5 sm:gap-3"
             >
               {/* Enhanced Notification Bell */}
               <div className="relative" ref={notificationRef}>
                 {/* Notification Center - Hidden button, controlled by bell icon */}
                 {user && (
                   <NotificationCenter
                     userId={user._id}
                     userRole={user.role || 'organization'}
                     className="pointer-events-none"
                     isOpen={isNotificationOpen}
                     onToggle={setIsNotificationOpen}
                     hideButton={true}
                   />
                 )}
                 <motion.button 
                  onClick={handleNotificationClick}
                   className="relative text-gray-900 hover:text-purple-600 transition-colors p-1 sm:p-2 rounded-full hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50 touch-manipulation group"
                   whileHover={{ scale: 1.1, rotate: [0, -10, 10, 0] }}
                   whileTap={{ scale: 0.95 }}
                   transition={{ duration: 0.2 }}
                >
                  <svg className="w-5 h-5 sm:w-6 sm:h-6" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect width="30.24" height="30.24" transform="translate(0.899902 1.38086)" fill="#F5F5F5"/>
                    <path d="M16.0204 3.90039C13.6812 3.90039 11.4378 4.82964 9.7837 6.48371C8.12963 8.13778 7.20039 10.3812 7.20039 12.7204V17.1657C7.20057 17.3611 7.15527 17.554 7.06809 17.7289L4.90467 22.0545C4.79899 22.2658 4.74908 22.5006 4.7597 22.7367C4.77032 22.9727 4.8411 23.2021 4.96533 23.4031C5.08956 23.6041 5.2631 23.77 5.46948 23.885C5.67586 24.0001 5.90823 24.0604 6.14451 24.0604H25.8963C26.1325 24.0604 26.3649 24.0001 26.5713 23.885C26.7777 23.77 26.9512 23.6041 27.0754 23.4031C27.1997 23.2021 27.2705 22.9727 27.2811 22.7367C27.2917 22.5006 27.2418 22.2658 27.1361 22.0545L24.9739 17.7289C24.8863 17.5541 24.8406 17.3612 24.8404 17.1657V12.7204C24.8404 10.3812 23.9111 8.13778 22.2571 6.48371C20.603 4.82964 18.3596 3.90039 16.0204 3.90039ZM16.0204 27.8404C15.2384 27.8408 14.4755 27.5987 13.8368 27.1473C13.1982 26.696 12.7153 26.0577 12.4546 25.3204H19.5862C19.3255 26.0577 18.8426 26.696 18.2039 27.1473C17.5653 27.5987 16.8024 27.8408 16.0204 27.8404Z" fill="#A5A5A5"/>
                    <circle cx="23.58" cy="6.27336" r="5.78118" fill="#FDBB30"/>
                    <path d="M21.8094 7.82227V7.15526L23.579 5.42054C23.7482 5.24964 23.8893 5.09782 24.0021 4.96508C24.1149 4.83234 24.1995 4.70375 24.2559 4.57931C24.3124 4.45487 24.3406 4.32213 24.3406 4.1811C24.3406 4.02015 24.3041 3.88244 24.2311 3.76795C24.158 3.6518 24.0577 3.56221 23.9299 3.49916C23.8021 3.43611 23.657 3.40458 23.4944 3.40458C23.3268 3.40458 23.1799 3.43942 23.0538 3.50911C22.9277 3.57714 22.8298 3.6742 22.7601 3.80031C22.6921 3.92641 22.6581 4.07657 22.6581 4.25078H21.7795C21.7795 3.92724 21.8534 3.646 22.0011 3.40707C22.1487 3.16814 22.352 2.98314 22.6108 2.85206C22.8713 2.72098 23.17 2.65544 23.5068 2.65544C23.8486 2.65544 24.1489 2.71932 24.4078 2.84708C24.6666 2.97484 24.8674 3.14989 25.0101 3.37223C25.1544 3.59456 25.2266 3.84842 25.2266 4.13381C25.2266 4.32462 25.1901 4.51211 25.1171 4.69629C25.0441 4.88046 24.9155 5.08454 24.7313 5.30854C24.5488 5.53254 24.2924 5.80382 23.9623 6.12239L23.0837 7.01588V7.05073H25.3037V7.82227H21.8094Z" fill="white"/>
                  </svg>
                   {/* Enhanced Notification count */}
                  {unreadCount > 0 && (
                     <motion.span 
                       className="absolute -top-1 -right-1 w-3.5 h-3.5 sm:w-5 sm:h-5 bg-gradient-to-r from-orange-500 to-red-500 text-white text-[10px] sm:text-xs rounded-full flex items-center justify-center font-medium shadow-lg"
                       animate={{ 
                         scale: [1, 1.2, 1],
                         rotate: [0, 5, -5, 0]
                       }}
                       transition={{ 
                         duration: 2, 
                         repeat: Infinity, 
                         ease: "easeInOut" 
                       }}
                     >
                      {unreadCount > 9 ? '9+' : unreadCount}
                     </motion.span>
                   )}
                   
                   {/* Pulsing Ring Effect */}
                   {unreadCount > 0 && (
                     <motion.div
                       className="absolute inset-0 rounded-full border-2 border-orange-400/50"
                       animate={{
                         scale: [1, 1.3, 1],
                         opacity: [0.8, 0, 0.8],
                       }}
                       transition={{
                         duration: 2,
                         repeat: Infinity,
                         ease: "easeInOut",
                       }}
                     />
                   )}
                 </motion.button>
               </div>
               {/* Enhanced Circular Avatar */}
               <div 
                 className="relative w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center shadow-lg transition-all duration-300"
               >
                <div className="w-full h-full bg-gradient-to-br from-green-600 to-green-700 flex items-center justify-center">
                  <span className="text-white text-sm sm:text-lg font-bold">OA</span>
                </div>
                 
                 {/* Online Status Indicator */}
                 <motion.div
                   className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 sm:w-3 sm:h-3 bg-green-500 rounded-full border-2 border-white"
                   animate={{ scale: [1, 1.2, 1] }}
                   transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                 />
               </div>
               
               {/* Enhanced User Info */}
              <div className="hidden sm:flex flex-col">
                 <span 
                   className="font-bold text-gray-900 text-sm"
                 >
                  {user?.name}
                 </span>
                 <span 
                   className="text-xs text-gray-600"
                 >
                  Organization Admin
                 </span>
              </div>
               
               {/* Hover Arrow */}
               <div
                 className="hidden sm:block ml-auto opacity-0 cursor-pointer"
                 onClick={() => setActiveTab('settings')}
               >
                 <svg className="w-4 h-4 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                 </svg>
               </div>
             </div>
          </div>
        </div>
                
        {/* Main Content with Responsive Layout */}
        <div className="dashboard-content">
          {/* Main Panel */}
          <main className="flex-1 overflow-y-auto">
            {/* Tab Content */}
            <div className="space-y-6 p-4 sm:p-6">
          {activeTab === 'overview' && (
            <>
              {/* Welcome Section */}
              <div className="mb-6">
                <div className="flex items-center justify-between">
                  {/* Left side: Avatar and welcome text */}
                  <div className="flex items-center gap-4">
                    <div 
                      className="relative w-16 h-16 sm:w-20 sm:h-20"
                    >
                      <div className="w-full h-full bg-gradient-to-br from-green-600 to-green-700 rounded-full flex items-center justify-center shadow-lg">
                        <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                  </div>
                      {/* Glow Effect */}
                      <div className="absolute inset-0 rounded-full bg-gradient-to-br from-green-500/30 to-green-600/30 blur-lg pointer-events-none"></div>
                    </div>
                    
                    <div>
                      <StaggeredText
                        text={`Welcome back, ${user?.name}!`}
                        className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-1"
                        delay={0.1}
                      />
                      
                      </div>
                      </div>
            
                  {/* Right side: Stats cards */}
                  <div className="flex gap-4">
                    {/* Branches Card */}
                    <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-6 shadow-sm border border-blue-200/50 min-w-[140px] min-h-[100px] flex flex-col justify-center">
                      <ScrollCounter
                        from={0}
                        to={dashboardStats?.totalBranches || 0}
                        duration={2}
                        className="text-3xl font-bold text-blue-600"
                      />
                      <div className="text-sm text-gray-900 font-medium">Total Branches</div>
                    </div>

                    {/* Teachers Card */}
                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 shadow-sm border border-green-200/50 min-w-[140px] min-h-[100px] flex flex-col justify-center">
                      <ScrollCounter
                        from={0}
                        to={dashboardStats?.totalTeachers || 0}
                        duration={2}
                        className="text-3xl font-bold text-green-600"
                      />
                      <div className="text-sm text-gray-900 font-medium">Total Teachers</div>
                    </div>

                    {/* Students Card */}
                    <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 shadow-sm border border-purple-200/50 min-w-[140px] min-h-[100px] flex flex-col justify-center">
                      <ScrollCounter
                        from={0}
                        to={dashboardStats?.totalStudents || 0}
                        duration={2}
                        className="text-3xl font-bold text-purple-600"
                      />
                      <div className="text-sm text-gray-900 font-medium">Total Students</div>
                    </div>

                    {/* Invitations Card */}
                    <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-xl p-6 shadow-sm border border-orange-200/50 min-w-[140px] min-h-[100px] flex flex-col justify-center">
                      <ScrollCounter
                        from={0}
                        to={dashboardStats?.pendingInvitations || 0}
                        duration={2}
                        className="text-3xl font-bold text-orange-600"
                      />
                      <div className="text-sm text-gray-900 font-medium">Pending Invitations</div>
                    </div>
                      </div>
                      </div>
                    </div>

                    {/* Additional Stats Section */}
                    <div className="mt-8">
                      <h3 className="text-xl font-semibold text-gray-900 mb-6">Student Progress Overview</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {/* Active Students */}
                        <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-xl p-6 shadow-sm border border-emerald-200/50">
                          <div className="flex items-center justify-between">
                            <div>
                              <ScrollCounter
                                from={0}
                                to={dashboardStats?.activeStudents || 0}
                                duration={2}
                                className="text-2xl font-bold text-emerald-600"
                              />
                              <div className="text-sm text-gray-600 font-medium">Active Students</div>
                              <div className="text-xs text-gray-500 mt-1">
                                {dashboardStats?.totalStudents ? Math.round(((dashboardStats?.activeStudents || 0) / dashboardStats.totalStudents) * 100) : 0}% of total
                              </div>
                            </div>
                            <div className="text-emerald-500">
                              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            </div>
                          </div>
                        </div>

                        {/* Pending Students */}
                        <div className="bg-gradient-to-br from-yellow-50 to-amber-50 rounded-xl p-6 shadow-sm border border-yellow-200/50">
                          <div className="flex items-center justify-between">
                            <div>
                              <ScrollCounter
                                from={0}
                                to={dashboardStats?.pendingStudents || 0}
                                duration={2}
                                className="text-2xl font-bold text-yellow-600"
                              />
                              <div className="text-sm text-gray-600 font-medium">Pending Onboarding</div>
                              <div className="text-xs text-gray-500 mt-1">
                                Need to complete setup
                              </div>
                            </div>
                            <div className="text-yellow-500">
                              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            </div>
                          </div>
                        </div>

                        {/* Assessment Completion */}
                        <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-xl p-6 shadow-sm border border-indigo-200/50">
                          <div className="flex items-center justify-between">
                            <div>
                              <ScrollCounter
                                from={0}
                                to={dashboardStats?.assessmentCompletionRate || 0}
                                duration={2}
                                className="text-2xl font-bold text-indigo-600"
                              />
                              <div className="text-sm text-gray-600 font-medium">Assessment Rate</div>
                              <div className="text-xs text-gray-500 mt-1">
                                {dashboardStats?.studentsWithAssessments || 0} completed
                              </div>
                            </div>
                            <div className="text-indigo-500">
                              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                              </svg>
                            </div>
                          </div>
                        </div>

                        {/* Diagnostic Completion */}
                        <div className="bg-gradient-to-br from-pink-50 to-rose-50 rounded-xl p-6 shadow-sm border border-pink-200/50">
                          <div className="flex items-center justify-between">
                            <div>
                              <ScrollCounter
                                from={0}
                                to={dashboardStats?.diagnosticCompletionRate || 0}
                                duration={2}
                                className="text-2xl font-bold text-pink-600"
                              />
                              <div className="text-sm text-gray-600 font-medium">Diagnostic Rate</div>
                              <div className="text-xs text-gray-500 mt-1">
                                {dashboardStats?.studentsWithDiagnostic || 0} completed
                              </div>
                            </div>
                            <div className="text-pink-500">
                              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                              </svg>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
            </>
          )}

          {activeTab === 'users' && (
            <StaggerContainer className="space-y-6">
              <StaggerItem>
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                  <div>
                  <h2 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                    User Management
                  </h2>
                    <p className="text-gray-600 mt-1">Manage students, teachers, and user accounts across your organization</p>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <button
                      onClick={() => setShowStudentForm(true)}
                      className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-300"
                    >
                      + Add Student
                    </button>
                    <button
                      onClick={() => setShowBulkImport(true)}
                      className="px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-300"
                    >
                      📊 Bulk Import
                    </button>
                    <button
                      onClick={exportCredentials}
                      className="px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-700 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-300"
                    >
                      📥 Export Credentials
                    </button>
                </div>
                </div>
              </StaggerItem>

              {/* Student Form Modal */}
              {showStudentForm && (
                <Dialog open={showStudentForm} onClose={() => setShowStudentForm(false)} className="relative z-50">
                  <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
                  <div className="fixed inset-0 flex items-center justify-center p-4 overflow-y-auto">
                    <Dialog.Panel className="mx-auto max-w-md rounded-2xl bg-white p-6">
                      <Dialog.Title className="text-lg font-semibold text-gray-900 mb-4">Add New Student</Dialog.Title>
                      <form onSubmit={(e) => {
                        e.preventDefault();
                        const formData = new FormData(e.currentTarget);
                        const studentData = {
                          name: formData.get('name'),
                          email: formData.get('email'),
                          classGrade: formData.get('classGrade'),
                          schoolName: formData.get('schoolName')
                        };
                        handleStudentSubmit(studentData);
                      }} className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Full Name
                          </label>
                          <input
                            name="name"
                            type="text"
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Email
                          </label>
                          <input
                            name="email"
                            type="email"
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Class Grade
                          </label>
                          <select
                            name="classGrade"
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                          >
                            <option value="">Select Grade</option>
                            <option value="Pre-K">Pre-K</option>
                            <option value="Kindergarten">Kindergarten</option>
                            <option value="Grade 1">Grade 1</option>
                            <option value="Grade 2">Grade 2</option>
                            <option value="Grade 3">Grade 3</option>
                            <option value="Grade 4">Grade 4</option>
                            <option value="Grade 5">Grade 5</option>
                            <option value="Grade 6">Grade 6</option>
                            <option value="Grade 7">Grade 7</option>
                            <option value="Grade 8">Grade 8</option>
                            <option value="Grade 9">Grade 9</option>
                            <option value="Grade 10">Grade 10</option>
                            <option value="Grade 11">Grade 11</option>
                            <option value="Grade 12">Grade 12</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            School Name
                          </label>
                          <input
                            name="schoolName"
                            type="text"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 autofill:bg-white autofill:text-gray-900"
                            style={{ backgroundColor: 'white' }}
                          />
                        </div>
                        <div className="flex gap-3 pt-4">
                          <button
                            type="button"
                            onClick={() => setShowStudentForm(false)}
                            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            disabled={isSubmitting}
                            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                          >
                            {isSubmitting ? 'Adding...' : 'Add Student'}
                          </button>
                        </div>
                      </form>
                    </Dialog.Panel>
                  </div>
                </Dialog>
              )}

              {/* Bulk Import Modal */}
              {showBulkImport && (
                <Dialog open={showBulkImport} onClose={() => setShowBulkImport(false)} className="relative z-50">
                  <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
                  <div className="fixed inset-0 flex items-center justify-center p-4 overflow-y-auto">
                    <Dialog.Panel className="mx-auto max-w-2xl rounded-xl bg-white p-6 shadow-2xl max-h-[90vh] overflow-y-auto my-8 scroll-smooth">
                      <Dialog.Title className="text-xl font-semibold text-gray-900 mb-6 border-b border-gray-200 pb-3">Bulk Import Students</Dialog.Title>
                      <form onSubmit={handleBulkImport} className="space-y-6 pb-4">
                        <div>
                          <label className="block text-sm font-semibold text-gray-800 mb-2">CSV Data</label>
                          <textarea
                            value={bulkImportData}
                            onChange={(e) => setBulkImportData(e.target.value)}
                            rows={10}
                            placeholder="Paste CSV data here (Name, Email, Class Grade, School Name)"
                            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 placeholder-gray-400 text-gray-900"
                          />
            </div>
                        <div className="flex justify-end space-x-3 pt-4">
                          <button
                            type="button"
                            onClick={() => setShowBulkImport(false)}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 hover:border-gray-300 transition-all duration-200"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            disabled={isSubmitting}
                            className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50 shadow-sm hover:shadow-md transition-all duration-200"
                          >
                            {isSubmitting ? 'Importing...' : 'Import Students'}
                          </button>
                        </div>
                      </form>
                    </Dialog.Panel>
                  </div>
                </Dialog>
              )}





              {/* Remove Teacher Confirmation Modal */}
              {showRemoveConfirmModal && teacherToRemove && (
                <div 
                  className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[70] overflow-y-auto"
                  onClick={(e) => {
                    if (e.target === e.currentTarget) {
                      setShowRemoveConfirmModal(false);
                      setTeacherToRemove(null);
                    }
                  }}
                >
                  <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
                      <div className="flex justify-between items-center mb-6 border-b border-gray-200 pb-3">
                        <h3 className="text-xl font-semibold text-gray-900">
                        Remove Teacher
                        </h3>
                        <button
                          type="button"
                        onClick={() => {
                          setShowRemoveConfirmModal(false);
                          setTeacherToRemove(null);
                        }}
                          className="text-gray-400 hover:text-gray-600 transition-colors"
                        >
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    
                    <div className="space-y-4">
                      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <h4 className="font-medium text-red-900 mb-2">⚠️ Warning</h4>
                        <p className="text-sm text-red-700">
                          Are you sure you want to remove <strong>{teacherToRemove.fullName}</strong>? 
                          This action will deactivate their account and cannot be undone.
                          </p>
                        </div>
                        
                          <div className="bg-gray-50 rounded-lg p-4">
                        <h4 className="font-medium text-gray-900 mb-2">Teacher Details</h4>
                        <div className="text-sm text-gray-700 space-y-1">
                          <p><strong>Name:</strong> {teacherToRemove.fullName}</p>
                          <p><strong>Email:</strong> {teacherToRemove.email}</p>
                          <p><strong>Subject:</strong> {teacherToRemove.subjectSpecialization}</p>
                          <p><strong>Branch:</strong> {teacherToRemove.schoolName}</p>
                          </div>
                        </div>
                        
                        <div className="flex justify-end space-x-3 pt-4">
                          <button
                            onClick={() => {
                            setShowRemoveConfirmModal(false);
                            setTeacherToRemove(null);
                            }}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 hover:border-gray-300 transition-all duration-200"
                          >
                          Cancel
                          </button>
                          <button
                          onClick={confirmRemoveTeacher}
                          className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors duration-200"
                          >
                          Remove Teacher
                          </button>
                        </div>
                      </div>
                  </div>
                </div>
              )}

              {/* Delete Student Confirmation Modal */}
              {showDeleteStudentModal && studentToDelete && (
                <div 
                  className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[70] overflow-y-auto"
                  onClick={(e) => {
                    if (e.target === e.currentTarget) {
                      setShowDeleteStudentModal(false);
                      setStudentToDelete(null);
                    }
                  }}
                >
                  <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
                    <div className="flex justify-between items-center mb-6 border-b border-gray-200 pb-3">
                      <h3 className="text-xl font-semibold text-gray-900">
                        Delete Student
                      </h3>
                      <button
                        type="button"
                        onClick={() => {
                          setShowDeleteStudentModal(false);
                          setStudentToDelete(null);
                        }}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <h4 className="font-medium text-red-900 mb-2">⚠️ Warning</h4>
                        <p className="text-sm text-red-700">
                          Are you sure you want to permanently delete <strong>{studentToDelete.fullName}</strong>? 
                          This action cannot be undone and will:
                        </p>
                        <ul className="text-sm text-red-700 mt-2 ml-4 list-disc">
                          <li>Permanently remove the student account</li>
                          <li>Revoke login access immediately</li>
                          <li>Delete all associated data</li>
                        </ul>
                      </div>
                      
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h4 className="font-medium text-gray-900 mb-2">Student Details</h4>
                        <div className="text-sm text-gray-700 space-y-1">
                          <p><strong>Name:</strong> {studentToDelete.fullName}</p>
                          <p><strong>Email:</strong> {studentToDelete.email}</p>
                          <p><strong>Class Grade:</strong> {studentToDelete.classGrade}</p>
                          <p><strong>Student ID:</strong> {studentToDelete.uniqueId}</p>
                        </div>
                      </div>
                      
                      <div className="flex justify-end space-x-3 pt-4">
                        <button
                          onClick={() => {
                            setShowDeleteStudentModal(false);
                            setStudentToDelete(null);
                          }}
                          className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 hover:border-gray-300 transition-all duration-200"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={confirmDeleteStudent}
                          className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors duration-200"
                        >
                          Delete Student
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Student Details Modal */}
              {showStudentDetailsModal && selectedStudent && (
                <div 
                  className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[70] overflow-y-auto"
                  onClick={(e) => {
                    if (e.target === e.currentTarget) {
                      setShowStudentDetailsModal(false);
                      setSelectedStudent(null);
                      setStudentPerformanceData(null);
                      setPerformanceError(null);
                    }
                  }}
                >
                  <div className="bg-white rounded-lg p-6 w-full max-w-4xl mx-4 my-8 max-h-[90vh] overflow-y-auto">
                    <div className="flex justify-between items-center mb-6 border-b border-gray-200 pb-4">
                      <div>
                        <h3 className="text-2xl font-semibold text-gray-900">
                          Student Performance Overview
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">{selectedStudent.fullName} • {selectedStudent.classGrade}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setShowStudentDetailsModal(false);
                          setSelectedStudent(null);
                          setStudentPerformanceData(null);
                          setPerformanceError(null);
                        }}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>

                    {/* Loading State */}
                    {performanceLoading && (
                      <div className="flex flex-col items-center justify-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
                        <p className="text-gray-600">Loading performance data...</p>
                      </div>
                    )}

                    {/* Error State */}
                    {performanceError && !performanceLoading && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                        <div className="flex items-start gap-3">
                          <svg className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <div>
                            <p className="text-red-800 font-medium">Error loading performance data</p>
                            <p className="text-red-600 text-sm mt-1">{performanceError}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Performance Data */}
                    {studentPerformanceData && !performanceLoading && !performanceError && (
                      <div className="space-y-6">
                        {/* Student Info */}
                        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6 border border-blue-100">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                              <p className="text-sm font-medium text-gray-600 mb-1">Email</p>
                              <p className="text-gray-900 font-semibold">{studentPerformanceData.student.email}</p>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-600 mb-1">Student ID</p>
                              <p className="text-gray-900 font-mono font-semibold">{studentPerformanceData.student.uniqueId}</p>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-600 mb-1">Status</p>
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                studentPerformanceData.student.isActive
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {studentPerformanceData.student.isActive ? 'Active' : 'Disabled'}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Overview Stats */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="bg-white border border-gray-200 rounded-lg p-4">
                            <div className="flex items-center justify-between mb-2">
                              <p className="text-xs font-medium text-gray-600">Total Modules</p>
                              <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                              </svg>
                            </div>
                            <p className="text-2xl font-bold text-gray-900">{studentPerformanceData.overview.totalModules}</p>
                            <p className="text-xs text-gray-500 mt-1">
                              {studentPerformanceData.overview.completedModules} completed
                            </p>
                          </div>

                          <div className="bg-white border border-gray-200 rounded-lg p-4">
                            <div className="flex items-center justify-between mb-2">
                              <p className="text-xs font-medium text-gray-600">Total XP</p>
                              <svg className="w-5 h-5 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                              </svg>
                            </div>
                            <p className="text-2xl font-bold text-gray-900">{studentPerformanceData.overview.totalXp}</p>
                            <p className="text-xs text-gray-500 mt-1">
                              {studentPerformanceData.overview.learningStreak} day streak
                            </p>
                          </div>

                          <div className="bg-white border border-gray-200 rounded-lg p-4">
                            <div className="flex items-center justify-between mb-2">
                              <p className="text-xs font-medium text-gray-600">Completion Rate</p>
                              <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            </div>
                            <p className="text-2xl font-bold text-gray-900">{studentPerformanceData.overview.completionRate}%</p>
                            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                              <div 
                                className="bg-green-600 h-2 rounded-full transition-all"
                                style={{ width: `${studentPerformanceData.overview.completionRate}%` }}
                              ></div>
                            </div>
                          </div>

                          <div className="bg-white border border-gray-200 rounded-lg p-4">
                            <div className="flex items-center justify-between mb-2">
                              <p className="text-xs font-medium text-gray-600">Badges Earned</p>
                              <svg className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                              </svg>
                            </div>
                            <p className="text-2xl font-bold text-gray-900">{studentPerformanceData.overview.badgesEarned}</p>
                            <p className="text-xs text-gray-500 mt-1">
                              Achievements unlocked
                            </p>
                          </div>
                        </div>

                        {/* Assessments Section */}
                        <div className="bg-white border border-gray-200 rounded-lg p-6">
                          <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            Assessment Performance
                          </h4>
                          {studentPerformanceData.assessments.totalCompleted > 0 ? (
                            <div className="space-y-4">
                              <div className="grid grid-cols-3 gap-4 mb-4">
                                <div className="text-center">
                                  <p className="text-xs text-gray-600 mb-1">Total Completed</p>
                                  <p className="text-2xl font-bold text-gray-900">{studentPerformanceData.assessments.totalCompleted}</p>
                                </div>
                                <div className="text-center">
                                  <p className="text-xs text-gray-600 mb-1">Latest Score</p>
                                  <p className="text-2xl font-bold text-blue-600">{studentPerformanceData.assessments.latestScore}%</p>
                                </div>
                                <div className="text-center">
                                  <p className="text-xs text-gray-600 mb-1">Average Score</p>
                                  <p className="text-2xl font-bold text-green-600">{studentPerformanceData.assessments.averageScore}%</p>
                                </div>
                              </div>
                              <div className="space-y-2">
                                {studentPerformanceData.assessments.completedAssessments.slice(0, 3).map((assessment: any, index: number) => (
                                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                    <div>
                                      <p className="font-medium text-gray-900 capitalize">{assessment.type || 'Assessment'}</p>
                                      <p className="text-xs text-gray-500">
                                        {assessment.completedAt ? new Date(assessment.completedAt).toLocaleDateString() : 'N/A'}
                                      </p>
                                    </div>
                                    <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-semibold">
                                      {assessment.score || 0}%
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ) : (
                            <p className="text-gray-500 text-sm">No assessments completed yet</p>
                          )}
                        </div>

                        {/* Learning Paths Section */}
                        <div className="bg-white border border-gray-200 rounded-lg p-6">
                          <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                            </svg>
                            Learning Paths
                          </h4>
                          {studentPerformanceData.learningPaths.total > 0 ? (
                            <div className="space-y-3">
                              <div className="flex items-center justify-between mb-3">
                                <span className="text-sm text-gray-600">
                                  {studentPerformanceData.learningPaths.completed} of {studentPerformanceData.learningPaths.total} completed
                                </span>
                                <span className="text-sm font-semibold text-gray-900">
                                  {Math.round((studentPerformanceData.learningPaths.completed / studentPerformanceData.learningPaths.total) * 100)}%
                                </span>
                              </div>
                              {studentPerformanceData.learningPaths.paths.slice(0, 3).map((path: any, index: number) => (
                                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                  <div>
                                    <p className="font-medium text-gray-900">{path.careerDomain || 'Learning Path'}</p>
                                    <p className="text-xs text-gray-500">
                                      Created: {path.createdAt ? new Date(path.createdAt).toLocaleDateString() : 'N/A'}
                                    </p>
                                  </div>
                                  {path.isCompleted ? (
                                    <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold">
                                      Completed
                                    </span>
                                  ) : (
                                    <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-semibold">
                                      In Progress
                                    </span>
                                  )}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-gray-500 text-sm">No learning paths created yet</p>
                          )}
                        </div>

                        {/* Recent Activity Section */}
                        <div className="bg-white border border-gray-200 rounded-lg p-6">
                          <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Recent Activity
                          </h4>
                          {studentPerformanceData.recentActivity.length > 0 ? (
                            <div className="space-y-3">
                              {studentPerformanceData.recentActivity.map((activity: any, index: number) => (
                                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                  <div className="flex-1">
                                    <p className="font-medium text-gray-900">{activity.moduleName || 'Module Activity'}</p>
                                    <p className="text-xs text-gray-500 mt-1">
                                      {activity.subject && <span className="capitalize">{activity.subject}</span>}
                                      {activity.lastAccessedAt && (
                                        <span className="ml-2">
                                          • {new Date(activity.lastAccessedAt).toLocaleDateString()}
                                        </span>
                                      )}
                                    </p>
                                  </div>
                                  {activity.completedAt || activity.isCompleted ? (
                                    <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold">
                                      Completed
                                    </span>
                                  ) : (
                                    <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-semibold">
                                      In Progress
                                    </span>
                                  )}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-gray-500 text-sm">No recent activity</p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}


              <StaggerItem>
                <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-white/20 p-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-6 border-b border-gray-200 pb-3">Student Management</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <h4 className="font-medium text-blue-900 mb-2">Add Individual Student</h4>
                      <p className="text-sm text-blue-700">Create a single student account with custom details.</p>
                    </div>
                    <div className="p-4 bg-green-50 rounded-lg">
                      <h4 className="font-medium text-green-900 mb-2">Bulk Import</h4>
                      <p className="text-sm text-green-700">Import multiple students from CSV data at once.</p>
                    </div>
                    <div className="p-4 bg-purple-50 rounded-lg">
                      <h4 className="font-medium text-purple-900 mb-2">Export Credentials</h4>
                      <p className="text-sm text-purple-700">Download student login credentials as CSV file.</p>
                    </div>
                  </div>
                </div>
              </StaggerItem>

              {/* Students Table */}
              <StaggerItem>
                <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-white/20 p-6">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
                    <h3 className="text-xl font-semibold text-gray-900">Organization Students</h3>
                    <div className="text-sm text-gray-600">
                      Total: {students.length} students
                    </div>
                  </div>
                  
                  {studentsLoading ? (
                    <div className="flex justify-center items-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                      <span className="ml-2 text-gray-600">Loading students...</span>
                    </div>
                  ) : students.length === 0 ? (
                    <div className="text-center py-8">
                      <div className="text-gray-400 mb-2">
                        <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                        </svg>
                      </div>
                      <h3 className="text-lg font-medium text-gray-900 mb-1">No students found</h3>
                      <p className="text-gray-500">Start by adding students to your organization.</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Student
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Class Grade
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              School
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Progress
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Status
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Joined
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {students.map((student) => (
                            <tr key={student.id}>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                  <div className="flex-shrink-0 h-10 w-10">
                                    <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold">
                                      {student.fullName.charAt(0).toUpperCase()}
                                    </div>
                                  </div>
                                  <div className="ml-4">
                                    <div className="text-sm font-medium text-gray-900">
                                      {student.fullName}
                                    </div>
                                    <div className="text-sm text-gray-500">
                                      {student.email}
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">{student.classGrade}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">{student.schoolName}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">
                                  {student.totalModulesCompleted} modules
                                </div>
                                <div className="text-xs text-gray-500">
                                  {student.totalXpEarned} XP • {student.learningStreak} day streak
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex flex-col gap-1">
                                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                    student.onboardingCompleted 
                                      ? 'bg-green-100 text-green-800' 
                                      : 'bg-yellow-100 text-yellow-800'
                                  }`}>
                                    {student.onboardingCompleted ? 'Onboarded' : 'Pending'}
                                  </span>
                                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                    student.isActive !== false
                                      ? 'bg-blue-100 text-blue-800' 
                                      : 'bg-red-100 text-red-800'
                                  }`}>
                                    {student.isActive !== false ? 'Active' : 'Disabled'}
                                  </span>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {new Date(student.joinedAt).toLocaleDateString()}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                <div className="flex flex-col space-y-1">
                                  <div className="flex space-x-2">
                                    <button
                                      className="text-blue-600 hover:text-blue-900"
                                      onClick={() => handleViewStudentDetails(student)}
                                    >
                                      View
                                    </button>
                                    <button
                                      className="text-green-600 hover:text-green-900"
                                      onClick={() => handleShowStudentCredentials(student.id)}
                                    >
                                      Credentials
                                    </button>
                                  </div>
                                  <div className="flex space-x-2">
                                    <button
                                      className={`text-xs px-2 py-1 rounded ${
                                        student.isActive !== false
                                          ? 'text-orange-600 hover:text-orange-900 bg-orange-50'
                                          : 'text-green-600 hover:text-green-900 bg-green-50'
                                      }`}
                                      onClick={() => handleToggleStudentStatus(student)}
                                    >
                                      {student.isActive !== false ? 'Disable' : 'Enable'}
                                    </button>
                                    <button
                                      className="text-xs px-2 py-1 rounded text-red-600 hover:text-red-900 bg-red-50"
                                      onClick={() => handleDeleteStudent(student)}
                                    >
                                      Delete
                                    </button>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </StaggerItem>
            </StaggerContainer>
          )}

          {/* Student Credentials Display - Below Table */}
          {activeTab === 'users' && newStudentCredentials && (
            <div className="mt-6">
              <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-white/20 p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-semibold text-gray-900">Student Login Credentials</h3>
                  <button
                    onClick={() => setNewStudentCredentials(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h4 className="text-lg font-medium text-green-800 mb-3">Student Login Credentials</h4>
                  <p className="text-green-700 mb-4">Please share these credentials with the student:</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white rounded-lg p-4 border">
                      <div className="flex items-center justify-between">
                        <div>
                          <label className="text-sm font-medium text-gray-600">Name:</label>
                          <p className="text-gray-900 font-medium">{newStudentCredentials.fullName}</p>
                        </div>
                        <button
                          onClick={() => copyToClipboard(newStudentCredentials.fullName)}
                          className="text-blue-600 hover:text-blue-800 px-3 py-1 border border-blue-300 rounded hover:bg-blue-50"
                        >
                          Copy
                        </button>
                      </div>
                    </div>
                    
                    <div className="bg-white rounded-lg p-4 border">
                      <div className="flex items-center justify-between">
                        <div>
                          <label className="text-sm font-medium text-gray-600">Email:</label>
                          <p className="text-gray-900 font-medium">{newStudentCredentials.email}</p>
                        </div>
                        <button
                          onClick={() => copyToClipboard(newStudentCredentials.email)}
                          className="text-blue-600 hover:text-blue-800 px-3 py-1 border border-blue-300 rounded hover:bg-blue-50"
                        >
                          Copy
                        </button>
                      </div>
                    </div>
                    
                    <div className="bg-white rounded-lg p-4 border">
                      <div className="flex items-center justify-between">
                        <div>
                          <label className="text-sm font-medium text-gray-600">Password:</label>
                          <p className="text-gray-900 font-mono font-medium">{newStudentCredentials.password}</p>
                        </div>
                        <button
                          onClick={() => copyToClipboard(newStudentCredentials.password || '')}
                          className="text-blue-600 hover:text-blue-800 px-3 py-1 border border-blue-300 rounded hover:bg-blue-50"
                        >
                          Copy
                        </button>
                      </div>
                    </div>
                    
                    <div className="bg-white rounded-lg p-4 border">
                      <div className="flex items-center justify-between">
                        <div>
                          <label className="text-sm font-medium text-gray-600">Student ID:</label>
                          <p className="text-gray-900 font-medium">{newStudentCredentials.uniqueId}</p>
                        </div>
                        <button
                          onClick={() => copyToClipboard(newStudentCredentials.uniqueId)}
                          className="text-blue-600 hover:text-blue-800 px-3 py-1 border border-blue-300 rounded hover:bg-blue-50"
                        >
                          Copy
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-yellow-800 text-sm">
                      <strong>Important:</strong> This is a permanent password that has been set for the student. 
                      The student can use these credentials to login and should change their password on first login. 
                      They can access the platform at the login page using these credentials.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'content' && (
            <ModuleManagementInterface />
          )}

          {activeTab === 'branches' && (
            <StaggerContainer className="space-y-6">
              <StaggerItem>
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                  <div>
                  <h2 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                    Branch Management
                  </h2>
                    <p className="text-gray-600 mt-1">Manage branches, locations, and organizational structure</p>
                  </div>
                  <button
                  onClick={() => setShowBranchForm(true)}
                    className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-300"
                >
                    + Add Branch
                  </button>
              </div>
              </StaggerItem>

              {/* Branch Form Modal */}
              {showBranchForm && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
                  <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto my-8 scroll-smooth">
                    <h3 className="text-xl font-semibold text-gray-900 mb-6 border-b border-gray-200 pb-3">Add New Branch</h3>
                    <form onSubmit={handleBranchSubmit} className="space-y-6 pb-4">
                      <div>
                          <label className="block text-sm font-semibold text-gray-800 mb-2">
                            Branch Name <span className="text-red-500">*</span>
                          </label>
                        <input
                          type="text"
                          required
                          value={branchFormData.branchName}
                          onChange={(e) => setBranchFormData(prev => ({ ...prev, branchName: e.target.value }))}
                            className="mt-1 block w-full px-4 py-3 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 placeholder-gray-400 text-gray-900"
                            placeholder="Enter branch name (e.g., Main Campus)"
                        />
                      </div>
                      <div>
                          <label className="block text-sm font-semibold text-gray-800 mb-2">
                            Branch Code <span className="text-red-500">*</span>
                          </label>
                        <input
                          type="text"
                          required
                          value={branchFormData.branchCode}
                          onChange={(e) => setBranchFormData(prev => ({ ...prev, branchCode: e.target.value }))}
                            className="mt-1 block w-full px-4 py-3 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 placeholder-gray-400 text-gray-900"
                            placeholder="Enter unique branch code (e.g., MAIN001)"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-800 mb-2">Address</label>
                        <input
                          type="text"
                          required
                          value={branchFormData.address}
                          onChange={(e) => setBranchFormData(prev => ({ ...prev, address: e.target.value }))}
                          className="mt-1 block w-full px-4 py-3 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 placeholder-gray-400 text-gray-900"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-semibold text-gray-800 mb-2">City</label>
                          <input
                            type="text"
                            required
                            value={branchFormData.city}
                            onChange={(e) => setBranchFormData(prev => ({ ...prev, city: e.target.value }))}
                            className="mt-1 block w-full px-4 py-3 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 placeholder-gray-400 text-gray-900"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-800 mb-2">State</label>
                          <input
                            type="text"
                            required
                            value={branchFormData.state}
                            onChange={(e) => setBranchFormData(prev => ({ ...prev, state: e.target.value }))}
                            className="mt-1 block w-full px-4 py-3 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 placeholder-gray-400 text-gray-900"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-800 mb-2">Phone Number</label>
                        <input
                          type="tel"
                          required
                          value={branchFormData.phoneNumber}
                          onChange={(e) => setBranchFormData(prev => ({ ...prev, phoneNumber: e.target.value }))}
                          className="mt-1 block w-full px-4 py-3 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 placeholder-gray-400 text-gray-900"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-800 mb-2">Email</label>
                        <input
                          type="email"
                          required
                          value={branchFormData.email}
                          onChange={(e) => setBranchFormData(prev => ({ ...prev, email: e.target.value }))}
                          className="mt-1 block w-full px-4 py-3 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 placeholder-gray-400 text-gray-900"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-800 mb-2">Principal Name</label>
                        <input
                          type="text"
                          required
                          value={branchFormData.principalName}
                          onChange={(e) => setBranchFormData(prev => ({ ...prev, principalName: e.target.value }))}
                          className="mt-1 block w-full px-4 py-3 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 placeholder-gray-400 text-gray-900"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-800 mb-2">Principal Email</label>
                        <input
                          type="email"
                          required
                          value={branchFormData.principalEmail}
                          onChange={(e) => setBranchFormData(prev => ({ ...prev, principalEmail: e.target.value }))}
                          className="mt-1 block w-full px-4 py-3 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 placeholder-gray-400 text-gray-900"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-800 mb-2">Principal Phone</label>
                        <input
                          type="tel"
                          required
                          value={branchFormData.principalPhone}
                          onChange={(e) => setBranchFormData(prev => ({ ...prev, principalPhone: e.target.value }))}
                          className="mt-1 block w-full px-4 py-3 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 placeholder-gray-400 text-gray-900"
                        />
                      </div>
                      <div className="flex justify-end space-x-3">
                        <button
                          type="button"
                          onClick={() => setShowBranchForm(false)}
                          className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 hover:border-gray-300 transition-all duration-200"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={isSubmitting}
                          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 shadow-sm hover:shadow-md transition-all duration-200"
                        >
                          {isSubmitting ? 'Creating...' : 'Create Branch'}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}


              {/* Quick Branch Creation Modal */}
              {showQuickBranchForm && (
                <div 
                  className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] overflow-y-auto"
                  onClick={(e) => {
                    if (e.target === e.currentTarget) {
                      setShowQuickBranchForm(false);
                    }
                  }}
                >
                  <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto my-8">
                    <div className="flex justify-between items-center mb-6 border-b border-gray-200 pb-3">
                      <h3 className="text-xl font-semibold text-gray-900">Create New Branch - MODAL IS WORKING!</h3>
                      <button
                        type="button"
                        onClick={() => setShowQuickBranchForm(false)}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                    <form onSubmit={handleQuickBranchSubmit} className="space-y-6 pb-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-800 mb-2">Branch Name</label>
                        <input
                          type="text"
                          required
                          value={quickBranchData.branchName}
                          onChange={(e) => setQuickBranchData(prev => ({ ...prev, branchName: e.target.value }))}
                          className="mt-1 block w-full px-4 py-3 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 placeholder-gray-400 text-gray-900"
                          placeholder="e.g., Main Campus"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-800 mb-2">Branch Code</label>
                        <input
                          type="text"
                          required
                          value={quickBranchData.branchCode}
                          onChange={(e) => setQuickBranchData(prev => ({ ...prev, branchCode: e.target.value }))}
                          className="mt-1 block w-full px-4 py-3 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 placeholder-gray-400 text-gray-900"
                          placeholder="e.g., MAIN001"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-semibold text-gray-800 mb-2">City</label>
                          <input
                            type="text"
                            required
                            value={quickBranchData.city}
                            onChange={(e) => setQuickBranchData(prev => ({ ...prev, city: e.target.value }))}
                            className="mt-1 block w-full px-4 py-3 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 placeholder-gray-400 text-gray-900"
                            placeholder="City"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-800 mb-2">State</label>
                          <input
                            type="text"
                            required
                            value={quickBranchData.state}
                            onChange={(e) => setQuickBranchData(prev => ({ ...prev, state: e.target.value }))}
                            className="mt-1 block w-full px-4 py-3 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 placeholder-gray-400 text-gray-900"
                            placeholder="State"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-800 mb-2">Principal Name</label>
                        <input
                          type="text"
                          required
                          value={quickBranchData.principalName}
                          onChange={(e) => setQuickBranchData(prev => ({ ...prev, principalName: e.target.value }))}
                          className="mt-1 block w-full px-4 py-3 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 placeholder-gray-400 text-gray-900"
                          placeholder="Principal's full name"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-800 mb-2">Principal Email</label>
                        <input
                          type="email"
                          required
                          value={quickBranchData.principalEmail}
                          onChange={(e) => setQuickBranchData(prev => ({ ...prev, principalEmail: e.target.value }))}
                          className="mt-1 block w-full px-4 py-3 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 placeholder-gray-400 text-gray-900"
                          placeholder="principal@school.com"
                        />
                      </div>
                      <div className="flex justify-end space-x-3 pt-4">
                        <button
                          type="button"
                          onClick={() => setShowQuickBranchForm(false)}
                          className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 hover:border-gray-300 transition-all duration-200"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={isSubmitting}
                          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 shadow-sm hover:shadow-md transition-all duration-200"
                        >
                          {isSubmitting ? 'Creating...' : 'Create & Select'}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

              {/* Branches List */}
              <StaggerItem>
                <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-white/20">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900">All Branches</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Branch</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Code</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Principal</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {(branches || []).map((branch) => (
                        <tr key={branch._id || Math.random()}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">{branch.branchName}</div>
                              <div className="text-sm text-gray-500">{branch.email}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{branch.branchCode}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{branch.city}, {branch.state}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">{branch.principalName}</div>
                              <div className="text-sm text-gray-500">{branch.principalEmail}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              branch.isActive ? 'text-green-600 bg-green-100' : 'text-red-600 bg-red-100'
                            }`}>
                              {branch.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                </div>
              </StaggerItem>
            </StaggerContainer>
          )}

          {activeTab === 'teachers' && (
            <StaggerContainer className="space-y-6">
              <StaggerItem>
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                  <div>
                    <h2 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                      Teacher Management
                    </h2>
                    <p className="text-gray-600 mt-1">Invite, manage, and oversee teachers across your organization</p>
                  </div>
                  <button
                  onClick={() => setShowTeacherInviteForm(true)}
                    className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={branchesLoading}
                  >
                    + Invite Teacher
                  </button>
                  {branches.length === 0 && !branchesLoading && (
                    <p className="text-sm text-blue-600 mt-2">
                      You can invite teachers and create branches or skip branch assignment
                    </p>
                  )}
              </div>
              </StaggerItem>

              {/* Teacher Invite Form Modal */}
              {showTeacherInviteForm && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
                  <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto my-8 scroll-smooth">
                    <h3 className="text-xl font-semibold text-gray-900 mb-6 border-b border-gray-200 pb-3">Invite Teacher</h3>
                    <form onSubmit={handleTeacherInviteSubmit} className="space-y-6">
                      <div>
                          <label className="block text-sm font-semibold text-gray-800 mb-2">
                            Email <span className="text-red-500">*</span>
                          </label>
                        <input
                          type="email"
                          required
                          value={teacherInviteData.email}
                          onChange={(e) => setTeacherInviteData(prev => ({ ...prev, email: e.target.value }))}
                            className="mt-1 block w-full px-4 py-3 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 placeholder-gray-400 text-gray-900"
                            placeholder="Enter teacher's email address"
                        />
                      </div>
                      <div>
                          <label className="block text-sm font-semibold text-gray-800 mb-2">
                            Name <span className="text-red-500">*</span>
                          </label>
                        <input
                          type="text"
                          required
                          value={teacherInviteData.name}
                          onChange={(e) => setTeacherInviteData(prev => ({ ...prev, name: e.target.value }))}
                            className="mt-1 block w-full px-4 py-3 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 placeholder-gray-400 text-gray-900"
                            placeholder="Enter teacher's full name"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-800 mb-2">Branch</label>
                        <select
                          required={branches.length > 0}
                          value={teacherInviteData.branchId}
                          onChange={(e) => setTeacherInviteData(prev => ({ ...prev, branchId: e.target.value }))}
                          className="mt-1 block w-full px-4 py-3 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 placeholder-gray-400 text-gray-900"
                          disabled={branchesLoading}
                        >
                          <option value="">
                            {branchesLoading ? 'Loading branches...' : 'Select Branch'}
                          </option>
                          {branches.length > 0 ? (
                            (branches || []).map((branch) => (
                            <option key={branch._id || Math.random()} value={branch._id}>{branch.branchName}</option>
                            ))
                          ) : !branchesLoading ? (
                            <option value="skip">Skip Branch Assignment</option>
                          ) : null}
                        </select>
                        
                        {branches.length === 0 && !branchesLoading && (
                          <div className="mt-3 space-y-3">
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                              <p className="text-sm text-blue-800 font-medium mb-2">
                                💡 No branches available yet
                              </p>
                              <p className="text-sm text-blue-700">
                                You can either create a new branch or skip branch assignment for now.
                              </p>
                            </div>
                            <div className="flex gap-2">
                              <div
                                onMouseDown={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  console.log('Create New Branch div mousedown');
                                  setShowQuickBranchForm(true);
                                }}
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  console.log('Create New Branch div clicked');
                                  console.log('Current showQuickBranchForm state:', showQuickBranchForm);
                                  setTimeout(() => {
                                    setShowQuickBranchForm(true);
                                    console.log('Set showQuickBranchForm to true');
                                  }, 0);
                                }}
                                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 shadow-sm hover:shadow-md cursor-pointer"
                                style={{ pointerEvents: 'auto', display: 'inline-block' }}
                              >
                                + Create New Branch
                              </div>
                              <button
                                type="button"
                                onClick={() => setTeacherInviteData(prev => ({ ...prev, branchId: 'skip' }))}
                                className="px-4 py-2 text-sm bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-all duration-200 shadow-sm hover:shadow-md"
                              >
                                Skip Branch
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-800 mb-2">
                          Subject Specialization <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={teacherInviteData.subjectSpecialization}
                          onChange={(e) => setTeacherInviteData(prev => ({ ...prev, subjectSpecialization: e.target.value }))}
                          className="mt-1 block w-full px-4 py-3 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 placeholder-gray-400 text-gray-900"
                          placeholder="e.g., Mathematics, Science, English"
                        />
                        <p className="mt-1 text-xs text-gray-500">Enter the main subject this teacher will teach</p>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-800 mb-2">
                          Experience Years <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="number"
                          required
                          min="0"
                          max="50"
                          value={teacherInviteData.experienceYears}
                          onChange={(e) => setTeacherInviteData(prev => ({ ...prev, experienceYears: e.target.value }))}
                          className="mt-1 block w-full px-4 py-3 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 placeholder-gray-400 text-gray-900"
                          placeholder="Enter years of teaching experience"
                        />
                        <p className="mt-1 text-xs text-gray-500">Number of years of teaching experience (0-50)</p>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-800 mb-2">
                          Qualification <span className="text-red-500">*</span>
                        </label>
                        <select
                          required
                          value={teacherInviteData.qualification}
                          onChange={(e) => setTeacherInviteData(prev => ({ ...prev, qualification: e.target.value }))}
                          className="mt-1 block w-full px-4 py-3 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-gray-900"
                        >
                          <option value="">Select qualification</option>
                          <option value="Bachelor's Degree">Bachelor's Degree</option>
                          <option value="Master's Degree">Master's Degree</option>
                          <option value="PhD">PhD</option>
                          <option value="B.Ed">B.Ed (Bachelor of Education)</option>
                          <option value="M.Ed">M.Ed (Master of Education)</option>
                          <option value="Diploma">Diploma</option>
                          <option value="Certificate">Certificate</option>
                          <option value="Other">Other</option>
                        </select>
                        <p className="mt-1 text-xs text-gray-500">Select the highest educational qualification</p>
                      </div>
                      <div className="flex justify-end space-x-3">
                        <button
                          type="button"
                          onClick={() => setShowTeacherInviteForm(false)}
                          className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 hover:border-gray-300 transition-all duration-200"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={isSubmitting}
                          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 shadow-sm hover:shadow-md transition-all duration-200"
                        >
                          {isSubmitting ? 'Sending...' : 'Send Invitation'}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

              {/* Teachers List */}
              <div className="bg-white rounded-xl shadow-lg border border-gray-200">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900">All Teachers</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Teacher</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subject</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Experience</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Branch</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {(teachers || []).map((teacher) => (
                          <tr key={teacher.id || Math.random()}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">{teacher.fullName}</div>
                              <div className="text-sm text-gray-500">{teacher.email}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{teacher.subjectSpecialization}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{teacher.experienceYears} years</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{teacher.schoolName}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              teacher.isActive ? 'text-green-600 bg-green-100' : 'text-red-600 bg-red-100'
                            }`}>
                              {teacher.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex space-x-2">
                              <button
                                onClick={() => {
                                  console.log('Teacher data:', teacher);
                                  console.log('Teacher ID:', teacher.id);
                                  handleShowTeacherCredentials(teacher.id);
                                }}
                                className="text-blue-600 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 px-3 py-1 rounded-md text-xs font-medium"
                              >
                                Show Credentials
                              </button>
                              <button
                                onClick={() => handleRemoveTeacher(teacher)}
                                className="text-red-600 hover:text-red-900 bg-red-50 hover:bg-red-100 px-3 py-1 rounded-md text-xs font-medium"
                              >
                                Remove
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Teacher Credentials Display - Below Table */}
              {activeTab === 'teachers' && newCredentials && newCredentials.type === 'teacher' && (
                <div className="mt-6">
                  <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-white/20 p-6">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-xl font-semibold text-gray-900">Teacher Login Credentials</h3>
                      <button
                        onClick={() => setNewCredentials(null)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                    
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <h4 className="text-lg font-medium text-green-800 mb-3">Teacher Login Credentials</h4>
                      <p className="text-green-700 mb-4">Please share these credentials with the teacher:</p>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-white rounded-lg p-4 border">
                          <div className="flex items-center justify-between">
                            <div>
                              <label className="text-sm font-medium text-gray-600">Name:</label>
                              <p className="text-gray-900 font-medium">{newCredentials.name}</p>
                            </div>
                            <button
                              onClick={() => copyToClipboard(newCredentials.name)}
                              className="text-blue-600 hover:text-blue-800 px-3 py-1 border border-blue-300 rounded hover:bg-blue-50"
                            >
                              Copy
                            </button>
                          </div>
                        </div>
                        
                        <div className="bg-white rounded-lg p-4 border">
                          <div className="flex items-center justify-between">
                            <div>
                              <label className="text-sm font-medium text-gray-600">Email:</label>
                              <p className="text-gray-900 font-medium">{newCredentials.email}</p>
                            </div>
                            <button
                              onClick={() => copyToClipboard(newCredentials.email)}
                              className="text-blue-600 hover:text-blue-800 px-3 py-1 border border-blue-300 rounded hover:bg-blue-50"
                            >
                              Copy
                            </button>
                          </div>
                        </div>
                        
                        <div className="bg-white rounded-lg p-4 border">
                          <div className="flex items-center justify-between">
                            <div>
                              <label className="text-sm font-medium text-gray-600">Password:</label>
                              <p className="text-gray-900 font-mono font-medium">{newCredentials.password}</p>
                            </div>
                            <button
                              onClick={() => copyToClipboard(newCredentials.password || '')}
                              className="text-blue-600 hover:text-blue-800 px-3 py-1 border border-blue-300 rounded hover:bg-blue-50"
                            >
                              Copy
                            </button>
                          </div>
                        </div>
                        
                        <div className="bg-white rounded-lg p-4 border">
                          <div className="flex items-center justify-between">
                            <div>
                              <label className="text-sm font-medium text-gray-600">User ID:</label>
                              <p className="text-gray-900 font-medium">{newCredentials.id}</p>
                            </div>
                            <button
                              onClick={() => copyToClipboard(newCredentials.id)}
                              className="text-blue-600 hover:text-blue-800 px-3 py-1 border border-blue-300 rounded hover:bg-blue-50"
                            >
                              Copy
                            </button>
                          </div>
                        </div>
                      </div>
                      
                      <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <p className="text-yellow-800 text-sm">
                          <strong>Important:</strong> This is a permanent password that has been set for the teacher. 
                          The teacher can use these credentials to login and should change their password on first login. 
                          They can access the platform at the login page using these credentials.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Remove Teacher Confirmation - Only show on teachers tab */}
              {showRemoveConfirmModal && teacherToRemove && (
                <div 
                  style={{
                    backgroundColor: '#dc2626',
                    color: 'white',
                    padding: '20px',
                    borderRadius: '10px',
                    border: '3px solid #ef4444',
                    marginTop: '20px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                    <h3 style={{ fontSize: '18px', fontWeight: 'bold', margin: 0 }}>
                      ⚠️ Remove Teacher Confirmation
                    </h3>
                    <button
                      onClick={() => setShowRemoveConfirmModal(false)}
                      style={{
                        background: '#374151',
                        color: 'white',
                        border: 'none',
                        padding: '8px 16px',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: '600'
                      }}
                    >
                      ✕ Cancel
                    </button>
                  </div>
                  
                  <div style={{ 
                    backgroundColor: '#b91c1c', 
                    padding: '15px', 
                    borderRadius: '6px',
                    marginBottom: '15px'
                  }}>
                    <p style={{ margin: '0 0 10px 0', fontSize: '16px' }}>
                      <strong>Are you sure you want to remove this teacher?</strong>
                    </p>
                    <div style={{ fontSize: '14px' }}>
                      <div><strong>Name:</strong> {teacherToRemove.name}</div>
                      <div><strong>Email:</strong> {teacherToRemove.email}</div>
                      <div><strong>Subject:</strong> {teacherToRemove.subject}</div>
                    </div>
                  </div>
                  
                  <div style={{ 
                    display: 'flex', 
                    gap: '10px',
                    justifyContent: 'flex-end'
                  }}>
                    <button
                      onClick={() => setShowRemoveConfirmModal(false)}
                      style={{
                        background: '#6b7280',
                        color: 'white',
                        border: 'none',
                        padding: '10px 20px',
                        borderRadius: '5px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: '600'
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={confirmRemoveTeacher}
                      style={{
                        background: '#dc2626',
                        color: 'white',
                        border: '2px solid #fca5a5',
                        padding: '10px 20px',
                        borderRadius: '5px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: '600'
                      }}
                    >
                      🗑️ Yes, Remove Teacher
                    </button>
                  </div>
                  
                  <div style={{ 
                    backgroundColor: '#991b1b', 
                    padding: '10px', 
                    borderRadius: '4px',
                    fontSize: '12px',
                    marginTop: '10px'
                  }}>
                    <strong>⚠️ Warning:</strong> This action will deactivate the teacher account. The teacher will no longer be able to access the system.
                  </div>
                </div>
              )}
            </StaggerContainer>
          )}

          {activeTab === 'reports' && (
            <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-white/20 p-6">
              <ReportsCenter />
            </div>
          )}

          {activeTab === 'audit-logs' && (
            <StaggerContainer className="space-y-6">
              <StaggerItem>
                <div>
                  <h2 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                    Audit Logs
                  </h2>
                  <p className="text-gray-600 mt-1">Track and monitor all activities and changes within your organization</p>
                </div>
              </StaggerItem>
              <StaggerItem>
                <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-white/20 p-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-6 border-b border-gray-200 pb-3">Activity Logs</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <h4 className="font-medium text-blue-900 mb-2">User Activities</h4>
                      <p className="text-sm text-blue-700">Track login/logout activities, profile changes, and user interactions across the platform.</p>
                    </div>
                    <div className="p-4 bg-green-50 rounded-lg">
                      <h4 className="font-medium text-green-900 mb-2">System Changes</h4>
                      <p className="text-sm text-green-700">Monitor configuration changes, permission updates, and system modifications.</p>
                    </div>
                    <div className="p-4 bg-purple-50 rounded-lg">
                      <h4 className="font-medium text-purple-900 mb-2">Data Modifications</h4>
                      <p className="text-sm text-purple-700">Track all data changes including student records, teacher profiles, and branch information.</p>
                    </div>
                    <div className="p-4 bg-orange-50 rounded-lg">
                      <h4 className="font-medium text-orange-900 mb-2">Security Events</h4>
                      <p className="text-sm text-orange-700">Monitor security-related events, failed login attempts, and suspicious activities.</p>
                    </div>
                  </div>
                </div>
              </StaggerItem>
            </StaggerContainer>
          )}

          {activeTab === 'analytics' && (
            <StaggerContainer className="space-y-6">
              <StaggerItem>
                <div>
                <h2 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                  Organization Analytics
                </h2>
                  <p className="text-gray-600 mt-1">Comprehensive insights into your organization's performance and engagement</p>
                </div>
              </StaggerItem>
              <StaggerItem>
                <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-white/20 p-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-6 border-b border-gray-200 pb-3">Performance Metrics</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <h4 className="font-medium text-blue-900 mb-2">User Engagement</h4>
                      <p className="text-sm text-blue-700">Track student and teacher activity, login patterns, and platform usage.</p>
              </div>
                    <div className="p-4 bg-green-50 rounded-lg">
                      <h4 className="font-medium text-green-900 mb-2">Learning Progress</h4>
                      <p className="text-sm text-green-700">Monitor student progress, module completion rates, and performance trends.</p>
            </div>
                    <div className="p-4 bg-purple-50 rounded-lg">
                      <h4 className="font-medium text-purple-900 mb-2">Branch Performance</h4>
                      <p className="text-sm text-purple-700">Compare performance across different branches and locations.</p>
                    </div>
                    <div className="p-4 bg-orange-50 rounded-lg">
                      <h4 className="font-medium text-orange-900 mb-2">Resource Utilization</h4>
                      <p className="text-sm text-orange-700">Analyze platform usage, feature adoption, and resource efficiency.</p>
                    </div>
                  </div>
                </div>
              </StaggerItem>
            </StaggerContainer>
          )}

          {activeTab === 'announcements' && (
            <StaggerContainer className="space-y-6">
              <StaggerItem>
                <div>
                <h2 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                  Announcements
                </h2>
                  <p className="text-gray-600 mt-1">Communicate effectively with your organization through announcements and notifications</p>
                </div>
              </StaggerItem>
              <StaggerItem>
                <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-white/20 p-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-6 border-b border-gray-200 pb-3">Communication Center</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <h4 className="font-medium text-blue-900 mb-2">Send Announcements</h4>
                      <p className="text-sm text-blue-700">Create and send announcements to teachers, students, or specific groups.</p>
              </div>
                    <div className="p-4 bg-green-50 rounded-lg">
                      <h4 className="font-medium text-green-900 mb-2">Notification Management</h4>
                      <p className="text-sm text-green-700">Manage notification preferences and delivery settings for your organization.</p>
            </div>
                    <div className="p-4 bg-purple-50 rounded-lg">
                      <h4 className="font-medium text-purple-900 mb-2">Message Templates</h4>
                      <p className="text-sm text-purple-700">Create and manage reusable message templates for common communications.</p>
                    </div>
                    <div className="p-4 bg-orange-50 rounded-lg">
                      <h4 className="font-medium text-orange-900 mb-2">Delivery Reports</h4>
                      <p className="text-sm text-orange-700">Track message delivery status and engagement metrics.</p>
                    </div>
                  </div>
                </div>
              </StaggerItem>
            </StaggerContainer>
          )}

          {activeTab === 'settings' && (
            <StaggerContainer className="space-y-6">
              <StaggerItem>
                <div>
                <h2 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                  Organization Settings
                </h2>
                  <p className="text-gray-600 mt-1">Configure and customize your organization's platform settings and preferences</p>
                </div>
              </StaggerItem>

              {/* User Profile Settings */}
              <StaggerItem>
                <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-white/20 p-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-6 border-b border-gray-200 pb-3">User Profile</h3>
                  {settingsLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                      <span className="ml-2 text-gray-600">Loading settings...</span>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-semibold text-gray-800 mb-2">
                            Full Name <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={userSettings.name}
                            onChange={(e) => setUserSettings(prev => ({ ...prev, name: e.target.value }))}
                            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 placeholder-gray-400 text-gray-900"
                            placeholder="Enter your full name"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-800 mb-2">
                            Email Address <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="email"
                            value={userSettings.email}
                            onChange={(e) => setUserSettings(prev => ({ ...prev, email: e.target.value }))}
                            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 placeholder-gray-400 text-gray-900"
                            placeholder="Enter your email address"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-800 mb-2">
                          Role
                        </label>
                        <input
                          type="text"
                          value={userSettings.role}
                          disabled
                          className="w-full px-4 py-3 bg-gray-100 border border-gray-200 rounded-lg text-gray-500 cursor-not-allowed"
                        />
                      </div>
                      <div className="flex justify-end">
                        <button 
                          onClick={saveSettings}
                          disabled={settingsLoading}
                          className="px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 shadow-sm hover:shadow-md transition-all duration-200"
                        >
                          {settingsLoading ? 'Saving...' : 'Save Profile'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </StaggerItem>

              {/* Organization Profile Settings */}
              <StaggerItem>
                <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-white/20 p-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-6 border-b border-gray-200 pb-3">Organization Profile</h3>
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-semibold text-gray-800 mb-2">
                          Organization Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={organizationSettings.name}
                          onChange={(e) => setOrganizationSettings(prev => ({ ...prev, name: e.target.value }))}
                          className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 placeholder-gray-400 text-gray-900"
                          placeholder="Enter organization name"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-800 mb-2">
                          Organization Type
                        </label>
                        <select 
                          value={organizationSettings.type}
                          onChange={(e) => setOrganizationSettings(prev => ({ ...prev, type: e.target.value }))}
                          className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-gray-900"
                        >
                          <option value="school">School</option>
                          <option value="college">College</option>
                          <option value="university">University</option>
                          <option value="ngo">NGO</option>
                          <option value="private-institute">Private Institute</option>
                          <option value="trust">Trust</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-800 mb-2">
                        Organization Description
                      </label>
                      <textarea
                        rows={3}
                        value={organizationSettings.description}
                        onChange={(e) => setOrganizationSettings(prev => ({ ...prev, description: e.target.value }))}
                        className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 placeholder-gray-400 text-gray-900"
                        placeholder="Describe your organization's mission and goals"
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-semibold text-gray-800 mb-2">
                          Contact Email
                        </label>
                        <input
                          type="email"
                          value={organizationSettings.contactEmail}
                          onChange={(e) => setOrganizationSettings(prev => ({ ...prev, contactEmail: e.target.value }))}
                          className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 placeholder-gray-400 text-gray-900"
                          placeholder="contact@organization.com"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-800 mb-2">
                          Contact Phone
                        </label>
                        <input
                          type="tel"
                          value={organizationSettings.contactPhone}
                          onChange={(e) => setOrganizationSettings(prev => ({ ...prev, contactPhone: e.target.value }))}
                          className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 placeholder-gray-400 text-gray-900"
                          placeholder="+1 (555) 123-4567"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-800 mb-2">
                        Website URL
                      </label>
                      <input
                        type="url"
                        value={organizationSettings.website}
                        onChange={(e) => setOrganizationSettings(prev => ({ ...prev, website: e.target.value }))}
                        className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 placeholder-gray-400 text-gray-900"
                        placeholder="https://www.organization.com"
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-semibold text-gray-800 mb-2">
                          Address
                        </label>
                        <input
                          type="text"
                          value={organizationSettings.address}
                          onChange={(e) => setOrganizationSettings(prev => ({ ...prev, address: e.target.value }))}
                          className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 placeholder-gray-400 text-gray-900"
                          placeholder="Enter organization address"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-800 mb-2">
                          City
                        </label>
                        <input
                          type="text"
                          value={organizationSettings.city}
                          onChange={(e) => setOrganizationSettings(prev => ({ ...prev, city: e.target.value }))}
                          className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 placeholder-gray-400 text-gray-900"
                          placeholder="Enter city"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-semibold text-gray-800 mb-2">
                          State
                        </label>
                        <input
                          type="text"
                          value={organizationSettings.state}
                          onChange={(e) => setOrganizationSettings(prev => ({ ...prev, state: e.target.value }))}
                          className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 placeholder-gray-400 text-gray-900"
                          placeholder="Enter state"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-800 mb-2">
                          Country
                        </label>
                        <input
                          type="text"
                          value={organizationSettings.country}
                          onChange={(e) => setOrganizationSettings(prev => ({ ...prev, country: e.target.value }))}
                          className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 placeholder-gray-400 text-gray-900"
                          placeholder="Enter country"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end">
                      <button 
                        onClick={saveSettings}
                        disabled={settingsLoading}
                        className="px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 shadow-sm hover:shadow-md transition-all duration-200"
                      >
                        {settingsLoading ? 'Saving...' : 'Save Profile'}
                      </button>
                    </div>
                  </div>
                </div>
              </StaggerItem>

              {/* Security Settings */}
              <StaggerItem>
                <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-white/20 p-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-6 border-b border-gray-200 pb-3">Security & Access</h3>
                  <div className="space-y-6">
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <h4 className="font-medium text-gray-900">Two-Factor Authentication</h4>
                        <p className="text-sm text-gray-600">Add an extra layer of security to your account</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <h4 className="font-medium text-gray-900">Session Timeout</h4>
                        <p className="text-sm text-gray-600">Automatically log out inactive users</p>
                      </div>
                      <select className="px-3 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900">
                        <option value="30">30 minutes</option>
                        <option value="60">1 hour</option>
                        <option value="120">2 hours</option>
                        <option value="480">8 hours</option>
                      </select>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <h4 className="font-medium text-gray-900">Password Policy</h4>
                        <p className="text-sm text-gray-600">Enforce strong password requirements</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" defaultChecked />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                  </div>
                </div>
              </StaggerItem>

              {/* Notification Settings */}
              <StaggerItem>
                <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-white/20 p-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-6 border-b border-gray-200 pb-3">Notifications</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <h4 className="font-medium text-gray-900">Email Notifications</h4>
                        <p className="text-sm text-gray-600">Receive updates via email</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" defaultChecked />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <h4 className="font-medium text-gray-900">New User Registrations</h4>
                        <p className="text-sm text-gray-600">Get notified when new users join</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" defaultChecked />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <h4 className="font-medium text-gray-900">System Updates</h4>
                        <p className="text-sm text-gray-600">Receive notifications about platform updates</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" defaultChecked />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                  </div>
                </div>
              </StaggerItem>

              {/* Integration Settings */}
              <StaggerItem>
                <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-white/20 p-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-6 border-b border-gray-200 pb-3">Integrations</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium text-gray-900">Google Workspace</h4>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" className="sr-only peer" />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>
                      <p className="text-sm text-gray-600">Sync with Google Workspace for seamless user management</p>
        </div>
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium text-gray-900">Microsoft 365</h4>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" className="sr-only peer" />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>
                      <p className="text-sm text-gray-600">Integrate with Microsoft 365 for user authentication</p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium text-gray-900">Slack</h4>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" className="sr-only peer" />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>
                      <p className="text-sm text-gray-600">Send notifications to Slack channels</p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium text-gray-900">API Access</h4>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" className="sr-only peer" />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>
                      <p className="text-sm text-gray-600">Enable API access for third-party integrations</p>
                    </div>
                  </div>
                </div>
              </StaggerItem>

              {/* Danger Zone */}
              <StaggerItem>
                <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-red-200 p-6">
                  <h3 className="text-xl font-semibold text-red-600 mb-6 border-b border-red-200 pb-3">Danger Zone</h3>
                  <div className="space-y-4">
                    <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                      <h4 className="font-medium text-red-900 mb-2">Export Organization Data</h4>
                      <p className="text-sm text-red-700 mb-3">Download all organization data including users, content, and settings</p>
                      <button className="px-4 py-2 text-sm font-medium text-red-700 bg-red-100 border border-red-300 rounded-lg hover:bg-red-200 transition-all duration-200">
                        Export Data
                      </button>
                    </div>
                    <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                      <h4 className="font-medium text-red-900 mb-2">Delete Organization</h4>
                      <p className="text-sm text-red-700 mb-3">Permanently delete your organization and all associated data. This action cannot be undone.</p>
                      <button className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-red-600 rounded-lg hover:bg-red-700 transition-all duration-200">
                        Delete Organization
                      </button>
                    </div>
                  </div>
                </div>
              </StaggerItem>
            </StaggerContainer>
          )}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
