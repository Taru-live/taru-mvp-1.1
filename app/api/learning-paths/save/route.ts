import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import LearningPath from '@/models/LearningPath';
import LearningPathResponse from '@/models/LearningPathResponse';
import { normalizeCareerDetailsData, validateCareerDetailsData } from '@/lib/utils/learningPathUtils';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

interface DecodedToken {
  userId: string;
  [key: string]: unknown;
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

    // Get user
    const user = await User.findById(decoded.userId);
    if (!user || user.role !== 'student') {
      return NextResponse.json(
        { error: 'Only students can save learning paths' },
        { status: 403 }
      );
    }

    // Get request body
    const body = await request.json();
    const { 
      studentId, 
      careerPath, 
      description, 
      learningModules, 
      timeRequired, 
      focusAreas 
    } = body;

    // Validate required fields
    if (!careerPath || !description || !learningModules || !Array.isArray(learningModules)) {
      return NextResponse.json(
        { error: 'Missing required fields: careerPath, description, learningModules' },
        { status: 400 }
      );
    }

    // Normalize learningModules to ensure proper structure
    const normalizedModules = learningModules.map((module: any) => {
      // Ensure module has required fields
      const normalizedModule: any = {
        module: module.module || module.name || 'Module',
        description: module.description || '',
        submodules: []
      };

      // Normalize submodules if present
      if (module.submodules && Array.isArray(module.submodules)) {
        normalizedModule.submodules = module.submodules.map((sub: any) => {
          const normalizedSub: any = {
            title: sub.title || sub.name || 'Submodule',
            description: sub.description || '',
            chapters: []
          };

          // Normalize chapters if present
          if (sub.chapters && Array.isArray(sub.chapters)) {
            normalizedSub.chapters = sub.chapters.map((chapter: any) => ({
              title: chapter.title || chapter.name || 'Chapter'
            }));
          }

          return normalizedSub;
        });
      }

      return normalizedModule;
    });

    // Create a normalized career details structure for validation
    const careerDetailsForValidation = {
      uniqueid: studentId || user.uniqueId,
      output: {
        greeting: `Hi Student! Welcome to your ${careerPath} learning journey!`,
        overview: Array.isArray(description) ? description : description.split('. ').filter((s: string) => s.trim()),
        timeRequired: timeRequired || 'Not specified',
        focusAreas: Array.isArray(focusAreas) ? focusAreas : [],
        learningPath: normalizedModules,
        finalTip: `Keep exploring and learning in ${careerPath}!`
      }
    };

    // Normalize and validate the data
    const normalizedCareerDetails = normalizeCareerDetailsData(careerDetailsForValidation, studentId || user.uniqueId);
    
    if (!normalizedCareerDetails) {
      return NextResponse.json(
        { error: 'Failed to normalize learning path data' },
        { status: 400 }
      );
    }

    // Validate the structure
    const validationResult = validateCareerDetailsData(normalizedCareerDetails);
    if (!validationResult.isValid) {
      console.error('❌ Learning path validation failed:', validationResult.errors);
      return NextResponse.json(
        { 
          error: 'Invalid learning path data structure',
          validationErrors: validationResult.errors
        },
        { status: 400 }
      );
    }

    // Check if a learning path for this career already exists for this student in learning-path-responses
    const existingResponse = await LearningPathResponse.findOne({
      uniqueid: normalizedCareerDetails.uniqueid,
      'output.greeting': { $regex: new RegExp(careerPath, 'i') }
    });

    if (existingResponse) {
      // Update existing response with normalized data
      existingResponse.output = normalizedCareerDetails.output;
      existingResponse.updatedAt = new Date();
      
      await existingResponse.save();
      
      return NextResponse.json({
        message: 'Learning path updated successfully',
        learningPath: {
          _id: existingResponse._id,
          studentId: existingResponse.uniqueid,
          careerPath: careerPath,
          description: description,
          learningModules: normalizedCareerDetails.output.learningPath,
          timeRequired: normalizedCareerDetails.output.timeRequired,
          focusAreas: normalizedCareerDetails.output.focusAreas,
          createdAt: existingResponse.createdAt,
          updatedAt: existingResponse.updatedAt
        }
      });
    } else {
      // Create new learning path response with normalized data
      const newLearningPathResponse = new LearningPathResponse({
        uniqueid: normalizedCareerDetails.uniqueid,
        output: normalizedCareerDetails.output
      });

      await newLearningPathResponse.save();

      return NextResponse.json({
        message: 'Learning path saved successfully',
        learningPath: {
          _id: newLearningPathResponse._id,
          studentId: newLearningPathResponse.uniqueid,
          careerPath: careerPath,
          description: description,
          learningModules: normalizedCareerDetails.output.learningPath,
          timeRequired: normalizedCareerDetails.output.timeRequired,
          focusAreas: normalizedCareerDetails.output.focusAreas,
          createdAt: newLearningPathResponse.createdAt,
          updatedAt: newLearningPathResponse.updatedAt
        }
      });
    }

  } catch (error) {
    console.error('Save learning path error:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}