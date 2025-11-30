import { Suspense } from 'react';
import type { Project, Secret } from '../types';
import { ProjectList } from './project-list';
import { ProjectsListSkeleton } from './projects-list-skeleton';
import { SecretList } from './secret-list';
import { SecretsListSkeleton } from './secrets-list-skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';

interface DashboardTabsProps {
  secrets: Secret[];
  projects: Project[];
  refreshKey: number;
  onCopy: (text: string) => Promise<void>;
  onEditSecret: (id: number) => void;
  onDeleteSecret: (id: number) => void;
  onEditProject: (id: number) => void;
  onDeleteProject: (id: number) => void;
}

export function DashboardTabs({
  secrets,
  projects,
  refreshKey,
  onCopy,
  onEditSecret,
  onDeleteSecret,
  onEditProject,
  onDeleteProject,
}: DashboardTabsProps) {
  return (
    <Tabs defaultValue='secrets' className='mb-6'>
      <TabsList>
        <TabsTrigger value='secrets'>Segredos</TabsTrigger>
        <TabsTrigger value='projects'>Projetos</TabsTrigger>
      </TabsList>
      <TabsContent value='secrets'>
        <div className='space-y-4' key={`secrets-${refreshKey}`}>
          <Suspense fallback={<SecretsListSkeleton />}>
            <SecretList
              secrets={secrets}
              onCopy={onCopy}
              onEdit={onEditSecret}
              onDeleteClick={onDeleteSecret}
            />
          </Suspense>
        </div>
      </TabsContent>
      <TabsContent value='projects'>
        <div className='space-y-4' key={`projects-${refreshKey}`}>
          <Suspense fallback={<ProjectsListSkeleton />}>
            <ProjectList
              projects={projects}
              onEdit={onEditProject}
              onDeleteClick={onDeleteProject}
            />
          </Suspense>
        </div>
      </TabsContent>
    </Tabs>
  );
}
