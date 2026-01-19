import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import connectDB from '@/lib/mongodb';
import YoutubeUrl from '@/models/YoutubeUrl';
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

    // Get search query from URL parameters
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q')?.trim() || '';
    const filterLevel = searchParams.get('level') || 'all';

    if (!query) {
      return NextResponse.json(
        { error: 'Search query is required' },
        { status: 400 }
      );
    }

    console.log('🔍 Searching YouTube data for:', { query, uniqueId: student.uniqueId });

    // Find the most recent YouTube data for this student's uniqueId
    const youtubeData = await YoutubeUrl.findOne({ uniqueid: student.uniqueId })
      .sort({ createdAt: -1 })
      .lean() as any;

    if (!youtubeData || !youtubeData.modules) {
      return NextResponse.json({
        success: true,
        message: 'No modules found',
        data: {
          modules: [],
          totalMatches: 0
        }
      });
    }

    const searchQueryLower = query.toLowerCase();
    const filteredModules: any[] = [];

    // Search through modules, submodules, and chapters
    youtubeData.modules.forEach((module: any) => {
      // Check if module matches
      const moduleTitleMatch = module.moduleTitle?.toLowerCase().includes(searchQueryLower);
      const moduleDescMatch = module.moduleDescription?.toLowerCase().includes(searchQueryLower);
      const moduleMatches = moduleTitleMatch || moduleDescMatch;

      const filteredSubmodules: any[] = [];

      module.submodules?.forEach((submodule: any) => {
        // Check if submodule matches
        const submoduleTitleMatch = submodule.submoduleTitle?.toLowerCase().includes(searchQueryLower);
        const submoduleDescMatch = submodule.submoduleDescription?.toLowerCase().includes(searchQueryLower);
        const submoduleMatches = submoduleTitleMatch || submoduleDescMatch;

        // Filter chapters
        const filteredChapters = submodule.chapters?.filter((chapter: any) => {
          // Check if chapter matches
          const chapterTitleMatch = chapter.chapterTitle?.toLowerCase().includes(searchQueryLower);
          const chapterDescMatch = chapter.chapterDescription?.toLowerCase().includes(searchQueryLower);
          const chapterMatches = chapterTitleMatch || chapterDescMatch;

          // Check level filter
          if (filterLevel !== 'all') {
            const chapterNum = chapter.chapterId;
            if (filterLevel === 'basic' && chapterNum > 6) return false;
            if (filterLevel === 'intermediate' && (chapterNum <= 6 || chapterNum > 12)) return false;
            if (filterLevel === 'advanced' && chapterNum <= 12) return false;
          }

          return chapterMatches;
        }) || [];

        // Include submodule if:
        // 1. Submodule itself matches (show all its chapters)
        // 2. It has matching chapters (show only those chapters)
        if (submoduleMatches) {
          // If submodule matches, include all its chapters (with level filter)
          const allChapters = submodule.chapters?.filter((chapter: any) => {
            if (filterLevel === 'all') return true;
            const chapterNum = chapter.chapterId;
            if (filterLevel === 'basic') return chapterNum <= 6;
            if (filterLevel === 'intermediate') return chapterNum > 6 && chapterNum <= 12;
            if (filterLevel === 'advanced') return chapterNum > 12;
            return true;
          }) || [];
          filteredSubmodules.push({
            ...submodule,
            chapters: allChapters
          });
        } else if (filteredChapters.length > 0) {
          // If submodule doesn't match but has matching chapters
          filteredSubmodules.push({
            ...submodule,
            chapters: filteredChapters
          });
        }
      });

      // Include module if:
      // 1. Module itself matches (show all its submodules)
      // 2. It has matching submodules (show only those submodules)
      if (moduleMatches) {
        // If module matches, include all its submodules (but filter chapters by level)
        const allSubmodules = module.submodules?.map((submodule: any) => {
          const filteredChapters = submodule.chapters?.filter((chapter: any) => {
            if (filterLevel === 'all') return true;
            const chapterNum = chapter.chapterId;
            if (filterLevel === 'basic') return chapterNum <= 6;
            if (filterLevel === 'intermediate') return chapterNum > 6 && chapterNum <= 12;
            if (filterLevel === 'advanced') return chapterNum > 12;
            return true;
          }) || [];
          return {
            ...submodule,
            chapters: filteredChapters
          };
        }) || [];
        filteredModules.push({
          ...module,
          submodules: allSubmodules
        });
      } else if (filteredSubmodules.length > 0) {
        // If module doesn't match but has matching submodules
        filteredModules.push({
          ...module,
          submodules: filteredSubmodules
        });
      }
    });

    // Count total matches
    let totalMatches = 0;
    filteredModules.forEach(module => {
      module.submodules?.forEach((submodule: any) => {
        totalMatches += submodule.chapters?.length || 0;
      });
    });

    return NextResponse.json({
      success: true,
      message: 'Search completed successfully',
      data: {
        modules: filteredModules,
        totalMatches,
        query,
        filterLevel
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error searching modules:', error);
    
    return NextResponse.json({
      success: false,
      message: 'Error searching modules',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
