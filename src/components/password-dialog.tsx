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

interface PasswordDialogProps {
  open: boolean;
  title: string;
  description: string;
  password: string;
  onPasswordChange: (password: string) => void;
  onConfirm: () => void;
  onCancel: () => void;
  confirmLabel?: string;
  isLoading?: boolean;
}

export function PasswordDialog({
  open,
  title,
  description,
  password,
  onPasswordChange,
  onConfirm,
  onCancel,
  confirmLabel = 'Confirmar',
  isLoading = false,
}: PasswordDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onCancel}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className='space-y-2'>
          <Label htmlFor='dialog-password'>Senha Mestra</Label>
          <Input
            id='dialog-password'
            type='password'
            placeholder='Digite sua senha...'
            value={password}
            onChange={(e) => onPasswordChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                onConfirm();
              }
            }}
          />
        </div>
        <DialogFooter>
          <Button variant='outline' onClick={onCancel} disabled={isLoading}>
            Cancelar
          </Button>
          <Button onClick={onConfirm} disabled={!password || isLoading}>
            {isLoading ? (
              <>
                <Spinner className='mr-2' />
                Processando...
              </>
            ) : (
              confirmLabel
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
