import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import YoutubeUrl from '@/models/YoutubeUrl';
import LearningPathResponse from '@/models/LearningPathResponse';

// Helper function to clean invalid entries from hierarchical modules structure
function cleanHierarchicalModules(modules: any[]): any[] {
  if (!Array.isArray(modules)) return [];
  
  const invalidPatterns = [
    'no link found',
    'no valid video found',
    'invalid chapter',
    'invalid chapter data'
  ];
  
  return modules.map(module => {
    if (!module || typeof module !== 'object') return null;
    
    // Clean submodules
    const cleanedSubmodules = (module.submodules || []).map((submodule: any) => {
      if (!submodule || typeof submodule !== 'object') return null;
      
      // Clean chapters
      const cleanedChapters = (submodule.chapters || []).filter((chapter: any) => {
        if (!chapter || typeof chapter !== 'object') return false;
        
        const videoTitle = chapter.youtubeTitle || chapter.videoTitle || '';
        const videoUrl = chapter.youtubeUrl || chapter.videoUrl || '';
        
        const normalizedTitle = videoTitle.trim().toLowerCase();
        const normalizedUrl = videoUrl.trim().toLowerCase();
        
        const isInvalid = 
          invalidPatterns.some(pattern => normalizedTitle.includes(pattern)) ||
          normalizedUrl === 'no link found' ||
          !videoUrl || 
          videoUrl.trim() === '' ||
          (!videoUrl.startsWith('http://') && !videoUrl.startsWith('https://'));
        
        return !isInvalid;
      });
      
      // Only return submodule if it has valid chapters
      if (cleanedChapters.length === 0) return null;
      
      return {
        ...submodule,
        chapters: cleanedChapters
      };
    }).filter((sm: any) => sm !== null);
    
    // Only return module if it has valid submodules
    if (cleanedSubmodules.length === 0) return null;
    
    return {
      ...module,
      submodules: cleanedSubmodules
    };
  }).filter((m: any) => m !== null);
}

// Helper function to remove duplicate modules and invalid entries based on videoTitle
async function removeDuplicateModules(youtubeData: any): Promise<any> {
  // Handle hierarchical format (modules with submodules and chapters)
  if (youtubeData.modules && Array.isArray(youtubeData.modules)) {
    const cleanedModules = cleanHierarchicalModules(youtubeData.modules);
    
    if (cleanedModules.length !== youtubeData.modules.length) {
      console.log(`🗑️ Cleaned ${youtubeData.modules.length - cleanedModules.length} invalid module(s) from hierarchical structure`);
      
      // Update the document in database
      await YoutubeUrl.findByIdAndUpdate(
        youtubeData._id,
        { modules: cleanedModules, updatedAt: new Date() },
        { new: true }
      );
      
      youtubeData.modules = cleanedModules;
    }
    
    return youtubeData;
  }
  
  // Handle old flat format (Module array)
  if (!youtubeData.Module || !Array.isArray(youtubeData.Module)) {
    return youtubeData;
  }
  
  const seenTitles = new Set<string>();
  const uniqueModules: any[] = [];
  let duplicateCount = 0;
  let invalidCount = 0;
  
  // Invalid patterns to filter out
  const invalidPatterns = [
    'no link found',
    'no valid video found',
    'invalid chapter',
    'invalid chapter data'
  ];
  
  for (const moduleItem of youtubeData.Module) {
    if (!moduleItem || typeof moduleItem !== 'object') {
      // Skip invalid module items
      invalidCount++;
      console.log(`⚠️ Skipping invalid module item:`, moduleItem);
      continue;
    }
    
    // Extract videoTitle and videoUrl from moduleItem
    const chapterKey = Object.keys(moduleItem)[0];
    const chapterData = moduleItem[chapterKey];
    const videoTitle = chapterData?.videoTitle || '';
    const videoUrl = chapterData?.videoUrl || '';
    
    // Check if entry is invalid (no link found, no valid video, etc.)
    const normalizedTitle = videoTitle.trim().toLowerCase();
    const normalizedUrl = videoUrl.trim().toLowerCase();
    const isInvalid = 
      invalidPatterns.some(pattern => normalizedTitle.includes(pattern)) ||
      normalizedUrl === 'no link found' ||
      !videoUrl || 
      videoUrl.trim() === '' ||
      (!videoUrl.startsWith('http://') && !videoUrl.startsWith('https://'));
    
    if (isInvalid) {
      invalidCount++;
      console.log(`⚠️ Skipping invalid module entry - Title: "${videoTitle}", URL: "${videoUrl}"`);
      continue;
    }
    
    // Check for duplicates by normalized title
    if (normalizedTitle && !seenTitles.has(normalizedTitle)) {
      seenTitles.add(normalizedTitle);
      uniqueModules.push(moduleItem);
    } else if (normalizedTitle) {
      duplicateCount++;
      console.log(`⚠️ Found duplicate module with title: "${videoTitle}", skipping...`);
    } else {
      // Keep entries without titles if they have valid URLs
      if (videoUrl && videoUrl.startsWith('http')) {
        uniqueModules.push(moduleItem);
      } else {
        invalidCount++;
        console.log(`⚠️ Skipping entry without title and invalid URL: "${videoUrl}"`);
      }
    }
  }
  
  if (duplicateCount > 0 || invalidCount > 0) {
    console.log(`🗑️ Removed ${duplicateCount} duplicate(s) and ${invalidCount} invalid module(s)`);
    
    // Update the document in database to remove duplicates and invalid entries
    await YoutubeUrl.findByIdAndUpdate(
      youtubeData._id,
      { Module: uniqueModules, updatedAt: new Date() },
      { new: true }
    );
    
    // Update local reference
    youtubeData.Module = uniqueModules;
  }
  
  return youtubeData;
}

