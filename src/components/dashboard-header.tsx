import {
  HardDriveDownload,
  HardDriveUpload,
  Plus,
  Key,
  FolderPlus,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from './ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { Spinner } from './ui/spinner';

interface DashboardHeaderProps {
  onImport: () => void;
  onExport: () => void;
  onCreateSecret: () => void;
  isImporting: boolean;
  isExporting: boolean;
  isPendingAdd: boolean;
  isPendingEdit: boolean;
}

export function DashboardHeader({
  onImport,
  onExport,
  onCreateSecret,
  isImporting,
  isExporting,
  isPendingAdd,
  isPendingEdit,
}: DashboardHeaderProps) {
  return (
    <div className='flex items-center justify-between mb-6'>
      <h2 className='text-3xl font-bold'>🔐 Meus Segredos</h2>
      <div className='flex gap-2'>
        <Button
          variant='outline'
          size='icon'
          onClick={onImport}
          title='Importar Cofre'
          disabled={isImporting || isExporting}
        >
          {isImporting ? (
            <Spinner className='h-5 w-5' />
          ) : (
            <HardDriveDownload className='h-5 w-5' />
          )}
        </Button>
        <Button
          variant='outline'
          size='icon'
          onClick={onExport}
          title='Exportar Cofre'
          disabled={isImporting || isExporting}
        >
          {isExporting ? (
            <Spinner className='h-5 w-5' />
          ) : (
            <HardDriveUpload className='h-5 w-5' />
          )}
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant='default'
              size='icon'
              title='Adicionar novo'
              disabled={isPendingAdd || isPendingEdit}
            >
              <Plus className='h-5 w-5' />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align='end'>
            <DropdownMenuItem onClick={onCreateSecret}>
              <Key className='h-4 w-4' />
              Segredo
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => toast.info('Em breve!')}>
              <FolderPlus className='h-4 w-4' />
              Projeto
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
