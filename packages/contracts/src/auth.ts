import { z } from 'zod';

export const RegisterSchema = z.object({
  email: z.string().trim().min(3).max(254).email(),
  password: z.string().min(8).max(128),
}).strict();

export const LoginSchema = z.object({
  email: z.string().trim().min(3).max(254).email(),
  password: z.string().min(1).max(128),
}).strict();

export type RegisterInput = z.infer<typeof RegisterSchema>;
export type LoginInput = z.infer<typeof LoginSchema>;
