import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import Student from '@/models/Student';

export async function GET(request: NextRequest) {
  // Block in production for security
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'Not available in production' },
      { status: 403 }
    );
  }

  try {
    console.log('Testing database connection...');
    console.log('MONGODB_URI:', process.env.MONGODB_URI);
    console.log('MONGODB_DIRECT_URI:', process.env.MONGODB_DIRECT_URI);
    console.log('MONGODB_SIMPLE_URI:', process.env.MONGODB_SIMPLE_URI);
    
    await connectDB();
    console.log('✅ Database connected successfully');
    
    // Test creating a user
    const testUser = new User({
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
      role: 'student',
      profile: {}
    });
    
    await testUser.save();
    console.log('✅ User created successfully');
    
    // Test creating a student
    const testStudent = new Student({
      userId: testUser._id,
      teacherId: 'teacher123',
      fullName: 'Test Student',
      classGrade: 'Grade 7',
      schoolName: 'Test School'
    });
    
    await testStudent.save();
    console.log('✅ Student created successfully');
    
    return NextResponse.json({ 
      message: 'Database test successful',
      user: testUser._id,
      student: testStudent._id
    });
    
  } catch (error) {
    console.error('❌ Database test failed:', error);
    return NextResponse.json(
      { error: 'Database test failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
