import { invoke } from '@tauri-apps/api/core';
import type { Project } from '../types';

// Cache for Promise management
let projectsCache: Promise<Project[]> | null = null;
let projectsData: Project[] | null = null;

export function loadProjectsPromise(): Promise<Project[]> {
  if (!projectsCache) {
    projectsCache = invoke<Project[]>('get_all_projects').then((data) => {
      projectsData = data;
      return data;
    });
  }
  return projectsCache;
}

export function invalidateProjectsCache() {
  projectsCache = null;
  projectsData = null;
}

export function getProjectsFromCache(): Project[] | null {
  return projectsData;
}

export async function createProject(
  name: string,
  description?: string,
): Promise<number> {
  return await invoke<number>('create_project', {
    name,
    description,
  });
}

export async function updateProject(
  id: number,
  name: string,
  description?: string,
): Promise<void> {
  await invoke<void>('update_project', {
    id,
    name,
    description,
  });
}

export async function deleteProject(id: number): Promise<void> {
  await invoke<void>('delete_project', { id });
}
