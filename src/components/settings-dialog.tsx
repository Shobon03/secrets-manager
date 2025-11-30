import {
  HardDriveDownload,
  HardDriveUpload,
  Moon,
  Palette,
  Settings,
  Sun,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTheme } from './theme-provider';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Label } from './ui/label';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Separator } from './ui/separator';
import { Spinner } from './ui/spinner';
import { useZoom } from './zoom-provider';

type SettingsSection = 'appearance' | 'export-import';

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onExport: () => void;
  onImport: () => void;
  isExporting: boolean;
  isImporting: boolean;
}

export function SettingsDialog({
  open,
  onOpenChange,
  onExport,
  onImport,
  isExporting,
  isImporting,
}: SettingsDialogProps) {
  const [currentSection, setCurrentSection] =
    useState<SettingsSection>('appearance');
  const { theme, setTheme } = useTheme();
  const { zoomLevel, zoomIn, zoomOut, resetZoom, canZoomIn, canZoomOut } =
    useZoom();

  // Listener para atualizar o modal quando usar atalhos de teclado
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === '+' || e.key === '=')) {
        e.preventDefault();
        zoomIn();
      } else if ((e.ctrlKey || e.metaKey) && e.key === '-') {
        e.preventDefault();
        zoomOut();
      } else if ((e.ctrlKey || e.metaKey) && e.key === '0') {
        e.preventDefault();
        resetZoom();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, zoomIn, zoomOut, resetZoom]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='flex min-h-[550px] max-w-2xl! flex-col gap-0 p-0'>
        <DialogHeader className='shrink-0 border-b px-6 py-4'>
          <DialogTitle className='flex items-center gap-2 text-base'>
            <Settings className='size-5' />
            Configurações
          </DialogTitle>
        </DialogHeader>

        <div className='flex min-h-0 flex-1'>
          {/* Sidebar */}
          <div className='flex w-56 shrink-0 flex-col border-r bg-muted/30 p-4'>
            <nav className='space-y-6'>
              {/* Geral */}
              <div>
                <h3 className='mb-2 px-2 font-semibold text-muted-foreground text-xs uppercase'>
                  Geral
                </h3>
                <button
                  type='button'
                  onClick={() => setCurrentSection('appearance')}
                  className={`flex w-full cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors ${
                    currentSection === 'appearance'
                      ? 'bg-primary text-primary-foreground'
                      : 'hover:bg-muted'
                  }`}
                >
                  <Palette className='size-4' />
                  Aparência
                </button>
              </div>

              {/* Dados */}
              <div>
                <h3 className='mb-2 px-2 font-semibold text-muted-foreground text-xs uppercase'>
                  Dados
                </h3>
                <button
                  type='button'
                  onClick={() => setCurrentSection('export-import')}
                  className={`flex w-full cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors ${
                    currentSection === 'export-import'
                      ? 'bg-primary text-primary-foreground'
                      : 'hover:bg-muted'
                  }`}
                >
                  <HardDriveUpload className='size-4' />
                  Gerenciar
                </button>
              </div>
            </nav>
          </div>

          {/* Content */}
          <div className='flex-1 overflow-y-auto p-6'>
            {currentSection === 'appearance' && (
              <div className='space-y-6'>
                <div>
                  <h2 className='mb-1 font-semibold text-lg'>Aparência</h2>
                  <p className='text-muted-foreground text-sm'>
                    Personalize a aparência do aplicativo
                  </p>
                </div>

                <Separator />

                <div className='space-y-4'>
                  <div>
                    <Label className='text-base'>Tema</Label>
                    <p className='mb-3 text-muted-foreground text-sm'>
                      Escolha o tema do aplicativo
                    </p>

                    <RadioGroup
                      value={theme}
                      onValueChange={(value) =>
                        setTheme(value as 'light' | 'dark')
                      }
                      className='space-y-2'
                    >
                      <div className='flex cursor-pointer items-center space-x-3 rounded-lg border p-3 transition-colors hover:bg-muted/50'>
                        <RadioGroupItem
                          className='cursor-pointer'
                          value='light'
                          id='light'
                        />
                        <Label
                          htmlFor='light'
                          className='flex flex-1 cursor-pointer items-center gap-2'
                        >
                          <Sun className='size-4' />
                          <div>
                            <div className='font-medium'>Claro</div>
                            <div className='text-muted-foreground text-xs'>
                              Tema claro para ambientes iluminados
                            </div>
                          </div>
                        </Label>
                      </div>

                      <div className='flex cursor-pointer items-center space-x-3 rounded-lg border p-3 transition-colors hover:bg-muted/50'>
                        <RadioGroupItem
                          className='cursor-pointer'
                          value='dark'
                          id='dark'
                        />
                        <Label
                          htmlFor='dark'
                          className='flex flex-1 cursor-pointer items-center gap-2'
                        >
                          <Moon className='size-4' />
                          <div>
                            <div className='font-medium'>Escuro</div>
                            <div className='text-muted-foreground text-xs'>
                              Tema escuro para reduzir o cansaço visual
                            </div>
                          </div>
                        </Label>
                      </div>

                      {/*<div className='flex items-center space-x-3 border rounded-lg p-3 hover:bg-muted/50 transition-colors cursor-pointer'>
                        <RadioGroupItem
                          className='cursor-pointer'
                          value='system'
                          id='system'
                        />
                        <Label
                          htmlFor='system'
                          className='flex items-center gap-2 cursor-pointer flex-1'
                        >
                          <Monitor className='size-4' />
                          <div>
                            <div className='font-medium'>Sistema</div>
                            <div className='text-xs text-muted-foreground'>
                              Sincronizar com as preferências do sistema
                            </div>
                          </div>
                        </Label>
                      </div>*/}
                    </RadioGroup>
                  </div>

                  <Separator />

                  <div>
                    <Label className='text-base'>Zoom</Label>
                    <p className='mb-3 text-muted-foreground text-sm'>
                      Ajuste o tamanho da interface
                    </p>

                    <div className='flex items-center gap-3'>
                      <Button
                        variant='outline'
                        size='icon'
                        onClick={zoomOut}
                        disabled={!canZoomOut}
                        title='Diminuir zoom (Ctrl/Cmd + -)'
                      >
                        <ZoomOut className='size-4' />
                      </Button>

                      <div className='flex-1 text-center'>
                        <span className='font-semibold text-lg'>
                          {Math.round(zoomLevel * 100)}%
                        </span>
                        <p className='text-muted-foreground text-xs'>
                          1x · 1.2x · 1.5x · 2x
                        </p>
                      </div>

                      <Button
                        variant='outline'
                        size='icon'
                        onClick={zoomIn}
                        disabled={!canZoomIn}
                        title='Aumentar zoom (Ctrl/Cmd + +)'
                      >
                        <ZoomIn className='size-4' />
                      </Button>
                    </div>

                    {zoomLevel !== 1 && (
                      <Button
                        variant='ghost'
                        size='sm'
                        onClick={resetZoom}
                        className='mt-2 w-full'
                      >
                        Redefinir para 100%
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {currentSection === 'export-import' && (
              <div className='space-y-6'>
                <div>
                  <h2 className='mb-1 font-semibold text-lg'>
                    Exportação/Importação
                  </h2>
                  <p className='text-muted-foreground text-sm'>
                    Faça backup ou restaure seus dados
                  </p>
                </div>

                <Separator />

                <div className='space-y-6'>
                  {/* Exportação */}
                  <div className='space-y-3'>
                    <div>
                      <h3 className='mb-1 font-medium'>Exportar Cofre</h3>
                      <p className='text-muted-foreground text-sm'>
                        Crie um backup criptografado de todos os seus segredos e
                        projetos
                      </p>
                    </div>
                    <Button
                      onClick={onExport}
                      disabled={isExporting || isImporting}
                      className='w-full sm:w-auto'
                    >
                      {isExporting ? (
                        <>
                          <Spinner className='mr-2 size-4' />
                          Exportando...
                        </>
                      ) : (
                        <>
                          <HardDriveUpload className='mr-2 size-4' />
                          Exportar Cofre
                        </>
                      )}
                    </Button>
                  </div>

                  <Separator />

                  {/* Importação */}
                  <div className='space-y-3'>
                    <div>
                      <h3 className='mb-1 font-medium'>Importar Cofre</h3>
                      <p className='text-muted-foreground text-sm'>
                        Restaure seus dados a partir de um backup
                      </p>
                    </div>
                    <Button
                      onClick={onImport}
                      variant='outline'
                      disabled={isExporting || isImporting}
                      className='w-full sm:w-auto'
                    >
                      {isImporting ? (
                        <>
                          <Spinner className='mr-2 size-4' />
                          Importando...
                        </>
                      ) : (
                        <>
                          <HardDriveDownload className='mr-2 size-4' />
                          Importar Cofre
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
