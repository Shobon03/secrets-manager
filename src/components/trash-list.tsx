import { Folder, Key, RefreshCcw, Trash2 } from 'lucide-react';
import { useState } from 'react';
import type { Project, Secret } from '../types';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from './ui/alert-dialog';
import { Button } from './ui/button';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from './ui/empty';

export type TrashItem = (Secret | Project) & { type: 'secret' | 'project' };

interface TrashListProps {
  items: TrashItem[];
  onRestore: (item: TrashItem) => void;
  onDeletePermanently: (item: TrashItem) => void;
}

export function TrashList({
  items,
  onRestore,
  onDeletePermanently,
}: TrashListProps) {
  const [showRestoreDialog, setShowRestoreDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedItem, setSelectedItem] = useState<TrashItem | null>(null);

  const handleRestoreClick = (item: TrashItem) => {
    setSelectedItem(item);
    setShowRestoreDialog(true);
  };

  const confirmRestore = () => {
    if (selectedItem) {
      onRestore(selectedItem);
      setShowRestoreDialog(false);
      setSelectedItem(null);
    }
  };

  const handleDeleteClick = (item: TrashItem) => {
    setSelectedItem(item);
    setShowDeleteDialog(true);
  };

  const confirmDelete = () => {
    if (selectedItem) {
      onDeletePermanently(selectedItem);
      setShowDeleteDialog(false);
      setSelectedItem(null);
    }
  };

  if (items.length === 0) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyMedia>
            <Trash2 />
          </EmptyMedia>
          <EmptyTitle>Lixeira Vazia</EmptyTitle>
          <EmptyDescription>
            Não há itens deletados. Itens movidos para a lixeira aparecerão
            aqui.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <div className='space-y-2'>
      {items.map((item) => (
        <div
          key={`${item.type}-${item.id}`}
          className='flex items-center justify-between gap-3 rounded-lg border bg-card p-3 transition-colors hover:bg-accent/50'
        >
          <div className='flex items-center gap-3 min-w-0 flex-1'>
            {item.type === 'secret' ? (
              <Key className='size-5 shrink-0 text-muted-foreground' />
            ) : (
              <Folder className='size-5 shrink-0 text-muted-foreground' />
            )}
            <div className='min-w-0 flex-1'>
              <p className='truncate text-sm font-medium'>
                {'title' in item ? item.title : item.name}
              </p>
              <p className='text-xs text-muted-foreground'>
                Deletado em:{' '}
                {item.deletedAt
                  ? new Date(item.deletedAt).toLocaleDateString()
                  : 'Desconhecido'}
              </p>
            </div>
          </div>
          <div className='flex items-center gap-1 shrink-0'>
            <Button
              type='button'
              variant='outline'
              size='icon-sm'
              onClick={() => handleRestoreClick(item)}
              title='Restaurar'
            >
              <RefreshCcw className='size-4' />
            </Button>
            <Button
              type='button'
              variant='destructive'
              size='icon-sm'
              onClick={() => handleDeleteClick(item)}
              title='Excluir permanentemente'
            >
              <Trash2 className='size-4' />
            </Button>
          </div>
        </div>
      ))}

      {/* Dialog de Restaurar */}
      <AlertDialog open={showRestoreDialog} onOpenChange={setShowRestoreDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Restaurar Item</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja restaurar{' '}
              <strong>
                {selectedItem &&
                  ('title' in selectedItem
                    ? selectedItem.title
                    : selectedItem.name)}
              </strong>
              ? O item voltará para a listagem ativa.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowRestoreDialog(false)}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction onClick={confirmRestore}>
              Restaurar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog de Excluir Permanentemente */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Permanentemente</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir permanentemente{' '}
              <strong>
                {selectedItem &&
                  ('title' in selectedItem
                    ? selectedItem.title
                    : selectedItem.name)}
              </strong>
              ? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowDeleteDialog(false)}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
            >
              Excluir Permanentemente
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
