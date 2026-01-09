import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import connectDB from '@/lib/mongodb';
import YoutubeUrl from '@/models/YoutubeUrl';
import { FallbackModuleService } from '@/lib/FallbackModuleService';
import Student from '@/models/Student';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

interface DecodedToken {
  userId: string;
  [key: string]: unknown;
}
export async function GET(request: NextRequest) {
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

    // Get student profile to access uniqueId
    const student = await Student.findOne({ 
      userId: decoded.userId,
      onboardingCompleted: true 
    });

    if (!student) {
      return NextResponse.json(
        { error: 'Student not found or onboarding not completed' },
        { status: 404 }
      );
    }

    console.log('🎬 Fetching YouTube data for student uniqueId:', student.uniqueId);
    
    // Find the most recent YouTube data for this student's uniqueId
    const youtubeData = await YoutubeUrl.findOne({ uniqueid: student.uniqueId })
      .sort({ createdAt: -1 })
      .lean() as any;
    
    if (!youtubeData) {
      // Return fallback YouTube data instead of error
      const fallbackData = FallbackModuleService.getFallbackYouTubeData(student.uniqueId);
      return NextResponse.json({
        success: true,
        message: 'Using fallback YouTube data',
        data: fallbackData,
        isFallback: true
      });
    }
    
    // Check if data is in hierarchical format (modules with submodules and chapters)
    if (youtubeData.modules && Array.isArray(youtubeData.modules)) {
      console.log('✅ Found hierarchical modules format in youtube-data route');
      
      // Return hierarchical format directly
      return NextResponse.json({
        success: true,
        message: 'YouTube data fetched successfully',
        data: {
          _id: youtubeData._id,
          uniqueid: youtubeData.uniqueid,
          modules: youtubeData.modules,
          createdAt: youtubeData.createdAt,
          updatedAt: youtubeData.updatedAt
        },
        timestamp: new Date().toISOString()
      });
    }
    
    // Check if Module exists and is an array (old flat format)
    if (!youtubeData.Module || !Array.isArray(youtubeData.Module)) {
      console.log('⚠️ Module/modules data is missing or not an array. Available keys:', Object.keys(youtubeData));
      // Return fallback data if structure is invalid
      const fallbackData = FallbackModuleService.getFallbackYouTubeData(student.uniqueId);
      return NextResponse.json({
        success: true,
        message: 'Using fallback YouTube data (invalid structure)',
        data: fallbackData,
        isFallback: true
      });
    }
    
    // Convert the Module array to a more usable format
    // Each item in Module array contains one chapter (e.g., {"Chapter 1": {...}})
    const chapters = youtubeData.Module.map((moduleItem: any, index: number) => {
      // Each moduleItem is an object like {"Chapter 1": {videoUrl: "...", videoTitle: "..."}}
      const chapterKey = Object.keys(moduleItem)[0]; // e.g., "Chapter 1"
      const chapterData = moduleItem[chapterKey];
      
      return {
        chapterIndex: index + 1,
        chapterKey,
        videoTitle: chapterData.videoTitle,
        videoUrl: chapterData.videoUrl
      };
    });

    const formattedData = {
      _id: youtubeData._id,
      uniqueid: youtubeData.uniqueid,
      chapters: chapters,
      totalChapters: chapters.length,
      createdAt: youtubeData.createdAt,
      updatedAt: youtubeData.updatedAt
    };
    
    
    return NextResponse.json({
      success: true,
      message: 'YouTube data fetched successfully',
      data: formattedData,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Error fetching YouTube data:', error);
    
    return NextResponse.json({
      success: false,
      message: 'Error fetching YouTube data',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
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

    // Get student profile to access uniqueId
    const student = await Student.findOne({ 
      userId: decoded.userId,
      onboardingCompleted: true 
    });

    if (!student) {
      return NextResponse.json(
        { error: 'Student not found or onboarding not completed' },
        { status: 404 }
      );
    }

    console.log('🎬 Fetching YouTube data for student uniqueId:', student.uniqueId);
    
    // Find the most recent YouTube data for this student's uniqueId
    const youtubeData = await YoutubeUrl.findOne({ uniqueid: student.uniqueId })
      .sort({ createdAt: -1 })
      .lean() as any;
    
    if (!youtubeData) {
      // Return fallback YouTube data instead of error
      const fallbackData = FallbackModuleService.getFallbackYouTubeData(student.uniqueId);
      return NextResponse.json({
        success: true,
        message: 'Using fallback YouTube data',
        data: fallbackData,
        isFallback: true
      });
    }
    
    // Check if data is in hierarchical format (modules with submodules and chapters)
    if (youtubeData.modules && Array.isArray(youtubeData.modules)) {
      console.log('✅ Found hierarchical modules format in youtube-data route (POST)');
      
      // Return hierarchical format directly
      return NextResponse.json({
        success: true,
        message: 'YouTube data fetched successfully',
        data: {
          _id: youtubeData._id,
          uniqueid: youtubeData.uniqueid,
          modules: youtubeData.modules,
          createdAt: youtubeData.createdAt,
          updatedAt: youtubeData.updatedAt
        },
        timestamp: new Date().toISOString()
      });
    }
    
    // Check if Module exists and is an array (old flat format)
    if (!youtubeData.Module || !Array.isArray(youtubeData.Module)) {
      console.log('⚠️ Module/modules data is missing or not an array. Available keys:', Object.keys(youtubeData));
      // Return fallback data if structure is invalid
      const fallbackData = FallbackModuleService.getFallbackYouTubeData(student.uniqueId);
      return NextResponse.json({
        success: true,
        message: 'Using fallback YouTube data (invalid structure)',
        data: fallbackData,
        isFallback: true
      });
    }
    
    // Convert the Module array to a more usable format
    // Each item in Module array contains one chapter (e.g., {"Chapter 1": {...}})
    const chapters = youtubeData.Module.map((moduleItem: any, index: number) => {
      // Each moduleItem is an object like {"Chapter 1": {videoUrl: "...", videoTitle: "..."}}
      const chapterKey = Object.keys(moduleItem)[0]; // e.g., "Chapter 1"
      const chapterData = moduleItem[chapterKey];
      
      return {
        chapterIndex: index + 1,
        chapterKey,
        videoTitle: chapterData.videoTitle,
        videoUrl: chapterData.videoUrl
      };
    });

    const formattedData = {
      _id: youtubeData._id,
      uniqueid: youtubeData.uniqueid,
      chapters: chapters,
      totalChapters: chapters.length,
      createdAt: youtubeData.createdAt,
      updatedAt: youtubeData.updatedAt
    };
    
    
    return NextResponse.json({
      success: true,
      message: 'YouTube data fetched successfully',
      data: formattedData,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Error fetching YouTube data (POST):', error);
    
    return NextResponse.json({
      success: false,
      message: 'Error fetching YouTube data',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
