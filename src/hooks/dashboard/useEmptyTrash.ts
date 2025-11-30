import { invoke } from '@tauri-apps/api/core';
import { useState } from 'react';
import { toast } from 'sonner';

interface UseEmptyTrashProps {
  onRefresh: () => void;
}

export function useEmptyTrash({ onRefresh }: UseEmptyTrashProps) {
  const [showEmptyDialog, setShowEmptyDialog] = useState(false);
  const [isEmptying, setIsEmptying] = useState(false);

  function requestEmpty() {
    setShowEmptyDialog(true);
  }

  async function confirmEmpty() {
    setShowEmptyDialog(false);
    setIsEmptying(true);

    try {
      await invoke<string>('empty_trash');
      toast.success('Lixeira esvaziada com sucesso!');
      onRefresh();
    } catch (e) {
      toast.error(`Erro ao esvaziar lixeira: ${e}`);
    } finally {
      setIsEmptying(false);
    }
  }

  function cancelEmpty() {
    setShowEmptyDialog(false);
  }

  return {
    showEmptyDialog,
    setShowEmptyDialog,
    isEmptying,
    requestEmpty,
    confirmEmpty,
    cancelEmpty,
  };
}
