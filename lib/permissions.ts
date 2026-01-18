// Role-based permissions system for Taru platform

export type UserRole = 'student' | 'teacher' | 'parent' | 'organization' | 'admin' | 'platform_super_admin';

export interface Permission {
  resource: string;
  actions: string[];
}

export interface RolePermissions {
  role: UserRole;
  permissions: Permission[];
}

// Define permissions for each role
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  student: [
    { resource: 'student_profile', actions: ['read', 'update'] },
    { resource: 'modules', actions: ['read', 'complete'] },
    { resource: 'assessments', actions: ['read', 'submit'] },
    { resource: 'tests', actions: ['read', 'submit'] },
    { resource: 'test_submissions', actions: ['read', 'create'] },
    { resource: 'progress', actions: ['read'] },
    { resource: 'learning_paths', actions: ['read', 'save'] }
  ],
  
  teacher: [
    { resource: 'teacher_profile', actions: ['read', 'update'] },
    { resource: 'students', actions: ['read', 'create', 'update', 'bulk_import'] },
    { resource: 'student_progress', actions: ['read', 'export'] },
    { resource: 'assignments', actions: ['create', 'read', 'update', 'delete'] },
    { resource: 'tests', actions: ['create', 'read', 'update', 'delete', 'assign', 'evaluate'] },
    { resource: 'test_submissions', actions: ['read', 'evaluate'] },
    { resource: 'reports', actions: ['read', 'export'] }
  ],
  
  parent: [
    { resource: 'parent_profile', actions: ['read', 'update'] },
    { resource: 'child_progress', actions: ['read'] },
    { resource: 'child_teachers', actions: ['read'] },
    { resource: 'organization_info', actions: ['read'] },
    { resource: 'notifications', actions: ['read', 'update'] }
  ],
  
  organization: [
    { resource: 'organization_profile', actions: ['read', 'update'] },
    { resource: 'branches', actions: ['create', 'read', 'update', 'delete'] },
    { resource: 'teachers', actions: ['create', 'read', 'update', 'invite', 'manage'] },
    { resource: 'students', actions: ['read', 'export'] },
    { resource: 'tests', actions: ['create', 'read', 'update', 'delete', 'assign', 'evaluate'] },
    { resource: 'test_submissions', actions: ['read', 'evaluate'] },
    { resource: 'test_analytics', actions: ['read', 'export'] },
    { resource: 'reports', actions: ['read', 'export', 'generate'] },
    { resource: 'audit_logs', actions: ['read'] },
    { resource: 'invitations', actions: ['create', 'read', 'manage'] },
    { resource: 'organization_users', actions: ['read', 'create', 'update', 'delete'] }
  ],
  
  admin: [
    { resource: 'admin_profile', actions: ['read', 'update'] },
    { resource: 'users', actions: ['read', 'create', 'update', 'delete'] },
    { resource: 'content', actions: ['create', 'read', 'update', 'delete'] },
    { resource: 'modules', actions: ['create', 'read', 'update', 'delete'] },
    { resource: 'system_settings', actions: ['read', 'update'] }
  ],
  
  platform_super_admin: [
    { resource: 'psa_profile', actions: ['read', 'update'] },
    { resource: 'organizations', actions: ['read', 'approve', 'reject', 'suspend'] },
    { resource: 'audit_logs', actions: ['read', 'export', 'monitor'] },
    { resource: 'system_override', actions: ['execute'] },
    { resource: 'platform_settings', actions: ['read', 'update'] },
    { resource: 'all_data', actions: ['read', 'export'] }
  ]
};

// Check if a user has permission to perform an action on a resource
export function hasPermission(
  userRole: UserRole,
  resource: string,
  action: string
): boolean {
  const rolePermissions = ROLE_PERMISSIONS[userRole];
  if (!rolePermissions) return false;

  const permission = rolePermissions.find(p => p.resource === resource);
  if (!permission) return false;

  return permission.actions.includes(action);
}

// Get all permissions for a role
export function getRolePermissions(role: UserRole): Permission[] {
  return ROLE_PERMISSIONS[role] || [];
}

