import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { pdfBase64, fileName } = await request.json();
    
    if (!pdfBase64) {
      return NextResponse.json(
        { error: 'No PDF data provided' },
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

    const prompt = `You are an expert at analyzing documents and creating structured, meaningful mind maps.

Analyze this PDF document thoroughly and create a DEEP, STRUCTURED mind map that truly captures the content.

CRITICAL REQUIREMENTS:
1. Extract the REAL main topic as the root title
2. Create exactly 4-6 MAIN TOPICS (Level 1) that are the key themes/chapters
3. Each main topic must have 3-5 SUBTOPICS (Level 2) with meaningful explanations
4. Each subtopic should have 2-3 KEY POINTS (Level 3) that are specific details

QUALITY RULES:
- NO generic titles like "Introduction" or "Conclusion" unless they contain real substance
- Each node title must be SPECIFIC and MEANINGFUL (10-40 characters)
- Capture the ACTUAL key concepts, not surface-level summaries
- Maintain LOGICAL FLOW and relationships between topics
- Use precise, informative language
- Think deeply about what the reader needs to understand

Return ONLY this exact JSON structure (no markdown, no explanation):

{
  "title": "Main Document Topic (concise, specific title)",
  "summary": "A 2-3 sentence summary of the entire document",
  "children": [
    {
      "title": "Main Topic 1",
      "icon": "📚",
      "description": "Brief description of this topic",
      "children": [
        {
          "title": "Subtopic 1.1",
          "icon": "📝",
          "description": "What this subtopic covers",
          "children": [
            { "title": "Key Point 1", "icon": "•", "description": "Detail about this point" },
            { "title": "Key Point 2", "icon": "•", "description": "Detail about this point" }
          ]
        },
        {
          "title": "Subtopic 1.2",
          "icon": "💡",
          "description": "What this subtopic covers",
          "children": [
            { "title": "Key Point 1", "icon": "•" },
            { "title": "Key Point 2", "icon": "•" }
          ]
        }
      ]
    }
  ]
}

EMOJI GUIDE (use varied, relevant emojis):
- Main concepts: 📚 📖 🎯 🔑 💎 🌟
- Ideas/insights: 💡 ✨ 🧠 💭 🔍
- Actions/processes: ⚡ 🚀 ⚙️ 🔄 ▶️
- Data/facts: 📊 📈 📋 🔢 📌
- People/relations: 👥 🤝 🏢 👤
- Warnings/important: ⚠️ ❗ 🔔 ⭐
- Details: • ○ ◆ ▪️

Analyze the document NOW and return ONLY valid JSON.`;

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
            content: [
              { type: 'text', text: prompt },
              {
                type: 'image_url',
                image_url: {
                  url: `data:application/pdf;base64,${pdfBase64}`,
                },
              },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return NextResponse.json(
          { error: 'Rate limit exceeded. Please try again in a moment.' },
          { status: 429 }
        );
      }
      if (response.status === 402) {
        return NextResponse.json(
          { error: 'Usage limit reached. Please add credits.' },
          { status: 402 }
        );
      }
      return NextResponse.json(
        { error: `AI processing failed: ${response.status}` },
        { status: 500 }
      );
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices?.[0]?.message?.content;

    if (!content) {
      return NextResponse.json(
        { error: 'No response from AI' },
        { status: 500 }
      );
    }

    // Parse JSON from response (handle markdown code blocks)
    let mindMap;
    try {
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/) || [null, content];
      const jsonStr = jsonMatch[1] || content;
      mindMap = JSON.parse(jsonStr.trim());
    } catch (parseError) {
      console.error('JSON parse error:', parseError, 'Content:', content);
      return NextResponse.json(
        { error: 'Failed to parse mind map structure' },
        { status: 500 }
      );
    }

    // Validate the structure
    if (!mindMap.title || !mindMap.children || mindMap.children.length === 0) {
      console.error('Invalid mindmap structure:', mindMap);
      return NextResponse.json(
        { error: 'Invalid mind map structure received' },
        { status: 500 }
      );
    }

    return NextResponse.json({ mindMap });
  } catch (error) {
    console.error('Error processing PDF:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Processing failed' },
      { status: 500 }
    );
  }
}
