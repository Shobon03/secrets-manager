import { invoke } from '@tauri-apps/api/core';
import { writeText } from '@tauri-apps/plugin-clipboard-manager';
import { open, save } from '@tauri-apps/plugin-dialog';
import { HardDriveDownload, HardDriveUpload, Plus } from 'lucide-react';
import {
  Suspense,
  startTransition,
  use,
  useActionState,
  useRef,
  useState,
} from 'react';
import { toast } from 'sonner';
import type { AttachmentsManagerRef } from '../components/attachments-manager';
import { PasswordDialog } from '../components/password-dialog';
import { SecretCard } from '../components/secret-card';
import { SecretForm } from '../components/secret-form';
import { SecretsListSkeleton } from '../components/secrets-list-skeleton';
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
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Spinner } from '../components/ui/spinner';
import type { Secret } from '../types';

// Cache para gerenciar o estado da Promise
let secretsCache: Promise<Secret[]> | null = null;
let secretsData: Secret[] | null = null;

function loadSecretsPromise(): Promise<Secret[]> {
  if (!secretsCache) {
    secretsCache = invoke<Secret[]>('get_all_secrets').then((data) => {
      secretsData = data;
      return data;
    });
  }
  return secretsCache;
}

// Invalidar o cache quando necessário
export function invalidateSecretsCache() {
  secretsCache = null;
  secretsData = null;
}

// Obter dados síncronos do cache (para editar)
function getSecretsFromCache(): Secret[] | null {
  return secretsData;
}

// Componente que suspende enquanto carrega secrets
function SecretsList({
  onCopy,
  onEdit,
  onDeleteClick,
}: {
  onCopy: (text: string) => Promise<void>;
  onEdit: (id: number) => void;
  onDeleteClick: (id: number) => void;
}) {
  const secrets = use(loadSecretsPromise());

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
      {secrets.map((s) => (
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
      const result = await invoke<Secret>('create_secret', {
        title,
        username,
        password,
      });

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
      const updateData = { title, username, password, id: editSecretId };
      await invoke<void>('update_secret', updateData);

      // Salva anexos pendentes se houver
      if (
        editSecretId &&
        attachmentsManagerRef.current?.hasPendingAttachments()
      ) {
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
      await invoke<void>('delete_secret', { id });
      setForm({ title: '', username: '', password: '' });
      refreshSecrets();
      toast.success('Segredo deletado com sucesso!');
    } catch (e) {
      toast.error(`Erro ao deletar: ${e}`);
    } finally {
      setPendingDeleteId(null);
    }
  }

  async function copyToClipboard(text: string) {
    try {
      await writeText(text);
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
      await invoke<void>('export_vault', {
        filePath,
        password: dialogPassword,
      });

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
      const msg = await invoke<string>('import_vault', {
        filePath: pendingImportFilePath,
        password: dialogPassword,
      });

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
        <div className='flex items-center justify-between mb-6'>
          <h2 className='text-3xl font-bold'>🔐 Meus Segredos</h2>
          <div className='flex gap-2'>
            <Button
              variant='outline'
              size='icon'
              onClick={handleImport}
              title='Importar Cofre'
              disabled={isImporting || isExporting}
            >
              {isImporting ? (
                <Spinner className='h-5 w-5' />
              ) : (
                <HardDriveUpload className='h-5 w-5' />
              )}
            </Button>
            <Button
              variant='outline'
              size='icon'
              onClick={handleExport}
              title='Exportar Cofre'
              disabled={isImporting || isExporting}
            >
              {isExporting ? (
                <Spinner className='h-5 w-5' />
              ) : (
                <HardDriveDownload className='h-5 w-5' />
              )}
            </Button>
            <Button
              variant='default'
              size='icon'
              onClick={() => setIsCreateSecret((prev) => !prev)}
              title='Novo login'
              disabled={isPendingAdd || isPendingEdit}
            >
              <Plus className='h-5 w-5' />
            </Button>
          </div>
        </div>

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

        <div className='space-y-4' key={refreshKey}>
          <Suspense fallback={<SecretsListSkeleton />}>
            <SecretsList
              onCopy={copyToClipboard}
              onEdit={handleEditSecret}
              onDeleteClick={handleDeleteClick}
            />
          </Suspense>
        </div>

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
