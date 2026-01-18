import { redirect } from 'next/navigation';
import { createServerSideClient } from './supabase/server';
import { hasDemoSession, isDemoMode } from './demo-session';

export type UserRole = 'admin' | 'moderator' | 'agent' | 'supervisor';

/**
 * Role hierarchy - higher numbers have more permissions
 */
const ROLE_HIERARCHY: Record<UserRole, number> = {
  admin: 4,
  supervisor: 3,
  moderator: 2,
  agent: 1,
};

/**
 * Check if a user has at least the required role
 */
export function hasRole(userRole: UserRole, requiredRole: UserRole): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
}

/**
 * Server-side utility to get current user's role
 * Returns 'admin' in demo mode for full access
 */
export async function getCurrentUserRole(): Promise<UserRole> {
  // Demo mode - return admin for full access
  if (isDemoMode()) {
    const hasSession = await hasDemoSession();
    return hasSession ? 'admin' : 'agent';
  }

  try {
    const supabase = await createServerSideClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return 'agent'; // Default role for unauthenticated users
    }

    const { data: profile } = await supabase
      .from('agents')
      .select('role')
      .eq('user_id', user.id)
      .single();

    return (profile?.role as UserRole) || 'agent';
  } catch (error) {
    console.error('Error getting user role:', error);
    return 'agent';
  }
}

/**
 * Server-side utility to get current user info
 */
export async function getCurrentUser() {
  // Demo mode
  if (isDemoMode()) {
    const hasSession = await hasDemoSession();
    if (!hasSession) {
      return null;
    }
    return {
      id: 'demo-admin',
      role: 'admin' as UserRole,
      display_name: 'Demo Admin',
    };
  }

  try {
    const supabase = await createServerSideClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return null;
    }

    const { data: profile } = await supabase
      .from('agents')
      .select('id, display_name, role')
      .eq('user_id', user.id)
      .single();

    if (!profile) {
      return null;
    }

    return {
      id: profile.id,
      role: profile.role as UserRole,
      display_name: profile.display_name,
    };
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
}

/**
 * Require a minimum role for server actions and pages
 * Redirects to login or dashboard if user doesn't have required role
 */
export async function requireRole(requiredRole: UserRole, redirectPath = '/dashboard'): Promise<void> {
  const userRole = await getCurrentUserRole();

  if (!hasRole(userRole, requiredRole)) {
    redirect(redirectPath);
  }
}

/**
 * Middleware-style role check for API routes and server components
 * Returns true if user has required role, false otherwise
 */
export async function checkRole(requiredRole: UserRole): Promise<boolean> {
  const userRole = await getCurrentUserRole();
  return hasRole(userRole, requiredRole);
}

/**
 * Get all roles that the current user can manage
 * Admin can manage all roles, Supervisor can manage Moderator/Agent, etc.
 */
export async function getManageableRoles(): Promise<UserRole[]> {
  const userRole = await getCurrentUserRole();

  switch (userRole) {
    case 'admin':
      return ['admin', 'supervisor', 'moderator', 'agent'];
    case 'supervisor':
      return ['moderator', 'agent'];
    case 'moderator':
      return ['agent'];
    default:
      return [];
  }
}
