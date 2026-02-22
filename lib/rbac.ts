import type { UserRole } from '@/lib/audit';

const ROLE_HIERARCHY: Record<UserRole, number> = {
  admin: 3,
  doctor: 2,
  nurse: 1,
};

export function hasRole(userRole: string | undefined, allowed: UserRole | UserRole[]): boolean {
  if (!userRole) return false;
  const roles = Array.isArray(allowed) ? allowed : [allowed];
  return roles.includes(userRole as UserRole);
}

export function canAccessSensitiveAction(role: string | undefined): boolean {
  // Only doctor and admin can generate documents, finalize, delete patients, etc.
  return hasRole(role, ['doctor', 'admin']);
}

export function canManageUsers(role: string | undefined): boolean {
  return hasRole(role, ['admin']);
}

export function canManageTemplates(role: string | undefined): boolean {
  return hasRole(role, ['doctor', 'admin']);
}
