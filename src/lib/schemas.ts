import { z } from 'zod';

export const secretSchema = z.object({
  title: z.string().trim().min(1, { message: 'O título é obrigatório' }),
  username: z.string().trim().optional().default(''),
  password: z.string().min(1, { message: 'A senha é obrigatória' }),
  projectId: z.coerce.number().optional(),
});

export const projectSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, { message: 'O nome do projeto é obrigatório' }),
  description: z.string().trim().optional(),
});

export const vaultSchema = z.object({
  password: z
    .string()
    .min(6, { message: 'A senha deve ter no mínimo 6 caracteres' }),
});

export type SecretSchema = z.infer<typeof secretSchema>;
export type ProjectSchema = z.infer<typeof projectSchema>;
export type VaultSchema = z.infer<typeof vaultSchema>;
