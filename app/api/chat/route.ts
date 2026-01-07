import { NextRequest, NextResponse } from 'next/server';
import { LangChainService } from '@/lib/langchain/LangChainService';

export async function POST(request: NextRequest) {
  return handleRequest('POST', request);
}

export async function GET(request: NextRequest) {
  return handleRequest('GET', request);
}

async function handleRequest(method: 'GET' | 'POST', request: NextRequest) {
  try {
    let query = '';
    let studentData: Record<string, unknown> = {};
    let studentUniqueId = '';
    let sessionId = '';
    let context: Record<string, unknown> = {};

    if (method === 'POST') {
      const body = await request.json();
      console.log('Received POST body:', JSON.stringify(body, null, 2));

      query = body.query || body.message;
      studentData = body.studentData || {};
      studentUniqueId = body.studentUniqueId || '';
      sessionId = body.sessionId || '';
      context = body.context || {};
    } else {
      const { searchParams } = new URL(request.url);
      query = searchParams.get('query') || searchParams.get('message') || '';
      studentUniqueId = searchParams.get('studentUniqueId') || '';
      sessionId = searchParams.get('sessionId') || '';
      studentData = {
        name: searchParams.get('name') || '',
        email: searchParams.get('email') || '',
        grade: searchParams.get('grade') || '',
        school: searchParams.get('school') || '',
        uniqueId: searchParams.get('uniqueId') || '',
        timestamp: searchParams.get('timestamp') || new Date().toISOString()
      };
      context = {
        pdfContent: searchParams.get('pdfContent') || '',
        selectedText: searchParams.get('selectedText') || '',
        currentTime: parseInt(searchParams.get('currentTime') || '0'),
        bookmarks: [],
        action: searchParams.get('action') || 'general',
      };
    }

    if (!query) {
      return NextResponse.json({ error: 'Message or query is required' }, { status: 400 });
    }
    if (!studentData || !studentData.name) {
      return NextResponse.json({ error: 'Student name is required' }, { status: 400 });
    }

    console.log('Generating LangChain chat response for:', query);

    // Use LangChainService instead of n8n webhook
    const langChainService = new LangChainService();
    
    try {
      const result = await langChainService.generateResponse(
        query,
        {
          pdfContent: context.pdfContent as string,
          selectedText: context.selectedText as string,
          currentTime: context.currentTime as number,
          bookmarks: context.bookmarks as any[],
          action: context.action as string,
        },
        {
          name: studentData.name as string,
          grade: studentData.grade as string,
          school: studentData.school as string,
        }
      );

      return NextResponse.json({
        success: result.success,
        response: result.content,
        suggestions: result.suggestions,
        relatedQuestions: result.relatedQuestions,
        langChainOutput: {
          aiInput: query,
          aiResponse: result.content,
          timestamp: new Date().toISOString(),
          studentContext: {
            name: studentData.name,
            grade: studentData.grade,
            school: studentData.school
          }
        },
        metadata: {
          method,
          responseTime: Date.now(),
          messageLength: query.length,
          studentDataProvided: !!studentData,
          timestamp: new Date().toISOString(),
          studentUniqueId: studentUniqueId,
          sessionId: sessionId,
          confidence: result.confidence
        }
      });
    } catch (error) {
      console.error('LangChain chat error:', error);
      
      // Fallback response
      return NextResponse.json({
        success: true,
        response: generateFallbackResponse(query, studentData),
        fallback: true,
        langChainOutput: {
          aiInput: query,
          aiResponse: 'Offline mode - using built-in responses',
          timestamp: new Date().toISOString(),
          studentContext: {
            name: studentData.name,
            grade: studentData.grade,
            school: studentData.school
          }
        },
        metadata: {
          method,
          responseTime: Date.now(),
          messageLength: query.length,
          studentDataProvided: !!studentData,
          timestamp: new Date().toISOString(),
          studentUniqueId: studentUniqueId,
          sessionId: sessionId,
          error: `LangChain error: ${error instanceof Error ? error.message : 'Unknown error'} - using fallback mode`
        }
      });
    }

  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({
      success: false,
      response: "I'm having trouble connecting right now. Please try again later.",
      error: 'Internal server error'
    }, { status: 500 });
  }
}

// Generate intelligent fallback responses
function generateFallbackResponse(query: string, studentData: Record<string, unknown>): string {
  const studentName = studentData.name as string || 'there';
  const lowerQuery = query.toLowerCase();
  
  // Match common queries with appropriate responses
  if (lowerQuery.includes('help') || lowerQuery.includes('assist')) {
    return `Hi ${studentName}! I'm here to help you with your learning journey. I can assist you with understanding your modules, tracking your progress, and answering questions about your courses.`;
  }
  
  if (lowerQuery.includes('progress') || lowerQuery.includes('score')) {
    return `${studentName}, you can check your progress in the Progress tab of your dashboard. Keep up the great work on your learning journey!`;
  }
  
  if (lowerQuery.includes('module') || lowerQuery.includes('course')) {
    return `Great question about modules, ${studentName}! You can find your recommended modules in the Learning Path section. Each module is tailored to your learning style and interests.`;
  }
  
  if (lowerQuery.includes('grade') || lowerQuery.includes('assessment')) {
    return `${studentName}, your assessments and grades are available in your dashboard. Remember, every assessment is a step forward in your learning journey!`;
  }
  
  // Default friendly response
  return `Hello ${studentName}! I'm your AI learning assistant. While I'm working in offline mode right now, I'm still here to help! You can ask me about your learning progress, modules, or any questions about your educational journey.`;
}
