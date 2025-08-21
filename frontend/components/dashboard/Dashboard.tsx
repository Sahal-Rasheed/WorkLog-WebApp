import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, TrendingUp, Calendar, Target } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { api } from '../../utils/api';
import { useAuth } from '../../hooks/useAuth';
import { TimeTrackingSection } from './TimeTrackingSection';
import { StatsCards } from './StatsCards';
import type { Project, TimeEntry } from '../../types';

export function Dashboard() {
  const { user, currentOrganization } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
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
      const [projectsResponse, timeEntriesResponse] = await Promise.all([
        api.get<{ projects: Project[] }>(`/organizations/${currentOrganization.id}/projects`),
        api.get<{ time_entries: TimeEntry[] }>(`/organizations/${currentOrganization.id}/time-entries?user_id=${user?.id}`)
      ]);

      setProjects(projectsResponse.projects);
      setTimeEntries(timeEntriesResponse.time_entries);
    } catch (error) {
      console.error('Failed to load data:', error);
      toast({
        title: "Error",
        description: "Failed to load dashboard data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddTimeEntry = async (entry: {
    project_id: string;
    date: string;
    task: string;
    hours: number;
  }) => {
    if (!currentOrganization || !user) return;

    try {
      const response = await api.post<{ time_entry: any }>(`/organizations/${currentOrganization.id}/time-entries`, {
        ...entry,
        user_id: user.id,
      });

      // Reload time entries to get the full data with project and user info
      const timeEntriesResponse = await api.get<{ time_entries: TimeEntry[] }>(
        `/organizations/${currentOrganization.id}/time-entries?user_id=${user.id}`
      );
      setTimeEntries(timeEntriesResponse.time_entries);

      toast({
        title: "Success",
        description: "Time entry added successfully",
      });
    } catch (error) {
      console.error('Failed to add time entry:', error);
      toast({
        title: "Error",
        description: "Failed to add time entry",
        variant: "destructive",
      });
    }
  };

  const handleUpdateTimeEntry = async (entryId: string, updates: {
    date?: string;
    task?: string;
    hours?: number;
  }) => {
    if (!currentOrganization) return;

    try {
      await api.put(`/organizations/${currentOrganization.id}/time-entries/${entryId}`, updates);

      // Reload time entries
      const timeEntriesResponse = await api.get<{ time_entries: TimeEntry[] }>(
        `/organizations/${currentOrganization.id}/time-entries?user_id=${user?.id}`
      );
      setTimeEntries(timeEntriesResponse.time_entries);

      toast({
        title: "Success",
        description: "Time entry updated successfully",
      });
    } catch (error) {
      console.error('Failed to update time entry:', error);
      toast({
        title: "Error",
        description: "Failed to update time entry",
        variant: "destructive",
      });
    }
  };

  const handleDeleteTimeEntry = async (entryId: string) => {
    if (!currentOrganization) return;

    try {
      await api.delete(`/organizations/${currentOrganization.id}/time-entries/${entryId}`);

      setTimeEntries(prev => prev.filter(entry => entry.id !== entryId));

      toast({
        title: "Success",
        description: "Time entry deleted successfully",
      });
    } catch (error) {
      console.error('Failed to delete time entry:', error);
      toast({
        title: "Error",
        description: "Failed to delete time entry",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg p-6 text-white">
          <div className="animate-pulse">
            <div className="h-8 bg-blue-500 rounded w-1/3 mb-2"></div>
            <div className="h-4 bg-blue-400 rounded w-1/2"></div>
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
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg p-6 text-white">
        <h2 className="text-2xl font-bold mb-2">Welcome back, {user?.name}!</h2>
        <p className="text-blue-100">
          Track your time, manage your projects, and stay productive.
        </p>
      </div>

      {/* Stats Cards */}
      <StatsCards timeEntries={timeEntries} projects={projects} />

      {/* Time Tracking Section */}
      <TimeTrackingSection
        projects={projects}
        timeEntries={timeEntries}
        onAddEntry={handleAddTimeEntry}
        onUpdateEntry={handleUpdateTimeEntry}
        onDeleteEntry={handleDeleteTimeEntry}
        loading={loading}
      />
    </div>
  );
}
