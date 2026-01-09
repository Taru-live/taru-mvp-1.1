import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import connectDB from '@/lib/mongodb';
import Student from '@/models/Student';
import YoutubeUrl from '@/models/YoutubeUrl';
import StudentProgress from '@/models/StudentProgress';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const YOUTUBE_SCRAPING_WEBHOOK_URL = 'https://nclbtaru.app.n8n.cloud/webhook/YoutubeLinkscrapper';

interface DecodedToken {
  userId: string;
  [key: string]: unknown;
}

export async function POST(request: NextRequest) {
  try {
    console.log('🎬 YouTube Scraping API called at:', new Date().toISOString());
    
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

    // Get student profile
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

    console.log('🎬 Triggering YouTube scraping for:', {
      uniqueId: student.uniqueId,
      fullName: student.fullName,
      classGrade: student.classGrade
    });

    // Check if we should delete existing data
    let deleteExisting = false;
    try {
      const body = await request.json();
      deleteExisting = body.deleteExisting === true;
    } catch (e) {
      // If body is empty or invalid JSON, deleteExisting remains false
      console.log('📝 No request body or invalid JSON, proceeding without deletion');
    }

    // If deleteExisting is true, delete all existing YouTube data and progress
    if (deleteExisting) {
      console.log('🗑️ Deleting existing YouTube data and progress for:', student.uniqueId);
      
      try {
        // Delete all YoutubeUrl entries for this uniqueid
        const youtubeDeleteResult = await YoutubeUrl.deleteMany({ uniqueid: student.uniqueId });
        console.log(`🗑️ Deleted ${youtubeDeleteResult.deletedCount} YouTube data entry/entries`);

        // Delete student progress related to modules
        const progress = await StudentProgress.findOne({ studentId: student.uniqueId });
        if (progress) {
          // Clear module progress but keep the student progress record
          progress.moduleProgress = [];
          progress.totalModulesCompleted = 0;
          progress.totalPoints = 0;
          progress.totalWatchTime = 0;
          progress.totalInteractiveTime = 0;
          progress.totalProjectTime = 0;
          progress.totalPeerLearningTime = 0;
          progress.learningStreak = 0;
          progress.badgesEarned = [];
          progress.skillLevels = new Map();
          await progress.save();
          console.log('🗑️ Cleared all module progress data');
        }

        // Also try to delete by userId (in case progress is stored by userId)
        const progressByUserId = await StudentProgress.findOne({ studentId: decoded.userId });
        if (progressByUserId) {
          progressByUserId.moduleProgress = [];
          progressByUserId.totalModulesCompleted = 0;
          progressByUserId.totalPoints = 0;
          progressByUserId.totalWatchTime = 0;
          progressByUserId.totalInteractiveTime = 0;
          progressByUserId.totalProjectTime = 0;
          progressByUserId.totalPeerLearningTime = 0;
          progressByUserId.learningStreak = 0;
          progressByUserId.badgesEarned = [];
          progressByUserId.skillLevels = new Map();
          await progressByUserId.save();
          console.log('🗑️ Cleared all module progress data (by userId)');
        }

        console.log('✅ Successfully deleted existing data before generating new modules');
      } catch (deleteError) {
        console.error('❌ Error deleting existing data:', deleteError);
        // Continue with scraping even if deletion fails
      }
    }

    // Prepare uniqueId for N8N webhook - use GET request with query parameters
    const uniqueId = student.uniqueId;

    console.log('🎬 Calling N8N YouTube scraping webhook with uniqueId only:', uniqueId);

    // Build GET URL with query parameters
    const urlParams = new URLSearchParams({
      uniqueid: uniqueId
    });
    const webhookUrl = `${YOUTUBE_SCRAPING_WEBHOOK_URL}?${urlParams.toString()}`;

    console.log('🎬 Calling N8N webhook:', webhookUrl);

    // Try to call N8N webhook with better error handling
    let webhookSuccess = false;
    let webhookResponse = null;
    
    try {
      // Add timeout to prevent hanging requests
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

      webhookResponse = await fetch(webhookUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (webhookResponse.ok) {
        webhookSuccess = true;
        const responseData = await webhookResponse.json();
        console.log('🎬 YouTube scraping triggered successfully:', responseData);
      } else {
        console.warn('🎬 N8N webhook returned non-OK status:', webhookResponse.status);
      }
    } catch (webhookError) {
      console.warn('🎬 N8N webhook call failed, but continuing with fallback:', webhookError);
      // Don't fail the entire request if N8N webhook fails
    }

    // Always return success to the frontend, as the N8N workflow might still be triggered
    // even if the webhook call fails or times out
    return NextResponse.json({
      success: true,
      message: webhookSuccess 
        ? 'YouTube scraping triggered successfully' 
        : 'YouTube scraping initiated (webhook call may have timed out, but processing continues)',
      studentInfo: {
        uniqueId: student.uniqueId,
        fullName: student.fullName,
        classGrade: student.classGrade,
        schoolName: student.schoolName,
        email: student.email
      },
      webhookSuccess: webhookSuccess,
      webhookUrl: webhookUrl,
      note: 'Please wait for the scraping to complete. Modules will be available shortly. The system will continue checking for results.'
    });

  } catch (error) {
    console.error('🎬 YouTube Scraping API error:', error);
    
    if (error instanceof Error && error.name === 'AbortError') {
      return NextResponse.json(
        { 
          success: false,
          error: 'YouTube scraping request timed out',
          details: 'The scraping request took too long to complete'
        },
        { status: 408 }
      );
    }
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
