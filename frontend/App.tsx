import React, { useState } from 'react';
import { Toaster } from '@/components/ui/toaster';
import { useToast } from '@/components/ui/use-toast';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { LoginForm } from './components/auth/LoginForm';
import { OrganizationSelector } from './components/auth/OrganizationSelector';
import { Header } from './components/layout/Header';
import { Dashboard } from './components/dashboard/Dashboard';
import { AdminPanel } from './components/admin/AdminPanel';
import { Clock } from 'lucide-react';
import { APP_CONFIG } from './config';
import type { Organization } from './types';

function AppContent() {
  const { user, organizations, currentOrganization, isAuthenticated, isLoading, login, setCurrentOrganization, refreshOrganizations } = useAuth();
  const [currentPage, setCurrentPage] = useState('dashboard');
  const { toast } = useToast();

  const handleLogin = async (email: string, name: string) => {
    try {
      await login(email, name);
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  };

  const handleOrganizationSelected = (org: Organization) => {
    setCurrentOrganization(org);
  };

  const handleOrganizationCreated = async (org: Organization) => {
    setCurrentOrganization(org);
    await refreshOrganizations();
    toast({
      title: "Welcome!",
      description: `${org.name} has been created successfully. You can now start tracking time.`,
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="bg-blue-600 p-3 rounded-full">
                <Clock className="w-8 h-8 text-white" />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{APP_CONFIG.name}</h1>
            <p className="text-gray-600">{APP_CONFIG.description}</p>
          </div>
          <LoginForm onSubmit={handleLogin} />
        </div>
      </div>
    );
  }

  if (!currentOrganization) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <OrganizationSelector
          userEmail={user.email}
          userId={user.id}
          organizations={organizations}
          onOrganizationSelected={handleOrganizationSelected}
          onOrganizationCreated={handleOrganizationCreated}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header onNavigate={setCurrentPage} currentPage={currentPage} />
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {currentPage === 'dashboard' ? <Dashboard /> : <AdminPanel />}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
      <Toaster />
    </AuthProvider>
  );
}
