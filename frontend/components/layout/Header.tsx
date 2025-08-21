import React from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Clock, Settings, LogOut, Building2, ChevronDown } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { APP_CONFIG } from '../../config';

interface HeaderProps {
  onNavigate: (page: string) => void;
  currentPage: string;
}

export function Header({ onNavigate, currentPage }: HeaderProps) {
  const { user, currentOrganization, organizations, logout, setCurrentOrganization } = useAuth();

  const isAdmin = currentOrganization?.role === 'admin';

  return (
    <header className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo and Organization */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="bg-blue-600 p-2 rounded-lg">
                <Clock className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">{APP_CONFIG.name}</h1>
                {currentOrganization && (
                  <p className="text-sm text-gray-600">{currentOrganization.name}</p>
                )}
              </div>
            </div>

            {/* Organization Switcher */}
            {organizations.length > 1 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Building2 className="w-4 h-4 mr-2" />
                    Switch Org
                    <ChevronDown className="w-4 h-4 ml-2" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  {organizations.map((org) => (
                    <DropdownMenuItem
                      key={org.id}
                      onClick={() => setCurrentOrganization(org)}
                      className={currentOrganization?.id === org.id ? 'bg-blue-50' : ''}
                    >
                      <div>
                        <div className="font-medium">{org.name}</div>
                        <div className="text-sm text-gray-600">{org.role}</div>
                      </div>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          {/* Navigation and User Menu */}
          <div className="flex items-center space-x-4">
            {/* Navigation */}
            <nav className="flex space-x-1">
              <Button
                variant={currentPage === 'dashboard' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => onNavigate('dashboard')}
              >
                <Clock className="w-4 h-4 mr-2" />
                Dashboard
              </Button>
              {isAdmin && (
                <Button
                  variant={currentPage === 'admin' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => onNavigate('admin')}
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Admin
                </Button>
              )}
            </nav>

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user?.avatar_url} alt={user?.name} />
                    <AvatarFallback>
                      {user?.name?.split(' ').map(n => n[0]).join('').toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <div className="flex items-center justify-start gap-2 p-2">
                  <div className="flex flex-col space-y-1 leading-none">
                    <p className="font-medium">{user?.name}</p>
                    <p className="w-[200px] truncate text-sm text-muted-foreground">
                      {user?.email}
                    </p>
                  </div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
}
