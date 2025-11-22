import { invoke } from '@tauri-apps/api/core';
import { writeText } from '@tauri-apps/plugin-clipboard-manager';
import { open, save } from '@tauri-apps/plugin-dialog';
import {
  Copy,
  Edit,
  HardDriveDownload,
  HardDriveUpload,
  Plus,
  Trash2,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '../components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Separator } from '../components/ui/separator';

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
      toast.error(`Erro ao carregar: ${e}`);
    }
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    try {
      await invoke('create_secret', form);
      setForm({ title: '', username: '', password: '' });
      loadSecrets();
      setIsCreateSecret(false);
      toast.success('Segredo criado com sucesso!');
    } catch (e) {
      toast.error(`Erro ao salvar: ${e}`);
    }
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault();
    try {
      const updateData = { ...form, id: editSecretId };
      await invoke('update_secret', updateData);
      setForm({ title: '', username: '', password: '' });
      loadSecrets();
      setEditSecretId(null);
      setIsEditSecret(false);
      toast.success('Segredo atualizado com sucesso!');
    } catch (e) {
      toast.error(`Erro ao editar: ${e}`);
    }
  }

  async function handleDelete(id: number) {
    try {
      await invoke('delete_secret', { id });
      setForm({ title: '', username: '', password: '' });
      loadSecrets();
      toast.success('Segredo deletado com sucesso!');
    } catch (e) {
      toast.error(`Erro ao deletar: ${e}`);
    }
  }

  async function copyToClipboard(text: string) {
    try {
      await writeText(text);
      toast.success('Copiado para a área de transferência!');
    } catch (e) {
      toast.error(`Erro ao copiar: ${e}`);
    }
  }

  async function handleExport() {
    const passwordConfirm = prompt('Confirme a sua senha para exportar');
    if (!passwordConfirm) return;

    try {
      const filePath = await save({
        filters: [
          {
            name: 'Backup Criptografado',
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

      toast.success('Backup exportado com sucesso!');
    } catch (e) {
      console.error(e);
      toast.error(`Erro ao exportar: ${e}`);
    }
  }

  async function handleImport() {
    try {
      const filePath = await open({
        multiple: false,
        filters: [
          {
            name: 'Backup Criptografado',
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

      toast.success(msg as string);
      loadSecrets();
    } catch (e) {
      console.error(e);
      toast.error(`Erro ao importar: ${e}`);
    }
  }

  return (
    <div className='container mx-auto p-6 max-w-6xl'>
      <div className='flex items-center justify-between mb-6'>
        <h2 className='text-3xl font-bold'>🔐 Meus Segredos</h2>
        <div className='flex gap-2'>
          <Button
            variant='outline'
            size='icon'
            onClick={handleImport}
            title='Importar Cofre'
          >
            <HardDriveUpload className='h-5 w-5' />
          </Button>
          <Button
            variant='outline'
            size='icon'
            onClick={handleExport}
            title='Exportar Cofre'
          >
            <HardDriveDownload className='h-5 w-5' />
          </Button>
          <Button
            variant='default'
            size='icon'
            onClick={() => setIsCreateSecret((prev) => !prev)}
            title='Novo login'
          >
            <Plus className='h-5 w-5' />
          </Button>
        </div>
      </div>

      {(isCreateSecret || isEditSecret) && (
        <Card className='mb-6'>
          <CardHeader>
            <CardTitle>{isEditSecret ? 'Editar' : 'Novo'} Login</CardTitle>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={isEditSecret ? handleEdit : handleAdd}
              className='space-y-4'
            >
              <div className='space-y-2'>
                <Label htmlFor='title'>Título</Label>
                <Input
                  id='title'
                  placeholder='Ex: Google, GitHub...'
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  required
                />
              </div>
              <div className='space-y-2'>
                <Label htmlFor='username'>Usuário</Label>
                <Input
                  id='username'
                  placeholder='email@exemplo.com'
                  value={form.username}
                  onChange={(e) =>
                    setForm({ ...form, username: e.target.value })
                  }
                />
              </div>
              <div className='space-y-2'>
                <Label htmlFor='password'>Senha</Label>
                <Input
                  id='password'
                  type='password'
                  placeholder='Digite a senha...'
                  value={form.password}
                  onChange={(e) =>
                    setForm({ ...form, password: e.target.value })
                  }
                  required
                />
              </div>
              <div className='flex gap-2'>
                <Button type='submit' className='flex-1'>
                  Salvar
                </Button>
                <Button
                  type='button'
                  variant='outline'
                  onClick={() => {
                    setIsCreateSecret(false);
                    setIsEditSecret(false);
                    setEditSecretId(null);
                    setForm({ title: '', username: '', password: '' });
                  }}
                >
                  Cancelar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {!isEditSecret && (
        <div className='space-y-4'>
          {secrets.map((s) => (
            <Card key={s.id}>
              <CardContent className='pt-6'>
                <div className='flex items-start justify-between'>
                  <div className='flex-1 space-y-3'>
                    <h3 className='text-xl font-semibold'>{s.title}</h3>
                    <Separator />
                    <div className='flex items-center gap-2'>
                      <span className='text-sm text-muted-foreground min-w-16'>
                        Usuário:
                      </span>
                      <span className='text-sm font-mono'>{s.username}</span>
                      <Button
                        variant='ghost'
                        size='icon'
                        className='h-8 w-8'
                        onClick={() => copyToClipboard(s.username)}
                        title='Copiar usuário'
                      >
                        <Copy className='h-4 w-4' />
                      </Button>
                    </div>
                    <div className='flex items-center gap-2'>
                      <span className='text-sm text-muted-foreground min-w-16'>
                        Senha:
                      </span>
                      <span className='text-sm font-mono' title={s.password}>
                        {Array(s.password?.length || 1)
                          .fill('•')
                          .toString()
                          .replace(/,/g, '')}
                      </span>
                      <Button
                        variant='ghost'
                        size='icon'
                        className='h-8 w-8'
                        onClick={() => copyToClipboard(s.password ?? '')}
                        title='Copiar senha'
                      >
                        <Copy className='h-4 w-4' />
                      </Button>
                    </div>
                  </div>
                  <div className='flex gap-2 ml-4'>
                    <Button
                      variant='outline'
                      size='icon'
                      onClick={() => {
                        setIsEditSecret(true);
                        setEditSecretId(s.id);
                      }}
                      title='Editar'
                    >
                      <Edit className='h-4 w-4' />
                    </Button>
                    <Button
                      variant='destructive'
                      size='icon'
                      onClick={() => handleDelete(s.id)}
                      title='Excluir'
                    >
                      <Trash2 className='h-4 w-4' />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          {secrets.length === 0 && (
            <Card>
              <CardContent className='py-12 text-center text-muted-foreground'>
                Nenhum segredo salvo ainda. Clique no botão + para adicionar seu
                primeiro login!
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
