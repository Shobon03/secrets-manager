import { invoke } from '@tauri-apps/api/core';
import { Eye, EyeOff, Lock, Plus } from 'lucide-react';
import { Suspense, use, useActionState, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { ThemeProvider } from './components/theme-provider';
import { TitleBar } from './components/title-bar';
import { Button } from './components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from './components/ui/card';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from './components/ui/input-group';
import { Label } from './components/ui/label';
import { Toaster } from './components/ui/sonner';
import { useZoom, ZoomProvider } from './components/zoom-provider';
import { useAutoLock } from './hooks/useAutoLock';
import { vaultSchema } from './lib/schemas';
import { Dashboard } from './routes/Dashboard';

import './assets/css/global.css';

interface FormState {
  status: string;
  success: boolean;
}

// Cache para o vault status
let vaultStatusCache: Promise<boolean> | null = null;

function getVaultStatusPromise(): Promise<boolean> {
  if (!vaultStatusCache) {
    vaultStatusCache = invoke<boolean>('check_vault_status');
  }
  return vaultStatusCache;
}

// Componente que suspende para verificar status do vault
function VaultStatus({
  onStatusLoaded,
}: {
  onStatusLoaded: (hasVault: boolean) => void;
}) {
  const hasVault = use(getVaultStatusPromise());

  // Use useEffect to avoid setState during render
  useEffect(() => {
    onStatusLoaded(hasVault);
  }, [hasVault, onStatusLoaded]);

  return null;
}

// Componente para gerenciar atalhos de zoom
function ZoomKeyboardShortcuts() {
  const { zoomIn, zoomOut, resetZoom } = useZoom();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + Plus/Equal (aumentar zoom)
      if ((e.ctrlKey || e.metaKey) && (e.key === '+' || e.key === '=')) {
        e.preventDefault();
        zoomIn();
      }
      // Ctrl/Cmd + Minus (diminuir zoom)
      else if ((e.ctrlKey || e.metaKey) && e.key === '-') {
        e.preventDefault();
        zoomOut();
      }
      // Ctrl/Cmd + 0 (resetar zoom)
      else if ((e.ctrlKey || e.metaKey) && e.key === '0') {
        e.preventDefault();
        resetZoom();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [zoomIn, zoomOut, resetZoom]);

  return null;
}

function App() {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Estado para saber se é Login ou Cadastro
  const [hasVault, setHasVault] = useState<boolean | null>(null);

  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useAutoLock(isLoggedIn, () => {
    setIsLoggedIn(false);
    setPassword('');
  });

  async function handleSubmitAction(
    _prevState: FormState,
    formData: FormData,
  ): Promise<FormState> {
    const rawData = { password: formData.get('password') };
    const validation = vaultSchema.safeParse(rawData);

    if (!validation.success) {
      const errorMessage = validation.error.issues[0].message;
      toast.error(errorMessage);
      return { status: '', success: false };
    }

    const { password: passwordValue } = validation.data;

    try {
      if (hasVault) {
        // Fluxo de Login
        await invoke<void>('unlock_vault', { password: passwordValue });
        setIsLoggedIn(true);
        setPassword('');
        toast.success('Cofre aberto com sucesso!');
        return { status: '', success: true };
      }
      // Fluxo de Criação (Setup)
      await invoke<void>('setup_vault', { password: passwordValue });
      setHasVault(true);
      setIsLoggedIn(true);
      setPassword('');
      toast.success('Cofre criado com sucesso!');
      return { status: '', success: true };
    } catch (error) {
      console.error(error);
      toast.error(`Erro: ${error}`);
      return { status: '', success: false };
    }
  }

  const [_formState, formAction, isPending] = useActionState<
    FormState,
    FormData
  >(handleSubmitAction, { status: '', success: false });

  return (
    <ThemeProvider defaultTheme='dark' storageKey='vite-ui-theme'>
      <ZoomProvider>
        <ZoomKeyboardShortcuts />
        <div className='flex h-screen flex-col overflow-hidden'>
          <TitleBar />

          <div className='relative flex flex-1 flex-col overflow-hidden'>
            <Suspense
              fallback={
                <div className='flex h-full items-center justify-center pt-10'>
                  <p>Carregando...</p>
                </div>
              }
            >
              <VaultStatus onStatusLoaded={setHasVault} />
            </Suspense>

            {isLoggedIn && (
              <Suspense
                fallback={
                  <div className='flex h-full items-center justify-center'>
                    <p>Carregando Dashboard...</p>
                  </div>
                }
              >
                <Dashboard
                  onLogout={() => {
                    setIsLoggedIn(false);
                    setPassword('');
                  }}
                />
              </Suspense>
            )}

            {!isLoggedIn && hasVault !== null && (
              <div className='flex h-full items-center justify-center p-4'>
                <Card className='w-full max-w-md'>
                  <CardHeader>
                    <CardTitle className='flex items-center gap-2 text-2xl'>
                      {hasVault ? (
                        <>
                          <Lock className='h-6 w-6' />
                          Login no Cofre
                        </>
                      ) : (
                        <>
                          <Plus className='h-6 w-6' />
                          Criar Novo Cofre
                        </>
                      )}
                    </CardTitle>
                    <CardDescription>
                      {hasVault
                        ? 'Digite sua Senha Mestra para abrir.'
                        : 'Defina uma Senha Mestra para criptografar seus dados.'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form action={formAction} className='space-y-4' noValidate>
                      <div className='space-y-2'>
                        <Label htmlFor='password'>Senha Mestra</Label>
                        <InputGroup>
                          <InputGroupInput
                            id='password'
                            name='password'
                            type={showPassword ? 'text' : 'password'}
                            placeholder='Digite sua senha (mínimo 6 caracteres)'
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            disabled={isPending}
                          />
                          <InputGroupAddon align='inline-end'>
                            <InputGroupButton
                              size='icon-xs'
                              onClick={() => setShowPassword(!showPassword)}
                              type='button'
                            >
                              {showPassword ? (
                                <EyeOff className='size-4' />
                              ) : (
                                <Eye className='size-4' />
                              )}
                            </InputGroupButton>
                          </InputGroupAddon>
                        </InputGroup>
                      </div>
                      <Button
                        type='submit'
                        className='w-full'
                        disabled={isPending || password.length < 6}
                      >
                        {isPending
                          ? 'Processando...'
                          : hasVault
                            ? 'Abrir Cofre'
                            : 'Criar Cofre'}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </div>

        <Toaster />
      </ZoomProvider>
    </ThemeProvider>
  );
}

export default App;
