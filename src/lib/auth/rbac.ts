import { getDb } from '@/lib/db/mongodb';
import { getCurrentUser } from './session';
import { DepartmentDoc, StartupDoc, SessionUser } from '@/types';

export interface AuthContext {
  user: SessionUser;
}

export async function requireAuth(): Promise<AuthContext> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error('UNAUTHORIZED');
  }
  return { user };
}

export async function requireRole(allowedRoles: Array<'founder' | 'investor' | 'developer'>): Promise<AuthContext> {
  const { user } = await requireAuth();
  if (!allowedRoles.includes(user.role)) {
    throw new Error('FORBIDDEN_ROLE');
  }
  return { user };
}

/**
 * Enforces department boundary:
 * 1. Startup founders can access all departments belonging to their startup.
 * 2. Developers can ONLY access departments if they are in department.memberIds.
 * 3. Investors cannot access department internal execution data.
 */
export async function authorizeDepartmentAccess(departmentId: string): Promise<{ user: SessionUser; department: DepartmentDoc; startup: StartupDoc }> {
  const { user } = await requireAuth();
  const db = await getDb();
  
  const deptCol = db.collection<DepartmentDoc>('departments');
  const department = await deptCol.findOne({ _id: departmentId });
  if (!department) {
    throw new Error('DEPARTMENT_NOT_FOUND');
  }

  const startupCol = db.collection<StartupDoc>('startups');
  const startup = await startupCol.findOne({ _id: department.startupId });
  if (!startup) {
    throw new Error('STARTUP_NOT_FOUND');
  }

  // If user is the startup founder -> full access
  if (startup.founderId === user.userId) {
    return { user, department, startup };
  }

  // If developer -> must be member of this specific department
  if (user.role === 'developer') {
    if (department.memberIds.includes(user.userId)) {
      return { user, department, startup };
    }
    throw new Error('DEPARTMENT_ACCESS_DENIED');
  }

  // Investors cannot access department internals
  throw new Error('DEPARTMENT_ACCESS_DENIED');
}

/**
 * Checks if user owns the startup
 */
export async function authorizeStartupOwner(startupId: string): Promise<{ user: SessionUser; startup: StartupDoc }> {
  const { user } = await requireAuth();
  const db = await getDb();
  const startupCol = db.collection<StartupDoc>('startups');
  const startup = await startupCol.findOne({ _id: startupId });
  if (!startup) {
    throw new Error('STARTUP_NOT_FOUND');
  }

  if (startup.founderId !== user.userId) {
    throw new Error('NOT_STARTUP_OWNER');
  }

  return { user, startup };
}
