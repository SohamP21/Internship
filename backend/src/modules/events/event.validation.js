import { z } from 'zod';

const slotSchema = z.object({
  slotNumber: z.union([
    z.literal(1), z.literal(2), z.literal(3)
  ]),
  date:      z.string().min(1, 'Slot date is required'),
  startTime: z.string().min(1, 'Slot start time is required'),
});

const criterionSchema = z.object({
  name:     z.string().min(1, 'Criterion name is required').trim(),
  maxScore: z.number({ invalid_type_error: 'Max score must be a number' }).min(1, 'Max score must be at least 1'),
});

export const createEventSchema = z.object({
  title:       z.string().min(3, 'Title must be at least 3 characters').trim(),
  description: z.string().optional(),
  domains:     z.array(z.string().min(1)).min(1, 'At least one domain is required'),
  slots:       z.array(slotSchema).length(3, 'Exactly 3 slots are required'),
  rubric: z.object({
    criteria: z.array(criterionSchema).min(1, 'At least one rubric criterion is required'),
  }),
  registrationDeadline: z.string().optional(),
});

export const updateStatusSchema = z.object({
  status: z.enum(['draft', 'open', 'assigning', 'judging', 'completed'], {
    errorMap: () => ({ message: 'Invalid status value' }),
  }),
});