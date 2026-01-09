import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { content } = await request.json();
    
    if (!content) {
      return NextResponse.json(
        { error: 'No content provided' },
        { status: 400 }
      );
    }

    const GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'AIzaSyDWvmkOFPB3lN4_9Qr2PaXTLV8QS29tI7A';
    const contentSummary = content.slice(0, 3000);

    const prompt = `Based on this content, brainstorm 3 main topics that would make excellent infographic subjects. Each topic should represent a key concept or section worth visualizing.

Content: ${contentSummary}

Return EXACTLY 3 unique topics in this JSON format:
[
  {"title": "Topic Title", "description": "A 1-2 sentence description of what this topic covers"}
]

Make the topics diverse, meaningful, and directly based on the content. No random or duplicate topics.`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 1024
          }
        })
      }
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: `API error: ${response.status}` },
        { status: 500 }
      );
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      return NextResponse.json(
        { error: 'Invalid response format' },
        { status: 500 }
      );
    }

    const parsedTopics = JSON.parse(jsonMatch[0]) as Array<{ title: string; description: string }>;
    const topics = parsedTopics.slice(0, 3).map((t, idx) => ({
      id: `topic-${Date.now()}-${idx}`,
      title: t.title,
      description: t.description,
    }));

    return NextResponse.json({ topics });
  } catch (error) {
    console.error('Error brainstorming topics:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Brainstorming failed' },
      { status: 500 }
    );
  }
}
