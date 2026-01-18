import jwt from 'jsonwebtoken';
import { NextRequest, NextResponse } from 'next/server';
import Student from '@/models/Student';
import Organization from '@/models/Organization';
import Teacher from '@/models/Teacher';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export interface DecodedToken {
  userId: string;
  email: string;
  fullName: string;
  role: string;
  mustChangePassword?: boolean;
  requiresOnboarding?: boolean;
  requiresAssessment?: boolean;
  [key: string]: unknown;
}

/**
 * Verify JWT token and extract user data
 */
export function verifyToken(token: string): DecodedToken | null {
  try {
    return jwt.verify(token, JWT_SECRET) as DecodedToken;
  } catch {
    return null;
  }
}

/**
 * Check if user must change password and block access if needed
 * Returns null if access is allowed, or a NextResponse with error if blocked
 */
export function checkMustChangePassword(
  request: NextRequest,
  decoded: DecodedToken,
  allowedPaths: string[] = ['/change-password', '/api/auth/change-password', '/api/auth/logout']
): NextResponse | null {
  if (decoded.mustChangePassword !== true) {
    return null; // Access allowed
  }

  const { pathname } = request.nextUrl;

  // Allow access to password change page and related endpoints only
  const isAllowedPath = allowedPaths.some(path => pathname.startsWith(path));
  if (isAllowedPath) {
    return null; // Access allowed
  }

  // Block access to all other endpoints
  return NextResponse.json(
    {
      error: 'Password change required',
      message: 'You must change your password before accessing this resource.',
      mustChangePassword: true
    },
    { status: 403 }
  );
}

/**
 * Check if a user (teacher/organization) can access a specific student
 * 
 * SECURITY: This function enforces strict access control:
 * - Teachers can only access students where student.teacherId matches the teacher's userId
 * - Organizations can only access students where student.organizationId matches the organization's _id
 * - Students can only access their own data (student.userId matches their userId)
 * - Super admins (platform_super_admin/admin) have unrestricted access
 * 
 * @param userId - The authenticated user's ID (User._id)
 * @param userRole - The authenticated user's role
 * @param studentId - The Student document _id (NOT userId)
 * @returns Promise<boolean> - true if authorized, false otherwise
 * 
 * NOTE: This function expects studentId to be the Student document _id.
 * If you have a userId instead, find the student first using Student.findOne({ userId })
 */
export async function canAccessStudent(
  userId: string,
  userRole: string,
  studentId: string
): Promise<boolean> {
  // Super admins have full access
  if (userRole === 'platform_super_admin' || userRole === 'admin') {
    return true;
  }

  // Find the student
  const student = await Student.findById(studentId);
  if (!student) {
    return false;
  }

  // Teachers can only access students assigned to them
  // CRITICAL: Check that student.teacherId matches the teacher's userId
  if (userRole === 'teacher') {
    return student.teacherId?.toString() === userId;
  }

  // Organizations can only access students created under them
  // CRITICAL: Verify organization exists and student belongs to it
  if (userRole === 'organization') {
    const organization = await Organization.findOne({ userId });
    if (!organization) {
      return false;
    }
    return student.organizationId?.toString() === organization._id.toString();
  }

  // Students can access their own data
  // CRITICAL: Verify student.userId matches the requesting user's userId
  if (userRole === 'student') {
    return student.userId?.toString() === userId;
  }

  return false;
}

/**
 * Check if a user (teacher/organization) can access students from a specific organization
 * Returns true if authorized, false otherwise
 * Super admins always have access
 */
export async function canAccessOrganizationStudents(
  userId: string,
  userRole: string,
  organizationId: string
): Promise<boolean> {
  // Super admins have full access
  if (userRole === 'platform_super_admin' || userRole === 'admin') {
    return true;
  }

  // Organizations can only access their own students
  if (userRole === 'organization') {
    const organization = await Organization.findOne({ userId });
    if (!organization) {
      return false;
    }
    return organization._id.toString() === organizationId;
  }

  // Teachers can access students from organizations they belong to
  if (userRole === 'teacher') {
    const teacher = await Teacher.findOne({ userId });
    if (!teacher || !teacher.schoolId) {
      return false;
    }
    // Check if teacher's school belongs to the organization
    // This requires checking Branch model, but for now we'll check if teacher has students
    // from this organization
    const studentCount = await Student.countDocuments({
      teacherId: userId,
      organizationId
    });
    return studentCount > 0;
  }

  return false;
}
