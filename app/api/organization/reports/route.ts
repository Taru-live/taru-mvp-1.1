import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import Organization from '@/models/Organization';
import Branch from '@/models/Branch';
import Teacher from '@/models/Teacher';
import Student from '@/models/Student';
import StudentProgress from '@/models/StudentProgress';
import AuditLog from '@/models/AuditLog';
import Test from '@/models/Test';
import TestSubmission from '@/models/TestSubmission';
import TestEvaluation from '@/models/TestEvaluation';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

interface DecodedToken {
  userId: string;
  role: string;
  [key: string]: unknown;
}

// Helper function to get organization ID with authorization
async function getOrganizationId(user: any): Promise<string> {
  if (user.role === 'platform_super_admin') {
    // Super admin can access any organization (handled via query param)
    return '';
  }
  
  const organization = await Organization.findOne({ userId: user._id.toString() });
  if (!organization) {
    throw new Error('Organization not found');
  }
  return organization._id.toString();
}

// Helper function to get all student IDs for an organization
async function getOrganizationStudentIds(organizationId: string): Promise<string[]> {
  const students = await Student.find({ organizationId });
  return students.map(s => s.uniqueId || s.userId);
}

// Helper function to get all teacher IDs for an organization
async function getOrganizationTeacherIds(organizationId: string): Promise<string[]> {
  const branches = await Branch.find({ organizationId, isActive: true });
  const branchIds = branches.map(b => b._id.toString());
  const teachers = await Teacher.find({ 
    schoolId: { $in: branchIds },
    isActive: true 
  });
  return teachers.map(t => t.userId);
}

// Student Progress Reports
async function getStudentProgressReport(organizationId: string, startDate?: string, endDate?: string) {
  const students = await Student.find({ organizationId });
  const studentIds = students.map(s => s.uniqueId || s.userId);
  
  // Get all progress data
  const progressData = await StudentProgress.find({ 
    studentId: { $in: studentIds }
  });

  // Build date filter for recent activity
  const dateFilter: any = {};
  if (startDate) dateFilter.$gte = new Date(startDate);
  if (endDate) dateFilter.$lte = new Date(endDate);

  const studentReports = await Promise.all(students.map(async (student) => {
    const studentId = student.uniqueId || student.userId;
    const progress = progressData.find(p => p.studentId === studentId);
    const user = await User.findById(student.userId);
    
    if (!progress) {
      return {
        id: student._id.toString(),
        studentId: studentId,
        name: student.fullName,
        email: user?.email || 'N/A',
        classGrade: student.classGrade,
        schoolName: student.schoolName,
        isActive: user?.isActive !== false,
        overallProgress: 0,
        completedModules: 0,
        inProgressModules: 0,
        totalModules: 0,
        averageQuizScore: 0,
        learningPathCompletion: 0,
        totalPoints: 0,
        learningStreak: 0,
        recentActivity: null,
        joinedAt: student.createdAt,
        createdBy: student.createdBy || null,
        managedBy: student.managedBy || null,
        teacherId: student.teacherId || null
      };
    }

    // Calculate progress metrics
    const moduleProgress = progress.moduleProgress || [];
    const completedModules = moduleProgress.filter((mp: any) => 
      mp.quizScore >= 75 || mp.completedAt
    ).length;
    
    const inProgressModules = moduleProgress.filter((mp: any) => 
      (mp.quizScore > 0 || mp.videoProgress?.watchTime > 0) && 
      !(mp.quizScore >= 75 || mp.completedAt)
    ).length;

    const totalModules = moduleProgress.length;
    const overallProgress = totalModules > 0 
      ? Math.round((completedModules / totalModules) * 100)
      : 0;

    // Calculate average quiz score
    const scoresWithQuiz = moduleProgress.filter((mp: any) => mp.quizScore > 0);
    const averageQuizScore = scoresWithQuiz.length > 0
      ? Math.round(scoresWithQuiz.reduce((sum: number, mp: any) => sum + mp.quizScore, 0) / scoresWithQuiz.length)
      : 0;

    // Learning path completion (modules with learningPath array)
    const modulesWithPath = moduleProgress.filter((mp: any) => 
      mp.learningPath && mp.learningPath.length > 0
    );
    const completedPaths = modulesWithPath.filter((mp: any) => 
      mp.quizScore >= 75 || mp.completedAt
    ).length;
    const learningPathCompletion = modulesWithPath.length > 0
      ? Math.round((completedPaths / modulesWithPath.length) * 100)
      : 0;

    // Get recent activity (last accessed module)
    const recentModule = moduleProgress
      .filter((mp: any) => mp.lastAccessedAt)
      .sort((a: any, b: any) => 
        new Date(b.lastAccessedAt).getTime() - new Date(a.lastAccessedAt).getTime()
      )[0];

    return {
      id: student._id.toString(),
      studentId: studentId,
      name: student.fullName,
      email: user?.email || 'N/A',
      classGrade: student.classGrade,
      schoolName: student.schoolName,
      isActive: user?.isActive !== false,
      overallProgress,
      completedModules,
      inProgressModules,
      totalModules,
      averageQuizScore,
      learningPathCompletion,
      totalPoints: progress.totalPoints || 0,
      learningStreak: progress.learningStreak || 0,
      recentActivity: recentModule ? {
        moduleId: recentModule.moduleId,
        lastAccessedAt: recentModule.lastAccessedAt
      } : null,
      joinedAt: student.createdAt,
      createdBy: student.createdBy || null,
      managedBy: student.managedBy || null,
      teacherId: student.teacherId || null
    };
  }));

  // Aggregate statistics
  const totalStudents = studentReports.length;
  const activeStudents = studentReports.filter(s => s.isActive).length;
  const avgOverallProgress = totalStudents > 0
    ? Math.round(studentReports.reduce((sum, s) => sum + s.overallProgress, 0) / totalStudents)
    : 0;
  const avgQuizScore = totalStudents > 0
    ? Math.round(studentReports.reduce((sum, s) => sum + s.averageQuizScore, 0) / totalStudents)
    : 0;
  const totalCompletedModules = studentReports.reduce((sum, s) => sum + s.completedModules, 0);

  return {
    students: studentReports,
    summary: {
      totalStudents,
      activeStudents,
      disabledStudents: totalStudents - activeStudents,
      avgOverallProgress,
      avgQuizScore,
      totalCompletedModules,
      totalInProgressModules: studentReports.reduce((sum, s) => sum + s.inProgressModules, 0)
    }
  };
}

