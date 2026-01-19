import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import connectDB from '@/lib/mongodb';
import Student from '@/models/Student';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const AI_BUDDY_MAIN_WEBHOOK = 'https://nclbtaru.app.n8n.cloud/webhook/AI-BUDDY-MAIN';

export async function POST(request: NextRequest) {
  try {
    let studentUniqueId = '';
    let requestBody: any = null;

    // Parse request body
    requestBody = await request.json();
    console.log('AI-BUDDY-MAIN POST body:', JSON.stringify(requestBody, null, 2));

    const { query, uniqueId } = requestBody;

    // Validate required fields
    if (!query) {
      return NextResponse.json(
        { success: false, error: 'Query is required' },
        { status: 400 }
      );
    }

    // Get token from HTTP-only cookie to fetch student unique ID
    const token = request.cookies.get('auth-token')?.value;
    if (token) {
      try {
        const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
        
        await connectDB();
        const student = await Student.findOne({ 
          userId: decoded.userId,
          onboardingCompleted: true 
        });

        if (student) {
          studentUniqueId = student.uniqueId;
        }
      } catch (err) {
        console.error('Auth check error:', err);
        // Continue without blocking if auth fails
      }
    }

    // Use provided uniqueId or the one from authenticated session
    const finalUniqueId = uniqueId || studentUniqueId;

    if (!finalUniqueId) {
      return NextResponse.json(
        { success: false, error: 'Unique ID is required' },
        { status: 400 }
      );
    }

    // Prepare payload for webhook (webhook expects uniqueid and message)
    const payload = {
      uniqueid: finalUniqueId,
      message: query
    };

    console.log('Sending to AI-BUDDY-MAIN webhook:', JSON.stringify(payload, null, 2));

    // Call the webhook with timeout using GET method
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

    try {
      // Convert payload to URL parameters for GET request
      const urlParams = new URLSearchParams({
        uniqueid: finalUniqueId,
        message: query
      });
      
      const getUrl = `${AI_BUDDY_MAIN_WEBHOOK}?${urlParams.toString()}`;
      console.log('GET URL:', getUrl);

      const webhookResponse = await fetch(getUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      // Check if response has content before parsing
      const responseText = await webhookResponse.text();
      console.log('AI-BUDDY-MAIN Raw Response Text:', responseText);

      let responseData: any = {};
      
      if (!responseText || responseText.trim().length === 0) {
        console.warn('Empty response from AI-BUDDY-MAIN webhook');
        responseData = { error: 'Empty response from webhook' };
      } else {
        try {
          responseData = JSON.parse(responseText);
          console.log('AI-BUDDY-MAIN Response:', JSON.stringify(responseData, null, 2));
        } catch (parseError) {
          console.error('Failed to parse AI-BUDDY-MAIN response as JSON:', parseError);
          console.error('Response text was:', responseText);
          responseData = { error: 'Invalid JSON response', rawText: responseText };
        }
      }

      if (webhookResponse.ok) {
        // Extract response text from various possible response shapes
        const responseText = extractResponseText(responseData);

        return NextResponse.json({
          success: true,
          response: responseText,
          metadata: {
            webhookStatus: webhookResponse.status,
            responseTime: Date.now(),
            messageLength: query.length,
            uniqueId: finalUniqueId,
            timestamp: new Date().toISOString()
          },
          rawResponse: responseData
        });
      } else {
        console.error('AI-BUDDY-MAIN webhook failed:', webhookResponse.status, webhookResponse.statusText);
        
        return NextResponse.json({
          success: false,
          response: "I'm having trouble connecting right now. Please try again later.",
          error: `Webhook returned ${webhookResponse.status}`,
          metadata: {
            webhookStatus: webhookResponse.status,
            responseTime: Date.now(),
            messageLength: query.length,
            uniqueId: finalUniqueId,
            timestamp: new Date().toISOString()
          }
        }, { status: webhookResponse.status });
      }
    } catch (fetchError: unknown) {
      clearTimeout(timeoutId);
      const error = fetchError as Error & { code?: string };
      console.error('AI-BUDDY-MAIN webhook connection failed:', error);
      
      let errorMessage = 'Connection failed';
      if (error.name === 'AbortError') {
        errorMessage = 'Webhook timeout (30s) - n8n workflow may be taking too long or inactive';
      } else if (error.code === 'ENOTFOUND') {
        errorMessage = 'Webhook URL not found - check n8n webhook URL';
      } else if (error.code === 'ECONNREFUSED') {
        errorMessage = 'Connection refused - n8n server may be down';
      }

      return NextResponse.json({
        success: false,
        response: "I'm having trouble connecting to the AI assistant right now. Please try again later.",
        error: errorMessage,
        metadata: {
          webhookStatus: 0,
          responseTime: Date.now(),
          messageLength: query.length,
          uniqueId: finalUniqueId,
          timestamp: new Date().toISOString()
        }
      }, { status: 500 });
    }
  } catch (error) {
    console.error('AI-BUDDY-MAIN API error:', error);
    return NextResponse.json({
      success: false,
      response: "I'm having trouble processing your request right now. Please try again later.",
      error: 'Internal server error'
    }, { status: 500 });
  }
}

// Utility function to extract response text from various possible webhook response shapes
function extractResponseText(data: any): string {
  if (!data || typeof data !== 'object') {
    return "I received your message and am processing it.";
  }

  // Handle error cases
  if (data.error) {
    return typeof data.error === 'string' ? data.error : 'An error occurred while processing your request.';
  }

  // Flatten object to search for response fields
  const flat = flattenObject(data);
  
  // Try common response field names
  const responseKeys = ['response', 'message', 'text', 'content', 'answer', 'output', 'result'];
  for (const key of responseKeys) {
    const value = flat[key];
    if (typeof value === 'string' && value.trim().length > 0) {
      return value.trim();
    }
  }

  // Check if data is an array and extract from first element
  if (Array.isArray(data) && data.length > 0) {
    const firstItem = data[0];
    if (firstItem && typeof firstItem === 'object') {
      const flatFirst = flattenObject(firstItem);
      for (const key of responseKeys) {
        const value = flatFirst[key];
        if (typeof value === 'string' && value.trim().length > 0) {
          return value.trim();
        }
      }
    }
  }

  // Try to find any string value that looks like a response (longer than 20 chars)
  const stringValues = Object.values(flat).filter(
    v => typeof v === 'string' && v.trim().length > 20
  ) as string[];
  
  if (stringValues.length > 0) {
    return stringValues[0].trim();
  }

  // Default fallback
  return "Thank you for your message! I'll get back to you soon.";
}

// Flattens a nested object into a single-level key map
function flattenObject(obj: Record<string, unknown>, parent = '', res: Record<string, unknown> = {}): Record<string, unknown> {
  for (const key in obj) {
    const propName = parent ? `${parent}.${key}` : key;
    if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
      flattenObject(obj[key] as Record<string, unknown>, propName, res);
    } else {
      res[propName] = obj[key];
    }
  }
  return res;
}
