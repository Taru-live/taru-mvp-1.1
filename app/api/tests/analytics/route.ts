import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import Teacher from '@/models/Teacher';
import Organization from '@/models/Organization';
import Test from '@/models/Test';
import TestSubmission from '@/models/TestSubmission';
import TestEvaluation from '@/models/TestEvaluation';
import Student from '@/models/Student';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

interface DecodedToken {
  userId: string;
  role: string;
  [key: string]: unknown;
}

// GET - Get test analytics
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as DecodedToken;
    const user = await User.findById(decoded.userId);
    
    if (!user || (user.role !== 'teacher' && user.role !== 'organization')) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const testId = searchParams.get('testId');
    const subject = searchParams.get('subject');
    const classGrade = searchParams.get('classGrade');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Build query based on user role
    const testQuery: any = {};

    if (user.role === 'teacher') {
      testQuery['createdBy.id'] = user._id.toString();
      testQuery['createdBy.type'] = 'teacher';
    } else if (user.role === 'organization') {
      const organization = await Organization.findOne({ userId: user._id.toString() });
      if (organization) {
        testQuery.organizationId = organization._id.toString();
      }
    }

    if (testId) {
      testQuery._id = testId;
    }
    if (subject) {
      testQuery.subject = subject;
    }
    if (classGrade) {
      testQuery.classGrade = classGrade;
    }

    const tests = await Test.find(testQuery).lean() as any[];

    if (testId && tests.length === 0) {
      return NextResponse.json({ error: 'Test not found' }, { status: 404 });
    }

    // Get all test IDs
    const testIds = tests.map(t => t._id.toString());

    // Build submission query
    const submissionQuery: any = { testId: { $in: testIds } };
    if (startDate || endDate) {
      submissionQuery.submittedAt = {};
      if (startDate) submissionQuery.submittedAt.$gte = new Date(startDate);
      if (endDate) submissionQuery.submittedAt.$lte = new Date(endDate);
    }

    const submissions = await TestSubmission.find(submissionQuery).lean();
    const evaluations = await TestEvaluation.find({ 
      testId: { $in: testIds } 
    }).lean();

    // Calculate analytics
    const analytics = {
      overview: {
        totalTests: tests.length,
        publishedTests: tests.filter(t => t.status === 'published').length,
        totalSubmissions: submissions.length,
        evaluatedSubmissions: evaluations.length,
        pendingEvaluations: submissions.filter(s => s.status === 'submitted').length
      },
      performance: {
        averageScore: 0,
        averagePercentage: 0,
        passRate: 0,
        totalStudents: new Set(submissions.map(s => s.studentId)).size
      },
      subjectWise: {} as Record<string, any>,
      classWise: {} as Record<string, any>,
      testWise: [] as any[]
    };

    // Calculate performance metrics
    const gradedSubmissions = submissions.filter(s => s.status === 'graded' && s.totalScore !== undefined);
    if (gradedSubmissions.length > 0) {
      const totalScore = gradedSubmissions.reduce((sum, s) => sum + (s.totalScore || 0), 0);
      const totalMaxScore = gradedSubmissions.reduce((sum, s) => {
        const test = tests.find(t => t._id.toString() === s.testId.toString());
        return sum + (test?.totalPoints || 100);
      }, 0);
      
      analytics.performance.averageScore = Math.round(totalScore / gradedSubmissions.length);
      analytics.performance.averagePercentage = totalMaxScore > 0 
        ? Math.round((totalScore / totalMaxScore) * 100)
        : 0;
      analytics.performance.passRate = Math.round(
        (gradedSubmissions.filter(s => s.isPassed).length / gradedSubmissions.length) * 100
      );
    }

    // Subject-wise analytics
    const subjects = new Set(tests.map(t => t.subject));
    subjects.forEach(subject => {
      const subjectTests = tests.filter(t => t.subject === subject);
      const subjectTestIds = subjectTests.map(t => t._id.toString());
      const subjectSubmissions = submissions.filter(s => 
        subjectTestIds.includes(s.testId.toString())
      );
      const subjectEvaluations = evaluations.filter(e => 
        subjectTestIds.includes(e.testId.toString())
      );

      const gradedSubjectSubmissions = subjectSubmissions.filter(s => 
        s.status === 'graded' && s.totalScore !== undefined
      );

      let avgScore = 0;
      let avgPercentage = 0;
      let passRate = 0;

      if (gradedSubjectSubmissions.length > 0) {
        const totalScore = gradedSubjectSubmissions.reduce((sum, s) => sum + (s.totalScore || 0), 0);
        const totalMaxScore = gradedSubjectSubmissions.reduce((sum, s) => {
          const test = subjectTests.find(t => t._id.toString() === s.testId.toString());
          return sum + (test?.totalPoints || 100);
        }, 0);
        
        avgScore = Math.round(totalScore / gradedSubjectSubmissions.length);
        avgPercentage = totalMaxScore > 0 
          ? Math.round((totalScore / totalMaxScore) * 100)
          : 0;
        passRate = Math.round(
          (gradedSubjectSubmissions.filter(s => s.isPassed).length / gradedSubjectSubmissions.length) * 100
        );
      }

      analytics.subjectWise[subject] = {
        totalTests: subjectTests.length,
        totalSubmissions: subjectSubmissions.length,
        evaluatedSubmissions: subjectEvaluations.length,
        averageScore: avgScore,
        averagePercentage: avgPercentage,
        passRate
      };
    });

    // Class-wise analytics
    const classGrades = new Set(tests.map(t => t.classGrade).filter(Boolean));
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

      analytics.classWise[grade] = {
        totalTests: classTests.length,
        totalSubmissions: classSubmissions.length,
        averageScore: avgScore,
        averagePercentage: avgPercentage,
        passRate,
        totalStudents: new Set(classSubmissions.map(s => s.studentId)).size
      };
    });

    // Test-wise analytics
    analytics.testWise = await Promise.all(tests.map(async (test) => {
      const testSubmissions = submissions.filter(s => 
        s.testId.toString() === test._id.toString()
      );
      const testEvaluations = evaluations.filter(e => 
        e.testId.toString() === test._id.toString()
      );

      const gradedTestSubmissions = testSubmissions.filter(s => 
        s.status === 'graded' && s.totalScore !== undefined
      );

      let avgScore = 0;
      let avgPercentage = 0;
      let passRate = 0;

      if (gradedTestSubmissions.length > 0) {
        const totalScore = gradedTestSubmissions.reduce((sum, s) => sum + (s.totalScore || 0), 0);
        avgScore = Math.round(totalScore / gradedTestSubmissions.length);
        avgPercentage = Math.round((totalScore / (test.totalPoints * gradedTestSubmissions.length)) * 100);
        passRate = Math.round(
          (gradedTestSubmissions.filter(s => s.isPassed).length / gradedTestSubmissions.length) * 100
        );
      }

      return {
        testId: test._id.toString(),
        title: test.title,
        subject: test.subject,
        classGrade: test.classGrade,
        totalPoints: test.totalPoints,
        totalSubmissions: testSubmissions.length,
        evaluatedSubmissions: testEvaluations.length,
        averageScore: avgScore,
        averagePercentage: avgPercentage,
        passRate,
        totalStudents: new Set(testSubmissions.map(s => s.studentId)).size
      };
    }));

    return NextResponse.json({
      success: true,
      analytics
    });

  } catch (error) {
    console.error('Error fetching test analytics:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
