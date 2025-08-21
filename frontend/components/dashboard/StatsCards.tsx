import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, Calendar, TrendingUp, Target } from 'lucide-react';
import type { TimeEntry, Project } from '../../types';

interface StatsCardsProps {
  timeEntries: TimeEntry[];
  projects: Project[];
}

export function StatsCards({ timeEntries, projects }: StatsCardsProps) {
  // Calculate current month stats
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  const currentMonthEntries = timeEntries.filter(entry => {
    const entryDate = new Date(entry.date);
    return entryDate.getMonth() === currentMonth && entryDate.getFullYear() === currentYear;
  });

  const totalHours = currentMonthEntries.reduce((sum, entry) => sum + entry.hours, 0);
  const totalDays = new Set(currentMonthEntries.map(entry => entry.date)).size;
  const avgHoursPerDay = totalDays > 0 ? totalHours / totalDays : 0;
  const activeProjects = projects.filter(p => !p.is_archived).length;

  return (
    <div className="grid gap-4 md:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Hours</CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalHours.toFixed(1)}</div>
          <p className="text-xs text-muted-foreground">This month</p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Days Logged</CardTitle>
          <Calendar className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalDays}</div>
          <p className="text-xs text-muted-foreground">Days with time entries</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Avg per Day</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{avgHoursPerDay.toFixed(1)}</div>
          <p className="text-xs text-muted-foreground">Hours per working day</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
          <Target className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{activeProjects}</div>
          <p className="text-xs text-muted-foreground">Available projects</p>
        </CardContent>
      </Card>
    </div>
  );
}
