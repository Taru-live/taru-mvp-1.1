'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { StaggerContainer, StaggerItem } from '../../../components/PageTransitions';

interface ReportData {
  studentProgress?: any;
  teacherPerformance?: any;
  branchAnalytics?: any;
  usageStatistics?: any;
}

interface ReportsCenterProps {
  onBack?: () => void;
}

export default function ReportsCenter({ onBack }: ReportsCenterProps) {
  const [activeReport, setActiveReport] = useState<string | null>(null);
  const [reportData, setReportData] = useState<ReportData>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [dateRange, setDateRange] = useState({ startDate: '', endDate: '' });

  const reportTypes = [
    {
      id: 'student-progress',
      title: 'Student Progress Reports',
      description: 'Aggregated student performance including overall progress, completed modules, quiz scores, and learning path completion',
      icon: '📊',
      color: 'blue'
    },
    {
      id: 'teacher-performance',
      title: 'Teacher Performance Reports',
      description: 'Track teacher activity, assigned students, student engagement, and teaching effectiveness metrics',
      icon: '👨‍🏫',
      color: 'green'
    },
    {
      id: 'branch-analytics',
      title: 'Branch Analytics',
      description: 'Compare performance across different branches including student count, average progress, and completion rates',
      icon: '🏢',
      color: 'purple'
    },
    {
      id: 'usage-statistics',
      title: 'Usage Statistics',
      description: 'Platform usage data including daily/monthly active users, feature usage, and system adoption',
      icon: '📈',
      color: 'orange'
    }
  ];

  const fetchReport = async (reportType: string) => {
    setLoading(prev => ({ ...prev, [reportType]: true }));
    try {
      const params = new URLSearchParams({
        type: reportType,
        ...(dateRange.startDate && { startDate: dateRange.startDate }),
        ...(dateRange.endDate && { endDate: dateRange.endDate })
      });

      const response = await fetch(`/api/organization/reports?${params}`, {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setReportData(prev => ({
          ...prev,
          [reportType]: data.data
        }));
      } else {
        console.error('Failed to fetch report:', await response.json());
      }
    } catch (error) {
      console.error('Error fetching report:', error);
    } finally {
      setLoading(prev => ({ ...prev, [reportType]: false }));
    }
  };

  const handleReportClick = (reportType: string) => {
    setActiveReport(reportType);
    if (!reportData[reportType as keyof ReportData]) {
      fetchReport(reportType);
    }
  };

  const handleDateRangeChange = () => {
    if (activeReport) {
      fetchReport(activeReport);
    }
  };

  const colorClasses = {
    blue: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      text: 'text-blue-900',
      textLight: 'text-blue-700',
      button: 'bg-blue-600 hover:bg-blue-700',
      accent: 'bg-blue-500'
    },
    green: {
      bg: 'bg-green-50',
      border: 'border-green-200',
      text: 'text-green-900',
      textLight: 'text-green-700',
      button: 'bg-green-600 hover:bg-green-700',
      accent: 'bg-green-500'
    },
    purple: {
      bg: 'bg-purple-50',
      border: 'border-purple-200',
      text: 'text-purple-900',
      textLight: 'text-purple-700',
      button: 'bg-purple-600 hover:bg-purple-700',
      accent: 'bg-purple-500'
    },
    orange: {
      bg: 'bg-orange-50',
      border: 'border-orange-200',
      text: 'text-orange-900',
      textLight: 'text-orange-700',
      button: 'bg-orange-600 hover:bg-orange-700',
      accent: 'bg-orange-500'
    }
  };

  if (activeReport) {
    const reportType = reportTypes.find(r => r.id === activeReport);
    const colors = reportType ? colorClasses[reportType.color as keyof typeof colorClasses] : colorClasses.blue;
    const data = reportData[activeReport as keyof ReportData];
    const isLoading = loading[activeReport];

    return (
      <div className="space-y-6">
        {/* Header with back button */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setActiveReport(null)}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              ← Back
            </button>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{reportType?.title}</h2>
              <p className="text-gray-600 text-sm mt-1">{reportType?.description}</p>
            </div>
          </div>
          
          {/* Date Range Filter */}
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={dateRange.startDate}
              onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
            <span className="text-gray-500">to</span>
            <input
              type="date"
              value={dateRange.endDate}
              onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
            <button
              onClick={handleDateRangeChange}
              className={`px-4 py-2 rounded-lg text-white text-sm ${colors.button}`}
            >
              Apply
            </button>
          </div>
        </div>

        {/* Report Content */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
          </div>
        ) : data ? (
          <div className="space-y-6">
            {activeReport === 'student-progress' && <StudentProgressReport data={data} colors={colors} />}
            {activeReport === 'teacher-performance' && <TeacherPerformanceReport data={data} colors={colors} />}
            {activeReport === 'branch-analytics' && <BranchAnalyticsReport data={data} colors={colors} />}
            {activeReport === 'usage-statistics' && <UsageStatisticsReport data={data} colors={colors} />}
          </div>
        ) : (
          <div className="text-center py-20 text-gray-500">
            No data available
          </div>
        )}
      </div>
    );
  }

  return (
    <StaggerContainer className="space-y-6">
      <StaggerItem>
        <div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
            Reports Center
          </h2>
          <p className="text-gray-600 mt-1">Generate and view comprehensive reports for your organization</p>
        </div>
      </StaggerItem>

      <StaggerItem>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {reportTypes.map((report) => {
            const colors = colorClasses[report.color as keyof typeof colorClasses];
            return (
              <motion.div
                key={report.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleReportClick(report.id)}
                className={`${colors.bg} ${colors.border} border-2 rounded-xl p-6 cursor-pointer transition-all hover:shadow-lg`}
              >
                <div className="flex items-start gap-4">
                  <div className="text-4xl">{report.icon}</div>
                  <div className="flex-1">
                    <h3 className={`text-xl font-semibold ${colors.text} mb-2`}>
                      {report.title}
                    </h3>
                    <p className={`text-sm ${colors.textLight} mb-4`}>
                      {report.description}
                    </p>
                    <div className={`inline-flex items-center gap-2 ${colors.text} text-sm font-medium`}>
                      View Report →
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </StaggerItem>
    </StaggerContainer>
  );
}

// Student Progress Report Component
function StudentProgressReport({ data, colors }: { data: any; colors: any }) {
  const { students, summary } = data;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard label="Total Students" value={summary.totalStudents} colors={colors} />
        <StatCard label="Active Students" value={summary.activeStudents} colors={colors} />
        <StatCard label="Avg Progress" value={`${summary.avgOverallProgress}%`} colors={colors} />
        <StatCard label="Avg Quiz Score" value={`${summary.avgQuizScore}%`} colors={colors} />
      </div>

      {/* Students Table */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Student Details</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Class</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Progress</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Completed</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quiz Score</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {students && students.length > 0 ? (
                students.map((student: any) => (
                  <tr key={student.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{student.name}</div>
                      <div className="text-sm text-gray-500">{student.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{student.classGrade}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-gray-200 rounded-full h-2 w-24">
                          <div
                            className={`${colors.accent} h-2 rounded-full`}
                            style={{ width: `${student.overallProgress}%` }}
                          />
                        </div>
                        <span className="text-sm text-gray-900">{student.overallProgress}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {student.completedModules} / {student.totalModules}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{student.averageQuizScore}%</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        student.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {student.isActive ? 'Active' : 'Disabled'}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    No students found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// Teacher Performance Report Component
function TeacherPerformanceReport({ data, colors }: { data: any; colors: any }) {
  const { teachers, summary } = data;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard label="Total Teachers" value={summary.totalTeachers} colors={colors} />
        <StatCard label="Active Teachers" value={summary.activeTeachers} colors={colors} />
        <StatCard label="Avg Engagement" value={`${summary.avgStudentEngagement}%`} colors={colors} />
        <StatCard label="Avg Effectiveness" value={`${summary.avgTeachingEffectiveness}%`} colors={colors} />
      </div>

      {/* Teachers Table */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Teacher Details</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subject</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Students</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Engagement</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Effectiveness</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quiz Attempts</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {teachers && teachers.length > 0 ? (
                teachers.map((teacher: any) => (
                  <tr key={teacher.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{teacher.name}</div>
                      <div className="text-sm text-gray-500">{teacher.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{teacher.subjectSpecialization}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {teacher.activeStudents} / {teacher.assignedStudents}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-gray-200 rounded-full h-2 w-24">
                          <div
                            className={`${colors.accent} h-2 rounded-full`}
                            style={{ width: `${teacher.studentEngagement}%` }}
                          />
                        </div>
                        <span className="text-sm text-gray-900">{teacher.studentEngagement}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{teacher.teachingEffectiveness}%</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{teacher.totalQuizAttempts}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    No teachers found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// Branch Analytics Report Component
function BranchAnalyticsReport({ data, colors }: { data: any; colors: any }) {
  const { branches, summary } = data;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard label="Total Branches" value={summary.totalBranches} colors={colors} />
        <StatCard label="Total Students" value={summary.totalStudents} colors={colors} />
        <StatCard label="Avg Progress" value={`${summary.avgProgress}%`} colors={colors} />
        <StatCard label="Avg Completion" value={`${summary.avgCompletionRate}%`} colors={colors} />
      </div>

      {/* Branches Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {branches && branches.length > 0 ? (
          branches.map((branch: any) => (
            <div key={branch.id} className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{branch.branchName}</h3>
                  <p className="text-sm text-gray-500">{branch.branchCode} • {branch.city}, {branch.state}</p>
                </div>
              </div>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Students</p>
                    <p className="text-lg font-semibold text-gray-900">{branch.activeStudentCount} / {branch.studentCount}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Teachers</p>
                    <p className="text-lg font-semibold text-gray-900">{branch.teacherCount}</p>
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-xs text-gray-500">Average Progress</p>
                    <span className="text-sm font-medium text-gray-900">{branch.avgProgress}%</span>
                  </div>
                  <div className="bg-gray-200 rounded-full h-2">
                    <div
                      className={`${colors.accent} h-2 rounded-full`}
                      style={{ width: `${branch.avgProgress}%` }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-xs text-gray-500">Completion Rate</p>
                    <span className="text-sm font-medium text-gray-900">{branch.completionRate}%</span>
                  </div>
                  <div className="bg-gray-200 rounded-full h-2">
                    <div
                      className={`${colors.accent} h-2 rounded-full`}
                      style={{ width: `${branch.completionRate}%` }}
                    />
                  </div>
                </div>
                <div className="pt-2 border-t border-gray-200">
                  <p className="text-xs text-gray-500">Engagement Trend</p>
                  <p className="text-lg font-semibold text-gray-900">{branch.engagementTrend}%</p>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-2 text-center py-12 text-gray-500">
            No branches found
          </div>
        )}
      </div>
    </div>
  );
}

// Usage Statistics Report Component
function UsageStatisticsReport({ data, colors }: { data: any; colors: any }) {
  const { dailyActiveUsers, monthlyActiveUsers, totalUsers, featureUsage, systemAdoption, activityByType } = data;

  return (
    <div className="space-y-6">
      {/* User Activity Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard label="Daily Active Users" value={dailyActiveUsers} colors={colors} />
        <StatCard label="Monthly Active Users" value={monthlyActiveUsers} colors={colors} />
        <StatCard label="Total Users" value={totalUsers} colors={colors} />
      </div>

      {/* Feature Usage */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Feature Usage</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-2xl font-bold text-gray-900">{featureUsage.quizAttempts}</p>
            <p className="text-sm text-gray-500 mt-1">Quiz Attempts</p>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-2xl font-bold text-gray-900">{featureUsage.learningPathUsage}</p>
            <p className="text-sm text-gray-500 mt-1">Learning Paths</p>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-2xl font-bold text-gray-900">{featureUsage.interactiveUsage}</p>
            <p className="text-sm text-gray-500 mt-1">Interactive Sessions</p>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-2xl font-bold text-gray-900">{featureUsage.videoWatchTime}</p>
            <p className="text-sm text-gray-500 mt-1">Video Minutes</p>
          </div>
        </div>
      </div>

      {/* System Adoption */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">System Adoption</h3>
        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Adoption Rate</span>
              <span className="text-sm font-medium text-gray-900">{systemAdoption.adoptionRate}%</span>
            </div>
            <div className="bg-gray-200 rounded-full h-3">
              <div
                className={`${colors.accent} h-3 rounded-full`}
                style={{ width: `${systemAdoption.adoptionRate}%` }}
              />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-200">
            <div>
              <p className="text-xs text-gray-500 mb-1">Total Modules</p>
              <p className="text-lg font-semibold text-gray-900">{systemAdoption.totalModules}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Students with Progress</p>
              <p className="text-lg font-semibold text-gray-900">{systemAdoption.studentsWithProgress}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Avg Modules/Student</p>
              <p className="text-lg font-semibold text-gray-900">{systemAdoption.avgModulesPerStudent}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Activity by Type */}
      {activityByType && activityByType.length > 0 && (
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Activity by Type</h3>
          <div className="space-y-2">
            {activityByType.map((item: any, index: number) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-700">{item.action || 'Unknown'}</span>
                <span className="text-sm font-medium text-gray-900">{item.count}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Stat Card Component
function StatCard({ label, value, colors }: { label: string; value: string | number; colors: any }) {
  return (
    <div className={`${colors.bg} border ${colors.border} rounded-xl p-4`}>
      <p className={`text-sm ${colors.textLight} mb-1`}>{label}</p>
      <p className={`text-2xl font-bold ${colors.text}`}>{value}</p>
    </div>
  );
}
