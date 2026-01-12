import { NextRequest, NextResponse } from 'next/server';
import { FallbackModuleService } from '@/lib/FallbackModuleService';

export async function GET(request: NextRequest) {
  // Block in production for security
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'Not available in production' },
      { status: 403 }
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const testType = searchParams.get('type') || 'modules';

    if (testType === 'modules') {
      const fallbackModules = FallbackModuleService.getFallbackModules();
      const randomModule = FallbackModuleService.getRandomFallbackModule();
      
      return NextResponse.json({
        success: true,
        message: 'Fallback modules test successful',
        data: {
          totalFallbackModules: fallbackModules.length,
          sampleModule: randomModule,
          allModules: fallbackModules.map(m => ({ id: m.moduleId, name: m.name, subject: m.subject }))
        }
      });
    }

    if (testType === 'youtube') {
      const testUniqueId = 'test-user-123';
      const fallbackYouTubeData = FallbackModuleService.getFallbackYouTubeData(testUniqueId);
      
      return NextResponse.json({
        success: true,
        message: 'Fallback YouTube data test successful',
        data: fallbackYouTubeData
      });
    }

    return NextResponse.json({
      success: false,
      message: 'Invalid test type. Use ?type=modules or ?type=youtube'
    }, { status: 400 });

  } catch (error) {
    console.error('Fallback test error:', error);
    return NextResponse.json({
      success: false,
      message: 'Fallback test failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
