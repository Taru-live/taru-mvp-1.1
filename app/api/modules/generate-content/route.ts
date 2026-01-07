import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import Module from '@/models/Module';
import { N8NCacheService } from '@/lib/N8NCacheService';
import { LangChainService } from '@/lib/langchain/LangChainService';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

interface DecodedToken {
  userId: string;
  [key: string]: unknown;
}

export async function POST(request: NextRequest) {
  return handleRequest('POST', request);
}

export async function GET(request: NextRequest) {
  return handleRequest('GET', request);
}

async function handleRequest(method: 'GET' | 'POST', request: NextRequest) {
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
        { error: 'Only students can generate content' },
        { status: 403 }
      );
    }

    // Extract parameters based on method
    let type = '';
    let uniqueId = '';

    if (method === 'POST') {
      const body = await request.json();
      console.log('Received POST body:', JSON.stringify(body, null, 2));

      type = body.type || '';
      uniqueId = body.uniqueId || '';
    } else {
      const { searchParams } = new URL(request.url);
      type = searchParams.get('type') || '';
      uniqueId = searchParams.get('uniqueId') || '';
    }

    // Validate required fields
    if (!type || !uniqueId) {
      return NextResponse.json({ 
        error: 'Type and uniqueId are required' 
      }, { status: 400 });
    }

    // Validate type
    if (!['mcq', 'flash'].includes(type.toLowerCase())) {
      return NextResponse.json({ 
        error: 'Type must be either "mcq" or "flash"' 
      }, { status: 400 });
    }

    // Check if we should force regenerate
    const forceRegenerate = request.headers.get('x-force-regenerate') === 'true';
    
    // Check for cached content first
    if (!forceRegenerate) {
      const module = await Module.findOne({ uniqueID: uniqueId });
      if (module) {
        const contentType = type.toLowerCase() === 'mcq' ? 'mcq' : 'flashcard';
        const cachedContent = await N8NCacheService.getCachedModuleContent(
          module._id.toString(),
          contentType,
          24 // 24 hours cache
        );
        
        if (cachedContent && cachedContent.length > 0) {
          console.log(`🎯 Using cached ${contentType} content for module ${uniqueId}`);
          return NextResponse.json({
            success: true,
            type,
            content: cachedContent,
            count: cachedContent.length,
            cached: true,
            metadata: {
              method,
              type: type,
              uniqueId: uniqueId,
              studentId: decoded.userId,
              timestamp: new Date().toISOString(),
              cacheHit: true
            }
          });
        }
      }
    }

    console.log(`Generating ${type} content for module ${uniqueId} using LangChain`);

    // Use LangChainService instead of n8n webhook
    const langChainService = new LangChainService();
    
    try {
      let content: any[] = [];
      
      if (type.toLowerCase() === 'mcq') {
        const mcqs = await langChainService.generateMCQs(uniqueId, forceRegenerate, decoded.userId as string);
        // Transform to expected format
        content = mcqs.map((q: any, index: number) => ({
          id: q.id || `q_${index + 1}`,
          Q: q.id || (index + 1).toString(),
          question: q.question,
          options: q.options || [],
          answer: q.correctAnswer || 0,
          explanation: q.explanation || '',
          level: q.difficulty || 'medium',
          category: q.category || '',
        }));
      } else if (type.toLowerCase() === 'flash') {
        const flashcards = await langChainService.generateFlashcards(uniqueId, forceRegenerate, decoded.userId as string);
        content = flashcards.map((f: any) => ({
          question: f.question,
          answer: f.answer,
          explanation: f.explanation || '',
        }));
      }

      if (content.length === 0) {
        console.log(`No ${type} content generated, using fallback`);
        const fallbackContent = generateFallbackContent(type);
        
        return NextResponse.json({
          success: true,
          type,
          content: fallbackContent,
          count: fallbackContent.length,
          fallback: true,
          metadata: {
            method,
            type: type,
            uniqueId: uniqueId,
            studentId: decoded.userId,
            timestamp: new Date().toISOString(),
            error: `Using fallback ${type} content due to LangChain unavailability`
          }
        });
      }

      // Save to cache
      try {
        const module = await Module.findOne({ uniqueID: uniqueId });
        if (module) {
          const contentType = type.toLowerCase() === 'mcq' ? 'mcq' : 'flashcard';
          
          // Save to cache
          const n8nResult = await N8NCacheService.saveResult({
            uniqueId: uniqueId,
            resultType: 'module_content',
            webhookUrl: `langchain-${contentType}`,
            requestPayload: { type, uniqueId },
            responseData: content,
            processedData: content,
            status: 'completed',
            metadata: {
              studentId: decoded.userId,
              moduleId: module._id.toString(),
              contentType: contentType,
              version: '1.0'
            },
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
          });

          // Update module with generated content
          await N8NCacheService.updateModuleContent(
            module._id.toString(),
            contentType,
            content,
            n8nResult._id.toString()
          );

          console.log(`💾 Saved ${contentType} content to cache for module ${uniqueId}`);
        }
      } catch (cacheError) {
        console.error('❌ Error saving to cache:', cacheError);
        // Continue with response even if cache fails
      }

      return NextResponse.json({
        success: true,
        type,
        content: content,
        count: content.length,
        cached: false,
        langChainOutput: {
          type: type,
          uniqueId: uniqueId,
          timestamp: new Date().toISOString(),
          studentContext: {
            studentId: decoded.userId,
            type: type
          }
        },
        metadata: {
          method,
          responseTime: Date.now(),
          type: type,
          uniqueId: uniqueId,
          studentId: decoded.userId,
          timestamp: new Date().toISOString(),
          source: 'langchain'
        }
      });

    } catch (error) {
      console.error(`LangChain ${type} generation error:`, error);
      
      const fallbackContent = generateFallbackContent(type);
      
      return NextResponse.json({
        success: true,
        type,
        content: fallbackContent,
        count: fallbackContent.length,
        fallback: true,
        metadata: {
          method,
          type: type,
          uniqueId: uniqueId,
          studentId: decoded.userId,
          timestamp: new Date().toISOString(),
          error: `LangChain error: ${error instanceof Error ? error.message : 'Unknown error'} - using fallback mode`
        }
      });
    }

  } catch (error) {
    console.error('Content generation error:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Internal server error',
      response: "I'm having trouble generating content right now. Please try again later."
    }, { status: 500 });
  }
}

