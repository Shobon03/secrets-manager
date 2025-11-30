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
    <div className='top-0 right-0 left-0 z-50 flex h-10 select-none items-center justify-between border-b bg-background'>
      <div
        data-tauri-drag-region
        className='flex h-full flex-1 items-center gap-2 pl-4'
      >
        <LockKeyhole size={16} className='pointer-events-none text-primary' />
        <span className='pointer-events-none font-medium text-sm'>
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
            <Minus className='size-5!' />
          </Button>

          <Button
            variant='ghost'
            size='icon'
            className='h-full w-12 rounded-none hover:bg-accent'
            onClick={handleMaximizeToggle}
            title={isMaximized ? 'Restaurar' : 'Maximizar'}
          >
            {isMaximized ? (
              <svg
                xmlns='http://www.w3.org/2000/svg'
                width='24'
                height='24'
                viewBox='0 0 24 24'
                fill='none'
                stroke='currentColor'
                strokeWidth='2'
                strokeLinecap='round'
                strokeLinejoin='round'
                className='size-3.5!'
              >
                <title>Restaurar</title>
                <rect x='3' y='6' width='15' height='15' rx='2' />
                <path d='M21 18V5a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v1' />
              </svg>
            ) : (
              <Square className='size-3.5!' />
            )}
          </Button>

          <Button
            variant='ghost'
            size='icon'
            className='h-full w-12 rounded-none transition-colors hover:bg-red-500! hover:text-white'
            onClick={handleClose}
            title='Fechar'
          >
            <X className='size-5!' />
          </Button>
        </div>
      )}
    </div>
  );
}
