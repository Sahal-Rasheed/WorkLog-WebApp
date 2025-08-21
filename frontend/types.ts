export interface User {
  id: string;
  email: string;
  name: string;
  avatar_url?: string;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  role?: string;
  status?: string;
}

export interface OrganizationMember {
  id: string;
  user_id: string;
  email: string;
  name: string;
  avatar_url?: string;
  role: 'admin' | 'member';
  status: 'active' | 'pending' | 'inactive';
  joined_at?: string;
  invited_by_name?: string;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  is_archived: boolean;
  created_by: string;
  created_at: string;
}

export interface TimeEntry {
  id: string;
  project_id: string;
  project_name: string;
  user_id: string;
  user_name: string;
  user_email: string;
  date: string;
  task: string;
  hours: number;
  created_at: string;
  updated_at: string;
}

export interface Invitation {
  id: string;
  organization_name: string;
  organization_slug: string;
  invited_by_name: string;
  token: string;
}

export interface OrganizationSuggestion {
  id: string;
  name: string;
  slug: string;
  member_count: number;
}

export interface AuthState {
  user: User | null;
  organizations: Organization[];
  currentOrganization: Organization | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}
