import { z } from 'zod';

export const registerSchema = z.object({
  name:  z.string().min(2, 'Name must be at least 2 characters').trim(),
  email: z.string().email('Invalid email address').toLowerCase(),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['coordinator', 'participant', 'judge'], {
    errorMap: () => ({ message: 'Role must be coordinator, participant, or judge' }),
  }),
});

export const loginSchema = z.object({
  email:    z.string().email('Invalid email address').toLowerCase(),
  password: z.string().min(1, 'Password is required'),
});