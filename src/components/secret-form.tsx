import { Eye, EyeOff } from 'lucide-react';
import { Suspense, use, useState } from 'react';
import { loadProjectsPromise } from '../functions/projects';
import type { AttachmentsManagerRef } from './attachments-manager';
import { AttachmentsManager } from './attachments-manager';
import { Button } from './ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Input } from './ui/input';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from './ui/input-group';
import { Label } from './ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { Separator } from './ui/separator';
import { Skeleton } from './ui/skeleton';
import { Spinner } from './ui/spinner';

interface SecretFormProps {
  open: boolean;
  form: {
    title: string;
    username: string;
    password: string;
    projectId?: string;
  };
  isEditMode: boolean;
  editSecretId: number | null;
  attachmentsManagerRef: React.RefObject<AttachmentsManagerRef | null>;
  onFormChange: (field: string, value: string) => void;
  formAction: (formData: FormData) => void;
  onCancel: () => void;
  isPending: boolean;
}

function ProjectSelector({
  value,
  onChange,
}: {
  value: string | undefined;
  onChange: (val: string) => void;
}) {
  const projects = use(loadProjectsPromise());

  return (
    <Select
      value={value || 'no-project'}
      onValueChange={onChange}
      name='projectId'
    >
      <SelectTrigger>
        <SelectValue placeholder='Selecione um projeto (opcional)' />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value='no-project'>Nenhum projeto</SelectItem>
        {projects.map((p) => (
          <SelectItem key={p.id} value={p.id.toString()}>
            {p.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function SecretForm({
  open,
  form,
  isEditMode,
  editSecretId,
  attachmentsManagerRef,
  onFormChange,
  formAction,
  onCancel,
  isPending,
}: SecretFormProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [isAttachmentDialogOpen, setIsAttachmentDialogOpen] = useState(false);
  const isFormValid = form.title.trim().length > 0 && form.password.length > 0;

  return (
    <Dialog open={open} onOpenChange={onCancel}>
      <DialogContent className='max-h-[90vh] max-w-2xl overflow-y-auto'>
        <DialogHeader>
          <DialogTitle>{isEditMode ? 'Editar' : 'Novo'} Login</DialogTitle>
          <DialogDescription>
            {isEditMode
              ? 'Atualize as informações do seu login.'
              : 'Adicione um novo login ao seu cofre.'}
          </DialogDescription>
        </DialogHeader>
        <form action={formAction} className='space-y-4' noValidate>
          <div className='space-y-2'>
            <Label htmlFor='title'>
              Título <span className='text-destructive'>*</span>
            </Label>
            <Input
              id='title'
              name='title'
              placeholder='Ex: Google, GitHub...'
              value={form.title}
              onChange={(e) => onFormChange('title', e.target.value)}
            />
          </div>
          <div className='space-y-2'>
            <Label htmlFor='username'>Usuário</Label>
            <Input
              id='username'
              name='username'
              placeholder='email@exemplo.com'
              value={form.username}
              onChange={(e) => onFormChange('username', e.target.value)}
            />
          </div>
          <div className='space-y-2'>
            <Label htmlFor='password'>
              Senha <span className='text-destructive'>*</span>
            </Label>
            <InputGroup>
              <InputGroupInput
                id='password'
                name='password'
                type={showPassword ? 'text' : 'password'}
                placeholder='Digite a senha...'
                value={form.password}
                onChange={(e) => onFormChange('password', e.target.value)}
              />
              <InputGroupAddon align='inline-end'>
                <InputGroupButton
                  size='icon-xs'
                  onClick={() => setShowPassword(!showPassword)}
                  type='button'
                >
                  {showPassword ? (
                    <EyeOff className='size-4' />
                  ) : (
                    <Eye className='size-4' />
                  )}
                </InputGroupButton>
              </InputGroupAddon>
            </InputGroup>
          </div>

          <div className='space-y-2'>
            <Label>Projeto</Label>
            <Suspense fallback={<Skeleton className='h-9 w-full' />}>
              <ProjectSelector
                value={form.projectId}
                onChange={(val) => onFormChange('projectId', val)}
              />
            </Suspense>
          </div>

          <Separator />

          {/* Gerenciador de Anexos */}
          <AttachmentsManager
            ref={attachmentsManagerRef}
            secretId={editSecretId}
            setIsAttachmentDialogOpen={setIsAttachmentDialogOpen}
          />

          <DialogFooter>
            <Button
              type='button'
              variant='outline'
              onClick={onCancel}
              disabled={isPending || isAttachmentDialogOpen}
            >
              Cancelar
            </Button>
            <Button
              type='submit'
              disabled={isPending || !isFormValid || isAttachmentDialogOpen}
            >
              {isPending ? (
                <>
                  <Spinner className='mr-2' />
                  Salvando...
                </>
              ) : (
                'Salvar'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
