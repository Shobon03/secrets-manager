import { invoke } from '@tauri-apps/api/core';
import { open, save } from '@tauri-apps/plugin-dialog';
import { readFile, writeFile } from '@tauri-apps/plugin-fs';
import {
  DownloadIcon,
  FileIcon,
  PaperclipIcon,
  Trash2Icon,
} from 'lucide-react';
import { Suspense, use, useEffect, useImperativeHandle, useState } from 'react';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import type { AttachmentMetadata } from '@/types';

interface AttachmentsManagerProps {
  secretId: number | null;
  ref?: React.Ref<AttachmentsManagerRef>;
  setIsAttachmentDialogOpen: (open: boolean) => void;
}

interface PendingAttachment {
  file: File;
  id: string;
}

export interface AttachmentsManagerRef {
  savePendingAttachments: (secretId: number) => Promise<void>;
  hasPendingAttachments: () => boolean;
}

// Cache para attachments por secretId
const attachmentsCache = new Map<number, Promise<AttachmentMetadata[]>>();

function getAttachmentsPromise(
  secretId: number,
): Promise<AttachmentMetadata[]> {
  if (!attachmentsCache.has(secretId)) {
    const promise = invoke<AttachmentMetadata[]>('get_attachments_metadata', {
      secretId,
    });
    attachmentsCache.set(secretId, promise);
  }
  return attachmentsCache.get(secretId) as Promise<AttachmentMetadata[]>;
}

function invalidateAttachmentsCache(secretId: number) {
  attachmentsCache.delete(secretId);
}

