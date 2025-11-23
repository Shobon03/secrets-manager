import { getCurrentWindow } from '@tauri-apps/api/window';
import { type } from '@tauri-apps/plugin-os';
import { LockKeyhole, Minus, Square, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from './ui/button';

const appWindow = getCurrentWindow();
const osType = type();

export function TitleBar() {
  const [isMaximized, setIsMaximized] = useState(false);
  const isMac = osType === 'macos';

  useEffect(() => {
    const unlisten = appWindow.onResized(async () => {
      setIsMaximized(await appWindow.isMaximized());
    });

    return () => {
      unlisten.then((f) => f());
    };
  });

  const handleMinimize = () => appWindow.minimize();
  const handleMaximizeToggle = async () => {
    if (await appWindow.isMaximized()) {
      appWindow.unmaximize();
      setIsMaximized(false);
    } else {
      appWindow.maximize();
      setIsMaximized(true);
    }
  };
  const handleClose = () => appWindow.close();

  return (
    <div className='h-10 flex items-center justify-between bg-background border-b select-none fixed top-0 left-0 right-0 z-50'>
      <div
        data-tauri-drag-region
        className='flex-1 flex items-center h-full pl-4 gap-2'
      >
        <LockKeyhole size={16} className='text-primary pointer-events-none' />
        <span className='text-sm font-medium pointer-events-none'>
          Secrets Manager
        </span>
      </div>

      {!isMac && (
        <div className='flex h-full'>
          <Button
            variant='ghost'
            size='icon'
            className='h-full w-12 rounded-none hover:bg-accent'
            onClick={handleMinimize}
            title='Minimizar'
          >
            <Minus className='w-5! h-5!' />
          </Button>

          <Button
            variant='ghost'
            size='icon'
            className='h-full w-12 rounded-none hover:bg-accent'
            onClick={handleMaximizeToggle}
            title={isMaximized ? 'Restaurar' : 'Maximizar'}
          >
            {isMaximized ? (
              <Square className='w-3.5! h-3.5! rotate-45' />
            ) : (
              <Square className='w-3.5! h-3.5!' />
            )}
          </Button>

          <Button
            variant='ghost'
            size='icon'
            className='h-full w-12 rounded-none hover:bg-red-500! hover:text-white transition-colors'
            onClick={handleClose}
            title='Fechar'
          >
            <X className='w-5! h-5!' />
          </Button>
        </div>
      )}
    </div>
  );
}
