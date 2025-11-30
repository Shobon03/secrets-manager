import { useActionState, useState } from 'react';
import { toast } from 'sonner';
import {
  createProject,
  getProjectsFromCache,
  updateProject,
} from '../../functions/projects';
import { projectSchema } from '../../lib/schemas';

interface ProjectFormData {
  name: string;
  description: string;
}

interface UseProjectsFormProps {
  onRefresh: () => void;
}

export function useProjectsForm({ onRefresh }: UseProjectsFormProps) {
  const [form, setForm] = useState<ProjectFormData>({
    name: '',
    description: '',
  });

  const [isCreateProject, setIsCreateProject] = useState(false);
  const [isEditProject, setIsEditProject] = useState(false);
  const [editProjectId, setEditProjectId] = useState<number | null>(null);

  function resetForm() {
    setForm({ name: '', description: '' });
    setEditProjectId(null);
    setIsCreateProject(false);
    setIsEditProject(false);
  }

  async function handleAddAction(
    _prevState: null,
    formData: FormData,
  ): Promise<null> {
    const rawData = {
      name: formData.get('name'),
      description: formData.get('description'),
    };

    const validation = projectSchema.safeParse(rawData);

    if (!validation.success) {
      const errorMessage = validation.error.issues[0].message;
      toast.error(errorMessage);
      return null;
    }

    const { name, description } = validation.data;

    try {
      await createProject(name, description);
      resetForm();
      onRefresh();
      toast.success('Projeto criado com sucesso!');
    } catch (e) {
      toast.error(`Erro ao salvar: ${e}`);
    }
    return null;
  }

  async function handleEditAction(
    _prevState: null,
    formData: FormData,
  ): Promise<null> {
    const rawData = {
      name: formData.get('name'),
      description: formData.get('description'),
    };

    const validation = projectSchema.safeParse(rawData);

    if (!validation.success) {
      const errorMessage = validation.error.issues[0].message;
      toast.error(errorMessage);
      return null;
    }

    const { name, description } = validation.data;

    try {
      if (!editProjectId) return null;

      await updateProject(editProjectId, name, description);
      resetForm();
      onRefresh();
      toast.success('Projeto atualizado com sucesso!');
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

  function openCreate() {
    resetForm();
    setIsCreateProject(true);
  }

  function openEdit(id: number) {
    const projects = getProjectsFromCache();

    if (!projects) {
      toast.error('Dados não carregados ainda');
      return;
    }

    const editProject = projects.find((p) => p.id === id);

    if (editProject) {
      setForm({
        name: editProject.name,
        description: editProject.description ?? '',
      });
      setIsEditProject(true);
      setEditProjectId(id);
    }
  }

  function handleFormChange(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  return {
    form,
    handleFormChange,
    isCreateProject,
    isEditProject,
    editProjectId,
    formAddAction,
    isPendingAdd,
    formEditAction,
    isPendingEdit,
    openCreate,
    openEdit,
    closeForm: resetForm,
  };
}
