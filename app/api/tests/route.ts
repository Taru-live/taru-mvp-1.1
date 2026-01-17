import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import Teacher from '@/models/Teacher';
import Organization from '@/models/Organization';
import Test from '@/models/Test';
import TestQuestion from '@/models/TestQuestion';
import Student from '@/models/Student';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

interface DecodedToken {
  userId: string;
  role: string;
  [key: string]: unknown;
}

// GET - List tests with filters
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as DecodedToken;
    const user = await User.findById(decoded.userId);
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const subject = searchParams.get('subject');
    const grade = searchParams.get('grade');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    // Build query based on user role
    const query: any = {};

    if (user.role === 'teacher') {
      query['createdBy.id'] = user._id.toString();
      query['createdBy.type'] = 'teacher';
    } else if (user.role === 'organization') {
      const organization = await Organization.findOne({ userId: user._id.toString() });
      if (organization) {
        query.organizationId = organization._id.toString();
      }
    } else if (user.role === 'student') {
      // Students can only see tests assigned to them
      const student = await Student.findOne({ userId: user._id.toString() });
      if (student) {
        query.$or = [
          { 'assignedTo.studentIds': student.uniqueId || student.userId },
          { 'assignedTo.classGrades': student.classGrade }
        ];
        query.status = 'published';
      } else {
        return NextResponse.json({ tests: [], total: 0, page: 1, limit });
      }
    } else {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Apply filters
    if (status) query.status = status;
    if (subject) query.subject = subject;
    if (grade) query.grade = grade;

    // Get tests with pagination
    const skip = (page - 1) * limit;
    const tests = await Test.find(query)
      .populate('questions', 'questionType questionText points order')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await Test.countDocuments(query);

    return NextResponse.json({
      success: true,
      tests,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching tests:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// POST - Create a new test
export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as DecodedToken;
    const user = await User.findById(decoded.userId);
    
    if (!user || (user.role !== 'teacher' && user.role !== 'organization')) {
      return NextResponse.json({ error: 'Access denied. Only teachers and organizations can create tests.' }, { status: 403 });
    }

    const body = await request.json();
    const {
      title,
      description,
      subject,
      grade,
      classGrade,
      questions,
      totalPoints,
      passingScore,
      duration,
      instructions,
      assignmentType,
      assignedTo,
      startDate,
      endDate,
      allowLateSubmission,
      showResultsImmediately,
      randomizeQuestions,
      randomizeOptions,
      attemptsAllowed
    } = body;

    // Validate required fields
    if (!title || !subject || !questions || !Array.isArray(questions) || questions.length === 0) {
      return NextResponse.json({ 
        error: 'Title, subject, and at least one question are required' 
      }, { status: 400 });
    }

    // Get organization ID if user is organization
    let organizationId: string | undefined;
    if (user.role === 'organization') {
      const organization = await Organization.findOne({ userId: user._id.toString() });
      if (!organization) {
        return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
      }
      organizationId = organization._id.toString();
    } else if (user.role === 'teacher') {
      const teacher = await Teacher.findOne({ userId: user._id.toString() });
      if (teacher?.organizationId) {
        organizationId = teacher.organizationId;
      }
    }

    // Create test
    const test = new Test({
      title,
      description,
      createdBy: {
        type: user.role === 'teacher' ? 'teacher' : 'organization',
        id: user._id.toString(),
        name: user.name
      },
      organizationId,
      subject,
      grade,
      classGrade,
      totalPoints: totalPoints || 100,
      passingScore: passingScore || 50,
      duration,
      instructions,
      assignmentType: assignmentType || 'individual',
      assignedTo: assignedTo || { studentIds: [], classGrades: [] },
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      allowLateSubmission: allowLateSubmission || false,
      showResultsImmediately: showResultsImmediately || false,
      randomizeQuestions: randomizeQuestions || false,
      randomizeOptions: randomizeOptions || false,
      attemptsAllowed: attemptsAllowed || 1,
      status: 'draft',
      questions: [] // Will be populated after creating questions
    });

    await test.save();

    // Create questions
    const createdQuestions: any[] = [];
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      const question = new TestQuestion({
        testId: test._id,
        questionType: q.questionType,
        questionText: q.questionText,
        points: q.points || 10,
        order: i + 1,
        options: q.options || [],
        correctAnswer: q.correctAnswer,
        correctAnswers: q.correctAnswers || [],
        expectedAnswer: q.expectedAnswer,
        evaluationCriteria: q.evaluationCriteria || [],
        minWords: q.minWords,
        maxWords: q.maxWords,
        videoUrl: q.videoUrl,
        videoDuration: q.videoDuration,
        prompt: q.prompt,
        explanation: q.explanation,
        attachments: q.attachments || []
      });
      await question.save();
      createdQuestions.push(question._id);
    }

    // Update test with question IDs
    test.questions = createdQuestions;
    await test.save();

    // Calculate total points from questions if not provided
    if (!totalPoints) {
      const calculatedPoints = createdQuestions.reduce((sum, qId) => {
        const q = questions[createdQuestions.indexOf(qId)];
        return sum + (q.points || 10);
      }, 0);
      test.totalPoints = calculatedPoints;
      await test.save();
    }

    return NextResponse.json({
      success: true,
      message: 'Test created successfully',
      test: {
        id: test._id.toString(),
        title: test.title,
        subject: test.subject,
        totalPoints: test.totalPoints,
        questionCount: createdQuestions.length,
        status: test.status
      }
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating test:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
