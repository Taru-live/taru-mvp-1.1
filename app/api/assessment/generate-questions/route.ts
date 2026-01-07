import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import Student from '@/models/Student';
import AssessmentResponse from '@/models/AssessmentResponse';
import { N8NCacheService } from '@/lib/N8NCacheService';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const N8N_ASSESSMENT_WEBHOOK_URL = process.env.N8N_ASSESSMENT_WEBHOOK_URL || 'https://nclbtaru.app.n8n.cloud/webhook/assessment-questions';

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

    // Prepare data for N8N
    const assessmentData = {
      studentId: decoded.userId,
      studentName: user.name,
      uniqueId: student.uniqueId,
      age: student.age,
      classGrade: student.classGrade,
      languagePreference: student.languagePreference,
      schoolName: student.schoolName,
      preferredSubject: student.preferredSubject,
      type: type,
      timestamp: new Date().toISOString()
    };

    // Call N8N webhook to generate questions
    let rawResponse;

    try {
      console.log('🔄 Calling webhook:', N8N_ASSESSMENT_WEBHOOK_URL);

      // Add timeout to prevent hanging requests
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);

      // Convert payload to URL parameters for GET request
      const urlParams = new URLSearchParams({
        uniqueID: student.uniqueId, // Use actual student unique ID
        submittedAt: new Date().toISOString()
      });

      const getUrl = `${N8N_ASSESSMENT_WEBHOOK_URL}?${urlParams.toString()}`;
      console.log('🔗 Full webhook URL:', getUrl);

      const response = await fetch(getUrl, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      console.log('📡 Webhook response status:', response.status);

      const responseText = await response.text();
      console.log('📥 N8N Raw response text:', responseText);

      if (!responseText || responseText.trim() === '') {
        console.warn('📥 Empty response from N8N webhook');
        rawResponse = { error: 'Empty response from N8N webhook' };
      } else {
        try {
          rawResponse = JSON.parse(responseText);
          console.log('📥 N8N Parsed Response:', JSON.stringify(rawResponse, null, 2));
        } catch (parseError) {
          console.error('📥 Failed to parse response text as JSON:', parseError);
          rawResponse = { error: 'Invalid JSON response from N8N', rawText: responseText };
        }
      }
    } catch (fetchError: unknown) {
      const error = fetchError as Error & { code?: string };
      console.error('🔄 Webhook call failed:', error);

      let errorMessage = 'Connection failed';
      if (error.name === 'AbortError') {
        errorMessage = 'Webhook timeout (30s)';
      } else if (error.code === 'ENOTFOUND') {
        errorMessage = 'Webhook URL not found';
      } else if (error.code === 'ECONNREFUSED') {
        errorMessage = 'Connection refused';
      }

      console.error('Diagnosed issue:', errorMessage);
      rawResponse = { error: `Webhook unreachable: ${errorMessage}` };
    }

    // Parse N8N response and extract questions
    const questions = parseN8nOutput(rawResponse);
    
    if (questions.length === 0) {
      console.log('🔍 No questions generated from N8N, using fallback');
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
          error: 'Using fallback questions due to N8N unavailability'
        }
      });
    }

    // Store the generated questions in the database and cache
    try {
      // Save to N8N cache
      const n8nResult = await N8NCacheService.saveResult({
        uniqueId: student.uniqueId,
        resultType: 'assessment_questions',
        webhookUrl: N8N_ASSESSMENT_WEBHOOK_URL,
        requestPayload: assessmentData,
        responseData: rawResponse,
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

      // Update assessment response with N8N results
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
        generatedQuestions: rawResponse
      });
    } else {
      assessmentResponse.generatedQuestions = rawResponse;
      assessmentResponse.webhookTriggered = true;
    }

    await assessmentResponse.save();
    console.log('🔍 Saved N8N questions to database for student:', student.uniqueId);

    return NextResponse.json({
      success: true,
      questions: questions,
      metadata: {
        generatedAt: new Date().toISOString(),
        studentId: decoded.userId,
        type: type,
        totalQuestions: questions.length,
        webhookUrl: N8N_ASSESSMENT_WEBHOOK_URL
      }
    });

  } catch (error) {
    console.error('Generate assessment questions error:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}

interface N8nOutputItem {
  output: string;
}

interface N8nQuestion {
  id: string | number;
  question: string;
  type: string;
  difficulty: string;
  section?: string;
}

interface ParsedOutput {
  questions: N8nQuestion[];
}

// Function to parse N8N output format and extract questions
function parseN8nOutput(n8nOutput: N8nOutputItem[] | ParsedOutput): AssessmentQuestion[] {
  try {
    console.log('🔍 Parsing N8N output:', JSON.stringify(n8nOutput, null, 2));
    
    // Handle the N8N format: [{"output": "JSON_STRING_WITH_QUESTIONS"}]
    if (Array.isArray(n8nOutput) && n8nOutput.length > 0) {
      const firstItem = n8nOutput[0];
      if (firstItem && firstItem.output) {
        console.log('🔍 Found output field in N8N response');
        
        // Parse the JSON string inside the output field
        const parsedOutput = JSON.parse(firstItem.output);
        console.log('🔍 Parsed output:', JSON.stringify(parsedOutput, null, 2));
        
        // Extract questions from the parsed output
        if (parsedOutput && parsedOutput.questions && Array.isArray(parsedOutput.questions)) {
          console.log('🔍 Found questions array with', parsedOutput.questions.length, 'questions');
          return parsedOutput.questions.map((q: N8nQuestion) => convertN8nQuestion(q));
        }
      }
    }
    
    // Handle direct object format (fallback)
    if (n8nOutput && typeof n8nOutput === 'object' && !Array.isArray(n8nOutput)) {
      const directOutput = n8nOutput as ParsedOutput;
      if (directOutput.questions && Array.isArray(directOutput.questions)) {
        console.log('🔍 Found direct questions array with', directOutput.questions.length, 'questions');
        return directOutput.questions.map((q: N8nQuestion) => convertN8nQuestion(q));
      }
    }
    
    console.warn('🔍 No valid questions found in N8N output');
    return [];
  } catch (error) {
    console.error('🔍 Error parsing N8N output:', error);
    return [];
  }
}

// Function to convert n8n question format to our internal format
function convertN8nQuestion(n8nQuestion: N8nQuestion): AssessmentQuestion {
  const questionType = n8nQuestion.type;
  let type: 'MCQ' | 'OPEN' = 'OPEN';
  let options: string[] | undefined = undefined;

  // Map n8n question types to our format based on the actual N8N output
  if (questionType === 'Multiple Choice') {
    type = 'MCQ';
    // For Multiple Choice questions, generate contextually appropriate options
    options = ['Strongly Agree', 'Agree', 'Disagree', 'Strongly Disagree'];
  } else if (questionType === 'Pattern Choice') {
    type = 'MCQ';
    // For Pattern Choice questions, generate pattern-related options
    options = ['Organ', 'System', 'Organism', 'Population'];
  } else {
    // All other types (Open Text, etc.) are treated as OPEN questions
    type = 'OPEN';
  }

  // Map difficulty levels
  let difficulty: 'easy' | 'medium' | 'hard' = 'easy';
  if (n8nQuestion.difficulty === 'Middle') {
    difficulty = 'medium';
  } else if (n8nQuestion.difficulty === 'Secondary') {
    difficulty = 'hard';
  }

  return {
    id: n8nQuestion.id.toString(),
    question: n8nQuestion.question,
    type: type,
    options: options,
    category: n8nQuestion.section || 'General',
    difficulty: difficulty
  };
}

interface AssessmentData {
  studentId: string;
  studentName: string;
  uniqueId: string;
  age: number;
  classGrade: string;
  languagePreference: string;
  schoolName: string;
  preferredSubject: string;
  type: string;
  timestamp: string;
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