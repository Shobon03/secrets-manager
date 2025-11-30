import type { Secret } from '../types';
import { SecretCard } from './secret-card';
import { Card, CardContent } from './ui/card';

interface SecretListProps {
  secrets: Secret[];
  onCopy: (text: string) => Promise<void>;
  onEdit: (id: number) => void;
  onDeleteClick: (id: number) => void;
}

export function SecretList({
  secrets,
  onCopy,
  onEdit,
  onDeleteClick,
}: SecretListProps) {
  if (secrets.length === 0) {
    return (
      <Card>
        <CardContent className='py-12 text-center text-muted-foreground'>
          Nenhum segredo salvo ainda. Clique no botão + para adicionar seu
          primeiro login!
        </CardContent>
      </Card>
    );
  }

  return (
    <>
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
    </>
  );
}
