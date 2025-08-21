import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { api } from '../utils/api';
import type { User, Organization, AuthState } from '../types';

interface AuthContextType extends AuthState {
  login: (email: string, name: string, avatarUrl?: string) => Promise<void>;
  logout: () => void;
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
    // Load auth state from localStorage on mount
    const savedUser = localStorage.getItem('worklog_user');
    const savedOrganizations = localStorage.getItem('worklog_organizations');
    const savedCurrentOrg = localStorage.getItem('worklog_current_organization');

    if (savedUser) {
      const user = JSON.parse(savedUser);
      const organizations = savedOrganizations ? JSON.parse(savedOrganizations) : [];
      const currentOrganization = savedCurrentOrg ? JSON.parse(savedCurrentOrg) : null;

      setAuthState({
        user,
        organizations,
        currentOrganization,
        isAuthenticated: true,
        isLoading: false,
      });
    } else {
      setAuthState(prev => ({ ...prev, isLoading: false }));
    }
  }, []);

  const login = async (email: string, name: string, avatarUrl?: string) => {
    try {
      const response = await api.post<{
        user: User;
        organizations: Organization[];
        needs_organization_selection: boolean;
      }>('/auth/login', {
        email,
        name,
        avatar_url: avatarUrl,
      });

      const newAuthState = {
        user: response.user,
        organizations: response.organizations,
        currentOrganization: response.organizations.length === 1 ? response.organizations[0] : null,
        isAuthenticated: true,
        isLoading: false,
      };

      setAuthState(newAuthState);

      // Save to localStorage
      localStorage.setItem('worklog_user', JSON.stringify(response.user));
      localStorage.setItem('worklog_organizations', JSON.stringify(response.organizations));
      if (newAuthState.currentOrganization) {
        localStorage.setItem('worklog_current_organization', JSON.stringify(newAuthState.currentOrganization));
      }
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  };

  const logout = () => {
    setAuthState({
      user: null,
      organizations: [],
      currentOrganization: null,
      isAuthenticated: false,
      isLoading: false,
    });

    // Clear localStorage
    localStorage.removeItem('worklog_user');
    localStorage.removeItem('worklog_organizations');
    localStorage.removeItem('worklog_current_organization');
  };

  const setCurrentOrganization = (org: Organization) => {
    setAuthState(prev => ({ ...prev, currentOrganization: org }));
    localStorage.setItem('worklog_current_organization', JSON.stringify(org));
  };

  const refreshOrganizations = async () => {
    if (!authState.user) return;

    try {
      const response = await api.post<{
        user: User;
        organizations: Organization[];
        needs_organization_selection: boolean;
      }>('/auth/login', {
        email: authState.user.email,
        name: authState.user.name,
        avatar_url: authState.user.avatar_url,
      });

      setAuthState(prev => ({
        ...prev,
        organizations: response.organizations,
      }));

      localStorage.setItem('worklog_organizations', JSON.stringify(response.organizations));
    } catch (error) {
      console.error('Failed to refresh organizations:', error);
    }
  };

  const contextValue: AuthContextType = {
    ...authState,
    login,
    logout,
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
