import {
  FolderPlus,
  HardDriveDownload,
  HardDriveUpload,
  Key,
  Plus,
} from 'lucide-react';
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
  onCreateProject: () => void;
  isImporting: boolean;
  isExporting: boolean;
  isPendingAdd: boolean;
  isPendingEdit: boolean;
}

export function DashboardHeader({
  onImport,
  onExport,
  onCreateSecret,
  onCreateProject,
  isImporting,
  isExporting,
  isPendingAdd,
  isPendingEdit,
}: DashboardHeaderProps) {
  return (
    <div className='mb-6 flex items-center justify-between'>
      <h2 className='flex items-center gap-2 font-bold text-3xl'>
        <Key className='h-7 w-7' />
        Meus Segredos
      </h2>
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
            <DropdownMenuItem onClick={onCreateProject}>
              <FolderPlus className='h-4 w-4' />
              Projeto
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
