import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ProjectSelector } from './ProjectSelector';
import { MonthSelector } from './MonthSelector';
import { TimeEntriesTable } from './TimeEntriesTable';
import type { Project, TimeEntry } from '../../types';

interface TimeTrackingSectionProps {
  projects: Project[];
  timeEntries: TimeEntry[];
  onAddEntry: (entry: { project_id: string; date: string; task: string; hours: number }) => Promise<void>;
  onUpdateEntry: (entryId: string, updates: { date?: string; task?: string; hours?: number }) => Promise<void>;
  onDeleteEntry: (entryId: string) => Promise<void>;
  loading: boolean;
}

export function TimeTrackingSection({
  projects,
  timeEntries,
  onAddEntry,
  onUpdateEntry,
  onDeleteEntry,
  loading
}: TimeTrackingSectionProps) {
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  // Auto-select first active project
  React.useEffect(() => {
    if (projects.length > 0 && !selectedProject) {
      const activeProjects = projects.filter(p => !p.is_archived);
      if (activeProjects.length > 0) {
        setSelectedProject(activeProjects[0]);
      }
    }
  }, [projects, selectedProject]);

  // Filter time entries by selected project and month
  const filteredTimeEntries = timeEntries.filter(entry => {
    if (selectedProject && entry.project_id !== selectedProject.id) return false;
    
    const entryDate = new Date(entry.date);
    const [year, month] = selectedMonth.split('-');
    return entryDate.getFullYear() === parseInt(year) && 
           entryDate.getMonth() === parseInt(month) - 1;
  });

  const totalHours = filteredTimeEntries.reduce((sum, entry) => sum + entry.hours, 0);

  return (
    <div className="space-y-6">
      {/* Controls */}
      <Card>
        <CardHeader>
          <CardTitle>Time Tracking</CardTitle>
          <CardDescription>
            Select a project and month to view and manage your time entries
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
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
        </CardContent>
      </Card>

      {/* Time Entries Table */}
      {selectedProject && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>
                {selectedProject.name} - {new Date(selectedMonth + '-01').toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}
              </span>
              <span className="text-lg font-normal text-muted-foreground">
                Total: {totalHours.toFixed(2)} hrs
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <TimeEntriesTable
              timeEntries={filteredTimeEntries}
              selectedProject={selectedProject}
              selectedMonth={selectedMonth}
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
