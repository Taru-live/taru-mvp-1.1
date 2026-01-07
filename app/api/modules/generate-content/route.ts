import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import Module from '@/models/Module';
import { N8NCacheService } from '@/lib/N8NCacheService';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const N8N_MODULE_ASSESSMENT_WEBHOOK_URL = process.env.N8N_MODULE_ASSESSMENT_WEBHOOK_URL || 'https://nclbtaru.app.n8n.cloud/webhook/MCQ/Flash/questions';

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
    let webhookUrl = N8N_MODULE_ASSESSMENT_WEBHOOK_URL;

    if (method === 'POST') {
      const body = await request.json();
      console.log('Received POST body:', JSON.stringify(body, null, 2));

      type = body.type || '';
      uniqueId = body.uniqueId || '';
      if (body.webhookUrl) webhookUrl = body.webhookUrl;
    } else {
      const { searchParams } = new URL(request.url);
      type = searchParams.get('type') || '';
      uniqueId = searchParams.get('uniqueId') || '';
      if (searchParams.get('webhookUrl')) webhookUrl = searchParams.get('webhookUrl')!;
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

    const payload = {
      type,
      uniqueId,
      studentId: decoded.userId,
      timestamp: new Date().toISOString()
    };

    console.log('Payload being sent to N8N:', JSON.stringify(payload, null, 2));

    // Enhanced error handling
    let rawResponse;
    let webhookResponse: Response | undefined;
    
    try {
      console.log('🔄 Trying webhook:', webhookUrl);
      
      // Convert payload to URL parameters for GET request
      const urlParams = new URLSearchParams({
        uniqueID: uniqueId, // Use actual unique ID from request
        submittedAt: new Date().toISOString()
      });
      
      const getUrl = `${webhookUrl}?${urlParams.toString()}`;
      console.log('🔗 Full webhook URL:', getUrl);
      console.log('🔗 URL parameters:', urlParams.toString());
      
      webhookResponse = await fetch(getUrl, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      
      console.log('📡 Webhook response status:', webhookResponse.status);
      console.log('📡 Webhook response status text:', webhookResponse.statusText);
      console.log('📡 Webhook response headers:', Object.fromEntries(webhookResponse.headers.entries()));

      const responseText = await webhookResponse.text();
      console.log('📥 N8N Raw response text:', responseText);
      console.log('📥 Response text length:', responseText.length);
      
      if (!responseText || responseText.trim() === '') {
        console.warn('📥 Empty response from N8N webhook');
        rawResponse = { error: 'Empty response from N8N webhook' };
      } else {
        try {
          rawResponse = JSON.parse(responseText);
          console.log('📥 N8N Parsed Response:', JSON.stringify(rawResponse, null, 2));
          console.log('📥 Response type:', typeof rawResponse);
          console.log('📥 Is array:', Array.isArray(rawResponse));
          if (Array.isArray(rawResponse)) {
            console.log('📥 Array length:', rawResponse.length);
            if (rawResponse.length > 0) {
              console.log('📥 First item:', JSON.stringify(rawResponse[0], null, 2));
            }
          }
        } catch (parseError) {
          console.error('📥 Failed to parse response text as JSON:', parseError);
          console.error('📥 Response text that failed to parse:', responseText);
          rawResponse = { error: 'Invalid JSON response from N8N', rawText: responseText };
        }
      }
    } catch (fetchError: unknown) {
      const error = fetchError as Error & { code?: string };
      console.error('🔄 Webhook request failed:', error);
      console.error('Webhook URL attempted:', webhookUrl);
      console.error('Error name:', error.name);
      console.error('Error code:', error.code);
      
      let errorMessage = 'Connection failed';
      if (error.code === 'ENOTFOUND') {
        errorMessage = 'Webhook URL not found - check n8n webhook URL';
      } else if (error.code === 'ECONNREFUSED') {
        errorMessage = 'Connection refused - n8n server may be down';
      }
      
      console.error('Diagnosed issue:', errorMessage);
      
      // Return immediate fallback response for network errors
      const fallbackContent = generateFallbackContent(type);
      
      return NextResponse.json({
        success: true,
        type,
        content: fallbackContent,
        count: fallbackContent.length,
        fallback: true,
        n8nOutput: {
          fullResponse: null,
          processedResponse: null,
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
          webhookStatus: 0,
          responseTime: Date.now(),
          type: type,
          uniqueId: uniqueId,
          studentId: decoded.userId,
          webhookUrl: webhookUrl,
          timestamp: new Date().toISOString(),
          error: `Webhook unreachable: ${errorMessage} - using fallback mode`
        }
      });
    }

    const { content, count, n8nOutput } = extractN8nContentResponse(rawResponse, type);

    if (webhookResponse && webhookResponse.ok) {
      // Save to cache
      try {
        const module = await Module.findOne({ uniqueID: uniqueId });
        if (module) {
          const contentType = type.toLowerCase() === 'mcq' ? 'mcq' : 'flashcard';
          
          // Save to N8N cache
          const n8nResult = await N8NCacheService.saveResult({
            uniqueId: uniqueId,
            resultType: 'module_content',
            webhookUrl: webhookUrl,
            requestPayload: payload,
            responseData: rawResponse,
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
        count: count,
        cached: false,
        n8nOutput: {
          fullResponse: rawResponse,
          processedResponse: n8nOutput,
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
          webhookStatus: webhookResponse.status,
          responseTime: Date.now(),
          type: type,
          uniqueId: uniqueId,
          studentId: decoded.userId,
          webhookUrl: webhookUrl,
          timestamp: new Date().toISOString()
        }
      });
    } else {
      console.error('Webhook failed:', webhookResponse?.status, webhookResponse?.statusText);
      console.log('Using intelligent fallback response for type:', type);
      
      const fallbackContent = generateFallbackContent(type);
      
      return NextResponse.json({
        success: true,
        type,
        content: fallbackContent,
        count: fallbackContent.length,
        fallback: true,
        n8nOutput: {
          fullResponse: rawResponse,
          processedResponse: null,
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
          webhookStatus: webhookResponse?.status || 0,
          responseTime: Date.now(),
          type: type,
          uniqueId: uniqueId,
          studentId: decoded.userId,
          webhookUrl: webhookUrl,
          timestamp: new Date().toISOString(),
          error: `Webhook returned ${webhookResponse?.status || 0} - using fallback mode`
        },
        n8nError: {
          status: webhookResponse?.status || 0,
          statusText: webhookResponse?.statusText || 'Unknown error',
          raw: rawResponse
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

// Generate intelligent fallback content when N8N is unavailable
function generateFallbackContent(type: string) {
  if (type.toLowerCase() === 'mcq') {
    return [
      {
        id: "1",
        question: "What is the primary purpose of education?",
        type: "multiple_choice",
        options: [
          "To memorize facts",
          "To develop critical thinking skills",
          "To pass exams",
          "To get a job"
        ],
        difficulty: "Basic"
      },
      {
        id: "2",
        question: "Which of the following is NOT a key component of effective learning?",
        type: "multiple_choice",
        options: [
          "Active engagement",
          "Regular practice",
          "Passive listening",
          "Feedback and reflection"
        ],
        difficulty: "Medium"
      },
      {
        id: "3",
        question: "What is the best way to retain information?",
        type: "multiple_choice",
        options: [
          "Cramming the night before",
          "Spaced repetition",
          "Reading once",
          "Avoiding practice"
        ],
        difficulty: "Basic"
      },
      {
        id: "4",
        question: "Which learning method is most effective for understanding complex concepts?",
        type: "multiple_choice",
        options: [
          "Rote memorization",
          "Teaching others",
          "Avoiding questions",
          "Skipping difficult topics"
        ],
        difficulty: "Medium"
      },
      {
        id: "5",
        question: "What is the relationship between curiosity and learning?",
        type: "multiple_choice",
        options: [
          "Curiosity has no impact on learning",
          "Curiosity can interfere with learning",
          "Curiosity enhances learning and retention",
          "Curiosity only matters for children"
        ],
        difficulty: "Advanced"
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
        term: "Active Learning",
        definition: "A learning approach where students engage with the material through discussion, practice, and application rather than passive listening.",
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

// Utility to extract content from various possible webhook response shapes
function extractN8nContentResponse(data: Record<string, unknown>, type: string) {
  // Handle error cases
  if (data?.error) {
    console.error('N8N returned error:', data.error);
    return {
      content: generateFallbackContent(type),
      count: 0,
      n8nOutput: data
    };
  }

  console.log('🔍 Processing N8N response for type:', type);
  console.log('🔍 Raw N8N data:', JSON.stringify(data, null, 2));

  let content = null;

  // Handle N8N response format: [{"output": "JSON string"}]
  // The N8N workflow returns both MCQ and flashcard content, we need to filter by type
  if (Array.isArray(data) && data.length > 0) {
    const firstItem = data[0];
    if (firstItem && typeof firstItem === 'object' && firstItem.output) {
      console.log('🔍 Found output field in first array item:', firstItem.output);
      try {
        const parsedOutput = JSON.parse(firstItem.output as string);
        console.log('🔍 Parsed output:', JSON.stringify(parsedOutput, null, 2));
        
        // Handle the user's specific N8N format: { "questions": [...], "status": "success" }
        if (parsedOutput && typeof parsedOutput === 'object' && parsedOutput.questions) {
          console.log('🔍 Found questions array in N8N response');
          content = parsedOutput.questions;
        }
        // Handle direct array format (fallback)
        else if (Array.isArray(parsedOutput)) {
          console.log('🔍 Found direct array in N8N response');
          content = parsedOutput;
        } else {
          console.warn('🔍 Parsed output is not in expected format:', typeof parsedOutput);
        }
      } catch (parseError) {
        console.error('🔍 Failed to parse output as JSON:', parseError);
      }
    } else {
      console.log('🔍 First array item structure:', firstItem);
    }
  }
  // Handle direct object format (if N8N returns object directly)
  else if (data && typeof data === 'object' && !Array.isArray(data)) {
    console.log('🔍 Processing direct object format');
    
    // Check if it's the user's format: { "questions": [...], "status": "success" }
    if (data.questions && Array.isArray(data.questions)) {
      console.log('🔍 Found questions array in direct object');
      content = data.questions;
    }
    // Try to find content in various possible fields
    else {
      const possibleFields = ['output', 'result', 'response', 'content', 'data', 'questions', 'flashcards'];
      for (const field of possibleFields) {
        if (data[field]) {
          console.log(`🔍 Found content in field: ${field}`);
          let fieldContent = data[field];
          
          // If it's a string, try to parse it
          if (typeof fieldContent === 'string') {
            try {
              fieldContent = JSON.parse(fieldContent);
            } catch (parseError) {
              console.error(`🔍 Failed to parse ${field} as JSON:`, parseError);
              continue;
            }
          }
          
          if (Array.isArray(fieldContent)) {
            content = fieldContent;
            break;
          }
        }
      }
    }
  }

  // If no content found, use fallback
  if (!content || !Array.isArray(content)) {
    console.warn('🔍 No valid content found in N8N response, using fallback');
    content = generateFallbackContent(type);
  }

  // Validate content structure based on type
  if (type.toLowerCase() === 'mcq') {
    content = content.filter((item: ContentItem) => 
      // Handle user's format: { id, question, type, options, difficulty }
      (item.question && item.options && Array.isArray(item.options) && item.type === 'multiple_choice') ||
      // Handle traditional format: { question, options, answer }
      (item.question && item.options && Array.isArray(item.options) && item.answer)
    );
    console.log('🔍 Validated MCQ questions:', content.length);
  } else if (type.toLowerCase() === 'flash') {
    content = content.filter((item: ContentItem) => 
      (item.question && item.answer) || (item.term && item.definition)
    );
    console.log('🔍 Validated flashcard content:', content.length);
  }

  // If validation removed all content, use fallback
  if (!content || content.length === 0) {
    console.warn('🔍 Validation removed all content, using fallback');
    content = generateFallbackContent(type);
  }

  // Transform content to expected format if needed
  content = transformContentToExpectedFormat(content, type);

  const count = Array.isArray(content) ? content.length : 0;

  // Extract the full n8n output for debugging
  const n8nOutput = data?.json || data?.data || data;

  console.log('✅ Extracted content:', { 
    type, 
    count, 
    contentLength: Array.isArray(content) ? content.length : 0,
    sampleContent: Array.isArray(content) && content.length > 0 ? content[0] : null
  });

  return { content, count, n8nOutput };
}

interface ContentItem {
  id?: string;
  question?: string;
  type?: string;
  options?: string[];
  difficulty?: string;
  answer?: string;
  Q?: string;
  level?: string;
  term?: string;
  definition?: string;
}

// Transform content to expected format
function transformContentToExpectedFormat(content: ContentItem[], type: string) {
  if (type.toLowerCase() === 'mcq') {
    return content.map((item: ContentItem, index: number) => {
      // If it's already in expected format, return as is
      if (item.Q && item.answer) {
        return item;
      }
      
      // Transform from user's format: { id, question, type, options, difficulty }
      // To expected format: { Q, level, question, options, answer }
      return {
        Q: item.id || (index + 1).toString(),
        level: item.difficulty || 'Basic',
        question: item.question || '',
        options: item.options || [],
        answer: item.answer || item.options?.[0] || 'No answer provided' // Use first option as default answer
      };
    });
  }
  
  return content;
}

 