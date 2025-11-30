import { startTransition, use, useOptimistic, useState } from 'react';
import { toast } from 'sonner';
import { DashboardHeader } from '../components/dashboard-header';
import { DashboardTabs } from '../components/dashboard-tabs';
import { PasswordDialog } from '../components/password-dialog';
import { ProjectForm } from '../components/project-form';
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
import { invalidateProjectsCache } from '../functions/projects';
import {
  invalidateSecretsCache,
  loadSecretsPromise,
} from '../functions/secrets';
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

function DashboardContent() {
  // Trigger para forçar re-render após mutations
  const [refreshKey, setRefreshKey] = useState(0);

  // Carregar dados iniciais (suspende aqui se não estiver em cache)
  // O refreshKey força a recriação da promise se o cache foi invalidado
  const initialSecrets = use(loadSecretsPromise());

  // Estado Otimista
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

  async function handleCopy(text: string) {
    try {
      await copyToClipboard(text);
      toast.success('Copiado para a área de transferência!');
    } catch (e) {
      toast.error(`Erro ao copiar: ${e}`);
    }
  }

  return (
    <div className='absolute top-10 bottom-0 left-0 right-0 overflow-y-scroll'>
      <div className='container mx-auto p-6 pb-20 max-w-6xl'>
        <DashboardHeader
          onImport={vaultBackup.handleImport}
          onExport={vaultBackup.handleExport}
          onCreateSecret={secretForm.openCreate}
          onCreateProject={projectForm.openCreate}
          isImporting={vaultBackup.isImporting}
          isExporting={vaultBackup.isExporting}
          isPendingAdd={secretForm.isPendingAdd || projectForm.isPendingAdd}
          isPendingEdit={secretForm.isPendingEdit || projectForm.isPendingEdit}
        />

        <DashboardTabs
          secrets={optimisticSecrets}
          refreshKey={refreshKey}
          onCopy={handleCopy}
          onEditSecret={secretForm.openEdit}
          onDeleteSecret={secretDeletion.requestDelete}
          onEditProject={projectForm.openEdit}
          onDeleteProject={projectDeletion.requestDelete}
        />

        {/* Forms */}
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

        {/* Dialog para Exportar */}
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

        {/* Dialog para Importar */}
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

        {/* Dialog de Confirmação para Deletar Segredo */}
        <AlertDialog
          open={secretDeletion.showDeleteDialog}
          onOpenChange={secretDeletion.setShowDeleteDialog}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Excluir Segredo</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja excluir este segredo? Esta ação não pode
                ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={secretDeletion.cancelDelete}>
                Cancelar
              </AlertDialogCancel>
              <AlertDialogAction onClick={secretDeletion.confirmDelete}>
                Excluir
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Dialog de Confirmação para Deletar Projeto */}
        <AlertDialog
          open={projectDeletion.showDeleteDialog}
          onOpenChange={projectDeletion.setShowDeleteDialog}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Excluir Projeto</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja excluir este projeto?
                <br />
                <strong>Atenção:</strong> Os segredos vinculados a este projeto
                NÃO serão excluídos, mas perderão o vínculo com o projeto.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={projectDeletion.cancelDelete}>
                Cancelar
              </AlertDialogCancel>
              <AlertDialogAction onClick={projectDeletion.confirmDelete}>
                Excluir
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}

export function Dashboard() {
  return <DashboardContent />;
}
