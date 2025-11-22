import { invoke } from '@tauri-apps/api/core';
import { useEffect, useState } from 'react';
import { Dashboard } from './Dashboard';

import './App.css';

function App() {
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Estado para saber se é Login ou Cadastro
  const [hasVault, setHasVault] = useState<boolean | null>(null);

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
      } else {
        // Fluxo de Criação (Setup)
        await invoke('setup_vault', { password });
        setStatus('✅ Cofre Criado e Aberto!');
        setHasVault(true); // Agora existe um cofre
      }
    } catch (error) {
      console.error(error);
      setStatus(`❌ Erro: ${error}`);
    } finally {
      setIsLoading(false);
    }
  }

  if (status.includes('Aberto') || status.includes('Sucesso')) {
    return <Dashboard />;
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
