import { z } from 'zod';

const slotSchema = z.object({
  slotNumber: z.number().int().min(1, 'Slot number must be at least 1'),
  date:      z.string().min(1, 'Slot date is required'),
  startTime: z.string().min(1, 'Slot start time is required'),
  endTime:   z.string().min(1, 'Slot end time is required'),
});

const criterionSchema = z.object({
  name:     z.string().min(1, 'Criterion name is required').trim(),
  maxScore: z.number({ invalid_type_error: 'Max score must be a number' }).min(1, 'Max score must be at least 1'),
});

export const createEventSchema = z.object({
  title:       z.string().min(3, 'Title must be at least 3 characters').trim(),
  description: z.string().optional(),
  domains:     z.array(z.string().min(1)).min(1, 'At least one domain is required'),
  slots:       z.array(slotSchema).min(1, 'At least 1 judging slot is required'),
  rubric: z.object({
    criteria: z.array(criterionSchema).min(1, 'At least one rubric criterion is required'),
  }),
  registrationDeadline: z
    .string()
    .optional()
    .transform((s) => (s && String(s).trim() ? s : undefined)),
  eventStartDate: z
    .string()
    .optional()
    .transform((s) => (s && String(s).trim() ? s : undefined)),
  eventEndDate: z
    .string()
    .optional()
    .transform((s) => (s && String(s).trim() ? s : undefined)),
});

export const extendRegistrationDeadlineSchema = z.object({
  registrationDeadline: z.string().min(1, 'Registration deadline is required'),
});

export const updateStatusSchema = z.object({
  status: z.enum(['draft', 'open', 'assigning', 'judging', 'completed'], {
    errorMap: () => ({ message: 'Invalid status value' }),
  }),
});