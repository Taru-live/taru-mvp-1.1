import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { nodeText, nodeDescription, documentSummary, parentContext } = await request.json();
    
    if (!nodeText) {
      return NextResponse.json(
        { error: 'No node text provided' },
        { status: 400 }
      );
    }

    const LOVABLE_API_KEY = process.env.LOVABLE_API_KEY;
    if (!LOVABLE_API_KEY) {
      return NextResponse.json(
        { error: 'LOVABLE_API_KEY is not configured' },
        { status: 500 }
      );
    }

    const prompt = `You are a helpful educational assistant. Explain the following concept from a mind map node in a clear, concise way (2-3 sentences).

Node: "${nodeText}"
${nodeDescription ? `Description: ${nodeDescription}` : ''}
${parentContext ? `Parent Context: ${parentContext}` : ''}
${documentSummary ? `Document Summary: ${documentSummary}` : ''}

Provide a clear, educational explanation that helps the user understand this concept better.`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-pro',
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      }),
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to generate explanation' },
        { status: 500 }
      );
    }

    const aiResponse = await response.json();
    const explanation = aiResponse.choices?.[0]?.message?.content;

    if (!explanation) {
      return NextResponse.json(
        { error: 'No explanation received' },
        { status: 500 }
      );
    }

    return NextResponse.json({ explanation });
  } catch (error) {
    console.error('Error explaining node:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Explanation failed' },
      { status: 500 }
    );
  }
}
