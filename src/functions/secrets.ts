import { invoke } from '@tauri-apps/api/core';
import type { Secret } from '../types';

// Cache para gerenciar o estado da Promise
let secretsCache: Promise<Secret[]> | null = null;
let secretsData: Secret[] | null = null;

let deletedSecretsCache: Promise<Secret[]> | null = null;
let deletedSecretsData: Secret[] | null = null;

export function loadSecretsPromise(): Promise<Secret[]> {
  if (!secretsCache) {
    secretsCache = invoke<Secret[]>('get_all_secrets').then((data) => {
      console.log(data);
      secretsData = data;
      return data;
    });
  }
  return secretsCache;
}

export function loadDeletedSecretsPromise(): Promise<Secret[]> {
  if (!deletedSecretsCache) {
    deletedSecretsCache = invoke<Secret[]>('get_deleted_secrets').then(
      (data) => {
        deletedSecretsData = data;
        return data;
      },
    );
  }
  return deletedSecretsCache;
}

export function invalidateSecretsCache() {
  secretsCache = null;
  secretsData = null;
  deletedSecretsCache = null;
  deletedSecretsData = null;
}

export function getSecretsFromCache(): Secret[] | null {
  return secretsData;
}

export function getDeletedSecretsFromCache(): Secret[] | null {
  return deletedSecretsData;
}

export async function createSecret(
  title: string,
  username: string,
  password: string,
  projectId?: number,
): Promise<Secret> {
  return await invoke<Secret>('create_secret', {
    title,
    username,
    password,
    projectId,
  });
}

export async function updateSecret(
  id: number,
  title: string,
  username: string,
  password: string,
  projectId?: number,
): Promise<void> {
  const updateData = { title, username, password, id, projectId };
  await invoke<void>('update_secret', updateData);
}

export async function softDeleteSecret(id: number): Promise<void> {
  await invoke<void>('soft_delete_secret', { id });
}

export async function deleteSecret(id: number): Promise<void> {
  await invoke<void>('delete_secret', { id });
}

export async function restoreSecret(id: number): Promise<void> {
  await invoke<void>('restore_secret', { id });
}
