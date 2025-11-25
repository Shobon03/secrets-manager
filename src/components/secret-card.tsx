import { Copy, Edit, Trash2 } from 'lucide-react';
import type { Secret } from '../types';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Separator } from './ui/separator';
import { Spinner } from './ui/spinner';

interface SecretCardProps {
  secret: Secret;
  onCopy: (text: string) => void;
  onEdit: (id: number) => void;
  onDelete: (id: number) => void;
  isDeleting: boolean;
}

export function SecretCard({
  secret,
  onCopy,
  onEdit,
  onDelete,
  isDeleting,
}: SecretCardProps) {
  return (
    <Card className='transition-colors hover:bg-accent/53 p-0'>
      <CardContent className='p-6'>
        <div className='space-y-3'>
          <div className='flex items-center justify-between'>
            <h3 className='text-xl font-semibold'>{secret.title}</h3>
            <div className='flex gap-2'>
              <Button
                variant='outline'
                size='icon'
                onClick={() => onEdit(secret.id)}
                title='Editar'
                disabled={isDeleting}
              >
                <Edit className='h-4 w-4' />
              </Button>
              <Button
                variant='destructive'
                size='icon'
                onClick={() => onDelete(secret.id)}
                title='Excluir'
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <Spinner className='h-4 w-4' />
                ) : (
                  <Trash2 className='h-4 w-4' />
                )}
              </Button>
            </div>
          </div>

          <Separator />

          <div className='flex gap-10 items-center'>
            <div className='flex items-center gap-2'>
              <span className='text-sm text-muted-foreground min-w-16'>
                Usuário:
              </span>
              {secret.username ? (
                <span
                  className='text-sm font-mono w-24! max-w-24 text-ellipsis text-nowrap overflow-hidden'
                  title={secret.username}
                >
                  {secret.username}
                </span>
              ) : (
                <span className='text-sm italic w-[136px]'>Não cadastrado</span>
              )}
              {secret.username && (
                <Button
                  variant='ghost'
                  size='icon'
                  className='h-8 w-8'
                  onClick={() => onCopy(secret.username)}
                  title='Copiar usuário'
                >
                  <Copy className='h-4 w-4' />
                </Button>
              )}
            </div>
            <div className='flex items-center gap-2'>
              <span className='text-sm text-muted-foreground min-w-16'>
                Senha:
              </span>
              <span
                className='text-sm font-mono max-w-24'
                title={secret.password}
              >
                {Array(secret.password?.length || 1)
                  .fill('•')
                  .toString()
                  .replace(/,/g, '')}
              </span>
              <Button
                variant='ghost'
                size='icon'
                className='h-8 w-8'
                onClick={() => onCopy(secret.password ?? '')}
                title='Copiar senha'
              >
                <Copy className='h-4 w-4' />
              </Button>
            </div>
          </div>
          <small className='text-xs text-muted-foreground'>
            Criado em:{' '}
            <span>{new Date(secret.created_at).toLocaleString('pt-BR')}</span>
          </small>
        </div>
      </CardContent>
    </Card>
  );
}
