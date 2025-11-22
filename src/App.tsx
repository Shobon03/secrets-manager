import { invoke } from '@tauri-apps/api/core';
import { useEffect, useState } from 'react';
import { useAutoLock } from './hooks/useAutoLock';
import { Dashboard } from './routes/Dashboard';

import './App.css';
import { Lock } from 'lucide-react';

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

  if (isLoggedIn) {
    return (
      <div>
        <div style={{ position: 'absolute', bottom: 10, right: 10 }}>
          <button
            type='button'
            style={{
              padding: 10,
              gap: 10,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 16,
              backgroundColor: '#f4ca16 ',
            }}
            onClick={() => {
              setIsLoggedIn(false);
              setPassword('');
              setStatus('💤 Sessão fechada.');
            }}
            title='Trancar cofre'
          >
            <Lock size={24} />
          </button>
        </div>
        <Dashboard />
      </div>
    );
  }

  if (hasVault === null) return <p>Carregando...</p>;

  return (
    <main className='container'>
      <h1>{hasVault ? '🔐 Login no Cofre' : '🆕 Criar Novo Cofre'}</h1>

      <p>
        {hasVault
          ? 'Digite sua Senha Mestra para abrir.'
          : 'Defina uma Senha Mestra para criptografar seus dados.'}
      </p>

      <form className='row' onSubmit={handleSubmit}>
        <input
          onChange={(e) => setPassword(e.target.value)}
          placeholder='Senha Mestra...'
          type='password'
          disabled={isLoading}
        />
        <button type='submit' disabled={isLoading}>
          {isLoading ? 'Processando...' : hasVault ? 'Abrir' : 'Criar Cofre'}
        </button>
      </form>
      <p>{status}</p>
    </main>
  );
}

export default App;
