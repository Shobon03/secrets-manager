import { invoke } from '@tauri-apps/api/core';
import { writeText } from '@tauri-apps/plugin-clipboard-manager';
import { open, save } from '@tauri-apps/plugin-dialog';
import {
  Copy,
  Edit,
  HardDriveDownload,
  HardDriveUpload,
  Plus,
  Trash,
  Trash2,
} from 'lucide-react';
import { useEffect, useState } from 'react';

// Tipagem igual à Struct do Rust
interface Secret {
  id: number;
  title: string;
  username: string;
  password?: string; // Opcional na visualização se quisermos esconder
}

export function Dashboard() {
  const [secrets, setSecrets] = useState<Secret[]>([]);
  const [form, setForm] = useState({ title: '', username: '', password: '' });

  const [isCreateSecret, setIsCreateSecret] = useState(false);

  const [isEditSecret, setIsEditSecret] = useState(false);
  const [editSecretId, setEditSecretId] = useState<number | null>(null);

  // Carrega a lista ao abrir
  useEffect(() => {
    loadSecrets();
  }, []);

  useEffect(() => {
    if (isEditSecret) {
      // Editando
      const editSecret = secrets.find((s) => s.id === editSecretId);
      if (editSecret) {
        setForm({
          title: editSecret.title,
          username: editSecret.username,
          password: editSecret.password ?? '',
        });
      }
    }
  }, [isEditSecret, editSecretId]);

  async function loadSecrets() {
    try {
      const data = await invoke<Secret[]>('get_all_secrets');
      setSecrets(data);
    } catch (e) {
      alert(`Erro ao carregar: ${e}`);
    }
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    try {
      await invoke('create_secret', form);
      // Limpa formulário e recarrega lista
      setForm({ title: '', username: '', password: '' });
      loadSecrets();
      setIsCreateSecret(false);
    } catch (e) {
      alert(`Erro ao salvar: ${e}`);
    }
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault();
    try {
      const updateData = { ...form, id: editSecretId };

      await invoke('update_secret', updateData);
      // Limpa formulário e recarrega lista
      setForm({ title: '', username: '', password: '' });
      loadSecrets();
      setEditSecretId(null);
      setIsEditSecret(false);
    } catch (e) {
      alert(`Erro ao editar: ${e}`);
    }
  }

  async function handleDelete(id: number) {
    try {
      await invoke('delete_secret', { id });
      // Limpa formulário e recarrega lista
      setForm({ title: '', username: '', password: '' });
      loadSecrets();
    } catch (e) {
      alert(`Erro ao deletar: ${e}`);
    }
  }

  async function copyToClipboard(text: string) {
    try {
      await writeText(text);
      alert('Texto copiado para a área de transferência');
    } catch (e) {
      alert(`Erro ao copiar: ${e}`);
    }
  }

  async function handleExport() {
    const passwordConfirm = prompt('Confirme a sua senha para exportar');
    if (!passwordConfirm) return;

    try {
      const filePath = await save({
        filters: [
          {
            name: 'Backupo Criptografado',
            extensions: ['enc', 'json'],
          },
        ],
        defaultPath: 'meus_segredos_backup.enc',
      });

      if (!filePath) return;

      await invoke('export_vault', {
        filePath,
        password: passwordConfirm,
      });

      alert('Backup exportado com sucesso!');
    } catch (e) {
      console.error(e);
      alert(`Erro ao exportar: ${e}`);
    }
  }

  async function handleImport() {
    try {
      const filePath = await open({
        multiple: false,
        filters: [
          {
            name: 'Backupo Criptografado',
            extensions: ['enc', 'json'],
          },
        ],
      });

      if (!filePath) return;

      const passwordConfirm = prompt('Confirme a sua senha para importar');
      if (!passwordConfirm) return;

      const msg = await invoke('import_vault', {
        filePath: filePath,
        password: passwordConfirm,
      });

      alert(msg);

      loadSecrets();
    } catch (e) {
      console.error(e);
      alert(`Erro ao importar: ${e}`);
    }
  }

  return (
    <div className='dashboard'>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <h2>🔐 Meus Segredos</h2>
        <div
          style={{
            display: 'flex',
            gap: 10,
            alignItems: 'center',
          }}
        >
          <button
            type='button'
            onClick={() => {
              handleImport();
            }}
            style={{
              padding: 10,
              gap: 10,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 16,
            }}
            title='Importar Cofre'
          >
            <HardDriveUpload size={24} />
          </button>
          <button
            type='button'
            onClick={() => {
              handleExport();
            }}
            style={{
              padding: 10,
              gap: 10,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 16,
            }}
            title='Exportar Cofre'
          >
            <HardDriveDownload size={24} />
          </button>
          <button
            type='button'
            onClick={() => {
              setIsCreateSecret((prev) => !prev);
            }}
            style={{
              padding: 10,
              gap: 10,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 16,
            }}
            title='Novo login'
          >
            <Plus size={24} />
          </button>
        </div>
      </div>

      {/* Formulário de Adição/Edição */}
      {(isCreateSecret || isEditSecret) && (
        <div className='card'>
          <h3>{isEditSecret ? 'Editar' : 'Novo'} Login</h3>
          <form
            onSubmit={isEditSecret ? handleEdit : handleAdd}
            style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}
          >
            <input
              placeholder='Título (ex: Google)'
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
            />
            <input
              placeholder='Usuário'
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
            />
            <input
              placeholder='Senha'
              type='password'
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
            />
            <button type='submit'>Salvar</button>
          </form>
        </div>
      )}

      {!isEditSecret && (
        <div className='list'>
          {secrets.map((s) => (
            <div
              key={s.id}
              className='item'
              style={{
                borderBottom: '1px solid #444',
                padding: '10px',
                display: 'flex',
                gap: '10px',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <strong>{s.title}</strong>
                <br />
                <div
                  style={{
                    display: 'flex',
                    gap: '10px',
                    alignItems: 'center',
                  }}
                >
                  <small>User: {s.username}</small>

                  <button
                    type='button'
                    style={{
                      padding: 5,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                    onClick={() => {
                      copyToClipboard(s.username);
                    }}
                    title='Copiar'
                  >
                    <Copy size={16} />
                  </button>
                </div>
                <div
                  style={{
                    display: 'flex',
                    gap: '10px',
                    alignItems: 'center',
                  }}
                >
                  <small>
                    Pass:{' '}
                    <span title={s.password}>
                      {Array(s.password?.length || 1)
                        .fill('•')
                        .toString()
                        .replace(/,/g, '')}{' '}
                      (Passe o mouse)
                    </span>
                  </small>
                  <button
                    type='button'
                    style={{
                      padding: 5,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                    onClick={() => {
                      copyToClipboard(s.password ?? '');
                    }}
                    title='Copiar'
                  >
                    <Copy size={16} />
                  </button>
                </div>
              </div>
              <div
                style={{
                  display: 'flex',
                  gap: 5,
                }}
              >
                <button
                  type='button'
                  style={{
                    padding: 10,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  onClick={() => {
                    setIsEditSecret(true);
                    setEditSecretId(s.id);
                  }}
                  title='Editar'
                >
                  <Edit size={16} />
                </button>
                <button
                  type='button'
                  style={{
                    padding: 10,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: '#ff1a1a',
                    color: '#fff',
                  }}
                  onClick={() => {
                    handleDelete(s.id);
                  }}
                  title='Excluir'
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
          {secrets.length === 0 && <p>Nenhum segredo salvo ainda.</p>}
        </div>
      )}
    </div>
  );
}
