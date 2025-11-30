import { useState } from 'react';
import { toast } from 'sonner';
import { softDeleteSecret } from '../../functions/secrets';

interface UseSecretDeletionProps {
  onRefresh: () => void;
  onOptimisticDelete?: (id: number) => void;
}

export function useSecretDeletion({
  onRefresh,
  onOptimisticDelete,
}: UseSecretDeletionProps) {
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

    // Optimistic update
    onOptimisticDelete?.(id);

    try {
      await softDeleteSecret(id);
      toast.success('Segredo movido para a lixeira!');
      onRefresh();
    } catch (e) {
      toast.error(`Erro ao deletar: ${e}`);
      // Em um cenário ideal, faríamos rollback do optimistic update aqui se falhasse,
      // mas como o refresh vai acontecer de qualquer jeito ou o erro vai estourar,
      // a lista vai acabar voltando ao estado real no próximo fetch.
      onRefresh();
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