// Teacher Performance Reports
async function getTeacherPerformanceReport(organizationId: string, startDate?: string, endDate?: string) {
  const branches = await Branch.find({ organizationId, isActive: true });
  const branchIds = branches.map(b => b._id.toString());
  const teachers = await Teacher.find({ 
    schoolId: { $in: branchIds },
    isActive: true 
  });

  const teacherReports = await Promise.all(teachers.map(async (teacher) => {
    // Get assigned students
    const assignedStudents = await Student.find({ 
      teacherId: teacher.userId,
      organizationId 
    });
    
    const studentIds = assignedStudents.map(s => s.uniqueId || s.userId);
    const progressData = await StudentProgress.find({ 
      studentId: { $in: studentIds }
    });

    // Calculate student engagement metrics
    const assignedUserIds = assignedStudents.map(s => s.userId);
    const assignedUsers = await User.find({ _id: { $in: assignedUserIds } });
    const activeUserIds = new Set(assignedUsers.filter(u => u.isActive !== false).map(u => u._id.toString()));
    const activeStudents = assignedStudents.filter(s => activeUserIds.has(s.userId)).length;

    // Calculate content/quiz involvement
    let totalQuizAttempts = 0;
    let totalContentInteractions = 0;
    let avgStudentProgress = 0;

    if (progressData.length > 0) {
      progressData.forEach((progress) => {
        const moduleProgress = progress.moduleProgress || [];
        totalQuizAttempts += moduleProgress.reduce((sum: number, mp: any) => 
          sum + (mp.quizAttempts?.length || 0), 0
        );
        totalContentInteractions += moduleProgress.filter((mp: any) => 
          mp.videoProgress?.watchTime > 0 || mp.interactiveProgress
        ).length;
      });

      const totalProgress = progressData.reduce((sum, p) => {
        const completed = (p.moduleProgress || []).filter((mp: any) => 
          mp.quizScore >= 75 || mp.completedAt
        ).length;
        const total = (p.moduleProgress || []).length;
        return sum + (total > 0 ? (completed / total) * 100 : 0);
      }, 0);
      avgStudentProgress = progressData.length > 0 
        ? Math.round(totalProgress / progressData.length)
        : 0;
    }

    // Calculate test-related metrics
    const teacherTests = await Test.find({
      'createdBy.id': teacher.userId,
      'createdBy.type': 'teacher',
      organizationId
    });
    const testIds = teacherTests.map(t => t._id.toString());
    const testSubmissions = await TestSubmission.find({
      testId: { $in: testIds }
    });
    const testEvaluations = await TestEvaluation.find({
      testId: { $in: testIds }
    });

    const gradedSubmissions = testSubmissions.filter(s => s.status === 'graded' && s.totalScore !== undefined);
    let avgTestScore = 0;
    let testPassRate = 0;
    if (gradedSubmissions.length > 0) {
      const totalScore = gradedSubmissions.reduce((sum, s) => sum + (s.totalScore || 0), 0);
      const totalMaxScore = gradedSubmissions.reduce((sum, s) => {
        const test = teacherTests.find(t => t._id.toString() === s.testId.toString());
        return sum + (test?.totalPoints || 100);
      }, 0);
      avgTestScore = totalMaxScore > 0 ? Math.round((totalScore / totalMaxScore) * 100) : 0;
      testPassRate = Math.round(
        (gradedSubmissions.filter(s => s.isPassed).length / gradedSubmissions.length) * 100
      );
    }

    // Get teacher user data
    const user = await User.findById(teacher.userId);

    return {
      id: teacher._id.toString(),
      name: teacher.fullName,
      email: teacher.email,
      subjectSpecialization: teacher.subjectSpecialization,
      experienceYears: teacher.experienceYears,
      assignedStudents: assignedStudents.length,
      activeStudents,
      studentEngagement: assignedStudents.length > 0
        ? Math.round((activeStudents / assignedStudents.length) * 100)
        : 0,
      totalQuizAttempts,
      totalContentInteractions,
      avgStudentProgress,
      teachingEffectiveness: avgStudentProgress, // Simplified metric
      // Test-related metrics
      testsCreated: teacherTests.length,
      testSubmissions: testSubmissions.length,
      testEvaluations: testEvaluations.length,
      avgTestScore,
      testPassRate,
      joinedAt: teacher.createdAt,
      isActive: user?.isActive !== false
    };
  }));

  // Aggregate statistics
  const totalTeachers = teacherReports.length;
  const activeTeachers = teacherReports.filter(t => t.isActive).length;
  const avgStudentEngagement = totalTeachers > 0
    ? Math.round(teacherReports.reduce((sum, t) => sum + t.studentEngagement, 0) / totalTeachers)
    : 0;
  const avgTeachingEffectiveness = totalTeachers > 0
    ? Math.round(teacherReports.reduce((sum, t) => sum + t.teachingEffectiveness, 0) / totalTeachers)
    : 0;
  const totalAssignedStudents = teacherReports.reduce((sum, t) => sum + t.assignedStudents, 0);

  return {
    teachers: teacherReports,
    summary: {
      totalTeachers,
      activeTeachers,
      totalAssignedStudents,
      avgStudentEngagement,
      avgTeachingEffectiveness,
      totalQuizAttempts: teacherReports.reduce((sum, t) => sum + t.totalQuizAttempts, 0),
      totalContentInteractions: teacherReports.reduce((sum, t) => sum + t.totalContentInteractions, 0)
    }
  };
}

