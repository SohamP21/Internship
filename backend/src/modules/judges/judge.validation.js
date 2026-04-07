import { z } from 'zod';

export const judgeOnboardSchema = z.object({
  domains: z
    .array(z.string().min(1))
    .min(1, 'Select at least one domain'),
  slotNumber: z
    .number({ invalid_type_error: 'Slot number must be a number' })
    .int()
    .min(1, 'Slot number must be at least 1'),
});