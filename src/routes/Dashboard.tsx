import {
  Folder,
  FolderPlus,
  HardDriveDownload,
  HardDriveUpload,
  Key,
  Plus,
  Trash2,
} from 'lucide-react';
import { startTransition, use, useOptimistic, useState } from 'react';
import { toast } from 'sonner';
import { AppSidebar, type SidebarView } from '../components/app-sidebar';
import { PasswordDialog } from '../components/password-dialog';
import { ProjectForm } from '../components/project-form';
import { ProjectList } from '../components/project-list';
import { SecretForm } from '../components/secret-form';
import { SecretList } from '../components/secret-list';
import { type TrashItem, TrashList } from '../components/trash-list';
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
import { SidebarInset, SidebarProvider } from '../components/ui/sidebar';
import { Spinner } from '../components/ui/spinner';
import { copyToClipboard } from '../functions/clipboard';
import {
  invalidateProjectsCache,
  loadDeletedProjectsPromise,
  loadProjectsPromise,
  deleteProject as permanentlyDeleteProject,
  restoreProject,
} from '../functions/projects';
import {
  invalidateSecretsCache,
  loadDeletedSecretsPromise,
  loadSecretsPromise,
  deleteSecret as permanentlyDeleteSecret,
  restoreSecret,
} from '../functions/secrets';
import { useEmptyTrash } from '../hooks/dashboard/useEmptyTrash';
import { useProjectDeletion } from '../hooks/dashboard/useProjectDeletion';
import { useProjectsForm } from '../hooks/dashboard/useProjectsForm';
import { useSecretDeletion } from '../hooks/dashboard/useSecretDeletion';
import { useSecretsForm } from '../hooks/dashboard/useSecretsForm';
import { useVaultBackup } from '../hooks/dashboard/useVaultBackup';
import type { Secret } from '../types';

type OptimisticAction =
  | { type: 'create'; secret: Secret }
  | { type: 'update'; secret: Secret }
  | { type: 'delete'; id: number };

function dashboardReducer(state: Secret[], action: OptimisticAction): Secret[] {
  switch (action.type) {
    case 'create':
      return [action.secret, ...state];
    case 'update':
      return state.map((s) => (s.id === action.secret.id ? action.secret : s));
    case 'delete':
      return state.filter((s) => s.id !== action.id);
    default:
      return state;
  }
}

