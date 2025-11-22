import { invoke } from '@tauri-apps/api/core';
import { Lock } from 'lucide-react';
import { useEffect, useState } from 'react';
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
import { Input } from './components/ui/input';
import { Label } from './components/ui/label';
import { Toaster } from './components/ui/sonner';
import { useAutoLock } from './hooks/useAutoLock';
import { Dashboard } from './routes/Dashboard';

import './App.css';

function App() {
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Estado para saber se é Login ou Cadastro
  const [hasVault, setHasVault] = useState<boolean | null>(null);

  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useAutoLock(isLoggedIn, () => {
    setIsLoggedIn(false);
    setPassword('');
    setStatus('💤 Sessão expirada por inatividade.');
  });

  // Ao iniciar, pergunta ao Rust se já existe um cofre
  useEffect(() => {
    checkStatus();
  }, []);

  async function checkStatus() {
    try {
      const exists = await invoke('check_vault_status');
      setHasVault(exists as boolean);
    } catch (e) {
      setStatus(`Erro ao verificar status: ${e}`);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!password) return;
    setIsLoading(true);
    setStatus('Processando criptografia...');

    try {
      if (hasVault) {
        // Fluxo de Login
        await invoke('unlock_vault', { password });
        setStatus('🔓 Cofre Aberto!');
        setIsLoggedIn(true);
      } else {
        // Fluxo de Criação (Setup)
        await invoke('setup_vault', { password });
        setStatus('✅ Cofre Criado e Aberto!');
        setHasVault(true); // Agora existe um cofre
        setIsLoggedIn(true);
      }
    } catch (error) {
      console.error(error);
      setStatus(`❌ Erro: ${error}`);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <ThemeProvider defaultTheme='dark' storageKey='vite-ui-theme'>
      <TitleBar />

      {isLoggedIn ? (
        <div className='pt-10'>
          <div className='fixed bottom-4 right-4 z-40'>
            <Button
              variant='outline'
              size='icon'
              onClick={() => {
                setIsLoggedIn(false);
                setPassword('');
                setStatus('💤 Sessão fechada.');
              }}
              title='Trancar cofre'
            >
              <Lock className='h-5 w-5' />
            </Button>
          </div>
          <Dashboard />
        </div>
      ) : hasVault === null ? (
        <div className='flex items-center justify-center min-h-screen pt-10'>
          <p>Carregando...</p>
        </div>
      ) : (
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
              <form onSubmit={handleSubmit} className='space-y-4'>
                <div className='space-y-2'>
                  <Label htmlFor='password'>Senha Mestra</Label>
                  <Input
                    id='password'
                    type='password'
                    placeholder='Digite sua senha...'
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading}
                    required
                  />
                </div>
                <Button type='submit' className='w-full' disabled={isLoading}>
                  {isLoading
                    ? 'Processando...'
                    : hasVault
                      ? 'Abrir Cofre'
                      : 'Criar Cofre'}
                </Button>
                {status && (
                  <p className='text-sm text-center text-muted-foreground mt-2'>
                    {status}
                  </p>
                )}
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
