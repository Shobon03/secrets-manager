import { open, save } from '@tauri-apps/plugin-dialog';
import { startTransition, useActionState, useRef, useState } from 'react';
import { toast } from 'sonner';
import type { AttachmentsManagerRef } from '../components/attachments-manager';
import { DashboardHeader } from '../components/dashboard-header';
import { DashboardTabs } from '../components/dashboard-tabs';
import { PasswordDialog } from '../components/password-dialog';
import { SecretForm } from '../components/secret-form';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../components/ui/alert-dialog';
import { copyToClipboard } from '../functions/clipboard';
import {
  createSecret,
  updateSecret,
  deleteSecret,
  invalidateSecretsCache,
  getSecretsFromCache,
} from '../functions/secrets';
import { exportVault, importVault } from '../functions/vault';

export function Dashboard() {
  const [form, setForm] = useState({ title: '', username: '', password: '' });

  const [isCreateSecret, setIsCreateSecret] = useState(false);

  const [isEditSecret, setIsEditSecret] = useState(false);
  const [editSecretId, setEditSecretId] = useState<number | null>(null);

  const attachmentsManagerRef = useRef<AttachmentsManagerRef>(null);

  // Estados para os dialogs
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null);
  const [dialogPassword, setDialogPassword] = useState('');
  const [pendingImportFilePath, setPendingImportFilePath] = useState<
    string | null
  >(null);

  // Estados de loading (apenas para operações que não são forms)
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  // Trigger para forçar re-render após mutations
  const [refreshKey, setRefreshKey] = useState(0);

  function refreshSecrets() {
    invalidateSecretsCache();
    startTransition(() => {
      setRefreshKey((prev) => prev + 1);
    });
  }

  async function handleAddAction(
    _prevState: null,
    formData: FormData,
  ): Promise<null> {
    const title = formData.get('title') as string;
    const username = formData.get('username') as string;
    const password = formData.get('password') as string;

    try {
      const result = await createSecret(title, username, password);

      // Salva anexos pendentes se houver
      if (attachmentsManagerRef.current?.hasPendingAttachments()) {
        await attachmentsManagerRef.current.savePendingAttachments(result.id);
      }

      setForm({ title: '', username: '', password: '' });
      setEditSecretId(null);
      setIsCreateSecret(false);
      refreshSecrets();
      toast.success('Segredo criado com sucesso!');
    } catch (e) {
      toast.error(`Erro ao salvar: ${e}`);
    }
    return null;
  }

  async function handleEditAction(
    _prevState: null,
    formData: FormData,
  ): Promise<null> {
    const title = formData.get('title') as string;
    const username = formData.get('username') as string;
    const password = formData.get('password') as string;

    try {
      if (!editSecretId) return null;

      await updateSecret(editSecretId, title, username, password);

      // Salva anexos pendentes se houver
      if (attachmentsManagerRef.current?.hasPendingAttachments()) {
        await attachmentsManagerRef.current.savePendingAttachments(
          editSecretId,
        );
      }

      setForm({ title: '', username: '', password: '' });
      refreshSecrets();
      setEditSecretId(null);
      setIsEditSecret(false);
      toast.success('Segredo atualizado com sucesso!');
    } catch (e) {
      toast.error(`Erro ao editar: ${e}`);
    }
    return null;
  }

  const [, formAddAction, isPendingAdd] = useActionState(handleAddAction, null);
  const [, formEditAction, isPendingEdit] = useActionState(
    handleEditAction,
    null,
  );

  function handleDeleteClick(id: number) {
    setPendingDeleteId(id);
    setShowDeleteDialog(true);
  }

  async function confirmDelete() {
    if (pendingDeleteId === null) return;

    const id = pendingDeleteId;
    setShowDeleteDialog(false);

    try {
      await deleteSecret(id);
      setForm({ title: '', username: '', password: '' });
      refreshSecrets();
      toast.success('Segredo deletado com sucesso!');
    } catch (e) {
      toast.error(`Erro ao deletar: ${e}`);
    } finally {
      setPendingDeleteId(null);
    }
  }

  async function handleCopy(text: string) {
    try {
      await copyToClipboard(text);
      toast.success('Copiado para a área de transferência!');
    } catch (e) {
      toast.error(`Erro ao copiar: ${e}`);
    }
  }

  async function handleExport() {
    // Primeiro pede a senha
    setShowExportDialog(true);
  }

  async function confirmExport() {
    if (!dialogPassword) return;

    setIsExporting(true);
    try {
      // Depois de ter a senha, escolhe o caminho do arquivo
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

      // Exporta com a senha e o caminho
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
      // Primeiro escolhe o arquivo
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

      // Depois pede a senha
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
      // Importa com a senha e o caminho
      const msg = await importVault(pendingImportFilePath, dialogPassword);

      toast.success(msg);
      refreshSecrets();
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

  function handleFormChange(field: string, value: string) {
    setForm({ ...form, [field]: value });
  }

  function handleCancel() {
    setIsCreateSecret(false);
    setIsEditSecret(false);
    setEditSecretId(null);
    setForm({ title: '', username: '', password: '' });
  }

  function handleEditSecret(id: number) {
    // Busca do cache síncrono
    const secrets = getSecretsFromCache();

    if (!secrets) {
      toast.error('Dados não carregados ainda');
      return;
    }

    const editSecret = secrets.find((s) => s.id === id);

    if (editSecret) {
      setForm({
        title: editSecret.title,
        username: editSecret.username,
        password: editSecret.password ?? '',
      });
      setIsEditSecret(true);
      setEditSecretId(id);
    }
  }

  return (
    <div className='absolute top-10 bottom-0 left-0 right-0 overflow-y-scroll'>
      <div className='container mx-auto p-6 pb-20 max-w-6xl'>
        <DashboardHeader
          onImport={handleImport}
          onExport={handleExport}
          onCreateSecret={() => setIsCreateSecret(true)}
          isImporting={isImporting}
          isExporting={isExporting}
          isPendingAdd={isPendingAdd}
          isPendingEdit={isPendingEdit}
        />

        <DashboardTabs
          refreshKey={refreshKey}
          onCopy={handleCopy}
          onEdit={handleEditSecret}
          onDeleteClick={handleDeleteClick}
        />

        <SecretForm
          open={isCreateSecret || isEditSecret}
          form={form}
          isEditMode={isEditSecret}
          editSecretId={editSecretId}
          attachmentsManagerRef={attachmentsManagerRef}
          onFormChange={handleFormChange}
          formAction={isEditSecret ? formEditAction : formAddAction}
          onCancel={handleCancel}
          isPending={isEditSecret ? isPendingEdit : isPendingAdd}
        />

        {/* Dialog para Exportar */}
        <PasswordDialog
          open={showExportDialog}
          title='Confirme sua senha'
          description='Digite sua senha mestra para exportar o backup do cofre.'
          password={dialogPassword}
          onPasswordChange={setDialogPassword}
          onConfirm={confirmExport}
          onCancel={() => {
            setShowExportDialog(false);
            setDialogPassword('');
          }}
          confirmLabel='Exportar'
          isLoading={isExporting}
        />

        {/* Dialog para Importar */}
        <PasswordDialog
          open={showImportDialog}
          title='Confirme sua senha'
          description='Digite sua senha mestra para importar o backup do cofre.'
          password={dialogPassword}
          onPasswordChange={setDialogPassword}
          onConfirm={confirmImport}
          onCancel={() => {
            setShowImportDialog(false);
            setDialogPassword('');
            setPendingImportFilePath(null);
          }}
          confirmLabel='Importar'
          isLoading={isImporting}
        />

        {/* Dialog de Confirmação para Deletar */}
        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja excluir este segredo? Esta ação não pode
                ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setPendingDeleteId(null)}>
                Cancelar
              </AlertDialogCancel>
              <AlertDialogAction onClick={confirmDelete}>
                Excluir
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
