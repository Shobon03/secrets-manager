import { useActionState, useRef, useState } from 'react';
import { toast } from 'sonner';
import type { AttachmentsManagerRef } from '../../components/attachments-manager';
import {
  createSecret,
  getSecretsFromCache,
  updateSecret,
} from '../../functions/secrets';
import { secretSchema } from '../../lib/schemas';
import type { Secret } from '../../types';

interface SecretFormData {
  title: string;
  username: string;
  password: string;
  projectId?: string;
}

interface UseSecretsFormProps {
  onRefresh: () => void;
  onOptimisticCreate?: (secret: Secret) => void;
  onOptimisticUpdate?: (secret: Secret) => void;
}

export function useSecretsForm({
  onRefresh,
  onOptimisticCreate,
  onOptimisticUpdate,
}: UseSecretsFormProps) {
  const [form, setForm] = useState<SecretFormData>({
    title: '',
    username: '',
    password: '',
    projectId: undefined,
  });

  const [isCreateSecret, setIsCreateSecret] = useState(false);
  const [isEditSecret, setIsEditSecret] = useState(false);
  const [editSecretId, setEditSecretId] = useState<number | null>(null);
  const attachmentsManagerRef = useRef<AttachmentsManagerRef>(null);

  function resetForm() {
    setForm({
      title: '',
      username: '',
      password: '',
      projectId: undefined,
    });
    setEditSecretId(null);
    setIsCreateSecret(false);
    setIsEditSecret(false);
  }

  async function handleAddAction(
    _prevState: null,
    formData: FormData,
  ): Promise<null> {
    const projectIdRaw = formData.get('projectId');
    console.log('projectIdRaw from FormData:', { projectIdRaw, type: typeof projectIdRaw });

    const rawData = {
      title: formData.get('title'),
      username: formData.get('username'),
      password: formData.get('password'),
      projectId:
        projectIdRaw === null ||
        projectIdRaw === 'no-project' ||
        projectIdRaw === ''
          ? undefined
          : projectIdRaw,
    };
    console.log('rawData for validation:', rawData);

    const validation = secretSchema.safeParse(rawData);

    if (validation.success === false) {
      console.error('Validation failed:', validation);
      let errorMessage = 'Erro de validação';
      if (
        validation.error &&
        validation.error.errors &&
        validation.error.errors.length > 0
      ) {
        errorMessage = validation.error.errors[0].message;
      }
      toast.error(errorMessage);
      return null;
    }

    const { title, username, password, projectId } = validation.data;

    // Optimistic Create
    const tempSecret: Secret = {
      id: Date.now(), // ID temporário
      title,
      username: username || '',
      password,
      created_at: new Date().toISOString(),
      project_id: projectId,
    };
    onOptimisticCreate?.(tempSecret);

    // Fecha o modal imediatamente para sensação de rapidez
    resetForm();

    try {
      const result = await createSecret(title, username, password, projectId);

      if (attachmentsManagerRef.current?.hasPendingAttachments()) {
        await attachmentsManagerRef.current.savePendingAttachments(result.id);
      }

      onRefresh();
      toast.success('Segredo criado com sucesso!');
    } catch (e) {
      toast.error(`Erro ao salvar: ${e}`);
      onRefresh(); // Reverte optimistic em caso de erro
    }
    return null;
  }

  async function handleEditAction(
    _prevState: null,
    formData: FormData,
  ): Promise<null> {
    const projectIdRaw = formData.get('projectId');
    console.log('projectIdRaw from FormData:', {
      projectIdRaw,
      type: typeof projectIdRaw,
    });

    const rawData = {
      title: formData.get('title'),
      username: formData.get('username'),
      password: formData.get('password'),
      projectId:
        projectIdRaw === null ||
        projectIdRaw === 'no-project' ||
        projectIdRaw === ''
          ? undefined
          : projectIdRaw,
    };
    console.log('rawData for validation:', rawData);

    const validation = secretSchema.safeParse(rawData);

    if (validation.success === false) {
      console.error('Validation failed:', validation);
      let errorMessage = 'Erro de validação';
      if (
        validation.error &&
        validation.error.errors &&
        validation.error.errors.length > 0
      ) {
        errorMessage = validation.error.errors[0].message;
      }
      toast.error(errorMessage);
      return null;
    }

    const { title, username, password, projectId } = validation.data;

    try {
      if (!editSecretId) return null;

      // Optimistic Update
      const original = getSecretsFromCache()?.find((s) => s.id === editSecretId);
      const updatedSecret: Secret = {
        id: editSecretId,
        title,
        username: username || '',
        password,
        created_at: original?.created_at || new Date().toISOString(),
        project_id: projectId,
      };
      onOptimisticUpdate?.(updatedSecret);
      
      // Fecha modal imediatamente
      resetForm();

      await updateSecret(
        editSecretId,
        title,
        username,
        password,
        projectId,
      );

      if (attachmentsManagerRef.current?.hasPendingAttachments()) {
        await attachmentsManagerRef.current.savePendingAttachments(
          editSecretId,
        );
      }

      onRefresh();
      toast.success('Segredo atualizado com sucesso!');
    } catch (e) {
      toast.error(`Erro ao editar: ${e}`);
      onRefresh();
    }
    return null;
  }

  const [, formAddAction, isPendingAdd] = useActionState(handleAddAction, null);
  const [, formEditAction, isPendingEdit] = useActionState(
    handleEditAction,
    null,
  );

  function openCreate() {
    resetForm();
    setIsCreateSecret(true);
  }

  function openEdit(id: number) {
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
        projectId: editSecret.project_id?.toString(),
      });
      setIsEditSecret(true);
      setEditSecretId(id);
    }
  }

  function handleFormChange(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  return {
    form,
    handleFormChange,
    isCreateSecret,
    isEditSecret,
    editSecretId,
    attachmentsManagerRef,
    formAddAction,
    isPendingAdd,
    formEditAction,
    isPendingEdit,
    openCreate,
    openEdit,
    closeForm: resetForm,
    setIsCreateSecret,
  };
}
