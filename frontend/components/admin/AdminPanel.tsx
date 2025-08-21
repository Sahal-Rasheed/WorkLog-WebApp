import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Building2, Users, FolderPlus, CheckCircle, Clock, BarChart3 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { api } from '../../utils/api';
import { useAuth } from '../../hooks/useAuth';
import { ProjectManagement } from './ProjectManagement';
import { UserManagement } from './UserManagement';
import { AdminStats } from './AdminStats';
import type { Project, OrganizationMember, TimeEntry } from '../../types';

export function AdminPanel() {
  const { currentOrganization } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [members, setMembers] = useState<OrganizationMember[]>([]);
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (currentOrganization) {
      loadData();
    }
  }, [currentOrganization]);

  const loadData = async () => {
    if (!currentOrganization) return;

    setLoading(true);
    try {
      const [projectsResponse, membersResponse, timeEntriesResponse] = await Promise.all([
        api.get<{ projects: Project[] }>(`/organizations/${currentOrganization.id}/projects`),
        api.get<{ members: OrganizationMember[] }>(`/organizations/${currentOrganization.id}/members`),
        api.get<{ time_entries: TimeEntry[] }>(`/organizations/${currentOrganization.id}/time-entries`)
      ]);

      setProjects(projectsResponse.projects);
      setMembers(membersResponse.members);
      setTimeEntries(timeEntriesResponse.time_entries);
    } catch (error) {
      console.error('Failed to load admin data:', error);
      toast({
        title: "Error",
        description: "Failed to load admin data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleProjectCreated = (project: Project) => {
    setProjects(prev => [...prev, project]);
  };

  const handleMemberApproved = (memberId: string) => {
    setMembers(prev => prev.map(member => 
      member.id === memberId 
        ? { ...member, status: 'active' as const, joined_at: new Date().toISOString() }
        : member
    ));
  };

  const activeProjects = projects.filter(p => !p.is_archived);
  const archivedProjects = projects.filter(p => p.is_archived);
  const activeMembers = members.filter(m => m.status === 'active');
  const pendingMembers = members.filter(m => m.status === 'pending');

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-lg p-6 text-white">
          <div className="animate-pulse">
            <div className="h-8 bg-purple-500 rounded w-1/3 mb-2"></div>
            <div className="h-4 bg-purple-400 rounded w-1/2"></div>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/3"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-lg p-6 text-white">
        <div className="flex items-center gap-3 mb-2">
          <Building2 className="w-8 h-8" />
          <div>
            <h2 className="text-2xl font-bold">Organization Admin</h2>
            <p className="text-purple-100">{currentOrganization?.name}</p>
          </div>
        </div>
        <p className="text-purple-100">
          Manage projects, users, and organization settings
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
            <FolderPlus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeProjects.length}</div>
            <p className="text-xs text-muted-foreground">
              {archivedProjects.length} archived
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Team Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeMembers.length}</div>
            <p className="text-xs text-muted-foreground">
              {pendingMembers.length} pending approval
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {timeEntries
                .filter(entry => {
                  const entryDate = new Date(entry.date);
                  const now = new Date();
                  return entryDate.getMonth() === now.getMonth() && 
                         entryDate.getFullYear() === now.getFullYear();
                })
                .reduce((sum, entry) => sum + entry.hours, 0)
                .toFixed(1)}
            </div>
            <p className="text-xs text-muted-foreground">
              Total hours logged
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Status</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">Active</div>
            <p className="text-xs text-muted-foreground">
              System operational
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Management Tabs */}
      <Tabs defaultValue="projects" className="w-full">
        <TabsList>
          <TabsTrigger value="projects">Projects</TabsTrigger>
          <TabsTrigger value="users">
            Users
            {pendingMembers.length > 0 && (
              <span className="ml-2 bg-red-500 text-white text-xs rounded-full px-2 py-0.5">
                {pendingMembers.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="stats">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="projects">
          <ProjectManagement
            projects={projects}
            onProjectCreated={handleProjectCreated}
            loading={loading}
          />
        </TabsContent>

        <TabsContent value="users">
          <UserManagement
            members={members}
            onMemberApproved={handleMemberApproved}
            onDataRefresh={loadData}
            loading={loading}
          />
        </TabsContent>

        <TabsContent value="stats">
          <AdminStats
            projects={projects}
            members={activeMembers}
            timeEntries={timeEntries}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
