import { invoke } from '@tauri-apps/api/core';
import type { Secret } from '../types';

// Cache para gerenciar o estado da Promise
let secretsCache: Promise<Secret[]> | null = null;
let secretsData: Secret[] | null = null;

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

export function invalidateSecretsCache() {
  secretsCache = null;
  secretsData = null;
}

export function getSecretsFromCache(): Secret[] | null {
  return secretsData;
}

export async function createSecret(
  title: string,
  username: string,
  password: string,
): Promise<Secret> {
  return await invoke<Secret>('create_secret', {
    title,
    username,
    password,
  });
}

export async function updateSecret(
  id: number,
  title: string,
  username: string,
  password: string,
): Promise<void> {
  const updateData = { title, username, password, id };
  await invoke<void>('update_secret', updateData);
}

export async function deleteSecret(id: number): Promise<void> {
  await invoke<void>('delete_secret', { id });
}
