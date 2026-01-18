import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import Organization from '@/models/Organization';
import Branch from '@/models/Branch';
import Teacher from '@/models/Teacher';
import Invitation from '@/models/Invitation';
import AuditLog from '@/models/AuditLog';

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
    
    if (!user || user.role !== 'organization') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const organization = await Organization.findOne({ userId: user._id.toString() });
    if (!organization) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    if (organization.approvalStatus !== 'approved') {
      return NextResponse.json({ error: 'Organization must be approved to invite teachers' }, { status: 403 });
    }

    const body = await request.json();
    const {
      email,
      name,
      branchId,
      subjectSpecialization,
      experienceYears,
      qualification,
      gradeLevels,
      subjects
    } = body;

    // Validate required fields
    if (!email || !name || !qualification) {
      return NextResponse.json({ error: 'Email, name, and qualification are required' }, { status: 400 });
    }

    // Check if user already exists and is active
    const existingActiveUser = await User.findOne({ 
      email: email.toLowerCase(),
      isActive: true 
    });
    if (existingActiveUser) {
      return NextResponse.json({ error: 'User with this email already exists' }, { status: 409 });
    }

    // Check if there's an inactive user with this email that we can reactivate
    const existingInactiveUser = await User.findOne({ 
      email: email.toLowerCase(),
      isActive: false 
    });

    // Check if invitation already exists
    const existingInvitation = await Invitation.findOne({ 
      email: email.toLowerCase(), 
      status: 'pending' 
    });
    if (existingInvitation) {
      return NextResponse.json({ error: 'Invitation already sent to this email' }, { status: 409 });
    }

    // Handle branch assignment (allow skipping)
    let branch = null;
    let schoolName = 'Not Assigned';
    
    if (branchId && branchId !== 'skip') {
      branch = await Branch.findById(branchId);
      if (!branch || branch.organizationId !== organization._id.toString()) {
        return NextResponse.json({ error: 'Branch not found or access denied' }, { status: 404 });
      }
      schoolName = branch.branchName;
    }

    // Generate secure password (same as student creation)
    const generateSecurePassword = () => {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
      let password = '';
      for (let i = 0; i < 12; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return password;
    };

    const securePassword = generateSecurePassword();

    let savedUser;
    
    try {
      if (existingInactiveUser) {
        // Reactivate existing inactive user
        savedUser = await User.findByIdAndUpdate(
          existingInactiveUser._id,
          {
            name,
            password: securePassword,
            role: 'teacher',
            isActive: true,
            profile: {
              subjectSpecialization,
              experienceYears: parseInt(experienceYears) || 0,
              gradeLevels,
              subjects
            },
            firstTimeLogin: true,
            mustChangePassword: true // Force password change on first login
          },
          { new: true, runValidators: true }
        );
      } else {
        // Create new user account directly (like student creation)
        const newUser = new User({
          name,
          email: email.toLowerCase(),
          password: securePassword,
          role: 'teacher',
          profile: {
            subjectSpecialization,
            experienceYears: parseInt(experienceYears) || 0,
            gradeLevels,
            subjects
          },
          firstTimeLogin: true, // Mark for password change on first login
          mustChangePassword: true // Force password change on first login
        });

        savedUser = await newUser.save();
      }
    } catch (error: any) {
      // If we get a duplicate key error, it means there's still an active user with this email
      if (error.code === 11000 && error.keyPattern?.email) {
        return NextResponse.json({ error: 'User with this email already exists' }, { status: 409 });
      }
      throw error; // Re-throw if it's a different error
    }

    // Check if there's an existing inactive teacher record
    const existingInactiveTeacher = await Teacher.findOne({
      email: email.toLowerCase(),
      organizationId: organization._id.toString(),
      isActive: false
    });

    let savedTeacher;
    
    try {
      if (existingInactiveTeacher) {
        // Reactivate existing inactive teacher
        savedTeacher = await Teacher.findByIdAndUpdate(
          existingInactiveTeacher._id,
          {
            userId: savedUser._id,
            schoolId: branchId === 'skip' ? null : branchId,
            fullName: name,
            subjectSpecialization,
            experienceYears: parseInt(experienceYears) || 0,
            qualification,
            schoolName: schoolName,
            isActive: true
          },
          { new: true, runValidators: true }
        );
      } else {
        // Create new teacher record
        const newTeacher = new Teacher({
          userId: savedUser._id,
          organizationId: organization._id.toString(),
          schoolId: branchId === 'skip' ? null : branchId, // Use schoolId to store branch ID
          fullName: name,
          email: email.toLowerCase(),
          subjectSpecialization,
          experienceYears: parseInt(experienceYears) || 0,
          qualification,
          schoolName: schoolName,
          isActive: true
        });

        savedTeacher = await newTeacher.save();
      }
    } catch (error: any) {
      // If we get a duplicate key error, clean up the user we just created
      if (error.code === 11000) {
        await User.findByIdAndDelete(savedUser._id);
        return NextResponse.json({ error: 'Teacher with this email already exists' }, { status: 409 });
      }
      throw error; // Re-throw if it's a different error
    }

    // Log audit
    const isReactivation = existingInactiveUser || existingInactiveTeacher;
    await AuditLog.create({
      userId: user._id.toString(),
      userRole: user.role,
      organizationId: organization._id.toString(),
      branchId: branchId === 'skip' ? null : branchId,
      action: isReactivation ? 'REACTIVATE_TEACHER' : 'CREATE_TEACHER',
      resource: 'Teacher',
      resourceId: savedTeacher._id.toString(),
      details: {
        newValues: { 
          email, 
          name, 
          schoolId: branchId === 'skip' ? 'No Branch Assigned' : branchId, 
          subjectSpecialization,
          qualification,
          schoolName
        },
        isReactivation: isReactivation
      },
      severity: 'medium'
    });

    const loginUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/login`;

    return NextResponse.json({
      message: isReactivation ? 'Teacher account reactivated successfully' : 'Teacher account created successfully',
      credentials: {
        id: savedUser._id.toString(),
        name: savedUser.name,
        email: savedUser.email,
        password: securePassword,
        loginUrl
      },
        teacher: {
          id: savedTeacher._id.toString(),
          userId: savedUser._id.toString(),
          fullName: savedUser.name,
          email: savedUser.email,
          subjectSpecialization,
          experienceYears: parseInt(experienceYears) || 0,
          qualification,
          schoolName: schoolName,
          schoolId: branchId === 'skip' ? null : branchId,
          isActive: true,
          createdAt: savedTeacher.createdAt.toISOString()
        }
    });

  } catch (error) {
    console.error('Error inviting teacher:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