// Branch Analytics
async function getBranchAnalytics(organizationId: string, startDate?: string, endDate?: string) {
  const branches = await Branch.find({ organizationId, isActive: true });

  const branchReports = await Promise.all(branches.map(async (branch) => {
    // Get teachers in this branch
    const teachers = await Teacher.find({ 
      schoolId: branch._id.toString(),
      isActive: true 
    });
    const teacherIds = teachers.map(t => t.userId);

    // Get students in this branch (via teachers)
    const students = await Student.find({ 
      teacherId: { $in: teacherIds },
      organizationId 
    });

    const studentIds = students.map(s => s.uniqueId || s.userId);
    const progressData = await StudentProgress.find({ 
      studentId: { $in: studentIds }
    });

    // Calculate metrics - get active students
    const studentUserIds = students.map(s => s.userId);
    const studentUsers = await User.find({ _id: { $in: studentUserIds } });
    const activeUserIds = new Set(studentUsers.filter(u => u.isActive !== false).map(u => u._id.toString()));
    const activeStudents = students.filter(s => activeUserIds.has(s.userId)).length;

    // Calculate average progress
    let avgProgress = 0;
    if (progressData.length > 0) {
      const totalProgress = progressData.reduce((sum, p) => {
        const completed = (p.moduleProgress || []).filter((mp: any) => 
          mp.quizScore >= 75 || mp.completedAt
        ).length;
        const total = (p.moduleProgress || []).length;
        return sum + (total > 0 ? (completed / total) * 100 : 0);
      }, 0);
      avgProgress = Math.round(totalProgress / progressData.length);
    }

    // Calculate completion rate
    const totalModules = progressData.reduce((sum, p) => 
      sum + (p.moduleProgress || []).length, 0
    );
    const completedModules = progressData.reduce((sum, p) => 
      sum + (p.moduleProgress || []).filter((mp: any) => 
        mp.quizScore >= 75 || mp.completedAt
      ).length, 0
    );
    const completionRate = totalModules > 0
      ? Math.round((completedModules / totalModules) * 100)
      : 0;

    // Calculate engagement trends (simplified - based on recent activity)
    const recentActivityCount = progressData.filter(p => {
      const recentModule = (p.moduleProgress || []).find((mp: any) => 
        mp.lastAccessedAt && 
        new Date(mp.lastAccessedAt).getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000
      );
      return !!recentModule;
    }).length;
    const engagementTrend = students.length > 0
      ? Math.round((recentActivityCount / students.length) * 100)
      : 0;

    return {
      id: branch._id.toString(),
      branchName: branch.branchName,
      branchCode: branch.branchCode,
      city: branch.city,
      state: branch.state,
      studentCount: students.length,
      activeStudentCount: activeStudents,
      teacherCount: teachers.length,
      avgProgress,
      completionRate,
      engagementTrend,
      totalModules,
      completedModules
    };
  }));

  // Aggregate statistics
  const totalBranches = branchReports.length;
  const totalStudents = branchReports.reduce((sum, b) => sum + b.studentCount, 0);
  const totalActiveStudents = branchReports.reduce((sum, b) => sum + b.activeStudentCount, 0);
  const avgProgress = totalBranches > 0
    ? Math.round(branchReports.reduce((sum, b) => sum + b.avgProgress, 0) / totalBranches)
    : 0;
  const avgCompletionRate = totalBranches > 0
    ? Math.round(branchReports.reduce((sum, b) => sum + b.completionRate, 0) / totalBranches)
    : 0;

  return {
    branches: branchReports,
    summary: {
      totalBranches,
      totalStudents,
      totalActiveStudents,
      avgProgress,
      avgCompletionRate,
      totalTeachers: branchReports.reduce((sum, b) => sum + b.teacherCount, 0)
    }
  };
}

