import { invoke } from '@tauri-apps/api/core';
import { Eye, EyeOff, Lock, Plus } from 'lucide-react';
import { Suspense, use, useActionState, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '../components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../components/ui/card';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from '../components/ui/input-group';
import { Label } from '../components/ui/label';
import { vaultSchema } from '../lib/schemas';

interface LoginPageProps {
  onLogin: () => void;
}

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

export function LoginPage({ onLogin }: LoginPageProps) {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Estado para saber se é Login ou Cadastro
  const [hasVault, setHasVault] = useState<boolean | null>(null);

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
        setPassword('');
        onLogin();
        toast.success('Cofre aberto com sucesso!');
        return { status: '', success: true };
      }
      // Fluxo de Criação (Setup)
      await invoke<void>('setup_vault', { password: passwordValue });
      setHasVault(true);
      setPassword('');
      onLogin();
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
    <>
      <Suspense
        fallback={
          <div className='flex min-h-screen items-center justify-center pt-10'>
            <p>Carregando...</p>
          </div>
        }
      >
        <VaultStatus onStatusLoaded={setHasVault} />
      </Suspense>

      {hasVault !== null && (
        <div className='flex min-h-screen items-center justify-center p-4 pt-10'>
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
    </>
  );
}
