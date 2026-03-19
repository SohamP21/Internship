import { z } from 'zod';

export const judgeOnboardSchema = z.object({
  domains: z
    .array(z.string().min(1))
    .min(1, 'Select at least one domain'),
  slotNumber: z
    .number({ invalid_type_error: 'Slot number must be a number' })
    .refine((n) => [1, 2, 3].includes(n), { message: 'Slot must be 1, 2, or 3' }),
});