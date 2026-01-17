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
  ======================= */
  class1to3: [
    {
      id: '1',
      question: 'Which animal is called the King of the Jungle?',
      type: 'MCQ',
      options: ['Elephant', 'Lion', 'Tiger', 'Bear'],
      correctAnswer: 'Lion',
      category: 'General Knowledge',
      difficulty: 'easy'
    },
    {
      id: '2',
      question: 'How many days are there in a week?',
      type: 'MCQ',
      options: ['5', '6', '7', '8'],
      correctAnswer: '7',
      category: 'General Knowledge',
      difficulty: 'easy'
    },
    {
      id: '3',
      question: 'Which color is the sky?',
      type: 'MCQ',
      options: ['Green', 'Blue', 'Red', 'Yellow'],
      correctAnswer: 'Blue',
      category: 'General Knowledge',
      difficulty: 'easy'
    },
    {
      id: '4',
      question: 'Which fruit is yellow?',
      type: 'MCQ',
      options: ['Apple', 'Banana', 'Grapes', 'Orange'],
      correctAnswer: 'Banana',
      category: 'General Knowledge',
      difficulty: 'easy'
    },
    {
      id: '5',
      question: 'How many legs does a dog have?',
      type: 'MCQ',
      options: ['2', '3', '4', '6'],
      correctAnswer: '4',
      category: 'General Knowledge',
      difficulty: 'easy'
    },
    {
      id: '6',
      question: 'Which shape is round?',
      type: 'MCQ',
      options: ['Square', 'Triangle', 'Circle', 'Rectangle'],
      correctAnswer: 'Circle',
      category: 'Mathematics',
      difficulty: 'easy'
    },
    {
      id: '7',
      question: 'Which vehicle flies in the sky?',
      type: 'MCQ',
      options: ['Car', 'Bus', 'Aeroplane', 'Train'],
      correctAnswer: 'Aeroplane',
      category: 'General Knowledge',
      difficulty: 'easy'
    },
    {
      id: '8',
      question: 'Which animal gives us milk?',
      type: 'MCQ',
      options: ['Dog', 'Cat', 'Cow', 'Lion'],
      correctAnswer: 'Cow',
      category: 'General Knowledge',
      difficulty: 'easy'
    },
    {
      id: '9',
      question: 'Which sense organ helps us hear?',
      type: 'MCQ',
      options: ['Eye', 'Nose', 'Ear', 'Tongue'],
      correctAnswer: 'Ear',
      category: 'Science',
      difficulty: 'easy'
    },
    {
      id: '10',
      question: 'How many alphabets are there in English?',
      type: 'MCQ',
      options: ['24', '25', '26', '27'],
      correctAnswer: '26',
      category: 'General Knowledge',
      difficulty: 'easy'
    }
  ],

  /* =======================
     CLASS 4 TO 7 (EASY–MEDIUM)
  ======================= */
  class4to7: [
    {
      id: '1',
      question: 'Which planet is known as the Red Planet?',
      type: 'MCQ',
      options: ['Earth', 'Mars', 'Venus', 'Jupiter'],
      correctAnswer: 'Mars',
      category: 'Science',
      difficulty: 'medium'
    },
    {
      id: '2',
      question: 'Who invented the telephone?',
      type: 'MCQ',
      options: ['Newton', 'Edison', 'Alexander Graham Bell', 'Einstein'],
      correctAnswer: 'Alexander Graham Bell',
      category: 'General Knowledge',
      difficulty: 'medium'
    },
    {
      id: '3',
      question: 'Which is the largest continent?',
      type: 'MCQ',
      options: ['Africa', 'Europe', 'Asia', 'Australia'],
      correctAnswer: 'Asia',
      category: 'Geography',
      difficulty: 'medium'
    },
    {
      id: '4',
      question: 'How many states are there in India?',
      type: 'MCQ',
      options: ['27', '28', '29', '30'],
      correctAnswer: '28',
      category: 'Civics',
      difficulty: 'medium'
    },
    {
      id: '5',
      question: 'What gas do plants use for photosynthesis?',
      type: 'MCQ',
      options: ['Oxygen', 'Carbon Dioxide', 'Nitrogen', 'Hydrogen'],
      correctAnswer: 'Carbon Dioxide',
      category: 'Science',
      difficulty: 'medium'
    },
    {
      id: '6',
      question: 'Which is the fastest land animal?',
      type: 'MCQ',
      options: ['Lion', 'Horse', 'Cheetah', 'Tiger'],
      correctAnswer: 'Cheetah',
      category: 'General Knowledge',
      difficulty: 'medium'
    },
    {
      id: '7',
      question: 'Who is known as the Father of the Nation (India)?',
      type: 'MCQ',
      options: ['Nehru', 'Gandhi', 'Patel', 'Bose'],
      correctAnswer: 'Gandhi',
      category: 'History',
      difficulty: 'medium'
    },
    {
      id: '8',
      question: 'Which ocean is the largest?',
      type: 'MCQ',
      options: ['Indian', 'Atlantic', 'Pacific', 'Arctic'],
      correctAnswer: 'Pacific',
      category: 'Geography',
      difficulty: 'medium'
    },
    {
      id: '9',
      question: 'Which vitamin is given by sunlight?',
      type: 'MCQ',
      options: ['Vitamin A', 'Vitamin B', 'Vitamin C', 'Vitamin D'],
      correctAnswer: 'Vitamin D',
      category: 'Science',
      difficulty: 'medium'
    },
    {
      id: '10',
      question: 'What is the currency of India?',
      type: 'MCQ',
      options: ['Dollar', 'Rupee', 'Euro', 'Yen'],
      correctAnswer: 'Rupee',
      category: 'General Knowledge',
      difficulty: 'medium'
    }
  ],

  /* =======================
     CLASS 7 TO 10 (MEDIUM–HARD)
  ======================= */
  class7to10: [
    {
      id: '1',
      question: 'What is the SI unit of force?',
      type: 'MCQ',
      options: ['Joule', 'Newton', 'Pascal', 'Watt'],
      correctAnswer: 'Newton',
      category: 'Physics',
      difficulty: 'hard'
    },
    {
      id: '2',
      question: 'Who wrote the Indian National Anthem?',
      type: 'MCQ',
      options: ['Bankim Chandra', 'Tagore', 'Gandhi', 'Nehru'],
      correctAnswer: 'Rabindranath Tagore',
      category: 'History',
      difficulty: 'hard'
    },
    {
      id: '3',
      question: 'Which gas is most abundant in the atmosphere?',
      type: 'MCQ',
      options: ['Oxygen', 'Carbon Dioxide', 'Nitrogen', 'Hydrogen'],
      correctAnswer: 'Nitrogen',
      category: 'Science',
      difficulty: 'hard'
    },
    {
      id: '4',
      question: 'What is the capital of Australia?',
      type: 'MCQ',
      options: ['Sydney', 'Melbourne', 'Canberra', 'Perth'],
      correctAnswer: 'Canberra',
      category: 'Geography',
      difficulty: 'hard'
    },
    {
      id: '5',
      question: 'Who discovered gravity?',
      type: 'MCQ',
      options: ['Newton', 'Einstein', 'Galileo', 'Tesla'],
      correctAnswer: 'Newton',
      category: 'Science',
      difficulty: 'hard'
    },
    {
      id: '6',
      question: 'Which blood group is universal donor?',
      type: 'MCQ',
      options: ['A', 'B', 'AB', 'O'],
      correctAnswer: 'O',
      category: 'Biology',
      difficulty: 'hard'
    },
    {
      id: '7',
      question: 'Which country gifted the Statue of Liberty to USA?',
      type: 'MCQ',
      options: ['UK', 'France', 'Germany', 'Italy'],
      correctAnswer: 'France',
      category: 'History',
      difficulty: 'hard'
    },
    {
      id: '8',
      question: 'What is the chemical formula of water?',
      type: 'MCQ',
      options: ['CO2', 'H2O', 'O2', 'NaCl'],
      correctAnswer: 'H2O',
      category: 'Chemistry',
      difficulty: 'hard'
    },
    {
      id: '9',
      question: 'Which Indian satellite was first sent to space?',
      type: 'MCQ',
      options: ['INSAT', 'Aryabhata', 'Chandrayaan', 'Mangalyaan'],
      correctAnswer: 'Aryabhata',
      category: 'Science',
      difficulty: 'hard'
    },
    {
      id: '10',
      question: 'What does CPU stand for?',
      type: 'MCQ',
      options: ['Central Processing Unit', 'Computer Power Unit', 'Core Process Unit', 'Control Panel Unit'],
      correctAnswer: 'Central Processing Unit',
      category: 'Computer',
      difficulty: 'hard'
    }
  ],

  /* =======================
     CLASS 11 TO 12 (HARD)
  ======================= */
  class11to12: [
    {
      id: '1',
      question: 'What is the pH value of pure water?',
      type: 'MCQ',
      options: ['5', '6', '7', '8'],
      correctAnswer: '7',
      category: 'Chemistry',
      difficulty: 'hard'
    },
    {
      id: '2',
      question: 'Who proposed the theory of relativity?',
      type: 'MCQ',
      options: ['Newton', 'Einstein', 'Galileo', 'Tesla'],
      correctAnswer: 'Einstein',
      category: 'Physics',
      difficulty: 'hard'
    },
    {
      id: '3',
      question: 'Which article of Indian Constitution deals with Right to Equality?',
      type: 'MCQ',
      options: ['Article 14', 'Article 19', 'Article 21', 'Article 32'],
      correctAnswer: 'Article 14',
      category: 'Political Science',
      difficulty: 'hard'
    },
    {
      id: '4',
      question: 'What is the chemical symbol of Gold?',
      type: 'MCQ',
      options: ['Ag', 'Au', 'Gd', 'Go'],
      correctAnswer: 'Au',
      category: 'Chemistry',
      difficulty: 'hard'
    },
    {
      id: '5',
      question: 'Which organ produces insulin?',
      type: 'MCQ',
      options: ['Liver', 'Pancreas', 'Kidney', 'Heart'],
      correctAnswer: 'Pancreas',
      category: 'Biology',
      difficulty: 'hard'
    },
    {
      id: '6',
      question: 'What is the speed of light?',
      type: 'MCQ',
      options: ['3×10⁸ m/s', '3×10⁶ m/s', '1×10⁸ m/s', '1×10⁶ m/s'],
      correctAnswer: '3×10⁸ m/s',
      category: 'Physics',
      difficulty: 'hard'
    },
    {
      id: '7',
      question: 'Who is the author of "Discovery of India"?',
      type: 'MCQ',
      options: ['Gandhi', 'Nehru', 'Tagore', 'Ambedkar'],
      correctAnswer: 'Jawaharlal Nehru',
      category: 'History',
      difficulty: 'hard'
    },
    {
      id: '8',
      question: 'What does DNA stand for?',
      type: 'MCQ',
      options: [
        'Deoxyribonucleic Acid',
        'Dynamic Nuclear Acid',
        'Double Nitrogen Atom',
        'Dual Nucleic Acid'
      ],
      correctAnswer: 'Deoxyribonucleic Acid',
      category: 'Biology',
      difficulty: 'hard'
    },
    {
      id: '9',
      question: 'Which country has the highest population?',
      type: 'MCQ',
      options: ['India', 'China', 'USA', 'Russia'],
      correctAnswer: 'India',
      category: 'Geography',
      difficulty: 'hard'
    },
    {
      id: '10',
      question: 'What is the full form of GDP?',
      type: 'MCQ',
      options: [
        'Gross Domestic Product',
        'General Development Plan',
        'Global Domestic Price',
        'Gross Demand Product'
      ],
      correctAnswer: 'Gross Domestic Product',
      category: 'Economics',
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