// Test Analytics Report
async function getTestAnalyticsReport(organizationId: string, startDate?: string, endDate?: string) {
  // Build date filter
  const dateFilter: any = {};
  if (startDate) dateFilter.$gte = new Date(startDate);
  if (endDate) dateFilter.$lte = new Date(endDate);

  // Get all tests for the organization
  const tests = await Test.find({ organizationId });
  const testIds = tests.map(t => t._id.toString());

  // Get submissions and evaluations
  const submissionQuery: any = { testId: { $in: testIds } };
  const evaluationQuery: any = { testId: { $in: testIds } };
  if (Object.keys(dateFilter).length > 0) {
    submissionQuery.submittedAt = dateFilter;
    evaluationQuery.evaluatedAt = dateFilter;
  }

  const submissions = await TestSubmission.find(submissionQuery);
  const evaluations = await TestEvaluation.find(evaluationQuery);

  // Subject-wise analytics
  const subjects = new Set(tests.map(t => t.subject));
  const subjectWise: Record<string, any> = {};

  subjects.forEach(subject => {
    const subjectTests = tests.filter(t => t.subject === subject);
    const subjectTestIds = subjectTests.map(t => t._id.toString());
    const subjectSubmissions = submissions.filter(s => 
      subjectTestIds.includes(s.testId.toString())
    );
    const subjectEvaluations = evaluations.filter(e => 
      subjectTestIds.includes(e.testId.toString())
    );

    const gradedSubmissions = subjectSubmissions.filter(s => 
      s.status === 'graded' && s.totalScore !== undefined
    );

    let avgScore = 0;
    let avgPercentage = 0;
    let passRate = 0;

    if (gradedSubmissions.length > 0) {
      const totalScore = gradedSubmissions.reduce((sum, s) => sum + (s.totalScore || 0), 0);
      const totalMaxScore = gradedSubmissions.reduce((sum, s) => {
        const test = subjectTests.find(t => t._id.toString() === s.testId.toString());
        return sum + (test?.totalPoints || 100);
      }, 0);
      
      avgScore = Math.round(totalScore / gradedSubmissions.length);
      avgPercentage = totalMaxScore > 0 
        ? Math.round((totalScore / totalMaxScore) * 100)
        : 0;
      passRate = Math.round(
        (gradedSubmissions.filter(s => s.isPassed).length / gradedSubmissions.length) * 100
      );
    }

    subjectWise[subject] = {
      totalTests: subjectTests.length,
      totalSubmissions: subjectSubmissions.length,
      evaluatedSubmissions: subjectEvaluations.length,
      averageScore: avgScore,
      averagePercentage: avgPercentage,
      passRate,
      totalStudents: new Set(subjectSubmissions.map(s => s.studentId)).size
    };
  });

  // Class-wise analytics
  const classGrades = new Set(tests.map(t => t.classGrade).filter(Boolean));
  const classWise: Record<string, any> = {};

  classGrades.forEach(grade => {
    const classTests = tests.filter(t => t.classGrade === grade);
    const classTestIds = classTests.map(t => t._id.toString());
    const classSubmissions = submissions.filter(s => 
      classTestIds.includes(s.testId.toString())
    );

    const gradedClassSubmissions = classSubmissions.filter(s => 
      s.status === 'graded' && s.totalScore !== undefined
    );

    let avgScore = 0;
    let avgPercentage = 0;
    let passRate = 0;

    if (gradedClassSubmissions.length > 0) {
      const totalScore = gradedClassSubmissions.reduce((sum, s) => sum + (s.totalScore || 0), 0);
      const totalMaxScore = gradedClassSubmissions.reduce((sum, s) => {
        const test = classTests.find(t => t._id.toString() === s.testId.toString());
        return sum + (test?.totalPoints || 100);
      }, 0);
      
      avgScore = Math.round(totalScore / gradedClassSubmissions.length);
      avgPercentage = totalMaxScore > 0 
        ? Math.round((totalScore / totalMaxScore) * 100)
        : 0;
      passRate = Math.round(
        (gradedClassSubmissions.filter(s => s.isPassed).length / gradedClassSubmissions.length) * 100
      );
    }

    classWise[grade] = {
      totalTests: classTests.length,
      totalSubmissions: classSubmissions.length,
      averageScore: avgScore,
      averagePercentage: avgPercentage,
      passRate,
      totalStudents: new Set(classSubmissions.map(s => s.studentId)).size
    };
  });

  // Teacher-wise test performance
  const teachers = await Teacher.find({ organizationId, isActive: true });
  const teacherPerformance = await Promise.all(teachers.map(async (teacher) => {
    const teacherTests = await Test.find({
      'createdBy.id': teacher.userId,
      'createdBy.type': 'teacher',
      organizationId
    });
    const teacherTestIds = teacherTests.map(t => t._id.toString());
    const teacherSubmissions = submissions.filter(s => 
      teacherTestIds.includes(s.testId.toString())
    );
    const teacherEvaluations = evaluations.filter(e => 
      teacherTestIds.includes(e.testId.toString())
    );

    const gradedTeacherSubmissions = teacherSubmissions.filter(s => 
      s.status === 'graded' && s.totalScore !== undefined
    );

    let avgScore = 0;
    let avgPercentage = 0;
    let passRate = 0;

    if (gradedTeacherSubmissions.length > 0) {
      const totalScore = gradedTeacherSubmissions.reduce((sum, s) => sum + (s.totalScore || 0), 0);
      const totalMaxScore = gradedTeacherSubmissions.reduce((sum, s) => {
        const test = teacherTests.find(t => t._id.toString() === s.testId.toString());
        return sum + (test?.totalPoints || 100);
      }, 0);
      
      avgScore = Math.round(totalScore / gradedTeacherSubmissions.length);
      avgPercentage = totalMaxScore > 0 
        ? Math.round((totalScore / totalMaxScore) * 100)
        : 0;
      passRate = Math.round(
        (gradedTeacherSubmissions.filter(s => s.isPassed).length / gradedTeacherSubmissions.length) * 100
      );
    }

    return {
      teacherId: teacher._id.toString(),
      teacherName: teacher.fullName,
      subjectSpecialization: teacher.subjectSpecialization,
      testsCreated: teacherTests.length,
      totalSubmissions: teacherSubmissions.length,
      evaluatedSubmissions: teacherEvaluations.length,
      averageScore: avgScore,
      averagePercentage: avgPercentage,
      passRate
    };
  }));

  // Overall summary
  const gradedSubmissions = submissions.filter(s => 
    s.status === 'graded' && s.totalScore !== undefined
  );
  let overallAvgScore = 0;
  let overallAvgPercentage = 0;
  let overallPassRate = 0;

  if (gradedSubmissions.length > 0) {
    const totalScore = gradedSubmissions.reduce((sum, s) => sum + (s.totalScore || 0), 0);
    const totalMaxScore = gradedSubmissions.reduce((sum, s) => {
      const test = tests.find(t => t._id.toString() === s.testId.toString());
      return sum + (test?.totalPoints || 100);
    }, 0);
    
    overallAvgScore = Math.round(totalScore / gradedSubmissions.length);
    overallAvgPercentage = totalMaxScore > 0 
      ? Math.round((totalScore / totalMaxScore) * 100)
      : 0;
    overallPassRate = Math.round(
      (gradedSubmissions.filter(s => s.isPassed).length / gradedSubmissions.length) * 100
    );
  }

  return {
    summary: {
      totalTests: tests.length,
      publishedTests: tests.filter(t => t.status === 'published').length,
      totalSubmissions: submissions.length,
      evaluatedSubmissions: evaluations.length,
      pendingEvaluations: submissions.filter(s => s.status === 'submitted').length,
      averageScore: overallAvgScore,
      averagePercentage: overallAvgPercentage,
      passRate: overallPassRate,
      totalStudents: new Set(submissions.map(s => s.studentId)).size
    },
    subjectWise,
    classWise,
    teacherPerformance
  };
}