// Generate intelligent fallback content when LangChain is unavailable
function generateFallbackContent(type: string) {
  if (type.toLowerCase() === 'mcq') {
    return [
      {
        id: "1",
        Q: "1",
        question: "What is the primary purpose of education?",
        type: "multiple_choice",
        options: [
          "To memorize facts",
          "To develop critical thinking skills",
          "To pass exams",
          "To get a job"
        ],
        answer: 1,
        level: "Basic",
        explanation: "Education should develop critical thinking skills"
      },
      {
        id: "2",
        Q: "2",
        question: "Which of the following is NOT a key component of effective learning?",
        type: "multiple_choice",
        options: [
          "Active engagement",
          "Regular practice",
          "Passive listening",
          "Feedback and reflection"
        ],
        answer: 2,
        level: "Medium",
        explanation: "Passive listening is not effective for learning"
      },
      {
        id: "3",
        Q: "3",
        question: "What is the best way to retain information?",
        type: "multiple_choice",
        options: [
          "Cramming the night before",
          "Spaced repetition",
          "Reading once",
          "Avoiding practice"
        ],
        answer: 1,
        level: "Basic",
        explanation: "Spaced repetition is scientifically proven to improve retention"
      }
    ];
  } else if (type.toLowerCase() === 'flash') {
    return [
      {
        question: "What is the difference between learning and memorization?",
        answer: "Learning involves understanding and applying concepts, while memorization is just recalling facts without comprehension.",
        explanation: "True learning requires critical thinking and the ability to apply knowledge in new situations."
      },
      {
        question: "What is Active Learning?",
        answer: "A learning approach where students engage with the material through discussion, practice, and application rather than passive listening.",
        explanation: "Active learning has been shown to improve retention and understanding compared to passive methods."
      },
      {
        question: "How can you improve your study habits?",
        answer: "Create a consistent schedule, use active learning techniques, take regular breaks, and review material regularly.",
        explanation: "Good study habits are essential for long-term academic success and knowledge retention."
      }
    ];
  }
  
  return [];
}
