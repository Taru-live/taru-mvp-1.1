import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import Test from '@/models/Test';
import TestQuestion from '@/models/TestQuestion';
import TestSubmission from '@/models/TestSubmission';
import Student from '@/models/Student';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

interface DecodedToken {
  userId: string;
  role: string;
  [key: string]: unknown;
}

// POST - Submit test answers
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await connectDB();

    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as DecodedToken;
    const user = await User.findById(decoded.userId);
    
    if (!user || user.role !== 'student') {
      return NextResponse.json({ error: 'Only students can submit tests' }, { status: 403 });
    }

    const test = await Test.findById(id);
    if (!test) {
      return NextResponse.json({ error: 'Test not found' }, { status: 404 });
    }

    // Check if test is published
    if (test.status !== 'published') {
      return NextResponse.json({ error: 'Test is not available' }, { status: 400 });
    }

    // Check if test is assigned to student
    const student = await Student.findOne({ userId: user._id.toString() });
    if (!student) {
      return NextResponse.json({ error: 'Student profile not found' }, { status: 404 });
    }

    const isAssigned = 
      (test.assignedTo?.studentIds?.includes(student.uniqueId || student.userId)) ||
      (test.assignedTo?.classGrades?.includes(student.classGrade));
    
    if (!isAssigned) {
      return NextResponse.json({ error: 'Test not assigned to you' }, { status: 403 });
    }

    // Check date restrictions
    const now = new Date();
    if (test.startDate && now < new Date(test.startDate)) {
      return NextResponse.json({ error: 'Test has not started yet' }, { status: 400 });
    }
    if (test.endDate && now > new Date(test.endDate)) {
      if (!test.allowLateSubmission) {
        return NextResponse.json({ error: 'Test submission deadline has passed' }, { status: 400 });
      }
    }

    // Check attempt limit
    const existingSubmissions = await TestSubmission.find({
      testId: test._id,
      studentId: student.uniqueId || student.userId
    });
    
    const attemptNumber = existingSubmissions.length + 1;
    if (attemptNumber > test.attemptsAllowed) {
      return NextResponse.json({ 
        error: `Maximum attempts (${test.attemptsAllowed}) reached` 
      }, { status: 400 });
    }

    const body = await request.json();
    const { answers, timeSpent } = body;

    if (!answers || !Array.isArray(answers) || answers.length === 0) {
      return NextResponse.json({ error: 'Answers are required' }, { status: 400 });
    }

    // Get test questions
    const questions = await TestQuestion.find({ testId: test._id }).sort({ order: 1 });

    // Validate answers match questions
    if (answers.length !== questions.length) {
      return NextResponse.json({ 
        error: 'Number of answers does not match number of questions' 
      }, { status: 400 });
    }

    // Auto-grade MCQ questions
    let autoScore = 0;
    const processedAnswers = answers.map((answer: any, index: number) => {
      const question = questions[index];
      let isCorrect = false;

      if (question.questionType === 'mcq') {
        if (question.correctAnswer) {
          // Single correct answer
          isCorrect = answer.answer === question.correctAnswer;
        } else if (question.correctAnswers && question.correctAnswers.length > 0) {
          // Multiple correct answers
          const studentAnswers = Array.isArray(answer.answer) ? answer.answer : [answer.answer];
          const correctSet = new Set(question.correctAnswers);
          const studentSet = new Set(studentAnswers);
          isCorrect = correctSet.size === studentSet.size && 
                     Array.from(correctSet).every(a => studentSet.has(a));
        }

        if (isCorrect) {
          autoScore += question.points;
        }
      }

      return {
        questionId: question._id,
        questionType: question.questionType,
        answer: answer.answer,
        videoUrl: answer.videoUrl,
        submittedAt: new Date()
      };
    });

    // Create submission
    const submission = new TestSubmission({
      testId: test._id,
      studentId: student.uniqueId || student.userId,
      studentUserId: user._id.toString(),
      attemptNumber,
      answers: processedAnswers,
      startedAt: body.startedAt ? new Date(body.startedAt) : new Date(),
      submittedAt: new Date(),
      timeSpent: timeSpent || 0,
      status: test.showResultsImmediately && autoScore === test.totalPoints ? 'graded' : 'submitted',
      autoScore: autoScore > 0 ? autoScore : undefined,
      totalScore: autoScore > 0 ? autoScore : undefined,
      percentage: autoScore > 0 ? Math.round((autoScore / test.totalPoints) * 100) : undefined,
      isPassed: autoScore > 0 ? autoScore >= test.passingScore : undefined
    });

    await submission.save();

    // Return results if immediate results are enabled
    const response: any = {
      success: true,
      message: 'Test submitted successfully',
      submission: {
        id: submission._id.toString(),
        attemptNumber: submission.attemptNumber,
        status: submission.status
      }
    };

    if (test.showResultsImmediately && autoScore > 0) {
      response.results = {
        score: autoScore,
        totalPoints: test.totalPoints,
        percentage: Math.round((autoScore / test.totalPoints) * 100),
        isPassed: autoScore >= test.passingScore
      };
    }

    return NextResponse.json(response, { status: 201 });

  } catch (error) {
    console.error('Error submitting test:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
