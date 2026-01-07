import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import Student from '@/models/Student';
import AssessmentResponse from '@/models/AssessmentResponse';
import { N8NCacheService } from '@/lib/N8NCacheService';
import { LangChainService } from '@/lib/langchain/LangChainService';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

interface DecodedToken {
  userId: string;
  [key: string]: unknown;
}

interface AssessmentQuestion {
  id: string;
  question: string;
  type: 'MCQ' | 'OPEN';
  options?: string[];
  correctAnswer?: string;
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

export async function GET(request: NextRequest) {
  try {
    // Get token from HTTP-only cookie
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json(
        { error: 'Authorization token required' },
        { status: 401 }
      );
    }

    // Verify token
    let decoded: DecodedToken;
    try {
      decoded = jwt.verify(token, JWT_SECRET) as DecodedToken;
    } catch {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    // Connect to database
    await connectDB();

    // Verify user is a student
    const user = await User.findById(decoded.userId);
    if (!user || user.role !== 'student') {
      return NextResponse.json(
        { error: 'Only students can generate assessment questions' },
        { status: 403 }
      );
    }

    // Get student profile
    const student = await Student.findOne({ userId: decoded.userId });
    if (!student) {
      return NextResponse.json(
        { error: 'Student profile not found' },
        { status: 404 }
      );
    }

    // Get parameters from URL search params for GET request
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'diagnostic';
    const forceRegenerate = searchParams.get('forceRegenerate') === 'true';

    // Check for cached questions first
    if (!forceRegenerate) {
      const cachedQuestions = await N8NCacheService.getCachedAssessmentResults(
        student.uniqueId,
        'questions',
        24 // 24 hours cache
      );
      
      if (cachedQuestions && cachedQuestions.length > 0) {
        console.log(`🎯 Using cached assessment questions for student ${student.uniqueId}`);
        return NextResponse.json({
          success: true,
          questions: cachedQuestions,
          cached: true,
          metadata: {
            generatedAt: new Date().toISOString(),
            studentId: decoded.userId,
            type: type,
            totalQuestions: cachedQuestions.length,
            cacheHit: true
          }
        });
      }
    }

    // Prepare data for LangChain
    const assessmentData = {
      studentName: user.name,
      age: student.age,
      classGrade: student.classGrade,
      languagePreference: student.languagePreference,
      schoolName: student.schoolName,
      preferredSubject: student.preferredSubject,
      type: type,
    };

    // Use LangChainService instead of n8n webhook
    const langChainService = new LangChainService();
    
    try {
      const n8nQuestions = await langChainService.generateAssessmentQuestions(assessmentData);
      
      // Convert LangChain format to internal format
      const questions: AssessmentQuestion[] = n8nQuestions.map((q: any) => {
        let type: 'MCQ' | 'OPEN' = 'OPEN';
        let options: string[] | undefined = undefined;

        if (q.type === 'Multiple Choice' || q.type === 'Single Choice' || q.type === 'Pattern Choice') {
          type = 'MCQ';
          options = q.options || (q.type === 'Multiple Choice' 
            ? ['Strongly Agree', 'Agree', 'Disagree', 'Strongly Disagree']
            : q.type === 'Pattern Choice'
            ? ['Organ', 'System', 'Organism', 'Population']
            : ['Option A', 'Option B', 'Option C', 'Option D']);
        }

        let difficulty: 'easy' | 'medium' | 'hard' = 'easy';
        if (q.difficulty === 'Middle') {
          difficulty = 'medium';
        } else if (q.difficulty === 'Secondary') {
          difficulty = 'hard';
        }

        return {
          id: q.id.toString(),
          question: q.question,
          type: type,
          options: options,
          category: q.section || 'General',
          difficulty: difficulty
        };
      });

      if (questions.length === 0) {
        console.log('🔍 No questions generated from LangChain, using fallback');
        const fallbackQuestions = generateFallbackQuestions(assessmentData);
        
        return NextResponse.json({
          success: true,
          questions: fallbackQuestions,
          fallback: true,
          metadata: {
            generatedAt: new Date().toISOString(),
            studentId: decoded.userId,
            type: type,
            totalQuestions: fallbackQuestions.length,
            error: 'Using fallback questions due to LangChain unavailability'
          }
        });
      }

      // Store the generated questions in the database and cache
      try {
        // Save to cache
        const n8nResult = await N8NCacheService.saveResult({
          uniqueId: student.uniqueId,
          resultType: 'assessment_questions',
          webhookUrl: 'langchain-assessment',
          requestPayload: assessmentData,
          responseData: n8nQuestions,
          processedData: questions,
          status: 'completed',
          metadata: {
            studentId: decoded.userId,
            assessmentId: `${student.uniqueId}_${type}`,
            contentType: 'questions',
            version: '1.0'
          },
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
        });

        // Update assessment response with LangChain results
        await N8NCacheService.updateAssessmentResults(
          student.uniqueId,
          'questions',
          questions,
          n8nResult._id.toString()
        );

        console.log(`💾 Saved assessment questions to cache for student ${student.uniqueId}`);
      } catch (cacheError) {
        console.error('❌ Error saving to cache:', cacheError);
        // Continue with response even if cache fails
      }

      // Store the generated questions in the database (legacy support)
      let assessmentResponse = await AssessmentResponse.findOne({
        uniqueId: student.uniqueId,
        assessmentType: type
      });

      if (!assessmentResponse) {
        assessmentResponse = new AssessmentResponse({
          uniqueId: student.uniqueId,
          assessmentType: type,
          responses: [],
          webhookTriggered: true,
          generatedQuestions: n8nQuestions
        });
      } else {
        assessmentResponse.generatedQuestions = n8nQuestions;
        assessmentResponse.webhookTriggered = true;
      }

      await assessmentResponse.save();
      console.log('🔍 Saved LangChain questions to database for student:', student.uniqueId);

      return NextResponse.json({
        success: true,
        questions: questions,
        metadata: {
          generatedAt: new Date().toISOString(),
          studentId: decoded.userId,
          type: type,
          totalQuestions: questions.length,
          source: 'langchain'
        }
      });

    } catch (error) {
      console.error('LangChain assessment questions generation error:', error);
      
      // Fallback questions
      const fallbackQuestions = generateFallbackQuestions(assessmentData);
      
      return NextResponse.json({
        success: true,
        questions: fallbackQuestions,
        fallback: true,
        metadata: {
          generatedAt: new Date().toISOString(),
          studentId: decoded.userId,
          type: type,
          totalQuestions: fallbackQuestions.length,
          error: 'Using fallback questions due to LangChain error'
        }
      });
    }

  } catch (error) {
    console.error('Generate assessment questions error:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}

interface AssessmentData {
  studentName: string;
  age: number;
  classGrade: string;
  languagePreference: string;
  schoolName: string;
  preferredSubject: string;
  type: string;
}

// Fallback question generator
function generateFallbackQuestions(_studentData: AssessmentData): AssessmentQuestion[] {
  // Generate diagnostic assessment questions
  const diagnosticQuestions: AssessmentQuestion[] = [
    {
      id: '1',
      question: 'What is your favorite subject in school?',
      type: 'MCQ',
      options: ['Mathematics', 'Science', 'English', 'History', 'Art'],
      category: 'Learning Preferences',
      difficulty: 'easy'
    },
    {
      id: '2',
      question: 'How do you prefer to learn new concepts?',
      type: 'MCQ',
      options: ['Reading and writing', 'Visual diagrams and charts', 'Hands-on practice', 'Listening to explanations'],
      category: 'Learning Style',
      difficulty: 'easy'
    },
    {
      id: '3',
      question: 'Describe a time when you solved a difficult problem. What approach did you use?',
      type: 'OPEN',
      category: 'Problem Solving',
      difficulty: 'medium'
    },
    {
      id: '4',
      question: 'What career interests you the most?',
      type: 'MCQ',
      options: ['Technology and Engineering', 'Healthcare and Medicine', 'Arts and Design', 'Business and Finance', 'Education and Teaching'],
      category: 'Career Interests',
      difficulty: 'medium'
    },
    {
      id: '5',
      question: 'How do you handle challenges or difficulties when learning something new?',
      type: 'OPEN',
      category: 'Learning Attitude',
      difficulty: 'medium'
    },
    {
      id: '6',
      question: 'Which of these activities do you enjoy the most?',
      type: 'MCQ',
      options: ['Working in teams', 'Working independently', 'Creative projects', 'Analytical tasks'],
      category: 'Work Preferences',
      difficulty: 'easy'
    },
    {
      id: '7',
      question: 'What motivates you to learn and improve?',
      type: 'OPEN',
      category: 'Motivation',
      difficulty: 'medium'
    },
    {
      id: '8',
      question: 'How do you prefer to receive feedback on your work?',
      type: 'MCQ',
      options: ['Immediate feedback', 'Detailed written feedback', 'One-on-one discussions', 'Group discussions'],
      category: 'Feedback Preferences',
      difficulty: 'easy'
    },
    {
      id: '9',
      question: 'What is your biggest strength as a learner?',
      type: 'OPEN',
      category: 'Self-Assessment',
      difficulty: 'medium'
    },
    {
      id: '10',
      question: 'What area would you like to improve the most?',
      type: 'OPEN',
      category: 'Growth Areas',
      difficulty: 'medium'
    }
  ];

  return diagnosticQuestions;
}
