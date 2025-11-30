import { open, save } from '@tauri-apps/plugin-dialog';
import { useState } from 'react';
import { toast } from 'sonner';
import { exportVault, importVault } from '../../functions/vault';

interface UseVaultBackupProps {
  onRefresh: () => void;
}

export function useVaultBackup({ onRefresh }: UseVaultBackupProps) {
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [dialogPassword, setDialogPassword] = useState('');
  const [pendingImportFilePath, setPendingImportFilePath] = useState<
    string | null
  >(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  async function handleExport() {
    setShowExportDialog(true);
  }

  async function confirmExport() {
    if (!dialogPassword) return;

    setIsExporting(true);
    try {
      const filePath = await save({
        filters: [
          {
            name: 'Backup Criptografado',
            extensions: ['enc', 'json'],
          },
        ],
        defaultPath: 'meus_segredos_backup.enc',
      });

      if (!filePath) {
        setIsExporting(false);
        return;
      }

      await exportVault(filePath, dialogPassword);
      toast.success('Backup exportado com sucesso!');
      setShowExportDialog(false);
      setDialogPassword('');
    } catch (e) {
      console.error(e);
      toast.error(`Erro ao exportar: ${e}`);
    } finally {
      setIsExporting(false);
    }
  }

  async function handleImport() {
    setIsImporting(true);
    try {
      const filePath = await open({
        multiple: false,
        filters: [
          {
            name: 'Backup Criptografado',
            extensions: ['enc', 'json'],
          },
        ],
      });

      if (!filePath) {
        setIsImporting(false);
        return;
      }

      setPendingImportFilePath(filePath as string);
      setShowImportDialog(true);
    } catch (e) {
      console.error(e);
      toast.error(`Erro ao selecionar arquivo: ${e}`);
      setIsImporting(false);
    }
  }

  async function confirmImport() {
    if (!dialogPassword || !pendingImportFilePath) return;

    try {
      const msg = await importVault(pendingImportFilePath, dialogPassword);
      toast.success(msg);
      onRefresh();
      setShowImportDialog(false);
      setDialogPassword('');
      setPendingImportFilePath(null);
    } catch (e) {
      console.error(e);
      toast.error(`Erro ao importar: ${e}`);
    } finally {
      setIsImporting(false);
    }
  }

  function cancelDialogs() {
    setShowExportDialog(false);
    setShowImportDialog(false);
    setDialogPassword('');
    setPendingImportFilePath(null);
  }

  return {
    showExportDialog,
    showImportDialog,
    dialogPassword,
    setDialogPassword,
    isExporting,
    isImporting,
    handleExport,
    confirmExport,
    handleImport,
    confirmImport,
    cancelDialogs,
    setShowExportDialog,
    setShowImportDialog,
  };
}
