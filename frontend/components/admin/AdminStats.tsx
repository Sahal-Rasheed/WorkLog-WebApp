import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { BarChart3, Users, Clock, TrendingUp } from 'lucide-react';
import type { Project, OrganizationMember, TimeEntry } from '../../types';

interface AdminStatsProps {
  projects: Project[];
  members: OrganizationMember[];
  timeEntries: TimeEntry[];
}

export function AdminStats({ projects, members, timeEntries }: AdminStatsProps) {
  // Calculate stats
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  const currentMonthEntries = timeEntries.filter(entry => {
    const entryDate = new Date(entry.date);
    return entryDate.getMonth() === currentMonth && entryDate.getFullYear() === currentYear;
  });

  const totalHoursThisMonth = currentMonthEntries.reduce((sum, entry) => sum + entry.hours, 0);

  // User stats
  const userStats = members.map(member => {
    const userEntries = currentMonthEntries.filter(entry => entry.user_id === member.user_id);
    const totalHours = userEntries.reduce((sum, entry) => sum + entry.hours, 0);
    const daysWorked = new Set(userEntries.map(entry => entry.date)).size;
    
    return {
      name: member.name,
      email: member.email,
      totalHours,
      daysWorked,
      avgHoursPerDay: daysWorked > 0 ? totalHours / daysWorked : 0,
    };
  }).sort((a, b) => b.totalHours - a.totalHours);

  // Project stats
  const projectStats = projects.map(project => {
    const projectEntries = currentMonthEntries.filter(entry => entry.project_id === project.id);
    const totalHours = projectEntries.reduce((sum, entry) => sum + entry.hours, 0);
    const uniqueUsers = new Set(projectEntries.map(entry => entry.user_id)).size;
    
    return {
      name: project.name,
      totalHours,
      uniqueUsers,
      percentage: totalHoursThisMonth > 0 ? (totalHours / totalHoursThisMonth) * 100 : 0,
    };
  }).sort((a, b) => b.totalHours - a.totalHours);

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Hours (This Month)</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalHoursThisMonth.toFixed(1)}</div>
            <p className="text-xs text-muted-foreground">
              Across all projects and team members
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Team Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userStats.filter(u => u.totalHours > 0).length}</div>
            <p className="text-xs text-muted-foreground">
              Members who logged time this month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Hours/Day</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {userStats.length > 0 
                ? (userStats.reduce((sum, u) => sum + u.avgHoursPerDay, 0) / userStats.filter(u => u.totalHours > 0).length || 0).toFixed(1)
                : '0.0'
              }
            </div>
            <p className="text-xs text-muted-foreground">
              Average across active members
            </p>
          </CardContent>
        </Card>
      </div>

      {/* User Performance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Team Performance (This Month)
          </CardTitle>
          <CardDescription>
            Time tracking statistics for each team member
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Total Hours</TableHead>
                <TableHead>Days Worked</TableHead>
                <TableHead>Avg Hours/Day</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {userStats.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-gray-500 py-8">
                    No time entries found for this month
                  </TableCell>
                </TableRow>
              ) : (
                userStats.map((user) => (
                  <TableRow key={user.email}>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{user.totalHours.toFixed(1)}</TableCell>
                    <TableCell>{user.daysWorked}</TableCell>
                    <TableCell>{user.avgHoursPerDay.toFixed(1)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Project Performance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Project Performance (This Month)
          </CardTitle>
          <CardDescription>
            Time allocation across different projects
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Project</TableHead>
                <TableHead>Total Hours</TableHead>
                <TableHead>Team Members</TableHead>
                <TableHead>Percentage</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {projectStats.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-gray-500 py-8">
                    No time entries found for this month
                  </TableCell>
                </TableRow>
              ) : (
                projectStats.map((project) => (
                  <TableRow key={project.name}>
                    <TableCell className="font-medium">{project.name}</TableCell>
                    <TableCell>{project.totalHours.toFixed(1)}</TableCell>
                    <TableCell>{project.uniqueUsers}</TableCell>
                    <TableCell>{project.percentage.toFixed(1)}%</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
