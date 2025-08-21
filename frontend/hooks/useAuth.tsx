import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import type { Organization, AuthState } from '../types';

interface AuthContextType extends AuthState {
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (name: string, avatarUrl?: string) => Promise<void>;
  setCurrentOrganization: (org: Organization) => void;
  refreshOrganizations: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    organizations: [],
    currentOrganization: null,
    isAuthenticated: false,
    isLoading: true,
  });

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        handleUserSession(session.user);
      } else {
        setAuthState(prev => ({ ...prev, isLoading: false }));
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        await handleUserSession(session.user);
      } else {
        setAuthState({
          user: null,
          organizations: [],
          currentOrganization: null,
          isAuthenticated: false,
          isLoading: false,
        });
        localStorage.removeItem('worklog_current_organization');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleUserSession = async (user: User) => {
    try {
      // Get user profile
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      // Get user's organizations
      const { data: memberships } = await supabase
        .from('organization_members')
        .select(`
          role,
          status,
          organizations (
            id,
            name,
            slug
          )
        `)
        .eq('user_id', user.id)
        .eq('status', 'active');

      const organizations: Organization[] = memberships?.map(m => ({
        id: m.organizations.id,
        name: m.organizations.name,
        slug: m.organizations.slug,
        role: m.role,
        status: m.status,
      })) || [];

      // Get saved current organization
      const savedCurrentOrg = localStorage.getItem('worklog_current_organization');
      let currentOrganization = null;

      if (savedCurrentOrg) {
        const saved = JSON.parse(savedCurrentOrg);
        currentOrganization = organizations.find(org => org.id === saved.id) || null;
      }

      if (!currentOrganization && organizations.length === 1) {
        currentOrganization = organizations[0];
      }

      const userProfile = {
        id: user.id,
        email: user.email || '',
        name: profile?.name || user.email || '',
        avatar_url: profile?.avatar_url || user.user_metadata?.avatar_url,
      };

      setAuthState({
        user: userProfile,
        organizations,
        currentOrganization,
        isAuthenticated: true,
        isLoading: false,
      });

      if (currentOrganization) {
        localStorage.setItem('worklog_current_organization', JSON.stringify(currentOrganization));
      }
    } catch (error) {
      console.error('Error handling user session:', error);
      setAuthState(prev => ({ ...prev, isLoading: false }));
    }
  };

  const signUp = async (email: string, password: string, name: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
        },
      },
    });

    if (error) throw error;
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  const updateProfile = async (name: string, avatarUrl?: string) => {
    if (!authState.user) return;

    const { error } = await supabase
      .from('user_profiles')
      .update({
        name,
        avatar_url: avatarUrl,
        updated_at: new Date().toISOString(),
      })
      .eq('id', authState.user.id);

    if (error) throw error;

    setAuthState(prev => ({
      ...prev,
      user: prev.user ? { ...prev.user, name, avatar_url: avatarUrl } : null,
    }));
  };

  const setCurrentOrganization = (org: Organization) => {
    setAuthState(prev => ({ ...prev, currentOrganization: org }));
    localStorage.setItem('worklog_current_organization', JSON.stringify(org));
  };

  const refreshOrganizations = async () => {
    if (!authState.user) return;

    const { data: memberships } = await supabase
      .from('organization_members')
      .select(`
        role,
        status,
        organizations (
          id,
          name,
          slug
        )
      `)
      .eq('user_id', authState.user.id)
      .eq('status', 'active');

    const organizations: Organization[] = memberships?.map(m => ({
      id: m.organizations.id,
      name: m.organizations.name,
      slug: m.organizations.slug,
      role: m.role,
      status: m.status,
    })) || [];

    setAuthState(prev => ({ ...prev, organizations }));
  };

  const contextValue: AuthContextType = {
    ...authState,
    signUp,
    signIn,
    signOut,
    updateProfile,
    setCurrentOrganization,
    refreshOrganizations,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
