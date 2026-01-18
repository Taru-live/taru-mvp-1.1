import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import connectDB from '@/lib/mongodb';
import Student from '@/models/Student';
import User from '@/models/User';
import Organization from '@/models/Organization';
import AuditLog from '@/models/AuditLog';
import { StudentKeyGenerator } from '@/lib/studentKeyGenerator';
import { checkMustChangePassword } from '@/lib/auth-utils';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

interface DecodedToken {
  userId: string;
  [key: string]: unknown;
}

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    // Get JWT token from cookies
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Verify JWT token
    let decoded: any;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (jwtError) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
    }

    // Check if user must change password (backend enforcement)
    const passwordCheck = checkMustChangePassword(request, decoded);
    if (passwordCheck) {
      return passwordCheck;
    }

    // Check if user is an organization admin
    const user = await User.findById(decoded.userId);
    if (!user || user.role !== 'organization') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Get organization
    const organization = await Organization.findOne({ userId: user._id.toString() });
    if (!organization) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    // Get students in this organization
    const students = await Student.find({ organizationId: organization._id.toString() })
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
        isActive: user?.isActive !== false, // Default to true if not set
        joinedAt: student.createdAt.toISOString(),
        totalModulesCompleted: student.totalModulesCompleted || 0,
        totalXpEarned: student.totalXpEarned || 0,
        learningStreak: student.learningStreak || 0,
        badgesEarned: student.badgesEarned || 0,
        assessmentCompleted: student.assessmentCompleted || false,
        diagnosticCompleted: student.diagnosticCompleted || false,
        diagnosticScore: student.diagnosticScore || 0,
        createdBy: student.createdBy || null,
        managedBy: student.managedBy || null,
        teacherId: student.teacherId || null
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
    console.log('POST /api/organization/students called');
    
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
    let decoded: any;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (jwtError) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
    }

    // Check if user is an organization admin
    const user = await User.findById(decoded.userId);
    if (!user || user.role !== 'organization') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Get organization
    const organization = await Organization.findOne({ userId: user._id.toString() });
    if (!organization) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    if (organization.approvalStatus !== 'approved') {
      return NextResponse.json({ error: 'Organization must be approved to create students' }, { status: 403 });
    }

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

    const { name, email, classGrade, schoolName } = body;

    // Validate required fields
    console.log('Validating fields:', { name, email, classGrade, schoolName });
    if (!name || !email || !classGrade) {
      console.log('Validation failed - missing required fields');
      return NextResponse.json(
        { error: 'Missing required fields' },
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
        { error: 'User with this email already exists' },
        { status: 400 }
      );
    }

    console.log('Validation passed, proceeding to create user and student records');

    // Generate secure password (same as teacher creation)
    const generateSecurePassword = () => {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
      let password = '';
      for (let i = 0; i < 12; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return password;
    };

    const securePassword = generateSecurePassword();

    // Create new user
    const newUser = new User({
      name,
      email,
      password: securePassword,
      role: 'student',
      profile: {
        classGrade,
        schoolName: schoolName || 'Not specified'
      },
      firstTimeLogin: true, // Mark for password change on first login
      mustChangePassword: true // Force password change on first login
    });

    const savedUser = await newUser.save();
    console.log('User saved successfully:', savedUser._id);

    // Create student record with all required fields
    const newStudent = new Student({
      userId: savedUser._id,
      organizationId: organization._id.toString(),
      createdBy: {
        type: 'organization',
        id: organization._id.toString(),
        name: organization.organizationName || 'Organization'
      },
      managedBy: {
        type: 'organization',
        id: organization._id.toString(),
        name: organization.organizationName || 'Organization'
      },
      fullName: name,
      classGrade,
      schoolName: schoolName || 'Not specified',
      schoolId: `SCH${Date.now()}`,
      uniqueId: StudentKeyGenerator.generate(),
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

    // Log audit
    await AuditLog.create({
      userId: user._id.toString(),
      userRole: user.role,
      organizationId: organization._id.toString(),
      action: 'CREATE_STUDENT',
      resource: 'Student',
      resourceId: savedStudent._id.toString(),
      details: {
        newValues: { name, email, classGrade, schoolName }
      },
      severity: 'medium'
    });

    // Verify the data was saved correctly
    const verifyUser = await User.findById(savedUser._id);
    const verifyStudent = await Student.findById(savedStudent._id);
    
    if (!verifyUser || !verifyStudent) {
      throw new Error('Failed to verify saved data');
    }
    
    console.log('Data verification successful - both User and Student records exist in database');

    const loginUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/login`;

    return NextResponse.json({
      message: 'Student created successfully',
      credentials: {
        id: savedUser._id.toString(),
        name: savedUser.name,
        email: savedUser.email,
        password: securePassword,
        loginUrl
      },
      student: {
        id: savedStudent._id.toString(),
        userId: savedUser._id.toString(),
        fullName: savedUser.name,
        email: savedUser.email,
        password: securePassword, // Include password in student object for frontend
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
    console.error('Error creating student:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    console.error('Error type:', typeof error);
    console.error('Error message:', error instanceof Error ? error.message : 'No message');
    
    // Handle specific error types
    let errorMessage = 'Failed to create student';
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
