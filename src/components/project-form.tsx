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
import { Label } from './ui/label';
import { Spinner } from './ui/spinner';
import { Textarea } from './ui/textarea';

interface ProjectFormProps {
  open: boolean;
  form: {
    name: string;
    description: string;
  };
  isEditMode: boolean;
  onFormChange: (field: string, value: string) => void;
  formAction: (formData: FormData) => void;
  onCancel: () => void;
  isPending: boolean;
}

export function ProjectForm({
  open,
  form,
  isEditMode,
  onFormChange,
  formAction,
  onCancel,
  isPending,
}: ProjectFormProps) {
  const isFormValid = form.name.trim().length > 0;

  return (
    <Dialog open={open} onOpenChange={onCancel}>
      <DialogContent className='max-w-md'>
        <DialogHeader>
          <DialogTitle>{isEditMode ? 'Editar' : 'Novo'} Projeto</DialogTitle>
          <DialogDescription>
            {isEditMode
              ? 'Atualize as informações do projeto.'
              : 'Crie um novo projeto para organizar seus segredos.'}
          </DialogDescription>
        </DialogHeader>
        <form action={formAction} className='space-y-4' noValidate>
          <div className='space-y-2'>
            <Label htmlFor='name'>
              Nome <span className='text-destructive'>*</span>
            </Label>
            <Input
              id='name'
              name='name'
              placeholder='Ex: Pessoal, Trabalho, Freelance...'
              value={form.name}
              onChange={(e) => onFormChange('name', e.target.value)}
            />
          </div>
          <div className='space-y-2'>
            <Label htmlFor='description'>Descrição</Label>
            <Textarea
              id='description'
              name='description'
              placeholder='Uma breve descrição do projeto...'
              value={form.description}
              onChange={(e) => onFormChange('description', e.target.value)}
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button
              type='button'
              variant='outline'
              onClick={onCancel}
              disabled={isPending}
            >
              Cancelar
            </Button>
            <Button type='submit' disabled={isPending || !isFormValid}>
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
