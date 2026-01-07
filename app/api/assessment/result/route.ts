import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import connectDB from '@/lib/mongodb';
import Student from '@/models/Student';
import AssessmentResponse from '@/models/AssessmentResponse';
import { N8NCacheService } from '@/lib/N8NCacheService';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const N8N_SCORE_WEBHOOK_URL = 'https://nclbtaru.app.n8n.cloud/webhook/Score-result';

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

    console.log('🔍 Sending uniqueID to N8N Score-result webhook:', student.uniqueId);
    console.log('🔍 N8N webhook URL:', N8N_SCORE_WEBHOOK_URL);

    // Send uniqueID to N8N webhook using GET request with URL parameters
    const urlParams = new URLSearchParams({
      uniqueId: student.uniqueId
    });
    
    const webhookUrl = `${N8N_SCORE_WEBHOOK_URL}?${urlParams.toString()}`;
    console.log('🔍 Webhook URL:', webhookUrl);

    // Add timeout to prevent hanging requests (increased to 30 seconds for n8n workflows)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

    let n8nOutput: any; // Declare n8nOutput here
    try {
      console.log('🔍 Making GET request to N8N webhook...');
      const response = await fetch(webhookUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: controller.signal
      });
      
      console.log('🔍 N8N webhook response status:', response.status);
      console.log('🔍 N8N webhook response statusText:', response.statusText);

      clearTimeout(timeoutId);

      if (!response.ok) {
        console.error('🔍 N8N webhook request failed:', response.status, response.statusText);
        return NextResponse.json(
          { error: 'Failed to get assessment results' },
          { status: 500 }
        );
      }

      // Add better error handling for JSON parsing
      const responseText = await response.text();
      console.log('🔍 Raw N8N response text:', responseText);
      
      if (!responseText || responseText.trim() === '') {
        console.log('⚠️ N8N returned empty response, using fallback');
        return NextResponse.json({
          success: true,
          result: {
            totalQuestions: 0,
            score: 0,
            summary: 'Assessment completed successfully!',
            n8nResults: null
          }
        });
      }
      
      n8nOutput = JSON.parse(responseText);
      console.log('🔍 Parsed N8N webhook response:', n8nOutput);
    } catch (fetchError) {
      clearTimeout(timeoutId);
      if (fetchError instanceof Error && fetchError.name === 'AbortError') {
        console.error('🔍 N8N webhook request timed out after 30 seconds');
      } else {
        console.error('🔍 N8N webhook request failed:', fetchError);
      }
      
      // Return fallback result instead of failing
      return NextResponse.json({
        success: true,
        result: {
          totalQuestions: 0,
          score: 0,
          summary: 'Assessment completed successfully!',
          n8nResults: null
        }
      });
    }

    // Parse the N8N output format - expecting array with single object
    let result = null;
    if (n8nOutput && Array.isArray(n8nOutput) && n8nOutput.length > 0) {
      result = n8nOutput[0];
      console.log('🔍 Parsed N8N result:', result);
    } else if (n8nOutput && typeof n8nOutput === 'object') {
      result = n8nOutput;
      console.log('🔍 Using direct N8N result:', result);
    }

    if (!result) {
      console.log('⚠️ No valid result from N8N, using fallback');
      return NextResponse.json({
        success: true,
        result: {
          totalQuestions: 0,
          score: 0,
          summary: 'Assessment completed successfully!',
          n8nResults: null
        }
      });
    }

    // Extract data from new N8N format
    const score = parseInt(result.Score) || 0;
    const totalQuestions = parseInt(result['Total Questions']) || 0;
    const summary = result.Summary || 'Assessment completed successfully!';

    // Prepare result data from N8N analysis
    const resultData = {
      type: result.PersonalityType || 'Assessment Completed',
      description: summary,
      score: score,
      learningStyle: result.LearningStyle || 'Mixed',
      recommendations: result.Recommendations || [],
      totalQuestions: totalQuestions,
      n8nResults: result
    };

    // Save to cache
    try {
      // Save to N8N cache
      const n8nResult = await N8NCacheService.saveResult({
        uniqueId: student.uniqueId,
        resultType: 'assessment_analysis',
        webhookUrl: N8N_SCORE_WEBHOOK_URL,
        requestPayload: { uniqueId: student.uniqueId },
        responseData: n8nOutput,
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

      // Update assessment response with N8N results
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

    // Update assessment response with N8N results (legacy support)
    assessmentResponse.result = resultData;
    await assessmentResponse.save();
    console.log('🔍 Assessment response updated with N8N results');

    return NextResponse.json({
      success: true,
      result: {
        totalQuestions: totalQuestions,
        score: score,
        summary: summary, // Only show Summary as requested
        n8nResults: result
      }
    });

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

    // Test N8N webhook connectivity
    try {
      console.log('🔍 Testing N8N webhook connectivity...');
      const testPayload = {
        uniqueId: 'test',
        submittedAt: new Date().toISOString()
      };
      const testResponse = await fetch(N8N_SCORE_WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testPayload)
      });
      
      console.log('🔍 N8N test response status:', testResponse.status);
      console.log('🔍 N8N test response headers:', Object.fromEntries(testResponse.headers.entries()));
      
      if (testResponse.ok) {
        const testText = await testResponse.text();
        console.log('🔍 N8N test response text:', testText);
        
        try {
          const testJson = JSON.parse(testText);
          console.log('🔍 N8N test response JSON:', testJson);
        } catch (parseError) {
          console.log('🔍 N8N test response is not valid JSON');
        }
      }
    } catch (testError) {
      console.error('🔍 N8N webhook test failed:', testError);
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