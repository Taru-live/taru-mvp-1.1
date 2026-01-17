import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import connectDB from '@/lib/mongodb';
import Student from '@/models/Student';
import User from '@/models/User';
import Organization from '@/models/Organization';
import AuditLog from '@/models/AuditLog';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

interface DecodedToken {
  userId: string;
  role: string;
  [key: string]: unknown;
}

// DELETE endpoint - Permanently delete a student
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ studentId: string }> }
) {
  try {
    await connectDB();

    // Get JWT token from cookies
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Verify JWT token
    let decoded: DecodedToken;
    try {
      decoded = jwt.verify(token, JWT_SECRET) as DecodedToken;
    } catch (jwtError) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
    }

    // Get authenticated user
    const user = await User.findById(decoded.userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if user is organization admin or super admin
    const isSuperAdmin = user.role === 'platform_super_admin' || user.role === 'admin';
    const isOrganizationAdmin = user.role === 'organization';

    if (!isSuperAdmin && !isOrganizationAdmin) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const { studentId } = await params;

    // Find the student
    const student = await Student.findById(studentId);
    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    // If organization admin, verify the student belongs to their organization
    if (isOrganizationAdmin && !isSuperAdmin) {
      const organization = await Organization.findOne({ userId: user._id.toString() });
      if (!organization) {
        return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
      }

      if (student.organizationId?.toString() !== organization._id.toString()) {
        return NextResponse.json(
          { error: 'You can only delete students from your own organization' },
          { status: 403 }
        );
      }
    }

    // Find and delete the associated user account
    const studentUser = await User.findById(student.userId);
    const studentUserId = student.userId;
    const studentFullName = student.fullName;

    // Delete student record
    await Student.findByIdAndDelete(studentId);

    // Delete user account
    if (studentUser) {
      await User.findByIdAndDelete(studentUserId);
    }

    // Log audit
    await AuditLog.create({
      userId: user._id.toString(),
      userRole: user.role,
      organizationId: student.organizationId?.toString(),
      action: 'DELETE_STUDENT',
      resource: 'Student',
      resourceId: studentId,
      details: {
        deletedStudent: { name: studentFullName, userId: studentUserId }
      },
      severity: 'high'
    });

    return NextResponse.json({
      message: 'Student deleted successfully',
      deletedStudentId: studentId
    });
  } catch (error) {
    console.error('Error deleting student:', error);
    return NextResponse.json(
      { error: 'Failed to delete student' },
      { status: 500 }
    );
  }
}

// PATCH endpoint - Update student status (enable/disable) or other fields
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ studentId: string }> }
) {
  try {
    await connectDB();

    // Get JWT token from cookies
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Verify JWT token
    let decoded: DecodedToken;
    try {
      decoded = jwt.verify(token, JWT_SECRET) as DecodedToken;
    } catch (jwtError) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
    }

    // Get authenticated user
    const user = await User.findById(decoded.userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if user is organization admin or super admin
    const isSuperAdmin = user.role === 'platform_super_admin' || user.role === 'admin';
    const isOrganizationAdmin = user.role === 'organization';

    if (!isSuperAdmin && !isOrganizationAdmin) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const { studentId } = await params;
    const body = await request.json();
    const { isActive } = body;

    // Find the student
    const student = await Student.findById(studentId);
    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    // If organization admin, verify the student belongs to their organization
    if (isOrganizationAdmin && !isSuperAdmin) {
      const organization = await Organization.findOne({ userId: user._id.toString() });
      if (!organization) {
        return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
      }

      if (student.organizationId?.toString() !== organization._id.toString()) {
        return NextResponse.json(
          { error: 'You can only manage students from your own organization' },
          { status: 403 }
        );
      }
    }

    // Find the associated user account
    const studentUser = await User.findById(student.userId);
    if (!studentUser) {
      return NextResponse.json({ error: 'Student user account not found' }, { status: 404 });
    }

    // Update isActive status if provided
    if (typeof isActive === 'boolean') {
      studentUser.isActive = isActive;
      await studentUser.save();

      // Log audit
      await AuditLog.create({
        userId: user._id.toString(),
        userRole: user.role,
        organizationId: student.organizationId?.toString(),
        action: isActive ? 'ENABLE_STUDENT' : 'DISABLE_STUDENT',
        resource: 'Student',
        resourceId: studentId,
        details: {
          studentName: student.fullName,
          previousStatus: !isActive,
          newStatus: isActive
        },
        severity: 'medium'
      });
    }

    // Get updated user for response
    const updatedUser = await User.findById(student.userId);

    return NextResponse.json({
      message: isActive !== undefined 
        ? `Student ${isActive ? 'enabled' : 'disabled'} successfully`
        : 'Student updated successfully',
      student: {
        id: student._id.toString(),
        fullName: student.fullName,
        email: updatedUser?.email,
        isActive: updatedUser?.isActive,
        uniqueId: student.uniqueId
      }
    });
  } catch (error) {
    console.error('Error updating student:', error);
    return NextResponse.json(
      { error: 'Failed to update student' },
      { status: 500 }
    );
  }
}
