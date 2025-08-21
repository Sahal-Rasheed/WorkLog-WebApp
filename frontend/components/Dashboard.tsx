import React, { useState, useEffect } from 'react';
import { WorklogTable } from './WorklogTable';
import { ImportExport } from './ImportExport';
import { ProjectSelector } from './ProjectSelector';
import { MonthSelector } from './MonthSelector';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, TrendingUp, Calendar, Target } from 'lucide-react';
import type { Project, TimeEntry } from '../types';

interface DashboardProps {
  projects: Project[];
  timeEntries: TimeEntry[];
  userEmail: string;
  userName: string;
  onAddEntry: (entry: Omit<TimeEntry, 'entry_id' | 'created_at' | 'updated_at'>) => Promise<void>;
  onUpdateEntry: (entryId: string, updates: Partial<TimeEntry>) => Promise<void>;
  onDeleteEntry: (entryId: string) => Promise<void>;
  onBatchAddEntries: (entries: Omit<TimeEntry, 'entry_id' | 'created_at' | 'updated_at'>[]) => Promise<void>;
  onLoadTimeEntries: (projectId: string, month: string) => Promise<void>;
  loading: boolean;
}

export function Dashboard({
  projects,
  timeEntries,
  userEmail,
  userName,
  onAddEntry,
  onUpdateEntry,
  onDeleteEntry,
  onBatchAddEntries,
  onLoadTimeEntries,
  loading
}: DashboardProps) {
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  // Auto-select first project when projects load
  useEffect(() => {
    if (projects.length > 0 && !selectedProject) {
      const activeProjects = projects.filter(p => !p.is_archived);
      if (activeProjects.length > 0) {
        setSelectedProject(activeProjects[0]);
      }
    }
  }, [projects, selectedProject]);

  // Load time entries when project or month changes
  useEffect(() => {
    if (selectedProject) {
      onLoadTimeEntries(selectedProject.project_id, selectedMonth);
    }
  }, [selectedProject, selectedMonth, onLoadTimeEntries]);

  const filteredTimeEntries = timeEntries.filter(entry => {
    const entryDate = new Date(entry.date);
    const [year, month] = selectedMonth.split('-');
    return entryDate.getFullYear() === parseInt(year) && 
           entryDate.getMonth() === parseInt(month) - 1;
  });

  const userTimeEntries = filteredTimeEntries.filter(entry => entry.user_email === userEmail);
  const totalHours = userTimeEntries.reduce((sum, entry) => sum + entry.hours, 0);
  const totalDays = userTimeEntries.length;
  const avgHoursPerDay = totalDays > 0 ? totalHours / totalDays : 0;

  // Calculate this month vs last month
  const currentDate = new Date();
  const lastMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1);
  const lastMonthStr = `${lastMonth.getFullYear()}-${String(lastMonth.getMonth() + 1).padStart(2, '0')}`;
  
  const isCurrentMonth = selectedMonth === `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg p-6 text-white">
        <h2 className="text-2xl font-bold mb-2">Welcome back, {userName}!</h2>
        <p className="text-blue-100">
          Track your time, manage your projects, and stay productive.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Hours</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalHours.toFixed(1)}</div>
            <p className="text-xs text-muted-foreground">
              {isCurrentMonth ? 'This month' : 'Selected month'}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Days Logged</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalDays}</div>
            <p className="text-xs text-muted-foreground">
              Days with time entries
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg per Day</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgHoursPerDay.toFixed(1)}</div>
            <p className="text-xs text-muted-foreground">
              Hours per working day
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{projects.filter(p => !p.is_archived).length}</div>
            <p className="text-xs text-muted-foreground">
              Available projects
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Controls */}
      <Card>
        <CardHeader>
          <CardTitle>Time Tracking</CardTitle>
          <CardDescription>
            Select a project and month to view and manage your time entries
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 mb-6">
            <ProjectSelector
              projects={projects}
              selectedProject={selectedProject}
              onProjectSelect={setSelectedProject}
              loading={loading}
            />
            <MonthSelector
              selectedMonth={selectedMonth}
              onMonthSelect={setSelectedMonth}
            />
          </div>

          {/* Import/Export */}
          <ImportExport
            projects={projects}
            selectedProject={selectedProject}
            selectedMonth={selectedMonth}
            timeEntries={filteredTimeEntries}
            onImport={onBatchAddEntries}
            userEmail={userEmail}
          />
        </CardContent>
      </Card>

      {/* Main Table */}
      {selectedProject && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>{selectedProject.name} - {new Date(selectedMonth + '-01').toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}</span>
              <span className="text-lg font-normal text-muted-foreground">
                Total: {totalHours.toFixed(2)} hrs
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <WorklogTable
              timeEntries={userTimeEntries}
              selectedProject={selectedProject}
              selectedMonth={selectedMonth}
              userEmail={userEmail}
              onAddEntry={onAddEntry}
              onUpdateEntry={onUpdateEntry}
              onDeleteEntry={onDeleteEntry}
              loading={loading}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