// Check if user can access a specific API endpoint
export function canAccessEndpoint(
  userRole: UserRole,
  endpoint: string,
  method: string
): boolean {
  // Define endpoint-to-permission mapping
  const endpointPermissions: Record<string, { resource: string; action: string }> = {
    // Student endpoints
    'GET /api/student/profile': { resource: 'student_profile', action: 'read' },
    'PUT /api/student/profile': { resource: 'student_profile', action: 'update' },
    'GET /api/modules': { resource: 'modules', action: 'read' },
    'POST /api/modules/complete': { resource: 'modules', action: 'complete' },
    'GET /api/assessments': { resource: 'assessments', action: 'read' },
    'POST /api/assessments/submit': { resource: 'assessments', action: 'submit' },
    'GET /api/progress': { resource: 'progress', action: 'read' },
    
    // Teacher endpoints
    'GET /api/teacher/profile': { resource: 'teacher_profile', action: 'read' },
    'PUT /api/teacher/profile': { resource: 'teacher_profile', action: 'update' },
    'GET /api/teacher/students': { resource: 'students', action: 'read' },
    'POST /api/teacher/add-student': { resource: 'students', action: 'create' },
    'POST /api/teacher/bulk-import-students': { resource: 'students', action: 'bulk_import' },
    'GET /api/teacher/student-progress': { resource: 'student_progress', action: 'read' },
    'GET /api/teacher/reports': { resource: 'reports', action: 'read' },
    
    // Parent endpoints
    'GET /api/parent/profile': { resource: 'parent_profile', action: 'read' },
    'PUT /api/parent/update-profile': { resource: 'parent_profile', action: 'update' },
    'GET /api/parent/child-details': { resource: 'child_progress', action: 'read' },
    'GET /api/parent/child-teachers': { resource: 'child_teachers', action: 'read' },
    'GET /api/parent/organization-info': { resource: 'organization_info', action: 'read' },
    
    // Organization endpoints
    'GET /api/organization/profile': { resource: 'organization_profile', action: 'read' },
    'PUT /api/organization/profile': { resource: 'organization_profile', action: 'update' },
    'GET /api/organization/branches': { resource: 'branches', action: 'read' },
    'POST /api/organization/branches': { resource: 'branches', action: 'create' },
    'PUT /api/organization/branches': { resource: 'branches', action: 'update' },
    'DELETE /api/organization/branches': { resource: 'branches', action: 'delete' },
    'GET /api/organization/teachers': { resource: 'teachers', action: 'read' },
    'POST /api/organization/invite-teacher': { resource: 'teachers', action: 'invite' },
    'GET /api/organization/reports': { resource: 'reports', action: 'read' },
    'GET /api/organization/audit-logs': { resource: 'audit_logs', action: 'read' },
    
    // Platform Super Admin endpoints
    'GET /api/platform-super-admin/organizations': { resource: 'organizations', action: 'read' },
    'POST /api/platform-super-admin/organizations/approve': { resource: 'organizations', action: 'approve' },
    'POST /api/platform-super-admin/organizations/reject': { resource: 'organizations', action: 'reject' },
    'GET /api/platform-super-admin/audit-logs': { resource: 'audit_logs', action: 'read' },
    'GET /api/platform-super-admin/dashboard-stats': { resource: 'all_data', action: 'read' }
  };

  const key = `${method} ${endpoint}`;
  const permission = endpointPermissions[key];
  
  if (!permission) {
    // If endpoint is not defined, allow access (for backward compatibility)
    return true;
  }

  return hasPermission(userRole, permission.resource, permission.action);
}

// Get dashboard route for a role
export function getDashboardRoute(role: UserRole): string {
  const routes: Record<UserRole, string> = {
    student: '/dashboard/student',
    teacher: '/dashboard/teacher',
    parent: '/dashboard/parent',
    organization: '/dashboard/organization-admin',
    admin: '/dashboard/admin',
    platform_super_admin: '/dashboard/platform-super-admin'
  };

  return routes[role] || '/dashboard/student';
}

// Check if a role can access a specific dashboard
export function canAccessDashboard(role: UserRole, dashboardPath: string): boolean {
  const allowedRoutes = [
    '/dashboard/student',
    '/dashboard/teacher', 
    '/dashboard/parent',
    '/dashboard/organization-admin',
    '/dashboard/admin',
    '/dashboard/platform-super-admin'
  ];

  if (!allowedRoutes.includes(dashboardPath)) {
    return false;
  }

  const expectedRoute = getDashboardRoute(role);
  return dashboardPath === expectedRoute;
}

// Organization-level access control functions
export function canAccessOrganizationData(
  userRole: UserRole,
  userOrganizationId: string | undefined,
  targetOrganizationId: string | undefined
): boolean {
  // Platform Super Admin can access all organizations
  if (userRole === 'platform_super_admin') {
    return true;
  }

  // Organization admins can only access their own organization's data
  if (userRole === 'organization') {
    return userOrganizationId === targetOrganizationId;
  }

  // Teachers and students can only access their own organization's data
  if (userRole === 'teacher' || userRole === 'student') {
    return userOrganizationId === targetOrganizationId;
  }

  // Parents can access their child's organization data
  if (userRole === 'parent') {
    return userOrganizationId === targetOrganizationId;
  }

  // Regular admins can access all data (for backward compatibility)
  if (userRole === 'admin') {
    return true;
  }

  return false;
}

// Check if user can manage users within their organization
export function canManageOrganizationUsers(
  userRole: UserRole,
  userOrganizationId: string | undefined,
  targetUserOrganizationId: string | undefined
): boolean {
  // Platform Super Admin can manage all users
  if (userRole === 'platform_super_admin') {
    return true;
  }

  // Organization admins can manage users within their organization
  if (userRole === 'organization') {
    return userOrganizationId === targetUserOrganizationId;
  }

  // Regular admins can manage all users (for backward compatibility)
  if (userRole === 'admin') {
    return true;
  }

  return false;
}

// Check if user can create users within their organization
export function canCreateOrganizationUsers(
  userRole: UserRole,
  userOrganizationId: string | undefined,
  targetOrganizationId: string | undefined
): boolean {
  // Platform Super Admin can create users in any organization
  if (userRole === 'platform_super_admin') {
    return true;
  }

  // Organization admins can create users within their organization
  if (userRole === 'organization') {
    return userOrganizationId === targetOrganizationId;
  }

  // Regular admins can create users in any organization (for backward compatibility)
  if (userRole === 'admin') {
    return true;
  }

  return false;
}
