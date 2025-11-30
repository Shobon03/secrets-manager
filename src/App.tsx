import { invoke } from '@tauri-apps/api/core';
import { Eye, EyeOff, Lock } from 'lucide-react';
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
      const errorMessage = validation.error.errors[0].message;
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
      <TitleBar />

      <Suspense
        fallback={
          <div className='flex items-center justify-center min-h-screen pt-10'>
            <p>Carregando...</p>
          </div>
        }
      >
        <VaultStatus onStatusLoaded={setHasVault} />
      </Suspense>

      {isLoggedIn && (
        <>
          <div className='fixed bottom-4 right-4 z-40'>
            <Button
              variant='outline'
              size='icon'
              onClick={() => {
                setIsLoggedIn(false);
                setPassword('');
              }}
              title='Trancar cofre'
              className='w-10 h-10'
            >
              <Lock className='h-5! w-5!' />
            </Button>
          </div>
          <Suspense
            fallback={
              <div className='flex items-center justify-center min-h-screen'>
                <p>Carregando Dashboard...</p>
              </div>
            }
          >
            <Dashboard />
          </Suspense>
        </>
      )}

      {!isLoggedIn && hasVault !== null && (
        <div className='flex items-center justify-center min-h-screen p-4 pt-10'>
          <Card className='w-full max-w-md'>
            <CardHeader>
              <CardTitle className='text-2xl'>
                {hasVault ? '🔐 Login no Cofre' : '🆕 Criar Novo Cofre'}
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
                      placeholder='Digite sua senha... (mínimo 6 caracteres)'
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

      <Toaster />
    </ThemeProvider>
  );
}

export default App;
