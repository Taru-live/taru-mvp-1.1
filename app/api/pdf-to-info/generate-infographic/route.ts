import { NextRequest, NextResponse } from 'next/server';

function getThemePrompt(theme: string): string {
  switch (theme) {
    case 'handwritten':
      return `CRITICAL STYLE REQUIREMENTS:
- Hand-drawn, pencil-sketch aesthetic with visible pencil strokes
- Cartoonish, doodle-style icons and illustrations
- Handwritten text style (like someone wrote it with a pen)
- Loose, imperfect lines that feel human and warm
- Sketchbook/notebook paper background with subtle texture
- Soft, warm color palette (cream, soft orange, muted teal, warm gray)
- Hand-drawn arrows, borders, and connecting lines
- Playful doodle diagrams and simple charts
- Whimsical, friendly visual elements
- NOT corporate or professional looking
- Think "designer doodles mixed with infographic structure"
- Include cute hand-drawn icons related to the content
- Add small decorative elements like stars, hearts, or swirls
- Make it feel like a creative person's visual notes`;

    case 'professional':
      return `CRITICAL STYLE REQUIREMENTS:
- Clean, modern corporate infographic design
- Professional typography with clear hierarchy
- Sleek, polished visual elements
- Business-appropriate color palette (blues, grays, teals)
- Sharp, precise lines and geometric shapes
- Data visualization charts and graphs
- Gradient backgrounds with subtle shadows
- Icons in a consistent, professional style
- White or light neutral background
- Corporate presentation quality
- Magazine-editorial level polish
- Clear visual flow and information hierarchy
- Modern sans-serif typography
- Professional stock photo quality`;

    case 'cartoon':
      return `CRITICAL STYLE REQUIREMENTS:
- Bold, vibrant cartoon illustration style
- Exaggerated, playful character designs
- Bright, saturated color palette (yellows, pinks, blues, greens)
- Thick black outlines around elements
- Fun, bouncy visual elements
- Comic book inspired design
- Expressive, animated-looking icons
- Cheerful, energetic mood
- Bubble letters and fun typography
- Cute mascot-like characters if applicable
- Pop art influences
- Sticker-like elements
- Confetti, stars, and celebration elements
- Very kid-friendly and approachable`;

    case 'retro':
      return `CRITICAL STYLE REQUIREMENTS:
- Vintage 1950s-1970s aesthetic
- Aged, textured paper background
- Muted, desaturated color palette (mustard, olive, burnt orange, cream)
- Halftone dot patterns
- Retro typography (serif fonts, decorative letters)
- Vintage illustration style
- Old print advertisement feel
- Faded edges and worn textures
- Mid-century modern design elements
- Art deco influences
- Nostalgic, classic Americana feel
- Old newspaper or magazine clipping style
- Sepia tones and vintage filters
- Classic stamp or badge elements`;

    case 'minimal':
      return `CRITICAL STYLE REQUIREMENTS:
- Ultra-clean whiteboard aesthetic
- Minimal, simple line drawings
- Black or dark gray on pure white background
- Maximum white space
- Simple, thin-line icons
- Sans-serif typography only
- No textures or gradients
- Geometric, precise shapes
- Clear information hierarchy
- Zen-like simplicity
- Sketch-style but precise lines
- Very limited color (one accent color max)
- Scandinavian design influence
- Apple-like minimalism`;

    default:
      return getThemePrompt('handwritten');
  }
}

export async function POST(request: NextRequest) {
  try {
    const { topic, content, theme } = await request.json();
    
    if (!topic || !content) {
      return NextResponse.json(
        { error: 'Topic and content are required' },
        { status: 400 }
      );
    }

    const GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'AIzaSyDWvmkOFPB3lN4_9Qr2PaXTLV8QS29tI7A';
    const themeStyles = getThemePrompt(theme || 'handwritten');
    const contentSummary = content.slice(0, 800);

    const prompt = `Create a 16:9 infographic visual about the following topic.

Topic: "${topic}"
Content Summary: ${contentSummary}

${themeStyles}

The image should clearly communicate the key points in an engaging, visually appealing way that matches the specified style. Make sure all text in the image is legible and the layout flows naturally for the reader.`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-pro-image-preview:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            responseModalities: ['TEXT', 'IMAGE']
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
    const parts = data.candidates?.[0]?.content?.parts || [];
    const imagePart = parts.find((p: any) => p.inlineData?.mimeType?.startsWith('image/'));

    if (imagePart?.inlineData?.data) {
      const imageUrl = `data:${imagePart.inlineData.mimeType};base64,${imagePart.inlineData.data}`;
      return NextResponse.json({ imageUrl });
    }

    return NextResponse.json(
      { error: 'No image in response' },
      { status: 500 }
    );
  } catch (error) {
    console.error('Error generating infographic:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Generation failed' },
      { status: 500 }
    );
  }
}