function DashboardContent({ onLogout }: { onLogout: () => void }) {
  const [currentView, setCurrentView] = useState<SidebarView>('secrets');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Trigger para forçar re-render após mutations
  const [_, setRefreshKey] = useState(0);

  // Carregar dados (Suspense)
  const initialSecrets = use(loadSecretsPromise());
  const initialProjects = use(loadProjectsPromise());
  const deletedSecrets = use(loadDeletedSecretsPromise());
  const deletedProjects = use(loadDeletedProjectsPromise());

  // Estado Otimista (apenas Segredos por enquanto)
  const [optimisticSecrets, addOptimisticSecret] = useOptimistic(
    initialSecrets,
    dashboardReducer,
  );

  function refreshAll() {
    invalidateSecretsCache();
    invalidateProjectsCache();
    startTransition(() => {
      setRefreshKey((prev) => prev + 1);
    });
  }

  const secretForm = useSecretsForm({
    onRefresh: refreshAll,
    onOptimisticCreate: (s) =>
      addOptimisticSecret({ type: 'create', secret: s }),
    onOptimisticUpdate: (s) =>
      addOptimisticSecret({ type: 'update', secret: s }),
  });

  const projectForm = useProjectsForm({ onRefresh: refreshAll });
  const vaultBackup = useVaultBackup({ onRefresh: refreshAll });

  const secretDeletion = useSecretDeletion({
    onRefresh: refreshAll,
    onOptimisticDelete: (id) => addOptimisticSecret({ type: 'delete', id }),
  });

  const projectDeletion = useProjectDeletion({ onRefresh: refreshAll });
  const emptyTrash = useEmptyTrash({ onRefresh: refreshAll });

  async function handleCopy(text: string) {
    try {
      await copyToClipboard(text);
      toast.success('Copiado para a área de transferência!');
    } catch (e) {
      toast.error(`Erro ao copiar: ${e}`);
    }
  }

  // Filtragem de Views
  const activeSecrets = optimisticSecrets.filter((s) => !s.deletedAt);
  const activeProjects = initialProjects.filter((p) => !p.deletedAt);

  const trashItems: TrashItem[] = [
    ...deletedSecrets.map((s) => ({ ...s, type: 'secret' as const })),
    ...deletedProjects.map((p) => ({ ...p, type: 'project' as const })),
  ];

  async function handleRestoreItem(item: TrashItem) {
    try {
      if (item.type === 'secret') {
        await restoreSecret(item.id as number);
        toast.success('Segredo restaurado com sucesso!');
      } else {
        await restoreProject(item.id as number);
        toast.success('Projeto restaurado com sucesso!');
      }
      refreshAll();
    } catch (e) {
      toast.error(`Erro ao restaurar: ${e}`);
    }
  }

  async function handleDeletePermanently(item: TrashItem) {
    try {
      if (item.type === 'secret') {
        await permanentlyDeleteSecret(item.id as number);
        toast.success('Segredo excluído permanentemente!');
      } else {
        await permanentlyDeleteProject(item.id as number);
        toast.success('Projeto excluído permanentemente!');
      }
      refreshAll();
    } catch (e) {
      toast.error(`Erro ao excluir: ${e}`);
    }
  }

  const getTitle = () => {
    switch (currentView) {
      case 'secrets':
        return 'Meus Segredos';
      case 'projects':
        return 'Meus Projetos';
      case 'trash':
        return 'Lixeira';
    }
  };

  const getTitleIcon = () => {
    switch (currentView) {
      case 'secrets':
        return <Key className='h-5 w-5' />;
      case 'projects':
        return <Folder className='h-5 w-5' />;
      case 'trash':
        return <Trash2 className='h-5 w-5' />;
    }
  };

  return (
    <SidebarProvider
      open={isSidebarOpen}
      onOpenChange={setIsSidebarOpen}
      className='h-full w-full overflow-hidden'
    >
      <AppSidebar
        currentView={currentView}
        onViewChange={setCurrentView}
        onLogout={onLogout}
        title={getTitle()}
        titleIcon={getTitleIcon()}
      />

      <SidebarInset className='h-full flex flex-col overflow-hidden'>
        {/* Header */}
        <header className='h-14 border-b flex items-center px-4 justify-between shrink-0 bg-card/50'>
          <div className='flex items-center gap-2 min-w-0 flex-1'>
            {!isSidebarOpen && (
              <h1
                className='flex items-center gap-2 text-xl font-bold truncate overflow-hidden whitespace-nowrap'
                style={{ viewTransitionName: 'sidebar-title' }}
              >
                {getTitleIcon()}
                <span className='truncate'>{getTitle()}</span>
              </h1>
            )}
          </div>

          <div className='flex gap-2 shrink-0 ml-4'>
            {currentView === 'secrets' && (
              <>
                <Button
                  variant='outline'
                  size='icon-sm'
                  onClick={vaultBackup.handleImport}
                  title='Importar Cofre'
                  disabled={vaultBackup.isImporting || vaultBackup.isExporting}
                >
                  {vaultBackup.isImporting ? (
                    <Spinner className='size-4' />
                  ) : (
                    <HardDriveDownload className='size-4' />
                  )}
                </Button>
                <Button
                  variant='outline'
                  size='icon-sm'
                  onClick={vaultBackup.handleExport}
                  title='Exportar Cofre'
                  disabled={vaultBackup.isImporting || vaultBackup.isExporting}
                >
                  {vaultBackup.isExporting ? (
                    <Spinner className='size-4' />
                  ) : (
                    <HardDriveUpload className='size-4' />
                  )}
                </Button>
                <Button
                  variant='default'
                  size='sm'
                  onClick={secretForm.openCreate}
                  disabled={secretForm.isPendingAdd}
                >
                  <Plus className='size-4' /> Novo Segredo
                </Button>
              </>
            )}

            {currentView === 'projects' && (
              <Button
                variant='default'
                size='sm'
                onClick={projectForm.openCreate}
                disabled={projectForm.isPendingAdd}
              >
                <FolderPlus className='size-4' /> Novo Projeto
              </Button>
            )}

            {currentView === 'trash' && (
              <Button
                variant='destructive'
                size='sm'
                onClick={emptyTrash.requestEmpty}
                disabled={trashItems.length === 0 || emptyTrash.isEmptying}
              >
                <Trash2 className='size-4' /> Esvaziar Lixeira
              </Button>
            )}
          </div>
        </header>

        {/* Conteúdo Scrollável */}
        <div className='flex-1 overflow-y-auto p-6'>
          {currentView === 'secrets' && (
            <SecretList
              secrets={activeSecrets}
              onCopy={handleCopy}
              onEdit={secretForm.openEdit}
              onDeleteClick={secretDeletion.requestDelete}
              onCreateClick={secretForm.openCreate}
            />
          )}

          {currentView === 'projects' && (
            <ProjectList
              projects={activeProjects}
              onEdit={projectForm.openEdit}
              onDeleteClick={projectDeletion.requestDelete}
              onCreateClick={projectForm.openCreate}
            />
          )}

          {currentView === 'trash' && (
            <TrashList
              items={trashItems}
              onRestore={handleRestoreItem}
              onDeletePermanently={handleDeletePermanently}
            />
          )}
        </div>
      </SidebarInset>

      {/* Modais e Dialogs Globais */}
      <SecretForm
        open={secretForm.isCreateSecret || secretForm.isEditSecret}
        form={secretForm.form}
        isEditMode={secretForm.isEditSecret}
        editSecretId={secretForm.editSecretId}
        attachmentsManagerRef={secretForm.attachmentsManagerRef}
        onFormChange={secretForm.handleFormChange}
        formAction={
          secretForm.isEditSecret
            ? secretForm.formEditAction
            : secretForm.formAddAction
        }
        onCancel={secretForm.closeForm}
        isPending={
          secretForm.isEditSecret
            ? secretForm.isPendingEdit
            : secretForm.isPendingAdd
        }
      />

      <ProjectForm
        open={projectForm.isCreateProject || projectForm.isEditProject}
        form={projectForm.form}
        isEditMode={projectForm.isEditProject}
        onFormChange={projectForm.handleFormChange}
        formAction={
          projectForm.isEditProject
            ? projectForm.formEditAction
            : projectForm.formAddAction
        }
        onCancel={projectForm.closeForm}
        isPending={
          projectForm.isEditProject
            ? projectForm.isPendingEdit
            : projectForm.isPendingAdd
        }
      />

      <PasswordDialog
        open={vaultBackup.showExportDialog}
        title='Confirme sua senha'
        description='Digite sua senha mestra para exportar o backup do cofre.'
        password={vaultBackup.dialogPassword}
        onPasswordChange={vaultBackup.setDialogPassword}
        onConfirm={vaultBackup.confirmExport}
        onCancel={() => {
          vaultBackup.setShowExportDialog(false);
          vaultBackup.setDialogPassword('');
        }}
        confirmLabel='Exportar'
        isLoading={vaultBackup.isExporting}
      />

      <PasswordDialog
        open={vaultBackup.showImportDialog}
        title='Confirme sua senha'
        description='Digite sua senha mestra para importar o backup do cofre.'
        password={vaultBackup.dialogPassword}
        onPasswordChange={vaultBackup.setDialogPassword}
        onConfirm={vaultBackup.confirmImport}
        onCancel={vaultBackup.cancelDialogs}
        confirmLabel='Importar'
        isLoading={vaultBackup.isImporting}
      />

      <AlertDialog
        open={secretDeletion.showDeleteDialog}
        onOpenChange={secretDeletion.setShowDeleteDialog}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Mover Segredo para Lixeira</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja mover este segredo para a lixeira? Você
              poderá restaurá-lo posteriormente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={secretDeletion.cancelDelete}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction onClick={secretDeletion.confirmDelete}>
              Mover para Lixeira
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={projectDeletion.showDeleteDialog}
        onOpenChange={projectDeletion.setShowDeleteDialog}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Mover Projeto para Lixeira</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja mover este projeto para a lixeira? Você
              poderá restaurá-lo posteriormente.
              <br />
              <strong>Nota:</strong> Os segredos vinculados a este projeto NÃO
              serão movidos para a lixeira, mas perderão o vínculo com o
              projeto.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={projectDeletion.cancelDelete}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction onClick={projectDeletion.confirmDelete}>
              Mover para Lixeira
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={emptyTrash.showEmptyDialog}
        onOpenChange={emptyTrash.setShowEmptyDialog}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Esvaziar Lixeira</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja esvaziar a lixeira? Todos os itens
              deletados serão removidos permanentemente. Esta ação não pode ser
              desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={emptyTrash.cancelEmpty}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={emptyTrash.confirmEmpty}
              className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
            >
              Esvaziar Lixeira
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </SidebarProvider>
  );
}

interface DashboardProps {
  onLogout: () => void;
}

export function Dashboard({ onLogout }: DashboardProps) {
  return <DashboardContent onLogout={onLogout} />;
}