// Usage Statistics
async function getUsageStatistics(organizationId: string, startDate?: string, endDate?: string) {
  // Build date filter
  const dateFilter: any = {};
  if (startDate) dateFilter.$gte = new Date(startDate);
  if (endDate) dateFilter.$lte = new Date(endDate);

  // Get all students
  const students = await Student.find({ organizationId });
  const studentIds = students.map(s => s.uniqueId || s.userId);
  const progressData = await StudentProgress.find({ 
    studentId: { $in: studentIds }
  });

  // Get active users (students who accessed in last 30 days)
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const dailyActiveUsers = progressData.filter(p => {
    const recentModule = (p.moduleProgress || []).find((mp: any) => 
      mp.lastAccessedAt && new Date(mp.lastAccessedAt) >= thirtyDaysAgo
    );
    return !!recentModule;
  }).length;

  // Monthly active users (last 90 days)
  const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
  const monthlyActiveUsers = progressData.filter(p => {
    const recentModule = (p.moduleProgress || []).find((mp: any) => 
      mp.lastAccessedAt && new Date(mp.lastAccessedAt) >= ninetyDaysAgo
    );
    return !!recentModule;
  }).length;

  // Feature usage
  let quizAttempts = 0;
  let learningPathUsage = 0;
  let interactiveUsage = 0;
  let videoWatchTime = 0; // in minutes

  progressData.forEach((progress) => {
    const moduleProgress = progress.moduleProgress || [];
    quizAttempts += moduleProgress.reduce((sum: number, mp: any) => 
      sum + (mp.quizAttempts?.length || 0), 0
    );
    learningPathUsage += moduleProgress.filter((mp: any) => 
      mp.learningPath && mp.learningPath.length > 0
    ).length;
    interactiveUsage += moduleProgress.filter((mp: any) => 
      mp.interactiveProgress
    ).length;
    videoWatchTime += moduleProgress.reduce((sum: number, mp: any) => 
      sum + ((mp.videoProgress?.watchTime || 0) / 60), 0
    );
  });

  // System adoption metrics
  const totalModules = progressData.reduce((sum, p) => 
    sum + (p.moduleProgress || []).length, 0
  );
  const studentsWithProgress = progressData.length;
  const adoptionRate = students.length > 0
    ? Math.round((studentsWithProgress / students.length) * 100)
    : 0;

  // Get audit logs for activity tracking
  const auditLogs = await AuditLog.find({
    organizationId,
    ...(Object.keys(dateFilter).length > 0 && { createdAt: dateFilter })
  }).sort({ createdAt: -1 });

  // Activity by type
  const activityByType = await AuditLog.aggregate([
    { $match: { organizationId, ...(Object.keys(dateFilter).length > 0 && { createdAt: dateFilter }) } },
    { $group: { _id: '$action', count: { $sum: 1 } } },
    { $sort: { count: -1 } }
  ]);

  return {
    dailyActiveUsers,
    monthlyActiveUsers,
    totalUsers: students.length,
    featureUsage: {
      quizAttempts,
      learningPathUsage,
      interactiveUsage,
      videoWatchTime: Math.round(videoWatchTime)
    },
    systemAdoption: {
      totalModules,
      studentsWithProgress,
      adoptionRate,
      avgModulesPerStudent: studentsWithProgress > 0
        ? Math.round(totalModules / studentsWithProgress)
        : 0
    },
    activityLogs: auditLogs.slice(0, 50).map(log => ({
      action: log.action,
      userId: log.userId,
      timestamp: log.createdAt,
      details: log.details
    })),
    activityByType: activityByType.map(item => ({
      action: item._id,
      count: item.count
    }))
  };
}

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as DecodedToken;
    const user = await User.findById(decoded.userId);
    
    if (!user || (user.role !== 'organization' && user.role !== 'platform_super_admin')) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Get organization ID
    let organizationId: string;
    if (user.role === 'platform_super_admin') {
      const { orgId } = Object.fromEntries(request.nextUrl.searchParams);
      if (!orgId) {
        return NextResponse.json({ error: 'Organization ID required for super admin' }, { status: 400 });
      }
      organizationId = orgId;
    } else {
      const organization = await Organization.findOne({ userId: user._id.toString() });
      if (!organization) {
        return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
      }
      organizationId = organization._id.toString();
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const reportType = searchParams.get('type') || 'student-progress';
    const startDate = searchParams.get('startDate') || undefined;
    const endDate = searchParams.get('endDate') || undefined;

    let reportData: any = {};

    switch (reportType) {
      case 'student-progress':
        reportData = await getStudentProgressReport(organizationId, startDate, endDate);
        break;
      
      case 'teacher-performance':
        reportData = await getTeacherPerformanceReport(organizationId, startDate, endDate);
        break;
      
      case 'branch-analytics':
        reportData = await getBranchAnalytics(organizationId, startDate, endDate);
        break;
      
      case 'usage-statistics':
        reportData = await getUsageStatistics(organizationId, startDate, endDate);
        break;
      
      case 'test-analytics':
        reportData = await getTestAnalyticsReport(organizationId, startDate, endDate);
        break;
      
      default:
        return NextResponse.json({ error: 'Invalid report type' }, { status: 400 });
    }

    // Get organization info
    const organization = await Organization.findById(organizationId);

    return NextResponse.json({
      success: true,
      reportType,
      organization: {
        id: organizationId,
        name: organization?.organizationName || 'Unknown',
        type: organization?.organizationType || 'unknown'
      },
      generatedAt: new Date().toISOString(),
      data: reportData
    });

  } catch (error) {
    console.error('Error generating report:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
