import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import Student from '@/models/Student';
import Teacher from '@/models/Teacher';
import { StudentKeyGenerator } from '@/lib/studentKeyGenerator';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

interface DecodedToken {
  userId: string;
  role: string;
  [key: string]: unknown;
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as DecodedToken;
    const user = await User.findById(decoded.userId);
    
    if (!user || user.role !== 'teacher') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const body = await request.json();
    const {
      fullName,
      nickname,
      dateOfBirth,
      age,
      gender,
      classGrade,
      schoolName,
      schoolId,
      languagePreference,
      learningModePreference,
      interestsOutsideClass,
      preferredCareerDomains,
      guardian,
      location,
      consentForDataUsage,
      termsAndConditionsAccepted
    } = body;

    // Validate required fields
    const requiredFields = ['fullName', 'dateOfBirth', 'gender', 'classGrade', 'schoolName'];
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json({ error: `${field} is required` }, { status: 400 });
      }
    }

    // Check if student with same name and school already exists
    const existingStudent = await Student.findOne({
      fullName,
      schoolName,
      teacherId: user._id.toString()
    });

    if (existingStudent) {
      return NextResponse.json({ error: 'Student with this name already exists in your class' }, { status: 409 });
    }

    // Create new student record
    const newStudent = new Student({
      userId: user._id.toString(), // Use teacher's ID as the linking field
      teacherId: user._id.toString(),
      createdBy: {
        type: 'teacher',
        id: user._id.toString(),
        name: user.name || 'Teacher'
      },
      managedBy: {
        type: 'teacher',
        id: user._id.toString(),
        name: user.name || 'Teacher'
      },
      fullName,
      nickname: nickname || fullName.split(' ')[0],
      dateOfBirth: new Date(dateOfBirth),
      age: age || new Date().getFullYear() - new Date(dateOfBirth).getFullYear(),
      gender,
      classGrade,
      schoolName,
      schoolId: schoolId || `SCH${Date.now()}`,
      uniqueId: StudentKeyGenerator.generate(),
      languagePreference: languagePreference || 'English',
      learningModePreference: learningModePreference || ['Visual'],
      interestsOutsideClass: interestsOutsideClass || [],
      preferredCareerDomains: preferredCareerDomains || [],
      guardian: guardian || {
        name: 'Guardian Name',
        contactNumber: '0000000000',
        email: 'guardian@email.com'
      },
      location: location || 'Not specified',
      consentForDataUsage: consentForDataUsage || false,
      termsAndConditionsAccepted: termsAndConditionsAccepted || false,
      onboardingCompleted: false,
      totalModulesCompleted: 0,
      totalXpEarned: 0,
      learningStreak: 0,
      badgesEarned: 0,
      assessmentCompleted: false,
      diagnosticCompleted: false,
      diagnosticScore: 0
    });

    await newStudent.save();

    return NextResponse.json({
      message: 'Student added successfully',
      student: {
        id: newStudent._id.toString(),
        fullName: newStudent.fullName,
        uniqueId: newStudent.uniqueId,
        classGrade: newStudent.classGrade,
        schoolName: newStudent.schoolName,
        onboardingCompleted: newStudent.onboardingCompleted
      }
    });

  } catch (error) {
    console.error('Error adding student:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}