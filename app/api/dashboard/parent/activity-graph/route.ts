import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import Student from '@/models/Student';
import StudentProgress from '@/models/StudentProgress';

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

    // Get user
    const user = await User.findById(decoded.userId);
    if (!user || user.role !== 'parent') {
      return NextResponse.json(
        { error: 'Only parents can access this endpoint' },
        { status: 403 }
      );
    }

    // Get linked student
    const linkedStudentId = user.profile?.linkedStudentId;
    if (!linkedStudentId) {
      return NextResponse.json(
        { error: 'No student linked to this parent account' },
        { status: 400 }
      );
    }

    // Get student profile
    const student = await Student.findOne({ userId: linkedStudentId });
    if (!student) {
      return NextResponse.json(
        { error: 'Linked student not found' },
        { status: 404 }
      );
    }

    // Get query parameter for time period
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'week'; // 'day', 'week', or 'month'

    // Get student progress
    const progress = await StudentProgress.findOne({ studentId: student.uniqueId });
    
    const now = new Date();
    let startDate: Date;
    let labels: string[];
    const activityByPeriod: Record<string, number> = {};

    if (period === 'day') {
      // Day view: Show hourly data for today (24 hours)
      startDate = new Date(now);
      startDate.setHours(0, 0, 0, 0);
      startDate.setMinutes(0, 0, 0);
      
      // For day view, show every 2 hours to make it more readable (12 bars)
      labels = Array.from({ length: 12 }, (_, i) => {
        const hour = (i * 2).toString().padStart(2, '0');
        return `${hour}:00`;
      });
      
      labels.forEach(label => {
        activityByPeriod[label] = 0;
      });
    } else if (period === 'week') {
      // Week view: Show daily data for last 7 days
      startDate = new Date(now);
      startDate.setDate(startDate.getDate() - 7);
      startDate.setHours(0, 0, 0, 0);
      
      labels = ['Mon', 'Tues', 'Wed', 'Thurs', 'Fri', 'Sat', 'Sun'];
      labels.forEach(label => {
        activityByPeriod[label] = 0;
      });
    } else if (period === 'month') {
      // Month view: Show weekly data for last 4 weeks
      startDate = new Date(now);
      startDate.setDate(startDate.getDate() - 28);
      startDate.setHours(0, 0, 0, 0);
      
      labels = ['Week 1', 'Week 2', 'Week 3', 'Week 4'];
      labels.forEach(label => {
        activityByPeriod[label] = 0;
      });
    } else {
      return NextResponse.json(
        { error: 'Invalid period. Use "day", "week", or "month"' },
        { status: 400 }
      );
    }

    if (progress && progress.moduleProgress) {
      // Process each module's activity
      progress.moduleProgress.forEach((mp: any) => {
        // Track all activity dates for this module
        const activityDates: Array<{ date: Date; value: number }> = [];

        // Check lastAccessedAt dates
        if (mp.lastAccessedAt) {
          const accessDate = new Date(mp.lastAccessedAt);
          if (accessDate >= startDate && accessDate <= now) {
            // Calculate activity value based on watch time and progress
            const watchTimeMinutes = (mp.videoProgress?.watchTime || 0) / 60;
            const progressValue = mp.quizScore || 0;
            // Activity value: base 30 + watch time (1 point per minute, max 50) + progress (0.5 per %, max 50)
            const activityValue = 30 + Math.min(50, Math.round(watchTimeMinutes)) + Math.min(50, Math.round(progressValue * 0.5));
            activityDates.push({ date: accessDate, value: activityValue });
          }
        }

        // Check completedAt dates
        if (mp.completedAt) {
          const completedDate = new Date(mp.completedAt);
          if (completedDate >= startDate && completedDate <= now) {
            // Completion gives high activity value
            activityDates.push({ date: completedDate, value: 120 });
          }
        }

        // Check video progress lastWatchedAt dates
        if (mp.videoProgress?.lastWatchedAt) {
          const watchedDate = new Date(mp.videoProgress.lastWatchedAt);
          if (watchedDate >= startDate && watchedDate <= now) {
            const watchTimeMinutes = (mp.videoProgress.watchTime || 0) / 60;
            // Activity based on watch time: 20 base + 2 per minute watched
            const activityValue = 20 + Math.min(80, Math.round(watchTimeMinutes * 2));
            activityDates.push({ date: watchedDate, value: activityValue });
          }
        }

        // Aggregate activities by period
        activityDates.forEach(({ date, value }) => {
          let periodKey: string;
          
          if (period === 'day') {
            // Group by hour, but round to nearest 2-hour interval (00:00, 02:00, ..., 22:00)
            const hour = date.getHours();
            const roundedHour = Math.floor(hour / 2) * 2; // Round down to nearest even hour
            periodKey = `${roundedHour.toString().padStart(2, '0')}:00`;
          } else if (period === 'week') {
            // Group by day of week
            const dayOfWeek = date.getDay();
            periodKey = dayOfWeek === 0 ? 'Sun' : 
                       dayOfWeek === 1 ? 'Mon' :
                       dayOfWeek === 2 ? 'Tues' :
                       dayOfWeek === 3 ? 'Wed' :
                       dayOfWeek === 4 ? 'Thurs' :
                       dayOfWeek === 5 ? 'Fri' : 'Sat';
          } else if (period === 'month') {
            // Group by week (Week 1, Week 2, Week 3, Week 4)
            const daysDiff = Math.floor((date.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
            const weekNumber = Math.floor(daysDiff / 7) + 1;
            periodKey = `Week ${Math.min(weekNumber, 4)}`;
          } else {
            return;
          }
          
          // Use max to handle multiple activities in same period
          if (activityByPeriod[periodKey] !== undefined) {
            activityByPeriod[periodKey] = Math.max(activityByPeriod[periodKey], value);
          }
        });
      });
    }

    // Convert to array format matching the chart structure
    const activityData = labels.map(label => ({
      day: label,
      height: Math.max(59, Math.min(124, activityByPeriod[label] || 59)) // Minimum 59px, max 124px
    }));

    return NextResponse.json({
      success: true,
      activityData,
      period,
      startDate: startDate.toISOString(),
      endDate: now.toISOString()
    });

  } catch (error: unknown) {
    console.error('Get activity graph error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
