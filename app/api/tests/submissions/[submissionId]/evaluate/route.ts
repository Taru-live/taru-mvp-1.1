import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import Teacher from '@/models/Teacher';
import Organization from '@/models/Organization';
import Test from '@/models/Test';
import TestSubmission from '@/models/TestSubmission';
import TestQuestion from '@/models/TestQuestion';
import TestEvaluation from '@/models/TestEvaluation';
import Student from '@/models/Student';
import Parent from '@/models/Parent';
import Notification from '@/models/Notification';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

interface DecodedToken {
  userId: string;
  role: string;
  [key: string]: unknown;
}

// POST - Evaluate a test submission
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ submissionId: string }> }
) {
  try {
    const { submissionId } = await params;
    await connectDB();

    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as DecodedToken;
    const user = await User.findById(decoded.userId);
    
    if (!user || (user.role !== 'teacher' && user.role !== 'organization')) {
      return NextResponse.json({ error: 'Access denied. Only teachers and organizations can evaluate tests.' }, { status: 403 });
    }

    const submission = await TestSubmission.findById(submissionId)
      .populate('testId');
    
    if (!submission) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
    }

    const test = submission.testId as any;
    if (!test) {
      return NextResponse.json({ error: 'Test not found' }, { status: 404 });
    }

    // Check permissions
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

    // Check if already evaluated
    const existingEvaluation = await TestEvaluation.findOne({ submissionId: submission._id });
    if (existingEvaluation) {
      return NextResponse.json({ 
        error: 'Submission already evaluated',
        evaluation: existingEvaluation
      }, { status: 400 });
    }

    const body = await request.json();
    const { questionEvaluations, overallFeedback } = body;

    if (!questionEvaluations || !Array.isArray(questionEvaluations)) {
      return NextResponse.json({ 
        error: 'Question evaluations are required' 
      }, { status: 400 });
    }

    // Get test questions
    const questions = await TestQuestion.find({ testId: test._id }).sort({ order: 1 });

    // Validate question evaluations
    if (questionEvaluations.length !== questions.length) {
      return NextResponse.json({ 
        error: 'Number of question evaluations does not match number of questions' 
      }, { status: 400 });
    }

    // Calculate total score
    let totalScore = 0;
    let maxScore = 0;

    const processedEvaluations = questionEvaluations.map((evaluation: any, index: number) => {
      const question = questions[index];
      maxScore += question.points;
      totalScore += evaluation.pointsAwarded || 0;

      return {
        questionId: question._id,
        pointsAwarded: evaluation.pointsAwarded || 0,
        maxPoints: question.points,
        feedback: evaluation.feedback,
        evaluatedAt: new Date()
      };
    });

    const percentage = Math.round((totalScore / maxScore) * 100);
    const isPassed = totalScore >= test.passingScore;

    // Create evaluation
    const evaluation = new TestEvaluation({
      submissionId: submission._id,
      testId: test._id,
      studentId: submission.studentId,
      evaluatedBy: {
        type: user.role === 'teacher' ? 'teacher' : 'organization',
        id: user._id.toString(),
        name: user.name
      },
      questionEvaluations: processedEvaluations,
      totalScore,
      maxScore,
      percentage,
      isPassed,
      overallFeedback,
      evaluatedAt: new Date()
    });

    await evaluation.save();

    // Update submission
    submission.status = 'graded';
    submission.totalScore = totalScore;
    submission.percentage = percentage;
    submission.isPassed = isPassed;
    submission.evaluatedBy = {
      type: user.role === 'teacher' ? 'teacher' : 'organization',
      id: user._id.toString(),
      name: user.name,
      evaluatedAt: new Date()
    };
    submission.feedback = overallFeedback;
    await submission.save();

    // Send notifications to student and parents
    try {
      const studentRecord = await Student.findOne({
        $or: [
          { uniqueId: submission.studentId },
          { userId: submission.studentId }
        ]
      });

      if (studentRecord) {
        const studentUser = await User.findById(submission.studentUserId);
        
        // Notify student
        if (studentUser) {
          const studentNotification = new Notification({
            recipientId: submission.studentUserId,
            recipientRole: 'student',
            senderId: user._id.toString(),
            senderRole: user.role as 'teacher' | 'organization',
            senderName: user.name,
            type: 'test_result',
            priority: 'normal',
            title: 'Test Results Available',
            message: `Your test "${test.title}" has been evaluated. Score: ${totalScore}/${maxScore} (${percentage}%)${isPassed ? ' - Passed!' : ' - Needs improvement.'}`,
            read: false,
            metadata: {
              testId: test._id.toString(),
              submissionId: submission._id.toString(),
              score: totalScore,
              maxScore,
              percentage,
              isPassed
            }
          });
          await studentNotification.save();
        }

        // Notify parents
        const parents = await Parent.find({ 
          studentUniqueId: studentRecord.uniqueId || studentRecord.userId 
        });
        
        for (const parent of parents) {
          const parentUser = await User.findById(parent.userId);
          if (parentUser) {
            const parentNotification = new Notification({
              recipientId: parent.userId,
              recipientRole: 'parent',
              senderId: user._id.toString(),
              senderRole: user.role as 'teacher' | 'organization',
              senderName: user.name,
              type: 'test_result',
              priority: 'normal',
              title: 'Test Results Available',
              message: `${studentRecord.fullName}'s test "${test.title}" has been evaluated. Score: ${totalScore}/${maxScore} (${percentage}%)${isPassed ? ' - Passed!' : ' - Needs improvement.'}`,
              read: false,
              metadata: {
                testId: test._id.toString(),
                submissionId: submission._id.toString(),
                studentId: studentRecord.uniqueId || studentRecord.userId,
                studentName: studentRecord.fullName,
                score: totalScore,
                maxScore,
                percentage,
                isPassed
              }
            });
            await parentNotification.save();
          }
        }
      }
    } catch (notifError) {
      console.error('Error sending notifications:', notifError);
      // Don't fail the evaluation if notification fails
    }

    return NextResponse.json({
      success: true,
      message: 'Test evaluated successfully',
      evaluation: {
        id: evaluation._id.toString(),
        totalScore,
        maxScore,
        percentage,
        isPassed
      }
    }, { status: 201 });

  } catch (error) {
    console.error('Error evaluating test:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// GET - Get evaluation for a submission
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ submissionId: string }> }
) {
  try {
    const { submissionId } = await params;
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

    const evaluation = await TestEvaluation.findOne({ submissionId })
      .populate('testId')
      .lean() as any;

    if (!evaluation) {
      return NextResponse.json({ error: 'Evaluation not found' }, { status: 404 });
    }

    // Check permissions
    if (user.role === 'student') {
      const submission = await TestSubmission.findById(submissionId);
      if (!submission || submission.studentUserId !== user._id.toString()) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 });
      }
    } else if (user.role === 'teacher' || user.role === 'organization') {
      const test = evaluation.testId as any;
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
    } else {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    return NextResponse.json({
      success: true,
      evaluation
    });

  } catch (error) {
    console.error('Error fetching evaluation:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
