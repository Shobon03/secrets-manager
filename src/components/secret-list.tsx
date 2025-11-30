import { Key, Plus } from 'lucide-react';
import type { Secret } from '../types';
import { SecretCard } from './secret-card';
import { Button } from './ui/button';
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from './ui/empty';

interface SecretListProps {
  secrets: Secret[];
  onCopy: (text: string) => Promise<void>;
  onEdit: (id: number) => void;
  onDeleteClick: (id: number) => void;
  onCreateClick?: () => void;
}

export function SecretList({
  secrets,
  onCopy,
  onEdit,
  onDeleteClick,
  onCreateClick,
}: SecretListProps) {
  if (secrets.length === 0) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyMedia>
            <Key />
          </EmptyMedia>
          <EmptyTitle>Nenhum Segredo Salvo</EmptyTitle>
          <EmptyDescription>
            Clique no botão <strong>Novo Segredo</strong> para cadastrá-lo.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent className='text-center text-muted-foreground'>
          <div className='flex gap-2'>
            <Button onClick={onCreateClick}>
              <Plus /> Novo Segredo
            </Button>
          </div>
        </EmptyContent>
      </Empty>
    );
  }

  return (
    <div className='flex flex-col gap-3'>
      {secrets.map((s: Secret) => (
        <SecretCard
          key={s.id}
          secret={s}
          onCopy={onCopy}
          onEdit={onEdit}
          onDelete={onDeleteClick}
          isDeleting={false}
        />
      ))}
    </div>
  );
}
