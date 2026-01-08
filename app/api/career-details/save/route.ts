import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import connectDB from '@/lib/mongodb';
import Student from '@/models/Student';
import CareerSession from '@/models/CareerSession';
import { processLearningPathData, saveLearningPathToDatabase, createLearningPathResponse, saveN8NLearningPathResponse, validateCareerDetailsData, normalizeCareerDetailsData } from '@/lib/utils/learningPathUtils';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

interface DecodedToken {
  userId: string;
  [key: string]: unknown;
}

interface CareerDetailsInput {
  output: {
    greeting: string;
    overview: string[];
    timeRequired: string;
    focusAreas: string[];
    learningPath: Array<{
      module: string;
      description: string;
      submodules: Array<{
        title: string;
        description: string;
        chapters: Array<{
          title: string;
        }>;
      }>;
    }>;
    finalTip: string;
  };
  uniqueid: string;
}

// Utility function to save career details to CareerSession model
async function saveCareerDetailsToSession(
  careerDetails: CareerDetailsInput,
  student: any,
  careerPath: string,
  description: string
): Promise<string | null> {
  try {
    if (!careerDetails?.output) {
      console.log('⚠️ No career details output to save');
      return null;
    }

    // Find existing career session or create new one
    let careerSession = await CareerSession.findOne({
      userId: student.userId,
      studentId: student.uniqueId,
      isCompleted: false
    });

    if (!careerSession) {
      // Create new career session
      careerSession = new CareerSession({
        userId: student.userId,
        studentId: student.uniqueId,
        sessionId: `career_${student.uniqueId}_${Date.now()}`,
        currentCareerPath: careerPath,
        careerPaths: [],
        explorationHistory: [],
        selectedCareerDetails: null,
        isCompleted: false,
        lastActivity: new Date()
      });
    }

    // Add or update career path details
    const careerPathData = {
      careerPath: careerPath,
      description: description || '',
      details: careerDetails.output,
      selectedAt: new Date()
    };

    // Check if this career path already exists in the session
    const existingPathIndex = careerSession.careerPaths.findIndex(
      (path: any) => path.careerPath === careerPath
    );

    if (existingPathIndex >= 0) {
      // Update existing career path
      careerSession.careerPaths[existingPathIndex] = careerPathData;
    } else {
      // Add new career path
      careerSession.careerPaths.push(careerPathData);
    }

    // Update current career path and selected details
    careerSession.currentCareerPath = careerPath;
    careerSession.selectedCareerDetails = careerDetails.output;
    careerSession.lastActivity = new Date();

    // Add to exploration history if not already present
    if (!careerSession.explorationHistory.includes(careerPath)) {
      careerSession.explorationHistory.push(careerPath);
    }

    await careerSession.save();
    console.log('✅ Career details saved to session:', careerSession.sessionId);
    
    return careerSession.sessionId;
  } catch (error) {
    console.error('❌ Error saving career details to session:', error);
    return null;
  }
}

export async function POST(request: NextRequest) {
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

    // Get student profile
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

    // Get career details from request body
    const { careerDetails, careerPath, description } = await request.json();

    if (!careerDetails || !careerPath) {
      return NextResponse.json(
        { error: 'Career details and career path are required' },
        { status: 400 }
      );
    }

    // Normalize the career details data structure
    const normalizedCareerDetails = normalizeCareerDetailsData(careerDetails, student.uniqueId);
    
    if (!normalizedCareerDetails) {
      return NextResponse.json(
        { error: 'Invalid career details data' },
        { status: 400 }
      );
    }

    // Validate the career details structure
    const validationResult = validateCareerDetailsData(normalizedCareerDetails);
    if (!validationResult.isValid) {
      console.error('❌ Career details validation failed:', {
        errors: validationResult.errors,
        warnings: validationResult.warnings,
        receivedData: {
          hasOutput: !!normalizedCareerDetails.output,
          hasUniqueid: !!normalizedCareerDetails.uniqueid,
          outputKeys: normalizedCareerDetails.output ? Object.keys(normalizedCareerDetails.output) : [],
          learningPathLength: normalizedCareerDetails.output?.learningPath?.length || 0
        }
      });
      return NextResponse.json(
        { 
          error: 'Invalid career details data structure',
          validationErrors: validationResult.errors,
          validationWarnings: validationResult.warnings,
          receivedStructure: {
            hasOutput: !!normalizedCareerDetails.output,
            hasUniqueid: !!normalizedCareerDetails.uniqueid,
            outputKeys: normalizedCareerDetails.output ? Object.keys(normalizedCareerDetails.output) : []
          }
        },
        { status: 400 }
      );
    }

    // Log any warnings
    if (validationResult.warnings.length > 0) {
      console.warn('⚠️ Career details validation warnings:', validationResult.warnings);
    }

    console.log('💾 Saving career details for path:', careerPath, 'student:', student.uniqueId);

    // Save career details to CareerSession (for exploration tracking)
    const careerSessionId = await saveCareerDetailsToSession(
      normalizedCareerDetails, 
      student, 
      careerPath, 
      description || ''
    );

    // Save N8N output directly in the exact database format
    const responseResult = await saveN8NLearningPathResponse(
      normalizedCareerDetails.output,
      student.uniqueId
    );

    // Create the learning path response for API response
    const learningPathResponse = createLearningPathResponse(
      normalizedCareerDetails.output,
      student.uniqueId
    );

    // Process the raw learning path data for database storage
    const processedData = processLearningPathData(
      normalizedCareerDetails.output,
      student,
      careerPath,
      'n8n'
    );

    // Save to database with validation
    const result = await saveLearningPathToDatabase(processedData);
    
    if (result.success && responseResult.success) {
      console.log('✅ Career details and learning path saved successfully:', {
        careerSessionId,
        pathId: result.pathId,
        responseId: responseResult.id
      });
      
      return NextResponse.json({
        success: true,
        message: 'Career details saved successfully',
        careerSessionId: careerSessionId,
        pathId: result.pathId,
        responseId: responseResult.id,
        learningPathResponse: learningPathResponse,
        careerDetails: normalizedCareerDetails
      });
    } else {
      const errors = [];
      if (!result.success) errors.push(result.error);
      if (!responseResult.success) errors.push(responseResult.error);
      
      console.error('❌ Failed to save career details:', errors);
      return NextResponse.json(
        { 
          success: false,
          error: 'Failed to save career details',
          details: errors.join('; '),
          careerSessionId: careerSessionId // Still return session ID if it was saved
        },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Career details save error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
