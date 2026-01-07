import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import connectDB from '@/lib/mongodb';
import Student from '@/models/Student';
import User from '@/models/User';
import mongoose from 'mongoose';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    // Get JWT token from cookies
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Verify JWT token
    const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
            let decoded: any;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (jwtError) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
    }

    // Check if user is a teacher
    const user = await User.findById(decoded.userId);
    if (!user || user.role !== 'teacher') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const teacherId = user._id.toString();

    // Get students with their user information
    const students = await Student.find({ teacherId })
      .sort({ createdAt: -1 });

    // Get user information for each student
    const studentsData = await Promise.all(students.map(async (student) => {
      const user = await User.findById(student.userId);
      return {
        id: student._id.toString(),
        userId: student.userId.toString(),
        fullName: student.fullName,
        email: user?.email || 'N/A',
        classGrade: student.classGrade || 'Not specified',
        schoolName: student.schoolName || 'Not specified',
        uniqueId: student.uniqueId,
        onboardingCompleted: student.onboardingCompleted,
        joinedAt: student.createdAt.toISOString(),
        totalModulesCompleted: student.totalModulesCompleted || 0,
        totalXpEarned: student.totalXpEarned || 0,
        learningStreak: student.learningStreak || 0,
        badgesEarned: student.badgesEarned || 0,
        assessmentCompleted: student.assessmentCompleted || false,
        diagnosticCompleted: student.diagnosticCompleted || false,
        diagnosticScore: student.diagnosticScore || 0
      };
    }));

    return NextResponse.json({ students: studentsData });
  } catch (error) {
    console.error('Error fetching students:', error);
    return NextResponse.json(
      { error: 'Failed to fetch students' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('POST /api/teacher/students called');
    
    try {
      await connectDB();
      console.log('Database connected successfully');
    } catch (dbError) {
      console.error('Database connection failed:', dbError);
      return NextResponse.json(
        { error: 'Database connection failed', details: dbError instanceof Error ? dbError.message : 'Unknown database error' },
        { status: 500 }
      );
    }

    // Get JWT token from cookies
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Verify JWT token
    const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
            let decoded: any;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (jwtError) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
    }

    // Check if user is a teacher
    const user = await User.findById(decoded.userId);
    if (!user || user.role !== 'teacher') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const teacherId = user._id.toString();

    let body;
    try {
      body = await request.json();
      console.log('Received student data:', body);
    } catch (jsonError) {
      console.error('JSON parsing error:', jsonError);
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }
    const { fullName, email, password, classGrade, schoolName } = body;

    // Validate required fields
    console.log('Validating fields:', { fullName, email, classGrade, schoolName });
    if (!fullName || !email || !classGrade) {
      console.log('Validation failed - missing required fields');
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate password if provided
    if (password && password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long' },
        { status: 400 }
      );
    }

    // Check if user already exists
    console.log('Checking for existing user with email:', email);
    const existingUser = await User.findOne({ email });
    console.log('Existing user found:', existingUser ? 'YES' : 'NO');
    if (existingUser) {
      console.log('User already exists, returning 400');
      return NextResponse.json(
        { error: 'A user with this email address is already registered. Please use a different email.' },
        { status: 400 }
      );
    }

    // Check if student already exists with same name and school for this teacher
    console.log('Checking for existing student:', { fullName, schoolName, teacherId });
    const existingStudent = await Student.findOne({
      fullName,
      schoolName: schoolName || 'Not specified',
      teacherId: teacherId
    });
    console.log('Existing student found:', existingStudent ? 'YES' : 'NO');
    if (existingStudent) {
      console.log('Student already exists, returning 409');
      return NextResponse.json(
        { error: 'A student with this name already exists in your class at this school. Please check the student list or use a different name.' },
        { status: 409 }
      );
    }

    console.log('Validation passed, proceeding to create user and student records');

    // Use provided password or generate secure password
    const generateSecurePassword = () => {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
      let generatedPassword = '';
      for (let i = 0; i < 12; i++) {
        generatedPassword += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return generatedPassword;
    };

    const securePassword = password || generateSecurePassword();

    // Create new user
    const newUser = new User({
      name: fullName,
      email,
      password: securePassword,
      role: 'student',
      profile: {
        classGrade,
        schoolName: schoolName || 'Not specified'
      },
      firstTimeLogin: true // Mark for password change on first login
    });

    const savedUser = await newUser.save();
    console.log('User saved successfully:', savedUser._id);

    // Create student record with all required fields
    const newStudent = new Student({
      userId: savedUser._id,
      teacherId: teacherId, // Use the authenticated teacher's ID
      fullName,
      classGrade,
      schoolName: schoolName || 'Not specified',
      schoolId: `SCH${Date.now()}`,
      uniqueId: `STU${Date.now()}${Math.random().toString(36).substr(2, 5)}`,
      languagePreference: 'English',
      gender: 'Other',
      dateOfBirth: new Date('2000-01-01'),
      guardian: {
        name: 'Guardian Name',
        contactNumber: '1234567890',
        email: email
      },
      onboardingCompleted: false,
      totalModulesCompleted: 0,
      totalXpEarned: 0,
      learningStreak: 0,
      badgesEarned: 0,
      assessmentCompleted: false,
      diagnosticCompleted: false,
      diagnosticScore: 0
    });

    const savedStudent = await newStudent.save();
    console.log('Student saved successfully:', savedStudent._id);

    // Verify the data was saved correctly
    const verifyUser = await User.findById(savedUser._id);
    const verifyStudent = await Student.findById(savedStudent._id);
    
    if (!verifyUser || !verifyStudent) {
      throw new Error('Failed to verify saved data');
    }
    
    console.log('Data verification successful - both User and Student records exist in database');

    const loginUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/login`;

    return NextResponse.json({
      message: 'Student added successfully',
      credentials: {
        id: savedUser._id.toString(),
        name: savedUser.name,
        email: savedUser.email,
        password: securePassword, // Return the plain password (before hashing) for display
        loginUrl
      },
      student: {
        id: savedStudent._id.toString(),
        userId: savedUser._id.toString(),
        fullName: savedUser.name,
        email: savedUser.email,
        password: securePassword, // Include password in student object for frontend (plain text before hashing)
        classGrade,
        schoolName: schoolName || 'Not specified',
        uniqueId: savedStudent.uniqueId,
        onboardingCompleted: false,
        joinedAt: savedStudent.createdAt.toISOString(),
        totalModulesCompleted: 0,
        totalXpEarned: 0,
        learningStreak: 0,
        badgesEarned: 0,
        assessmentCompleted: false,
        diagnosticCompleted: false,
        diagnosticScore: 0
      }
    });
  } catch (error) {
    console.error('Error adding student:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    console.error('Error type:', typeof error);
    console.error('Error message:', error instanceof Error ? error.message : 'No message');
    
    // Handle specific error types
    let errorMessage = 'Failed to add student';
    let statusCode = 500;
    
    if (error instanceof Error) {
      if (error.message.includes('duplicate') || error.message.includes('E11000')) {
        errorMessage = 'A student with this email already exists';
        statusCode = 409;
      } else if (error.message.includes('validation')) {
        errorMessage = 'Invalid data provided: ' + error.message;
        statusCode = 400;
      } else if (error.message.includes('MongoDB') || error.message.includes('connection')) {
        errorMessage = 'Database connection failed';
        statusCode = 500;
      } else {
        errorMessage = error.message;
      }
    }
    
    // Ensure we always return JSON, never HTML
    try {
      return NextResponse.json(
        { 
          error: errorMessage,
          details: error instanceof Error ? error.message : 'Unknown error',
          type: typeof error
        },
        { status: statusCode }
      );
    } catch (responseError) {
      console.error('Failed to create JSON response:', responseError);
      // Fallback response
      return new Response(
        JSON.stringify({ 
          error: 'Internal server error',
          details: 'Failed to process request'
        }),
        { 
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
  }
}

export async function DELETE(request: NextRequest) {
  try {
    console.log('DELETE /api/teacher/students called');
    
    try {
      await connectDB();
      console.log('Database connected successfully');
    } catch (dbError) {
      console.error('Database connection failed:', dbError);
      return NextResponse.json(
        { error: 'Database connection failed', details: dbError instanceof Error ? dbError.message : 'Unknown database error' },
        { status: 500 }
      );
    }

    // Extract student ID from URL
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const studentId = pathParts[pathParts.length - 1];
    
    console.log('Attempting to delete student with ID:', studentId);
    
    if (!studentId) {
      return NextResponse.json(
        { error: 'Student ID is required' },
        { status: 400 }
      );
    }

    // Find the student first
    const student = await Student.findById(studentId);
    if (!student) {
      console.log('Student not found with ID:', studentId);
      return NextResponse.json(
        { error: 'Student not found' },
        { status: 404 }
      );
    }

    console.log('Found student:', student.fullName);

    // Delete the student record
    await Student.findByIdAndDelete(studentId);
    console.log('Student record deleted successfully');

    // Also delete the associated user record
    if (student.userId) {
      await User.findByIdAndDelete(student.userId);
      console.log('Associated user record deleted successfully');
    }

    return NextResponse.json({
      message: 'Student deleted successfully',
      deletedStudentId: studentId
    });

  } catch (error) {
    console.error('Error deleting student:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    console.error('Error type:', typeof error);
    
    // Ensure we always return JSON, never HTML
    try {
      return NextResponse.json(
        { 
          error: 'Failed to delete student', 
          details: error instanceof Error ? error.message : 'Unknown error',
          type: typeof error
        },
        { status: 500 }
      );
    } catch (responseError) {
      console.error('Failed to create JSON response:', responseError);
      // Fallback response
      return new Response(
        JSON.stringify({ 
          error: 'Internal server error',
          details: 'Failed to process request'
        }),
        { 
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
  }
}