// Componente que suspende para carregar attachments
function AttachmentsList({
  secretId,
  onDownload,
  onDeleteClick,
}: {
  secretId: number;
  onDownload: (attachment: AttachmentMetadata) => Promise<void>;
  onDeleteClick: (id: number) => void;
}) {
  const attachments = use(getAttachmentsPromise(secretId));

  if (attachments.length === 0) {
    return <p className='text-muted-foreground text-sm'>Nenhum arquivo</p>;
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`;
  };

  return (
    <>
      {attachments.map((attachment) => (
        <div
          key={attachment.id}
          className='flex items-center justify-between gap-3 rounded-lg border bg-card p-3 transition-colors hover:bg-accent/50'
        >
          <div className='flex min-w-0 flex-1 items-center gap-3'>
            <FileIcon className='size-5 shrink-0 text-muted-foreground' />
            <div className='min-w-0 flex-1'>
              <p className='truncate font-medium text-sm'>
                {attachment.filename}
              </p>
              <p className='text-muted-foreground text-xs'>
                {formatFileSize(attachment.fileSize)}
              </p>
            </div>
          </div>
          <div className='flex shrink-0 items-center gap-1'>
            <Button
              type='button'
              variant='ghost'
              size='icon-sm'
              onClick={() => onDownload(attachment)}
              title='Baixar arquivo'
            >
              <DownloadIcon className='size-4' />
            </Button>
            <Button
              type='button'
              variant='ghost'
              size='icon-sm'
              onClick={() => onDeleteClick(attachment.id)}
              title='Remover arquivo'
            >
              <Trash2Icon className='size-4 text-destructive' />
            </Button>
          </div>
        </div>
      ))}
    </>
  );
}

export function AttachmentsManager({
  secretId,
  ref,
  setIsAttachmentDialogOpen,
}: AttachmentsManagerProps) {
  const [pendingAttachments, setPendingAttachments] = useState<
    PendingAttachment[]
  >([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null);

  const handleAddAttachment = async () => {
    if (isDialogOpen) {
      return;
    }

    try {
      setIsDialogOpen(true);

      const selected = await open({
        multiple: true,
        title: 'Selecionar Arquivos',
      });

      if (!selected) {
        setIsDialogOpen(false);
        return;
      }

      const filePaths = Array.isArray(selected) ? selected : [selected];
      setIsUploading(true);

      for (const path of filePaths) {
        const fileContent = await readFile(path);
        const fileName = path.split(/[\\/]/).pop() || 'arquivo';

        const ext = fileName.split('.').pop()?.toLowerCase();
        const mimeTypes: Record<string, string> = {
          txt: 'text/plain',
          json: 'application/json',
          xml: 'application/xml',
          csv: 'text/csv',
          log: 'text/plain',
          pdf: 'application/pdf',
          doc: 'application/msword',
          docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          png: 'image/png',
          jpg: 'image/jpeg',
          jpeg: 'image/jpeg',
          gif: 'image/gif',
          bmp: 'image/bmp',
          webp: 'image/webp',
          svg: 'image/svg+xml',
          zip: 'application/zip',
          rar: 'application/x-rar-compressed',
          '7z': 'application/x-7z-compressed',
          tar: 'application/x-tar',
          gz: 'application/gzip',
          pem: 'application/x-pem-file',
          key: 'application/x-pem-file',
          pub: 'application/x-pem-file',
          crt: 'application/x-x509-ca-cert',
          cer: 'application/x-x509-ca-cert',
          der: 'application/x-x509-ca-cert',
          p12: 'application/x-pkcs12',
          pfx: 'application/x-pkcs12',
          p7b: 'application/x-pkcs7-certificates',
          p7c: 'application/x-pkcs7-mime',
          csr: 'application/pkcs10',
          ppk: 'application/octet-stream',
          js: 'text/javascript',
          ts: 'text/typescript',
          py: 'text/x-python',
          java: 'text/x-java-source',
          cpp: 'text/x-c++src',
          c: 'text/x-csrc',
          h: 'text/x-chdr',
          rs: 'text/x-rustsrc',
          go: 'text/x-go',
          sh: 'application/x-sh',
          bat: 'application/x-bat',
          ps1: 'application/x-powershell',
        };
        const mimeType = mimeTypes[ext || ''] || 'application/octet-stream';

        const blob = new Blob([fileContent], { type: mimeType });
        const file = new File([blob], fileName, { type: mimeType });

        setPendingAttachments((prev) => [
          ...prev,
          { file, id: `${Date.now()}-${Math.random()}` },
        ]);
      }

      toast.success(`${filePaths.length} arquivo(s) adicionado(s)`);
    } catch (error) {
      console.error(error);
      toast.error('Erro ao selecionar arquivos');
    } finally {
      setIsUploading(false);
      setIsDialogOpen(false);
    }
  };

  const uploadFile = async (file: File, targetSecretId: number) => {
    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);

    await invoke<void>('add_attachment', {
      secretId: targetSecretId,
      filename: file.name,
      mimeType: file.type || 'application/octet-stream',
      content: Array.from(uint8Array),
    });
  };

  const savePendingAttachments = async (targetSecretId: number) => {
    if (pendingAttachments.length === 0) return;

    for (const pending of pendingAttachments) {
      await uploadFile(pending.file, targetSecretId);
    }
    setPendingAttachments([]);
    invalidateAttachmentsCache(targetSecretId);
    setRefreshKey((prev) => prev + 1);
  };

  const hasPendingAttachments = () => pendingAttachments.length > 0;

  useImperativeHandle(ref, () => ({
    savePendingAttachments,
    hasPendingAttachments,
  }));

  const handleDownload = async (attachment: AttachmentMetadata) => {
    try {
      // Abre o dialog do sistema para escolher onde salvar
      const filePath = await save({
        defaultPath: attachment.filename,
        filters: [
          {
            name: attachment.mimeType,
            extensions: [attachment.filename.split('.').pop() || '*'],
          },
        ],
      });

      if (!filePath) return; // Usuário cancelou

      const content = await invoke<number[]>('get_attachment_content', {
        attachmentId: attachment.id,
      });

      // Salva o arquivo no caminho escolhido
      const uint8Array = new Uint8Array(content);
      await writeFile(filePath, uint8Array);

      toast.success('Arquivo salvo com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar arquivo:', error);
      toast.error('Erro ao salvar arquivo. Verifique o console.');
    }
  };

  function handleDeleteClick(attachmentId: number) {
    setPendingDeleteId(attachmentId);
    setShowDeleteDialog(true);
  }

  async function confirmDelete() {
    if (secretId === null || pendingDeleteId === null) return;

    setShowDeleteDialog(false);

    try {
      await invoke<void>('delete_attachment', { id: pendingDeleteId });
      toast.success('Arquivo removido');
      invalidateAttachmentsCache(secretId);
      setRefreshKey((prev) => prev + 1);
    } catch (error) {
      toast.error(`Erro ao remover arquivo: ${error}`);
    } finally {
      setPendingDeleteId(null);
    }
  }

  const removePendingAttachment = (id: string) => {
    setPendingAttachments((prev) => prev.filter((p) => p.id !== id));
    toast.success('Arquivo removido');
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`;
  };

  const hasAnyAttachments = pendingAttachments.length > 0 || secretId !== null;

  useEffect(() => {
    setIsAttachmentDialogOpen(isDialogOpen);
  }, [setIsAttachmentDialogOpen, isDialogOpen]);

  return (
    <div className='space-y-2'>
      <div className='flex items-center justify-between'>
        <h3 className='font-medium text-sm'>Arquivos</h3>
        <Button
          type='button'
          variant='outline'
          size='sm'
          onClick={handleAddAttachment}
          disabled={isUploading || isDialogOpen}
        >
          <PaperclipIcon className='size-4' />
          {isUploading ? 'Selecionando...' : 'Adicionar'}
        </Button>
      </div>

      {!hasAnyAttachments && (
        <p className='text-muted-foreground text-sm'>Nenhum arquivo</p>
      )}

      {hasAnyAttachments && (
        <div className='space-y-2' key={refreshKey}>
          {/* Pending attachments */}
          {pendingAttachments.map((p) => (
            <div
              key={p.id}
              className='flex items-center justify-between gap-3 rounded-lg border bg-card p-3 transition-colors hover:bg-accent/50'
            >
              <div className='flex min-w-0 flex-1 items-center gap-3'>
                <FileIcon className='size-5 shrink-0 text-muted-foreground' />
                <div className='min-w-0 flex-1'>
                  <p className='truncate font-medium text-sm'>
                    {p.file.name}
                    <span className='ml-2 text-muted-foreground text-xs'>
                      (pendente)
                    </span>
                  </p>
                  <p className='text-muted-foreground text-xs'>
                    {formatFileSize(p.file.size)}
                  </p>
                </div>
              </div>
              <div className='flex shrink-0 items-center gap-1'>
                <Button
                  type='button'
                  variant='ghost'
                  size='icon-sm'
                  onClick={() => removePendingAttachment(p.id)}
                  title='Remover arquivo'
                >
                  <Trash2Icon className='size-4 text-destructive' />
                </Button>
              </div>
            </div>
          ))}

          {/* Saved attachments */}
          {secretId !== null && (
            <Suspense
              fallback={
                <p className='text-muted-foreground text-sm'>
                  Carregando arquivos...
                </p>
              }
            >
              <AttachmentsList
                secretId={secretId}
                onDownload={handleDownload}
                onDeleteClick={handleDeleteClick}
              />
            </Suspense>
          )}
        </div>
      )}

      {/* Dialog de Confirmação para Deletar Arquivo */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este arquivo? Esta ação não pode
              ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setPendingDeleteId(null)}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
