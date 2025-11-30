import { use } from 'react';
import { loadProjectsPromise } from '../functions/projects';
import type { Project } from '../types';
import { ProjectCard } from './project-card';
import { Card, CardContent } from './ui/card';

interface ProjectListProps {
  onEdit: (id: number) => void;
  onDeleteClick: (id: number) => void;
}

export function ProjectList({ onEdit, onDeleteClick }: ProjectListProps) {
  const projects = use(loadProjectsPromise());

  if (projects.length === 0) {
    return (
      <Card>
        <CardContent className='py-12 text-center text-muted-foreground'>
          Nenhum projeto criado ainda.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3'>
      {projects.map((p: Project) => (
        <ProjectCard
          key={p.id}
          project={p}
          onEdit={onEdit}
          onDelete={onDeleteClick}
        />
      ))}
    </div>
  );
}
