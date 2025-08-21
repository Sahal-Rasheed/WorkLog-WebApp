import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, TrendingUp, Calendar, Target } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '../../lib/supabase';
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
    if (currentOrganization && user) {
      loadData();
    }
  }, [currentOrganization, user]);

  const loadData = async () => {
    if (!currentOrganization || !user) return;

    setLoading(true);
    try {
      // Load projects
      const { data: projectsData, error: projectsError } = await supabase
        .from('projects')
        .select(`
          id,
          name,
          description,
          is_archived,
          created_at,
          user_profiles!projects_created_by_fkey (
            name
          )
        `)
        .eq('organization_id', currentOrganization.id)
        .order('is_archived', { ascending: true })
        .order('created_at', { ascending: false });

      if (projectsError) throw projectsError;

      const formattedProjects: Project[] = projectsData.map(project => ({
        id: project.id,
        name: project.name,
        description: project.description,
        is_archived: project.is_archived,
        created_by: project.user_profiles.name,
        created_at: project.created_at,
      }));

      // Load user's time entries
      const { data: timeEntriesData, error: timeEntriesError } = await supabase
        .from('time_entries')
        .select(`
          id,
          project_id,
          user_id,
          date,
          task,
          hours,
          created_at,
          updated_at,
          projects (
            name
          ),
          user_profiles (
            name,
            email
          )
        `)
        .eq('organization_id', currentOrganization.id)
        .eq('user_id', user.id)
        .order('date', { ascending: false })
        .order('created_at', { ascending: false });

      if (timeEntriesError) throw timeEntriesError;

      const formattedTimeEntries: TimeEntry[] = timeEntriesData.map(entry => ({
        id: entry.id,
        project_id: entry.project_id,
        project_name: entry.projects.name,
        user_id: entry.user_id,
        user_name: entry.user_profiles.name,
        user_email: entry.user_profiles.email,
        date: entry.date,
        task: entry.task,
        hours: entry.hours,
        created_at: entry.created_at,
        updated_at: entry.updated_at,
      }));

      setProjects(formattedProjects);
      setTimeEntries(formattedTimeEntries);
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
      const { data, error } = await supabase
        .from('time_entries')
        .insert({
          organization_id: currentOrganization.id,
          project_id: entry.project_id,
          user_id: user.id,
          date: entry.date,
          task: entry.task,
          hours: entry.hours,
        })
        .select(`
          id,
          project_id,
          user_id,
          date,
          task,
          hours,
          created_at,
          updated_at,
          projects (
            name
          ),
          user_profiles (
            name,
            email
          )
        `)
        .single();

      if (error) throw error;

      const newEntry: TimeEntry = {
        id: data.id,
        project_id: data.project_id,
        project_name: data.projects.name,
        user_id: data.user_id,
        user_name: data.user_profiles.name,
        user_email: data.user_profiles.email,
        date: data.date,
        task: data.task,
        hours: data.hours,
        created_at: data.created_at,
        updated_at: data.updated_at,
      };

      setTimeEntries(prev => [newEntry, ...prev]);

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
    try {
      const { error } = await supabase
        .from('time_entries')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', entryId);

      if (error) throw error;

      setTimeEntries(prev => prev.map(entry => 
        entry.id === entryId 
          ? { ...entry, ...updates, updated_at: new Date().toISOString() }
          : entry
      ));

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
    try {
      const { error } = await supabase
        .from('time_entries')
        .delete()
        .eq('id', entryId);

      if (error) throw error;

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
