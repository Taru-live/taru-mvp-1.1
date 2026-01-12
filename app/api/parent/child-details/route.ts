import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import Student from '@/models/Student';
import Teacher from '@/models/Teacher';
import Organization from '@/models/Organization';
import Branch from '@/models/Branch';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

interface DecodedToken {
  userId: string;
  role: string;
  [key: string]: unknown;
}

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as DecodedToken;
    const user = await User.findById(decoded.userId);
    
    if (!user || user.role !== 'parent') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Get linked student
    const linkedStudentId = user.profile?.linkedStudentId;
    if (!linkedStudentId) {
      return NextResponse.json({ error: 'No linked student found' }, { status: 404 });
    }

    // linkedStudentId is a userId, not a student _id
    const student = await Student.findOne({ userId: linkedStudentId });
    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    // Get student user data for email (email is stored in User model, not Student model)
    const studentUser = await User.findById(linkedStudentId);
    if (!studentUser) {
      return NextResponse.json({ error: 'Student user data not found' }, { status: 404 });
    }

    // Get student's teachers
    const teachers = await Teacher.find({ 
      schoolId: student.schoolId,
      isActive: true 
    }).catch(() => []); // Return empty array if query fails

    // Get organization and branch details
    let organization = null;
    let branch = null;

    if (student.schoolId) {
      try {
        branch = await Branch.findById(student.schoolId);
        if (branch && branch.organizationId) {
          organization = await Organization.findById(branch.organizationId);
        }
      } catch (error) {
        console.error('Error fetching organization/branch:', error);
        // Continue without organization/branch data
      }
    }

    return NextResponse.json({
      student: {
        id: student._id,
        fullName: student.fullName || 'N/A',
        email: studentUser.email || 'N/A',
        classGrade: student.classGrade || 'N/A',
        schoolName: student.schoolName || 'N/A',
        uniqueId: student.uniqueId || 'N/A',
        onboardingCompleted: student.onboardingCompleted || false,
        isActive: student.isActive !== undefined ? student.isActive : true
      },
      teachers: teachers.map(teacher => ({
        id: teacher._id,
        fullName: teacher.fullName || 'N/A',
        email: teacher.email || 'N/A',
        subjectSpecialization: teacher.subjectSpecialization || 'N/A',
        experienceYears: teacher.experienceYears || 0,
        phoneNumber: teacher.phoneNumber || 'N/A'
      })),
      organization: organization ? {
        id: organization._id,
        organizationName: organization.organizationName,
        organizationType: organization.organizationType,
        industry: organization.industry,
        address: organization.address,
        city: organization.city,
        state: organization.state,
        phoneNumber: organization.phoneNumber,
        website: organization.website
      } : null,
      branch: branch ? {
        id: branch._id,
        branchName: branch.branchName,
        branchCode: branch.branchCode,
        address: branch.address,
        city: branch.city,
        state: branch.state,
        phoneNumber: branch.phoneNumber,
        email: branch.email,
        principalName: branch.principalName,
        principalEmail: branch.principalEmail,
        principalPhone: branch.principalPhone
      } : null
    });

  } catch (error) {
    console.error('Error fetching child details:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('Error details:', {
      message: errorMessage,
      stack: error instanceof Error ? error.stack : undefined
    });
    return NextResponse.json({ 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
    }, { status: 500 });
  }
}
