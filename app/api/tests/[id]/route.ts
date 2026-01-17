import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import Teacher from '@/models/Teacher';
import Organization from '@/models/Organization';
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

// GET - Get a specific test by ID
export async function GET(
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
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const test = await Test.findById(id)
      .populate('questions')
      .lean() as any;

    if (!test) {
      return NextResponse.json({ error: 'Test not found' }, { status: 404 });
    }

    // Check permissions
    if (user.role === 'student') {
      // Students can only see published tests assigned to them
      if (test.status !== 'published') {
        return NextResponse.json({ error: 'Test not found' }, { status: 404 });
      }
      
      const student = await Student.findOne({ userId: user._id.toString() });
      if (student) {
        const isAssigned = 
          (test.assignedTo?.studentIds?.includes(student.uniqueId || student.userId)) ||
          (test.assignedTo?.classGrades?.includes(student.classGrade));
        
        if (!isAssigned) {
          return NextResponse.json({ error: 'Access denied. Test not assigned to you.' }, { status: 403 });
        }
      } else {
        return NextResponse.json({ error: 'Student profile not found' }, { status: 404 });
      }
    } else if (user.role === 'teacher') {
      // Teachers can only see their own tests
      if (test.createdBy.id !== user._id.toString() || test.createdBy.type !== 'teacher') {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 });
      }
    } else if (user.role === 'organization') {
      // Organizations can only see tests from their organization
      const organization = await Organization.findOne({ userId: user._id.toString() });
      if (organization && test.organizationId !== organization._id.toString()) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 });
      }
    }

    // For students, don't show correct answers if results shouldn't be shown immediately
    if (user.role === 'student' && !test.showResultsImmediately) {
      test.questions = test.questions.map((q: any) => {
        if (q.questionType === 'mcq') {
          return {
            ...q,
            options: q.options?.map((opt: any) => ({
              id: opt.id,
              text: opt.text
              // Don't include isCorrect
            })),
            correctAnswer: undefined,
            correctAnswers: undefined
          };
        }
        return q;
      });
    }

    return NextResponse.json({
      success: true,
      test
    });

  } catch (error) {
    console.error('Error fetching test:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// PUT - Update a test
export async function PUT(
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
    
    if (!user || (user.role !== 'teacher' && user.role !== 'organization')) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const test = await Test.findById(id);
    if (!test) {
      return NextResponse.json({ error: 'Test not found' }, { status: 404 });
    }

    // Check ownership
    if (user.role === 'teacher') {
      if (test.createdBy.id !== user._id.toString() || test.createdBy.type !== 'teacher') {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 });
      }
    } else if (user.role === 'organization') {
      const organization = await Organization.findOne({ userId: user._id.toString() });
      if (organization && test.organizationId !== organization._id.toString()) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 });
      }
    }

    // Check if test has submissions (restrict certain changes)
    const submissionCount = await TestSubmission.countDocuments({ testId: test._id });
    if (submissionCount > 0 && test.status === 'published') {
      // Can't change questions or points if there are submissions
      const body = await request.json();
      if (body.questions || body.totalPoints) {
        return NextResponse.json({ 
          error: 'Cannot modify questions or total points after test has submissions' 
        }, { status: 400 });
      }
    }

    const body = await request.json();
    const updateData: any = {};

    // Allowed fields to update
    if (body.title !== undefined) updateData.title = body.title;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.subject !== undefined) updateData.subject = body.subject;
    if (body.grade !== undefined) updateData.grade = body.grade;
    if (body.classGrade !== undefined) updateData.classGrade = body.classGrade;
    if (body.passingScore !== undefined) updateData.passingScore = body.passingScore;
    if (body.duration !== undefined) updateData.duration = body.duration;
    if (body.instructions !== undefined) updateData.instructions = body.instructions;
    if (body.assignmentType !== undefined) updateData.assignmentType = body.assignmentType;
    if (body.assignedTo !== undefined) updateData.assignedTo = body.assignedTo;
    if (body.startDate !== undefined) updateData.startDate = body.startDate ? new Date(body.startDate) : undefined;
    if (body.endDate !== undefined) updateData.endDate = body.endDate ? new Date(body.endDate) : undefined;
    if (body.allowLateSubmission !== undefined) updateData.allowLateSubmission = body.allowLateSubmission;
    if (body.showResultsImmediately !== undefined) updateData.showResultsImmediately = body.showResultsImmediately;
    if (body.randomizeQuestions !== undefined) updateData.randomizeQuestions = body.randomizeQuestions;
    if (body.randomizeOptions !== undefined) updateData.randomizeOptions = body.randomizeOptions;
    if (body.attemptsAllowed !== undefined) updateData.attemptsAllowed = body.attemptsAllowed;
    if (body.status !== undefined) updateData.status = body.status;

    // Update questions if provided and no submissions exist
    if (body.questions && Array.isArray(body.questions) && submissionCount === 0) {
      // Delete existing questions
      await TestQuestion.deleteMany({ testId: test._id });

      // Create new questions
      const createdQuestions = [];
      for (let i = 0; i < body.questions.length; i++) {
        const q = body.questions[i];
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
      updateData.questions = createdQuestions;

      // Recalculate total points
      const calculatedPoints = body.questions.reduce((sum: number, q: any) => sum + (q.points || 10), 0);
      updateData.totalPoints = calculatedPoints;
    }

    Object.assign(test, updateData);
    await test.save();

    return NextResponse.json({
      success: true,
      message: 'Test updated successfully',
      test: {
        id: test._id.toString(),
        title: test.title,
        status: test.status
      }
    });

  } catch (error) {
    console.error('Error updating test:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// DELETE - Delete a test
export async function DELETE(
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
    
    if (!user || (user.role !== 'teacher' && user.role !== 'organization')) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const test = await Test.findById(id);
    if (!test) {
      return NextResponse.json({ error: 'Test not found' }, { status: 404 });
    }

    // Check ownership
    if (user.role === 'teacher') {
      if (test.createdBy.id !== user._id.toString() || test.createdBy.type !== 'teacher') {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 });
      }
    } else if (user.role === 'organization') {
      const organization = await Organization.findOne({ userId: user._id.toString() });
      if (organization && test.organizationId !== organization._id.toString()) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 });
      }
    }

    // Check if test has submissions
    const submissionCount = await TestSubmission.countDocuments({ testId: test._id });
    if (submissionCount > 0) {
      // Archive instead of delete
      test.status = 'archived';
      await test.save();
      return NextResponse.json({
        success: true,
        message: 'Test archived (cannot delete tests with submissions)'
      });
    }

    // Delete questions
    await TestQuestion.deleteMany({ testId: test._id });
    
    // Delete test
    await Test.findByIdAndDelete(id);

    return NextResponse.json({
      success: true,
      message: 'Test deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting test:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
