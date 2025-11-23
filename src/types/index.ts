export interface Secret {
  id: number;
  title: string;
  username: string;
  password?: string;
}

export interface AttachmentMetadata {
  id: number;
  secretId: number;
  filename: string;
  mimeType: string;
  fileSize: number;
  createdAt: string;
}