export async function GET(request: NextRequest) {
  try {
    // Get uniqueid from query parameters
    const { searchParams } = new URL(request.url);
    const uniqueid = searchParams.get('uniqueid');

    if (!uniqueid) {
      return NextResponse.json(
        { error: 'uniqueid parameter is required' },
        { status: 400 }
      );
    }

    // Connect to database
    await connectDB();

    console.log('🎬 Fetching YouTube data for uniqueid:', uniqueid);
    
    // First, check for duplicate YoutubeUrl documents for this uniqueid
    const allYoutubeData = await YoutubeUrl.find({ uniqueid: uniqueid })
      .sort({ createdAt: -1 })
      .lean() as any[];
    
    // If there are multiple entries, remove duplicates and keep the most recent one
    if (allYoutubeData.length > 1) {
      console.log(`⚠️ Found ${allYoutubeData.length} entries for uniqueid ${uniqueid}, removing duplicates...`);
      
      // Keep the most recent one (already sorted by createdAt: -1, so first one is most recent)
      const mostRecent = allYoutubeData[0];
      const duplicatesToDelete = allYoutubeData.slice(1);
      
      // Delete duplicate entries
      if (duplicatesToDelete.length > 0) {
        const deleteIds = duplicatesToDelete.map(doc => doc._id);
        const deleteResult = await YoutubeUrl.deleteMany({
          _id: { $in: deleteIds }
        });
        console.log(`🗑️ Deleted ${deleteResult.deletedCount} duplicate YoutubeUrl entry/entries for uniqueid ${uniqueid}`);
      }
      
      // Use the most recent one and remove duplicate modules
      const youtubeData = await removeDuplicateModules(mostRecent);
      
      // Return the cleaned data
      return processYoutubeData(youtubeData);
    }
    
    // If only one entry exists, fetch it
    let youtubeData = allYoutubeData.length === 1 
      ? allYoutubeData[0]
      : await YoutubeUrl.findOne({ uniqueid: uniqueid })
          .sort({ createdAt: -1 })
          .lean() as any;
    
    if (!youtubeData) {
      return NextResponse.json({
        success: false,
        message: 'No YouTube data found for the provided uniqueid',
        data: null
      }, { status: 404 });
    }
    
    // Remove duplicate Module entries within the document based on videoTitle
    youtubeData = await removeDuplicateModules(youtubeData);
    
    // Process and return the data
    return processYoutubeData(youtubeData);
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

// Helper function to process YouTube data and return formatted response
function processYoutubeData(youtubeData: any) {
  // Check if data is in hierarchical format (modules with submodules and chapters)
  if (youtubeData.modules && Array.isArray(youtubeData.modules)) {
    console.log('✅ Found hierarchical modules format');
    
    // Clean invalid entries from hierarchical structure
    const cleanedModules = cleanHierarchicalModules(youtubeData.modules);
    
    if (cleanedModules.length === 0) {
      console.log('⚠️ No valid modules after cleaning');
      return NextResponse.json({
        success: false,
        message: 'YouTube data exists but no valid modules found after cleaning',
        isProcessing: true,
        data: {
          _id: youtubeData._id,
          uniqueid: youtubeData.uniqueid,
          modules: [],
          createdAt: youtubeData.createdAt,
          updatedAt: youtubeData.updatedAt
        }
      }, { status: 200 });
    }
    
    // Return hierarchical format directly
    return NextResponse.json({
      success: true,
      message: 'YouTube data fetched successfully',
      data: {
        _id: youtubeData._id,
        uniqueid: youtubeData.uniqueid,
        modules: cleanedModules,
        createdAt: youtubeData.createdAt,
        updatedAt: youtubeData.updatedAt
      },
      timestamp: new Date().toISOString()
    });
  }
  
  // Check if Module exists and is an array (old flat format)
  if (!youtubeData.Module || !Array.isArray(youtubeData.Module)) {
    console.log('⚠️ Module data is missing or not an array. Available keys:', Object.keys(youtubeData));
    return NextResponse.json({
      success: false,
      message: 'YouTube data exists but Module/modules array is missing or invalid',
      isProcessing: true, // Flag to indicate data is still being processed
      data: {
        _id: youtubeData._id,
        uniqueid: youtubeData.uniqueid,
        chapters: [],
        totalChapters: 0,
        createdAt: youtubeData.createdAt,
        updatedAt: youtubeData.updatedAt
      }
    }, { status: 200 });
  }

  // Convert the Module array to a more usable format
  // Each item in Module array contains one chapter (e.g., {"Chapter 1": {...}})
  // Filter out invalid entries during conversion
  const validChapters = youtubeData.Module
    .map((moduleItem: any, index: number) => {
      // Validate moduleItem structure
      if (!moduleItem || typeof moduleItem !== 'object') {
        return null; // Return null to filter out invalid items
      }

      // Each moduleItem is an object like {"Chapter 1": {videoUrl: "...", videoTitle: "..."}}
      const chapterKey = Object.keys(moduleItem)[0]; // e.g., "Chapter 1"
      const chapterData = moduleItem[chapterKey];
      
      // Validate chapterData structure
      if (!chapterData || typeof chapterData !== 'object') {
        return null; // Return null to filter out invalid items
      }
      
      const videoTitle = chapterData.videoTitle || '';
      const videoUrl = chapterData.videoUrl || '';
      
      // Filter out invalid entries
      const invalidPatterns = [
        'no link found',
        'no valid video found',
        'invalid chapter',
        'invalid chapter data'
      ];
      
      const normalizedTitle = videoTitle.trim().toLowerCase();
      const normalizedUrl = videoUrl.trim().toLowerCase();
      const isInvalid = 
        invalidPatterns.some(pattern => normalizedTitle.includes(pattern)) ||
        normalizedUrl === 'no link found' ||
        !videoUrl || 
        videoUrl.trim() === '' ||
        (!videoUrl.startsWith('http://') && !videoUrl.startsWith('https://'));
      
      if (isInvalid) {
        return null; // Filter out invalid entries
      }
      
      return {
        originalIndex: index,
        chapterKey,
        videoTitle: videoTitle || 'Untitled Video',
        videoUrl: videoUrl
      };
    })
    .filter((chapter: any) => chapter !== null); // Remove null entries
  
  // Re-index chapters sequentially after filtering
  const chapters = validChapters.map((chapter: any, index: number) => ({
    chapterIndex: index + 1,
    chapterKey: chapter.chapterKey,
    videoTitle: chapter.videoTitle,
    videoUrl: chapter.videoUrl
  }));

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
}
