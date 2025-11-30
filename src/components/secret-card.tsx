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
    <Card className='p-0 transition-colors hover:bg-accent/53'>
      <CardContent className='p-6'>
        <div className='space-y-3'>
          <div className='flex items-center justify-between'>
            <h3 className='font-semibold text-xl'>{secret.title}</h3>
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

          <div className='flex items-center gap-10'>
            <div className='flex items-center gap-2'>
              <span className='min-w-16 text-muted-foreground text-sm'>
                Usuário:
              </span>
              {secret.username ? (
                <span
                  className='w-24! max-w-24 overflow-hidden text-ellipsis text-nowrap font-mono text-sm'
                  title={secret.username}
                >
                  {secret.username}
                </span>
              ) : (
                <span className='w-[136px] text-sm italic'>Não cadastrado</span>
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
              <span className='min-w-16 text-muted-foreground text-sm'>
                Senha:
              </span>
              <span
                className='max-w-24 font-mono text-sm'
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
          <small className='text-muted-foreground text-xs'>
            Criado em:{' '}
            <span>{new Date(secret.createdAt).toLocaleString('pt-BR')}</span>
          </small>
        </div>
      </CardContent>
    </Card>
  );
}
