import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import type { Project } from '../types';

interface ProjectSelectorProps {
  projects: Project[];
  selectedProject: Project | null;
  onProjectSelect: (project: Project | null) => void;
  loading: boolean;
}

export function ProjectSelector({ projects, selectedProject, onProjectSelect, loading }: ProjectSelectorProps) {
  const activeProjects = projects.filter(p => !p.is_archived);

  const handleValueChange = (value: string) => {
    if (value === 'none') {
      onProjectSelect(null);
    } else {
      const project = projects.find(p => p.id === value);
      onProjectSelect(project || null);
    }
  };

  return (
    <div className="space-y-2">
      <Label htmlFor="project-select">Project</Label>
      <Select
        value={selectedProject?.id || 'none'}
        onValueChange={handleValueChange}
        disabled={loading}
      >
        <SelectTrigger className="w-48">
          <SelectValue placeholder="Select a project" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">Select a project</SelectItem>
          {activeProjects.map((project) => (
            <SelectItem key={project.id} value={project.id}>
              {project.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
