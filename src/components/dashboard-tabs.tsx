import { Suspense } from 'react';
import { SecretsListSkeleton } from './secrets-list-skeleton';
import { SecretList } from './secret-list';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './ui/tabs';

interface DashboardTabsProps {
  refreshKey: number;
  onCopy: (text: string) => Promise<void>;
  onEdit: (id: number) => void;
  onDeleteClick: (id: number) => void;
}

export function DashboardTabs({
  refreshKey,
  onCopy,
  onEdit,
  onDeleteClick,
}: DashboardTabsProps) {
  return (
    <Tabs defaultValue='secrets' className='mb-6'>
      <TabsList>
        <TabsTrigger value='secrets'>Segredos</TabsTrigger>
        <TabsTrigger value='projects'>Projetos</TabsTrigger>
      </TabsList>
      <TabsContent value='secrets'>
        <div className='space-y-4' key={refreshKey}>
          <Suspense fallback={<SecretsListSkeleton />}>
            <SecretList
              onCopy={onCopy}
              onEdit={onEdit}
              onDeleteClick={onDeleteClick}
            />
          </Suspense>
        </div>
      </TabsContent>
      <TabsContent value='projects'>
        <p>oi projetos</p>
      </TabsContent>
    </Tabs>
  );
}
