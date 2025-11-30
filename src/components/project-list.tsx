import { Folder, FolderPlus } from 'lucide-react';
import type { Project } from '../types';
import { ProjectCard } from './project-card';
import { Button } from './ui/button';
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from './ui/empty';

interface ProjectListProps {
  projects: Project[];
  onEdit: (id: number) => void;
  onDeleteClick: (id: number) => void;
  onCreateClick?: () => void;
}

export function ProjectList({
  projects,
  onEdit,
  onDeleteClick,
  onCreateClick,
}: ProjectListProps) {
  if (projects.length === 0) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyMedia>
            <Folder />
          </EmptyMedia>
          <EmptyTitle>Nenhum Projeto Salvo</EmptyTitle>
          <EmptyDescription>
            Clique no botão <strong>Novo Projeto</strong> para criar um.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent className='text-center text-muted-foreground'>
          <div className='flex gap-2'>
            <Button onClick={onCreateClick}>
              <FolderPlus /> Novo Projeto
            </Button>
          </div>
        </EmptyContent>
      </Empty>
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
