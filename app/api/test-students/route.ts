import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
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
    await connectDB();
    
    // Get all students
    const students = await Student.find({});
    console.log('All students:', students.length);
    
    // Get students with teacherId
    const teacherStudents = await Student.find({ teacherId: 'teacher123' });
    console.log('Teacher students:', teacherStudents.length);
    
    return NextResponse.json({ 
      allStudents: students.length,
      teacherStudents: teacherStudents.length,
      students: students.map(s => ({
        id: s._id,
        teacherId: s.teacherId,
        fullName: s.fullName,
        classGrade: s.classGrade
      }))
    });
    
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch students', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
