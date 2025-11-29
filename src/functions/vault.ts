import { invoke } from '@tauri-apps/api/core';

export async function exportVault(
  filePath: string,
  password: string,
): Promise<void> {
  await invoke<void>('export_vault', {
    filePath,
    password,
  });
}

export async function importVault(
  filePath: string,
  password: string,
): Promise<string> {
  return await invoke<string>('import_vault', {
    filePath,
    password,
  });
}
