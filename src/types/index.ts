export interface Secret {
  id: number;
  title: string;
  username: string;
  password?: string;
  created_at: string;
  project_id?: number;
}

export interface AttachmentMetadata {
  id: number;
  secretId: number;
  filename: string;
  mimeType: string;
  fileSize: number;
  createdAt: string;
}

export interface Project {
  id: number;
  name: string;
  description?: string;
  createdAt: string;
}
