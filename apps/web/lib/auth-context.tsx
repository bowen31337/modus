'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { createClient } from './supabase/client';

export type UserRole = 'admin' | 'moderator' | 'agent' | 'supervisor';

export interface AuthUser {
  id: string;
  email?: string;
  role: UserRole;
  display_name: string;
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Provides authentication context including user role information.
 * In demo mode, defaults to admin role for full access.
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    setLoading(true);
    try {
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session?.user) {
        // Fetch user profile from database
        const { data: profile } = await supabase
          .from('agents')
          .select('id, display_name, role')
          .eq('user_id', session.user.id)
          .single();

        if (profile) {
          setUser({
            id: profile.id,
            email: session.user.email,
            role: profile.role as UserRole,
            display_name: profile.display_name,
          });
        } else {
          // No profile found, create default one
          const newProfile = {
            user_id: session.user.id,
            display_name: session.user.email?.split('@')[0] || 'User',
            role: 'agent' as UserRole,
            status: 'online',
          };
          const { data: created } = await supabase
            .from('agents')
            .insert(newProfile)
            .select()
            .single();

          if (created) {
            setUser({
              id: created.id,
              email: session.user.email,
              role: created.role as UserRole,
              display_name: created.display_name,
            });
          }
        }
      } else {
        // Demo mode - check for demo session
        const isSupabaseConfigured =
          process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

        if (!isSupabaseConfigured) {
          // In demo mode, default to admin for full access
          setUser({
            id: 'demo-admin',
            role: 'admin',
            display_name: 'Demo Admin',
          });
        }
      }
    } catch (error) {
      console.error('Error loading user:', error);
      // In demo mode without Supabase, default to admin
      const isSupabaseConfigured =
        process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      if (!isSupabaseConfigured) {
        setUser({
          id: 'demo-admin',
          role: 'admin',
          display_name: 'Demo Admin',
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const refreshUser = async () => {
    await loadUser();
  };

  return (
    <AuthContext.Provider value={{ user, loading, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Hook to access the authentication context
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

/**
 * Hook to check if user has required role
 */
export function useRoleCheck() {
  const { user } = useAuth();

  const hasRole = (role: UserRole): boolean => {
    if (!user) return false;

    const roleHierarchy: Record<UserRole, number> = {
      admin: 4,
      supervisor: 3,
      moderator: 2,
      agent: 1,
    };

    return roleHierarchy[user.role] >= roleHierarchy[role];
  };

  const isAdmin = () => hasRole('admin');
  const isSupervisor = () => hasRole('supervisor');
  const isModerator = () => hasRole('moderator');
  const isAgent = () => hasRole('agent');

  return {
    user,
    hasRole,
    isAdmin,
    isSupervisor,
    isModerator,
    isAgent,
  };
}
