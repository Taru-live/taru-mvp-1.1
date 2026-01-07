import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import connectDB from '@/lib/mongodb';
import Student from '@/models/Student';
import AssessmentResponse from '@/models/AssessmentResponse';
import { N8NCacheService } from '@/lib/N8NCacheService';
import { LangChainService } from '@/lib/langchain/LangChainService';

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

    // Get assessment response
    const assessmentResponse = await AssessmentResponse.findOne({
      uniqueId: student.uniqueId,
      assessmentType: 'diagnostic',
      isCompleted: true
    });

    if (!assessmentResponse) {
      return NextResponse.json(
        { error: 'Assessment not completed' },
        { status: 404 }
      );
    }

    // Check for cached analysis results first
    const forceRegenerate = request.headers.get('x-force-regenerate') === 'true';
    
    if (!forceRegenerate) {
      const cachedAnalysis = await N8NCacheService.getCachedAssessmentResults(
        student.uniqueId,
        'analysis',
        24 // 24 hours cache
      );
      
      if (cachedAnalysis) {
        console.log(`🎯 Using cached assessment analysis for student ${student.uniqueId}`);
        return NextResponse.json({
          success: true,
          result: cachedAnalysis,
          cached: true,
          metadata: {
            generatedAt: new Date().toISOString(),
            studentId: decoded.userId,
            cacheHit: true
          }
        });
      }
    }

    console.log('🔍 Analyzing assessment results using LangChain for student:', student.uniqueId);

    // Use LangChainService instead of n8n webhook
    const langChainService = new LangChainService();
    
    try {
      // Get formatted responses for analysis
      const formattedResponses = assessmentResponse.responses.map((r: any) => ({
        Q: r.questionId || r.Q,
        section: r.category || r.section,
        question: r.question,
        studentAnswer: r.answer || r.studentAnswer,
        type: r.questionType === 'MCQ' ? 'Multiple Choice' : 'Open Text'
      }));

      const analysis = await langChainService.analyzeAssessmentResults(
        student.uniqueId,
        formattedResponses
      );

      if (!analysis) {
        console.log('⚠️ No analysis generated from LangChain, using fallback');
        return NextResponse.json({
          success: true,
          result: {
            totalQuestions: assessmentResponse.responses.length,
            score: 0,
            summary: 'Assessment completed successfully!',
            langChainResults: null
          }
        });
      }

      // Extract data from LangChain analysis
      const score = parseInt(analysis.Score) || 0;
      const totalQuestions = parseInt(analysis['Total Questions']) || assessmentResponse.responses.length;
      const summary = analysis.Summary || 'Assessment completed successfully!';

      // Prepare result data from LangChain analysis
      const resultData = {
        type: analysis.PersonalityType || 'Assessment Completed',
        description: summary,
        score: score,
        learningStyle: analysis.LearningStyle || 'Mixed',
        recommendations: analysis.Recommendations || [],
        totalQuestions: totalQuestions,
        langChainResults: analysis
      };

      // Save to cache
      try {
        // Save to cache
        const n8nResult = await N8NCacheService.saveResult({
          uniqueId: student.uniqueId,
          resultType: 'assessment_analysis',
          webhookUrl: 'langchain-analysis',
          requestPayload: { uniqueId: student.uniqueId },
          responseData: analysis,
          processedData: resultData,
          status: 'completed',
          metadata: {
            studentId: decoded.userId,
            assessmentId: `${student.uniqueId}_diagnostic`,
            contentType: 'analysis',
            version: '1.0'
          },
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
        });

        // Update assessment response with LangChain results
        await N8NCacheService.updateAssessmentResults(
          student.uniqueId,
          'analysis',
          resultData,
          n8nResult._id.toString()
        );

        console.log(`💾 Saved assessment analysis to cache for student ${student.uniqueId}`);
      } catch (cacheError) {
        console.error('❌ Error saving to cache:', cacheError);
        // Continue with response even if cache fails
      }

      // Update assessment response with LangChain results (legacy support)
      assessmentResponse.result = resultData;
      await assessmentResponse.save();
      console.log('🔍 Assessment response updated with LangChain results');

      return NextResponse.json({
        success: true,
        result: {
          totalQuestions: totalQuestions,
          score: score,
          summary: summary,
          langChainResults: analysis
        }
      });

    } catch (error) {
      console.error('LangChain assessment analysis error:', error);
      
      // Return fallback result
      return NextResponse.json({
        success: true,
        result: {
          totalQuestions: assessmentResponse.responses.length,
          score: 0,
          summary: 'Assessment completed successfully!',
          langChainResults: null,
          error: 'Using fallback due to LangChain error'
        }
      });
    }

  } catch (error) {
    console.error('Assessment result error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
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

    // Get assessment response
    const assessmentResponse = await AssessmentResponse.findOne({
      uniqueId: student.uniqueId,
      assessmentType: 'diagnostic',
      isCompleted: true
    });

    if (!assessmentResponse) {
      return NextResponse.json(
        { error: 'Assessment not completed' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      result: assessmentResponse.result || null
    });

  } catch (error) {
    console.error('Assessment result error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
