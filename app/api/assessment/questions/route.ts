import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import connectDB from '@/lib/mongodb';
import Student from '@/models/Student';
import AssessmentResponse from '@/models/AssessmentResponse';

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

interface N8nOutputItem {
  output: string;
}

interface N8nQuestion {
  id: string | number;
  question: string;
  type: string;
  difficulty: string;
  section?: string;
  options?: string[];
}

interface ParsedOutput {
  questions: N8nQuestion[];
}

// Type for N8N output that can be stored as string array
type N8nOutput = N8nOutputItem[] | ParsedOutput | string[];

// Function to convert n8n question format to our internal format
function convertN8nQuestion(n8nQuestion: N8nQuestion): AssessmentQuestion {
  const questionType = n8nQuestion.type;
  let type: 'MCQ' | 'OPEN' = 'OPEN';
  
  // Use the actual options from N8N if available, otherwise fallback to generated ones
  let options: string[] | undefined = undefined;
  
  // Check if N8N question has options property
  if ('options' in n8nQuestion && Array.isArray((n8nQuestion as any).options)) {
    options = (n8nQuestion as any).options;
    console.log('🔍 Using N8N options:', options);
  }

  // Map n8n question types to our format based on the actual N8N output
  if (questionType === 'Multiple Choice' || questionType === 'Single Choice') {
    type = 'MCQ';
    // Only generate fallback options if N8N didn't provide any
    if (!options) {
      if (questionType === 'Multiple Choice') {
        options = ['Strongly Agree', 'Agree', 'Disagree', 'Strongly Disagree'];
      } else {
        options = ['Option A', 'Option B', 'Option C', 'Option D'];
      }
    }
  } else if (questionType === 'Pattern Choice') {
    type = 'MCQ';
    // Only generate fallback options if N8N didn't provide any
    if (!options) {
      options = ['Organ', 'System', 'Organism', 'Population'];
    }
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

  const result = {
    id: n8nQuestion.id.toString(), // Use the id field from N8N output
    question: n8nQuestion.question,
    type: type,
    options: options,
    category: n8nQuestion.section || 'General',
    difficulty: difficulty
  };
  
  console.log('🔍 Converted question:', {
    id: result.id,
    type: result.type,
    hasOptions: !!result.options,
    optionsCount: result.options?.length || 0,
    originalType: questionType
  });
  
  return result;
}

// Function to parse N8N output format and extract questions
function parseN8nOutput(n8nOutput: N8nOutput): AssessmentQuestion[] {
  try {
    console.log('🔍 Parsing N8N output:', JSON.stringify(n8nOutput, null, 2));
    
    // Handle string array format (when N8N output is stored as string array)
    if (Array.isArray(n8nOutput) && n8nOutput.length > 0 && typeof n8nOutput[0] === 'string') {
      console.log('🔍 Found string array format, attempting to parse first element');
      try {
        const parsedOutput = JSON.parse(n8nOutput[0]);
        console.log('🔍 Successfully parsed string array element:', JSON.stringify(parsedOutput, null, 2));
        
        if (parsedOutput && parsedOutput.questions && Array.isArray(parsedOutput.questions)) {
          console.log('🔍 Found questions array with', parsedOutput.questions.length, 'questions');
          return parsedOutput.questions.map((q: N8nQuestion) => convertN8nQuestion(q));
        }
      } catch (parseError) {
        console.error('🔍 Failed to parse string array element:', parseError);
      }
    }
    
    // Handle the N8N format: [{"output": "JSON_STRING_WITH_QUESTIONS"}]
    if (Array.isArray(n8nOutput) && n8nOutput.length > 0) {
      const firstItem = n8nOutput[0];
      if (firstItem && typeof firstItem === 'object' && 'output' in firstItem) {
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

// Helper function to get fallback questions based on class grade
function getFallbackQuestionsByClass(classGrade?: string): AssessmentQuestion[] {
  if (!classGrade) {
    // Default to class 4-7 if no class grade is provided
    return fallbackQuestions.class4to7;
  }

  // Normalize the class grade string (remove extra spaces, convert to lowercase)
  const normalizedGrade = classGrade.trim().toLowerCase();

  // Handle various formats:
  // - "Class 1", "Class 2", "Class 3" -> class1to3
  // - "Class 4", "Class 5", "Class 6", "Class 7" -> class4to7
  // - "Class 8", "Class 9", "Class 10" -> class7to10
  // - "Class 11", "Class 12" -> class11to12
  // - "Grade 1", "Grade 2", etc. -> same mapping
  // - Just numbers "1", "2", "3", etc. -> same mapping
  // - "1st", "2nd", "3rd", etc. -> extract number
  // - "Class 1-3", "Grade 4-7" -> use the first number or range

  // Extract all numbers from the string
  const numberMatches = normalizedGrade.match(/\d+/g);
  
  if (!numberMatches || numberMatches.length === 0) {
    // No numbers found, default to class 4-7
    console.log(`🔍 No class number found in "${classGrade}", defaulting to class4to7`);
    return fallbackQuestions.class4to7;
  }

  // Get the first number (in case of ranges like "Class 4-7")
  const classNumber = parseInt(numberMatches[0], 10);

  // Map class numbers to question sets
  if (classNumber >= 1 && classNumber <= 3) {
    console.log(`🔍 Class ${classNumber} mapped to class1to3 questions`);
    return fallbackQuestions.class1to3;
  } else if (classNumber >= 4 && classNumber <= 7) {
    console.log(`🔍 Class ${classNumber} mapped to class4to7 questions`);
    return fallbackQuestions.class4to7;
  } else if (classNumber >= 8 && classNumber <= 10) {
    console.log(`🔍 Class ${classNumber} mapped to class7to10 questions`);
    return fallbackQuestions.class7to10;
  } else if (classNumber >= 11 && classNumber <= 12) {
    console.log(`🔍 Class ${classNumber} mapped to class11to12 questions`);
    return fallbackQuestions.class11to12;
  } else if (classNumber < 1) {
    // Invalid class number (0 or negative), default to class 1-3
    console.log(`🔍 Invalid class number ${classNumber}, defaulting to class1to3`);
    return fallbackQuestions.class1to3;
  } else {
    // Class number > 12, default to class 11-12 (highest level)
    console.log(`🔍 Class number ${classNumber} > 12, defaulting to class11to12`);
    return fallbackQuestions.class11to12;
  }
}

// Fallback questions if n8n hasn't generated questions yet
const fallbackQuestions: {
  class1to3: AssessmentQuestion[];
  class4to7: AssessmentQuestion[];
  class7to10: AssessmentQuestion[];
  class11to12: AssessmentQuestion[];
} = {

  /* =======================
     CLASS 1 TO 3 (EASY)
     Career Interests & Learning Preferences
  ======================= */
  class1to3: [
    {
      id: '1',
      question: 'What do you like to do when you play?',
      type: 'MCQ',
      options: ['Draw pictures', 'Build with blocks', 'Read stories', 'Play outside'],
      correctAnswer: '',
      category: 'Interests',
      difficulty: 'easy'
    },
    {
      id: '2',
      question: 'Which subject do you enjoy the most?',
      type: 'MCQ',
      options: ['Math', 'Drawing/Art', 'Stories/English', 'Science experiments'],
      correctAnswer: '',
      category: 'Learning Preferences',
      difficulty: 'easy'
    },
    {
      id: '3',
      question: 'How do you like to learn new things?',
      type: 'MCQ',
      options: ['Watching videos', 'Reading books', 'Playing games', 'Talking to teachers'],
      correctAnswer: '',
      category: 'Learning Style',
      difficulty: 'easy'
    },
    {
      id: '4',
      question: 'What would you like to be when you grow up?',
      type: 'MCQ',
      options: ['Teacher', 'Doctor', 'Engineer', 'Artist/Singer'],
      correctAnswer: '',
      category: 'Career Aspiration',
      difficulty: 'easy'
    },
    {
      id: '5',
      question: 'Which activity do you enjoy most?',
      type: 'MCQ',
      options: ['Solving puzzles', 'Drawing/Painting', 'Telling stories', 'Helping others'],
      correctAnswer: '',
      category: 'Interests',
      difficulty: 'easy'
    },
    {
      id: '6',
      question: 'Do you like working alone or with friends?',
      type: 'MCQ',
      options: ['Alone', 'With friends', 'Sometimes alone, sometimes with friends', "I don't mind"],
      correctAnswer: '',
      category: 'Learning Preference',
      difficulty: 'easy'
    },
    {
      id: '7',
      question: 'What makes you feel proud?',
      type: 'MCQ',
      options: ['Getting good marks', 'Creating something new', 'Helping someone', 'Trying something new'],
      correctAnswer: '',
      category: 'Values',
      difficulty: 'easy'
    },
    {
      id: '8',
      question: 'Which would you like to learn more about?',
      type: 'MCQ',
      options: ['Numbers and counting', 'Animals and nature', 'Stories and languages', 'How things work'],
      correctAnswer: '',
      category: 'Interests',
      difficulty: 'easy'
    },
    {
      id: '9',
      question: 'When you face a difficult problem, what do you do?',
      type: 'MCQ',
      options: ['Try again yourself', 'Ask for help', 'Try a different way', 'Take a break and think'],
      correctAnswer: '',
      category: 'Problem Solving',
      difficulty: 'easy'
    },
    {
      id: '10',
      question: 'What do you want to help others with?',
      type: 'MCQ',
      options: ['Teaching something', 'Making them happy', 'Solving problems', 'Creating things'],
      correctAnswer: '',
      category: 'Career Interest',
      difficulty: 'easy'
    }
  ],

  /* =======================
     CLASS 4 TO 7 (EASY–MEDIUM)
     Career Exploration & Skills Assessment
  ======================= */
  class4to7: [
    {
      id: '1',
      question: 'Which subject area interests you the most?',
      type: 'MCQ',
      options: ['Mathematics and Science', 'Arts and Creative Writing', 'Technology and Computers', 'Social Studies and History'],
      correctAnswer: '',
      category: 'Academic Interest',
      difficulty: 'medium'
    },
    {
      id: '2',
      question: 'What type of work environment appeals to you?',
      type: 'MCQ',
      options: ['Working with computers/technology', 'Helping and teaching others', 'Creating art or designs', 'Leading teams and projects'],
      correctAnswer: '',
      category: 'Career Preference',
      difficulty: 'medium'
    },
    {
      id: '3',
      question: 'How do you prefer to solve problems?',
      type: 'MCQ',
      options: ['Step-by-step logical approach', 'Creative and out-of-the-box thinking', 'Discussing with others', 'Learning from examples'],
      correctAnswer: '',
      category: 'Problem Solving Style',
      difficulty: 'medium'
    },
    {
      id: '4',
      question: 'Which career field interests you?',
      type: 'MCQ',
      options: ['Engineering/Technology', 'Medicine/Healthcare', 'Teaching/Education', 'Arts/Design/Media'],
      correctAnswer: '',
      category: 'Career Interest',
      difficulty: 'medium'
    },
    {
      id: '5',
      question: 'What motivates you to learn?',
      type: 'MCQ',
      options: ['Understanding how things work', 'Getting good grades', 'Creating something new', 'Helping others succeed'],
      correctAnswer: '',
      category: 'Learning Motivation',
      difficulty: 'medium'
    },
    {
      id: '6',
      question: 'Which skill would you like to develop most?',
      type: 'MCQ',
      options: ['Logical thinking and analysis', 'Communication and expression', 'Creative problem-solving', 'Leadership and teamwork'],
      correctAnswer: '',
      category: 'Skill Development',
      difficulty: 'medium'
    },
    {
      id: '7',
      question: 'When working on a project, you prefer:',
      type: 'MCQ',
      options: ['Following a clear structure', 'Experimenting and exploring', 'Collaborating with peers', 'Leading the direction'],
      correctAnswer: '',
      category: 'Work Style',
      difficulty: 'medium'
    },
    {
      id: '8',
      question: 'What type of achievements make you feel most accomplished?',
      type: 'MCQ',
      options: ['Solving complex problems', 'Creating original work', 'Helping others achieve goals', 'Leading successful projects'],
      correctAnswer: '',
      category: 'Values',
      difficulty: 'medium'
    },
    {
      id: '9',
      question: 'Which activity outside school interests you most?',
      type: 'MCQ',
      options: ['Coding/Technology projects', 'Sports/Physical activities', 'Art/Music/Dance', 'Volunteering/Community service'],
      correctAnswer: '',
      category: 'Interests',
      difficulty: 'medium'
    },
    {
      id: '10',
      question: 'Your ideal future career would involve:',
      type: 'MCQ',
      options: ['Innovation and technology', 'Teaching and mentoring', 'Creative expression', 'Business and entrepreneurship'],
      correctAnswer: '',
      category: 'Career Aspiration',
      difficulty: 'medium'
    }
  ],

  /* =======================
     CLASS 7 TO 10 (MEDIUM–HARD)
     Career Planning & Skill Assessment
  ======================= */
  class7to10: [
    {
      id: '1',
      question: 'Which stream interests you most for higher education?',
      type: 'MCQ',
      options: ['Science (Engineering/Medicine)', 'Commerce (Business/Economics)', 'Arts/Humanities', 'Technology/IT'],
      correctAnswer: '',
      category: 'Career Path',
      difficulty: 'hard'
    },
    {
      id: '2',
      question: 'What role would you prefer in a team project?',
      type: 'MCQ',
      options: ['Technical specialist', 'Creative designer', 'Project leader', 'Research and analysis'],
      correctAnswer: '',
      category: 'Work Preference',
      difficulty: 'hard'
    },
    {
      id: '3',
      question: 'Which career attribute is most important to you?',
      type: 'MCQ',
      options: ['High earning potential', 'Making a difference in society', 'Creative freedom', 'Stability and security'],
      correctAnswer: '',
      category: 'Career Values',
      difficulty: 'hard'
    },
    {
      id: '4',
      question: 'How do you handle academic challenges?',
      type: 'MCQ',
      options: ['Analyze systematically and study more', 'Seek help from teachers/peers', 'Find creative study methods', 'Practice through problem-solving'],
      correctAnswer: '',
      category: 'Learning Approach',
      difficulty: 'hard'
    },
    {
      id: '5',
      question: 'Which industry sector attracts you most?',
      type: 'MCQ',
      options: ['IT/Software/Technology', 'Healthcare/Medicine', 'Education/Research', 'Creative/Media/Design'],
      correctAnswer: '',
      category: 'Industry Interest',
      difficulty: 'hard'
    },
    {
      id: '6',
      question: 'Your ideal work day would involve:',
      type: 'MCQ',
      options: ['Solving technical problems', 'Interacting with people', 'Creating original content', 'Planning and organizing tasks'],
      correctAnswer: '',
      category: 'Work Style',
      difficulty: 'hard'
    },
    {
      id: '7',
      question: 'Which skill do you think is your strongest?',
      type: 'MCQ',
      options: ['Logical reasoning', 'Communication', 'Creativity', 'Leadership'],
      correctAnswer: '',
      category: 'Self-Assessment',
      difficulty: 'hard'
    },
    {
      id: '8',
      question: 'For career preparation, you would focus on:',
      type: 'MCQ',
      options: ['Academic excellence and competitive exams', 'Developing practical skills', 'Building a portfolio', 'Gaining work experience'],
      correctAnswer: '',
      category: 'Career Preparation',
      difficulty: 'hard'
    },
    {
      id: '9',
      question: 'What motivates your career choice?',
      type: 'MCQ',
      options: ['Personal interest and passion', 'Career growth opportunities', 'Social impact and contribution', 'Financial stability'],
      correctAnswer: '',
      category: 'Career Motivation',
      difficulty: 'hard'
    },
    {
      id: '10',
      question: 'When thinking about your future, you prioritize:',
      type: 'MCQ',
      options: ['Specialized expertise in a field', 'Versatile skills across areas', 'Entrepreneurship and innovation', 'Service to community'],
      correctAnswer: '',
      category: 'Career Vision',
      difficulty: 'hard'
    }
  ],

  /* =======================
     CLASS 11 TO 12 (HARD)
     Advanced Career Planning & Specialization
  ======================= */
  class11to12: [
    {
      id: '1',
      question: 'What is your primary motivation for choosing a career path?',
      type: 'MCQ',
      options: ['Personal passion and interest', 'Financial security and growth', 'Social impact and contribution', 'Intellectual challenge'],
      correctAnswer: '',
      category: 'Career Motivation',
      difficulty: 'hard'
    },
    {
      id: '2',
      question: 'Which specialization area aligns with your strengths?',
      type: 'MCQ',
      options: ['STEM (Science/Technology/Engineering/Math)', 'Business/Management/Commerce', 'Arts/Humanities/Social Sciences', 'Healthcare/Medicine'],
      correctAnswer: '',
      category: 'Specialization',
      difficulty: 'hard'
    },
    {
      id: '3',
      question: 'How do you envision your professional growth?',
      type: 'MCQ',
      options: ['Becoming a technical expert', 'Leadership and management roles', 'Creative/entrepreneurial ventures', 'Research and academia'],
      correctAnswer: '',
      category: 'Career Growth',
      difficulty: 'hard'
    },
    {
      id: '4',
      question: 'What work-life balance do you prefer?',
      type: 'MCQ',
      options: ['High commitment, high reward', 'Structured schedule with flexibility', 'Creative freedom with deadlines', 'Balanced with personal time'],
      correctAnswer: '',
      category: 'Work-Life Balance',
      difficulty: 'hard'
    },
    {
      id: '5',
      question: 'Which type of impact do you want to make?',
      type: 'MCQ',
      options: ['Technological innovation', 'Social change and development', 'Economic growth and business', 'Knowledge and education'],
      correctAnswer: '',
      category: 'Impact Goals',
      difficulty: 'hard'
    },
    {
      id: '6',
      question: 'How do you prefer to learn and grow professionally?',
      type: 'MCQ',
      options: ['Formal education and certifications', 'Hands-on experience and projects', 'Mentorship and networking', 'Self-directed learning'],
      correctAnswer: '',
      category: 'Professional Development',
      difficulty: 'hard'
    },
    {
      id: '7',
      question: 'What is your approach to career decisions?',
      type: 'MCQ',
      options: ['Data-driven and analytical', 'Following passion and interest', 'Considering market opportunities', 'Seeking guidance and advice'],
      correctAnswer: '',
      category: 'Decision Making',
      difficulty: 'hard'
    },
    {
      id: '8',
      question: 'Which professional environment suits you best?',
      type: 'MCQ',
      options: ['Fast-paced and dynamic', 'Structured and organized', 'Creative and flexible', 'Collaborative and supportive'],
      correctAnswer: '',
      category: 'Work Environment',
      difficulty: 'hard'
    },
    {
      id: '9',
      question: 'What role does financial success play in your career choice?',
      type: 'MCQ',
      options: ['Primary consideration', 'Important but not only factor', 'Secondary to passion', 'Less important than fulfillment'],
      correctAnswer: '',
      category: 'Career Values',
      difficulty: 'hard'
    },
    {
      id: '10',
      question: 'Your ideal career would allow you to:',
      type: 'MCQ',
      options: ['Solve complex problems', 'Express creativity', 'Lead and inspire others', 'Contribute to society'],
      correctAnswer: '',
      category: 'Career Vision',
      difficulty: 'hard'
    }
  ]
};


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

    // Check if this is a submission request (has questionId parameter)
    const { searchParams } = new URL(request.url);
    const questionId = searchParams.get('questionId');
    const answer = searchParams.get('answer');
    const questionNumber = parseInt(searchParams.get('questionNumber') || '0');
    const isPrevious = searchParams.get('previous') === 'true';
    const currentQuestionParam = parseInt(searchParams.get('currentQuestion') || '0');

    // If parameters are provided, handle as submission
    if (questionId && answer !== null) {
      return await handleAnswerSubmission(decoded, questionId, answer, questionNumber);
    }

    // If this is a previous question request
    if (isPrevious && currentQuestionParam > 0) {
      return await handlePreviousQuestion(decoded, currentQuestionParam);
    }

    // Otherwise, handle as question fetch request

    // Verify student exists and onboarding is completed
    const student = await Student.findOne({ 
      userId: decoded.userId,
      onboardingCompleted: true 
    });

    if (!student) {
      return NextResponse.json(
        { error: 'Student not found or onboarding not completed' },
        { status: 404 }
      );
    }

    // Get or create assessment response to check for generated questions
    const assessmentResponse = await AssessmentResponse.findOne({
      uniqueId: student.uniqueId,
      assessmentType: 'diagnostic'
    });

    // Get questions from n8n or use fallback based on student's class
    let questions: AssessmentQuestion[] = getFallbackQuestionsByClass(student.classGrade);
    
    // Try to get N8N questions from assessment response
    if (assessmentResponse && assessmentResponse.generatedQuestions && assessmentResponse.generatedQuestions.length > 0) {
      console.log('🔍 Found stored N8N questions for student:', student.uniqueId);
      console.log('🔍 Raw generatedQuestions type:', typeof assessmentResponse.generatedQuestions);
      console.log('🔍 Raw generatedQuestions length:', assessmentResponse.generatedQuestions.length);
      console.log('🔍 Raw generatedQuestions first element type:', typeof assessmentResponse.generatedQuestions[0]);
      
      const parsedQuestions = parseN8nOutput(assessmentResponse.generatedQuestions);
      
      if (parsedQuestions.length > 0) {
        questions = parsedQuestions;
        console.log('🔍 Using parsed N8N questions:', questions.length);
        console.log('🔍 First parsed question:', questions[0]);
      } else {
        console.log('🔍 Failed to parse N8N questions, using fallback');
      }
    } else {
      console.log('🔍 No stored N8N questions, using fallback questions for student:', student.uniqueId);
      console.log('🔍 Number of fallback questions:', questions.length);
    }

    // Create assessment response if it doesn't exist
    let mutableAssessmentResponse = assessmentResponse;
    if (!mutableAssessmentResponse) {
      mutableAssessmentResponse = new AssessmentResponse({
        uniqueId: student.uniqueId,
        assessmentType: 'diagnostic',
        responses: [],
        webhookTriggered: false,
        generatedQuestions: []
      });
      await mutableAssessmentResponse.save();
      console.log('🔍 Created new assessment response for student:', student.uniqueId);
    }

    // Get current question number from existing responses
    const currentQuestionNumber = mutableAssessmentResponse.responses.length;
    const totalQuestions = questions.length;

    console.log('🔍 Assessment state:', {
      currentQuestionNumber,
      totalQuestions,
      responsesCount: mutableAssessmentResponse.responses.length,
      hasGeneratedQuestions: !!mutableAssessmentResponse.generatedQuestions?.length,
      questionsUsed: questions.length > 0 ? 'fallback' : 'none'
    });

    // Check if assessment is explicitly marked as completed
    if (mutableAssessmentResponse.isCompleted) {
      // Assessment already completed
      console.log('🔍 Assessment marked as completed', {
        isCompleted: mutableAssessmentResponse.isCompleted,
        currentQuestionNumber,
        totalQuestions
      });
      return NextResponse.json({
        success: true,
        message: 'Assessment already completed',
        completed: true,
        result: mutableAssessmentResponse.result,
        responses: mutableAssessmentResponse.responses
      });
    }

    // Check if all questions have been answered
    if (currentQuestionNumber >= totalQuestions) {
      console.log('🔍 All questions answered, marking assessment as completed', {
        currentQuestionNumber,
        totalQuestions
      });
      
      // Mark assessment as completed
      mutableAssessmentResponse.isCompleted = true;
      mutableAssessmentResponse.completedAt = new Date();
      
      // Generate result based on responses
      const mcqResponses = mutableAssessmentResponse.responses.filter((r: any) => r.questionType === 'MCQ');
      const correctAnswers = mcqResponses.filter((r: any) => r.isCorrect).length;
      const score = mcqResponses.length > 0 ? Math.round((correctAnswers / mcqResponses.length) * 100) : 85;
      
      // Result will be generated by AI analysis later
      mutableAssessmentResponse.result = null;
      
      await mutableAssessmentResponse.save();
      
      return NextResponse.json({
        success: true,
        message: 'Assessment completed',
        completed: true,
        result: mutableAssessmentResponse.result,
        responses: mutableAssessmentResponse.responses
      });
    }

    const currentQuestion = questions[currentQuestionNumber];

    if (!currentQuestion) {
      console.error('🔍 No question found at index:', currentQuestionNumber);
      console.error('🔍 Available questions:', questions.length);
      return NextResponse.json({
        error: 'No question available'
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      question: {
        id: currentQuestion.id,
        question: currentQuestion.question,
        type: currentQuestion.type,
        options: currentQuestion.options,
        section: currentQuestion.category,
        questionNumber: currentQuestionNumber + 1,
        totalQuestions: totalQuestions
      },
      currentQuestion: currentQuestionNumber + 1,
      totalQuestions: totalQuestions,
      progress: Math.round(((currentQuestionNumber + 1) / totalQuestions) * 100),
      isLast: (currentQuestionNumber + 1) === totalQuestions
    });

  } catch (error) {
    console.error('Assessment questions error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Helper function to handle answer submission
async function handleAnswerSubmission(decoded: DecodedToken, questionId: string, answer: string, questionNumber: number) {
  try {
    // Verify student exists
    const student = await Student.findOne({ 
      userId: decoded.userId,
      onboardingCompleted: true 
    });

    if (!student) {
      return NextResponse.json(
        { error: 'Student not found' },
        { status: 404 }
      );
    }

    // Find or create assessment response document
    let assessmentResponse = await AssessmentResponse.findOne({
      uniqueId: student.uniqueId,
      assessmentType: 'diagnostic'
    });

    // Get questions (n8n generated or fallback) based on student's class
    let questions: AssessmentQuestion[] = getFallbackQuestionsByClass(student.classGrade);
    if (assessmentResponse && assessmentResponse.generatedQuestions && assessmentResponse.generatedQuestions.length > 0) {
      console.log('🔍 Found stored N8N questions for submission');
      console.log('🔍 Raw generatedQuestions type:', typeof assessmentResponse.generatedQuestions);
      console.log('🔍 Raw generatedQuestions length:', assessmentResponse.generatedQuestions.length);
      console.log('🔍 Raw generatedQuestions first element type:', typeof assessmentResponse.generatedQuestions[0]);
      
      const parsedQuestions = parseN8nOutput(assessmentResponse.generatedQuestions);
      
      if (parsedQuestions.length > 0) {
        questions = parsedQuestions;
        console.log('🔍 Using parsed N8N questions for submission:', questions.length);
        console.log('🔍 First parsed question for submission:', questions[0]);
      } else {
        console.log('🔍 Failed to parse N8N questions for submission, using fallback');
      }
    } else {
      console.log('🔍 Using fallback questions for submission:', questions.length);
    }

    // Get the current question details
    console.log('🔍 Looking for question with ID:', questionId);
    console.log('🔍 Available question IDs:', questions.map(q => q.id));
    
    const currentQuestion = questions.find(q => q.id === questionId);
    if (!currentQuestion) {
      console.error('🔍 Question not found. Available questions:', questions.map(q => ({ id: q.id, question: q.question.substring(0, 50) + '...' })));
      return NextResponse.json(
        { error: 'Question not found' },
        { status: 404 }
      );
    }
    
    console.log('🔍 Found question:', currentQuestion.question.substring(0, 50) + '...');

    // Check if answer is correct (for MCQ questions)
    let isCorrect = null;
    if (currentQuestion.type === 'MCQ' && currentQuestion.correctAnswer) {
      isCorrect = answer === currentQuestion.correctAnswer;
    }

    if (!assessmentResponse) {
      assessmentResponse = new AssessmentResponse({
        uniqueId: student.uniqueId,
        assessmentType: 'diagnostic',
        responses: []
      });
    }

    // Add the response in the required format
    const formattedResponse = {
      Q: currentQuestion.id,
      section: currentQuestion.category,
      question: currentQuestion.question,
      studentAnswer: answer,
      type: currentQuestion.type === 'MCQ' ? 'Multiple Choice' : 'Open Text'
    };

    console.log('🔍 Adding response with formattedResponse:', formattedResponse);

    // Find the index of the existing response to update it
    const existingResponseIndex = assessmentResponse.responses.findIndex(
      (r: any) => r.questionId === currentQuestion.id
    );

    if (existingResponseIndex >= 0) {
      // Update existing response
      assessmentResponse.responses[existingResponseIndex] = {
        questionId: currentQuestion.id,
        question: currentQuestion.question,
        answer: answer,
        questionType: currentQuestion.type,
        category: currentQuestion.category,
        difficulty: currentQuestion.difficulty,
        isCorrect: isCorrect,
        submittedAt: new Date(),
        formattedResponse: formattedResponse
      };
    } else {
      // Add new response
      assessmentResponse.responses.push({
        questionId: currentQuestion.id,
        question: currentQuestion.question,
        answer: answer,
        questionType: currentQuestion.type,
        category: currentQuestion.category,
        difficulty: currentQuestion.difficulty,
        isCorrect: isCorrect,
        submittedAt: new Date(),
        formattedResponse: formattedResponse
      });
    }

    // Check if this is the last question
    const totalQuestions = questions.length;
    const isCompleted = assessmentResponse.responses.length >= totalQuestions;

    if (isCompleted) {
      // Calculate score for MCQ questions
      const mcqResponses = assessmentResponse.responses.filter((r: { questionType: string }) => r.questionType === 'MCQ');
      const correctAnswers = mcqResponses.filter((r: { isCorrect: boolean }) => r.isCorrect).length;
      const score = mcqResponses.length > 0 ? Math.round((correctAnswers / mcqResponses.length) * 100) : 85;

      // Collect all formatted responses for N8N webhook
      const formattedResponses = assessmentResponse.responses.map((r: any) => r.formattedResponse);
      assessmentResponse.collectedAnswers = formattedResponses;

      // Set completion data
      assessmentResponse.isCompleted = true;
      assessmentResponse.completedAt = new Date();
      
      // Result will be generated by AI analysis later
      assessmentResponse.result = null;

      console.log(`🔍 Assessment completed for student ${student.uniqueId} with score: ${score}%`);
      console.log(`🔍 Collected ${formattedResponses.length} formatted responses`);
    }

    // Save the assessment response
    await assessmentResponse.save();

    if (isCompleted) {
      // Generate new token without assessment requirement (assessment now complete)
      const newToken = jwt.sign(
        {
          userId: decoded.userId,
          email: decoded.email,
          fullName: decoded.fullName,
          role: decoded.role,
          firstTimeLogin: false,
          requiresOnboarding: false,
          requiresAssessment: false
        },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      const response = NextResponse.json({
        success: true,
        message: 'Assessment completed successfully',
        completed: true,
        result: assessmentResponse.result
      });

      // Update the auth token cookie
      response.cookies.set('auth-token', newToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60, // 7 days
        path: '/'
      });

      return response;
    }

    return NextResponse.json({
      success: true,
      message: 'Answer saved successfully',
      nextQuestion: questionNumber + 1
    });

  } catch (error) {
    console.error('Save assessment answer error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Helper function to handle previous question request
async function handlePreviousQuestion(decoded: DecodedToken, currentQuestionNumber: number) {
  try {
    // Verify student exists
    const student = await Student.findOne({ 
      userId: decoded.userId,
      onboardingCompleted: true 
    });

    if (!student) {
      return NextResponse.json(
        { error: 'Student not found' },
        { status: 404 }
      );
    }

    // Find assessment response
    const assessmentResponse = await AssessmentResponse.findOne({
      uniqueId: student.uniqueId,
      assessmentType: 'diagnostic'
    });

    // Get questions (n8n generated or fallback) based on student's class
    let questions: AssessmentQuestion[] = getFallbackQuestionsByClass(student.classGrade);
    if (assessmentResponse && assessmentResponse.generatedQuestions && assessmentResponse.generatedQuestions.length > 0) {
      const parsedQuestions = parseN8nOutput(assessmentResponse.generatedQuestions);
      if (parsedQuestions.length > 0) {
        questions = parsedQuestions;
      }
    }

    // Calculate previous question number
    const previousQuestionNumber = currentQuestionNumber - 1;
    
    if (previousQuestionNumber < 0 || previousQuestionNumber >= questions.length) {
      return NextResponse.json(
        { error: 'Invalid question number' },
        { status: 400 }
      );
    }

    const previousQuestion = questions[previousQuestionNumber];

    if (!previousQuestion) {
      return NextResponse.json(
        { error: 'Question not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      question: {
        id: previousQuestion.id,
        question: previousQuestion.question,
        type: previousQuestion.type,
        options: previousQuestion.options,
        section: previousQuestion.category,
        questionNumber: previousQuestionNumber + 1,
        totalQuestions: questions.length
      },
      currentQuestion: previousQuestionNumber + 1,
      totalQuestions: questions.length,
      progress: Math.round(((previousQuestionNumber + 1) / questions.length) * 100),
      isLast: (previousQuestionNumber + 1) === questions.length
    });

  } catch (error) {
    console.error('Previous question error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
