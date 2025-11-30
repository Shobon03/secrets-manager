import { Folder, Pencil, Trash2 } from 'lucide-react';
import type { Project } from '../types';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from './ui/context-menu';

interface ProjectCardProps {
  project: Project;
  onEdit: (id: number) => void;
  onDelete: (id: number) => void;
}

export function ProjectCard({ project, onEdit, onDelete }: ProjectCardProps) {
  return (
    <ContextMenu>
      <ContextMenuTrigger>
        <Card className='group transition-all hover:border-primary/50 hover:shadow-md'>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <div className='flex items-center gap-3'>
              <div className='flex size-10 items-center justify-center rounded-full bg-secondary/50 text-primary group-hover:bg-primary/10 group-hover:text-primary transition-colors'>
                <Folder className='size-5' />
              </div>
              <div>
                <CardTitle className='text-base font-semibold leading-none'>
                  {project.name}
                </CardTitle>
                <p className='text-xs text-muted-foreground mt-1'>
                  Criado em{' '}
                  {new Date(
                    project.createdAt.replace(' ', 'T'),
                  ).toLocaleDateString('pt-BR')}
                </p>
              </div>
            </div>
            <div className='flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity'>
              <Button
                variant='outline'
                size='icon-sm'
                onClick={() => onEdit(project.id)}
                title='Editar'
              >
                <Pencil className='size-4' />
              </Button>
              <Button
                variant='destructive'
                size='icon-sm'
                onClick={() => onDelete(project.id)}
                title='Excluir'
              >
                <Trash2 className='size-4' />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <p className='text-sm text-muted-foreground line-clamp-2'>
              {project.description || 'Sem descrição.'}
            </p>
          </CardContent>
        </Card>
      </ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuItem onClick={() => onEdit(project.id)}>
          <Pencil className='mr-2 size-4' />
          Editar
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem
          onClick={() => onDelete(project.id)}
          className='text-destructive focus:text-destructive'
        >
          <Trash2 className='mr-2 size-4' />
          Excluir
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}
