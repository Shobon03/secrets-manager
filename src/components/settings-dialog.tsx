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
      <DialogContent className='max-w-2xl! min-h-[550px] p-0 gap-0 flex flex-col'>
        <DialogHeader className='px-6 py-4 border-b shrink-0'>
          <DialogTitle className='flex items-center gap-2 text-base'>
            <Settings className='size-5' />
            Configurações
          </DialogTitle>
        </DialogHeader>

        <div className='flex flex-1 min-h-0'>
          {/* Sidebar */}
          <div className='w-56 border-r bg-muted/30 p-4 shrink-0 flex flex-col'>
            <nav className='space-y-6'>
              {/* Geral */}
              <div>
                <h3 className='text-xs font-semibold text-muted-foreground uppercase mb-2 px-2'>
                  Geral
                </h3>
                <button
                  type='button'
                  onClick={() => setCurrentSection('appearance')}
                  className={`cursor-pointer w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-colors ${
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
                <h3 className='text-xs font-semibold text-muted-foreground uppercase mb-2 px-2'>
                  Dados
                </h3>
                <button
                  type='button'
                  onClick={() => setCurrentSection('export-import')}
                  className={`cursor-pointer w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-colors ${
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
          <div className='flex-1 p-6 overflow-y-auto'>
            {currentSection === 'appearance' && (
              <div className='space-y-6'>
                <div>
                  <h2 className='text-lg font-semibold mb-1'>Aparência</h2>
                  <p className='text-sm text-muted-foreground'>
                    Personalize a aparência do aplicativo
                  </p>
                </div>

                <Separator />

                <div className='space-y-4'>
                  <div>
                    <Label className='text-base'>Tema</Label>
                    <p className='text-sm text-muted-foreground mb-3'>
                      Escolha o tema do aplicativo
                    </p>

                    <RadioGroup
                      value={theme}
                      onValueChange={(value) =>
                        setTheme(value as 'light' | 'dark')
                      }
                      className='space-y-2'
                    >
                      <div className='flex items-center space-x-3 border rounded-lg p-3 hover:bg-muted/50 transition-colors cursor-pointer'>
                        <RadioGroupItem
                          className='cursor-pointer'
                          value='light'
                          id='light'
                        />
                        <Label
                          htmlFor='light'
                          className='flex items-center gap-2 cursor-pointer flex-1'
                        >
                          <Sun className='size-4' />
                          <div>
                            <div className='font-medium'>Claro</div>
                            <div className='text-xs text-muted-foreground'>
                              Tema claro para ambientes iluminados
                            </div>
                          </div>
                        </Label>
                      </div>

                      <div className='flex items-center space-x-3 border rounded-lg p-3 hover:bg-muted/50 transition-colors cursor-pointer'>
                        <RadioGroupItem
                          className='cursor-pointer'
                          value='dark'
                          id='dark'
                        />
                        <Label
                          htmlFor='dark'
                          className='flex items-center gap-2 cursor-pointer flex-1'
                        >
                          <Moon className='size-4' />
                          <div>
                            <div className='font-medium'>Escuro</div>
                            <div className='text-xs text-muted-foreground'>
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
                    <p className='text-sm text-muted-foreground mb-3'>
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
                        <span className='text-lg font-semibold'>
                          {Math.round(zoomLevel * 100)}%
                        </span>
                        <p className='text-xs text-muted-foreground'>
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
                        className='w-full mt-2'
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
                  <h2 className='text-lg font-semibold mb-1'>
                    Exportação/Importação
                  </h2>
                  <p className='text-sm text-muted-foreground'>
                    Faça backup ou restaure seus dados
                  </p>
                </div>

                <Separator />

                <div className='space-y-6'>
                  {/* Exportação */}
                  <div className='space-y-3'>
                    <div>
                      <h3 className='font-medium mb-1'>Exportar Cofre</h3>
                      <p className='text-sm text-muted-foreground'>
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
                          <Spinner className='size-4 mr-2' />
                          Exportando...
                        </>
                      ) : (
                        <>
                          <HardDriveUpload className='size-4 mr-2' />
                          Exportar Cofre
                        </>
                      )}
                    </Button>
                  </div>

                  <Separator />

                  {/* Importação */}
                  <div className='space-y-3'>
                    <div>
                      <h3 className='font-medium mb-1'>Importar Cofre</h3>
                      <p className='text-sm text-muted-foreground'>
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
                          <Spinner className='size-4 mr-2' />
                          Importando...
                        </>
                      ) : (
                        <>
                          <HardDriveDownload className='size-4 mr-2' />
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
