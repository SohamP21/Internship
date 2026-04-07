import { z } from 'zod';

export const registerSchema = z.object({
  name:  z.string().min(2, 'Name must be at least 2 characters').trim(),
  email: z.string().email('Invalid email address').toLowerCase(),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['participant', 'judge'], {
    errorMap: () => ({ message: 'Role must be participant or judge' }),
  }),
  judgeAccessCode: z.string().optional(),
});

export const loginSchema = z.object({
  email:    z.string().email('Invalid email address').toLowerCase(),
  password: z.string().min(1, 'Password is required'),
});

export const updateMeSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').trim(),
});