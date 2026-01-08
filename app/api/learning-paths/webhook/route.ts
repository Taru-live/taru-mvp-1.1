import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { saveN8NLearningPathResponse, normalizeCareerDetailsData, validateCareerDetailsData } from '@/lib/utils/learningPathUtils';

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Learning Path Webhook called at:', new Date().toISOString());
    
    // Connect to database
    await connectDB();
    
    // Get N8N webhook data
    const n8nData = await request.json();
    
    console.log('📥 Received N8N learning path data:', {
      uniqueid: n8nData.uniqueid,
      hasOutput: !!n8nData.output,
      hasLearningPath: !!n8nData.output?.learningPath,
      moduleCount: n8nData.output?.learningPath?.length || 0
    });

    if (!n8nData.uniqueid) {
      return NextResponse.json(
        { 
          success: false,
          error: 'uniqueid is required' 
        },
        { status: 400 }
      );
    }

    if (!n8nData.output) {
      return NextResponse.json(
        { 
          success: false,
          error: 'output data is required' 
        },
        { status: 400 }
      );
    }

    // Normalize the N8N data structure
    const normalizedData = normalizeCareerDetailsData(
      {
        uniqueid: n8nData.uniqueid,
        output: n8nData.output
      },
      n8nData.uniqueid
    );

    if (!normalizedData) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Failed to normalize N8N data' 
        },
        { status: 400 }
      );
    }

    // Validate the structure
    const validationResult = validateCareerDetailsData(normalizedData);
    if (!validationResult.isValid) {
      console.error('❌ N8N webhook data validation failed:', validationResult.errors);
      return NextResponse.json(
        { 
          success: false,
          error: 'Invalid N8N data structure',
          validationErrors: validationResult.errors
        },
        { status: 400 }
      );
    }

    // Save N8N output in exact format
    const saveResult = await saveN8NLearningPathResponse(
      normalizedData.output,
      normalizedData.uniqueid
    );

    if (saveResult.success) {
      console.log('✅ N8N learning path webhook processed successfully:', saveResult.id);
      
      return NextResponse.json({
        success: true,
        message: 'Learning path response saved successfully',
        responseId: saveResult.id,
        uniqueid: normalizedData.uniqueid,
        timestamp: new Date().toISOString()
      });
    } else {
      console.error('❌ Failed to save N8N learning path response:', saveResult.error);
      
      return NextResponse.json(
        { 
          success: false,
          error: 'Failed to save learning path response',
          details: saveResult.error,
          uniqueid: normalizedData.uniqueid,
          timestamp: new Date().toISOString()
        },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('❌ Learning path webhook error:', error);
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

// Handle GET requests for webhook verification
export async function GET(request: NextRequest) {
  return NextResponse.json({
    success: true,
    message: 'Learning Path Webhook endpoint is active',
    timestamp: new Date().toISOString()
  });
}
