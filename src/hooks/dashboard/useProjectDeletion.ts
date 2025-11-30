import { useState } from 'react';
import { toast } from 'sonner';
import { deleteProject } from '../../functions/projects';

interface UseProjectDeletionProps {
  onRefresh: () => void;
}

export function useProjectDeletion({ onRefresh }: UseProjectDeletionProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null);

  function requestDelete(id: number) {
    setPendingDeleteId(id);
    setShowDeleteDialog(true);
  }

  async function confirmDelete() {
    if (pendingDeleteId === null) return;

    const id = pendingDeleteId;
    setShowDeleteDialog(false);

    try {
      await deleteProject(id);
      toast.success('Projeto deletado com sucesso!');
      onRefresh();
    } catch (e) {
      toast.error(`Erro ao deletar: ${e}`);
    } finally {
      setPendingDeleteId(null);
    }
  }

  function cancelDelete() {
    setPendingDeleteId(null);
    setShowDeleteDialog(false);
  }

  return {
    showDeleteDialog,
    setShowDeleteDialog,
    requestDelete,
    confirmDelete,
    cancelDelete,
  };
}
