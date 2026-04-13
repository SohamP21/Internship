import { z } from 'zod';
import { validateEventDateRules, validateSlotsForEvent } from '../../utils/eventDatesAndSlots.js';

const slotSchema = z.object({
  slotNumber: z.number().int().min(1, 'Slot number must be at least 1'),
  date: z.string().min(1, 'Slot date is required'),
  startTime: z.string().min(1, 'Slot start time is required'),
  endTime: z.string().min(1, 'Slot end time is required'),
});

const criterionSchema = z.object({
  name: z.string().min(1, 'Criterion name is required').trim(),
  maxScore: z.number({ invalid_type_error: 'Max score must be a number' }).min(1, 'Max score must be at least 1'),
  weight: z.preprocess(
    (v) => (v === '' || v === null || v === undefined ? undefined : Number(v)),
    z.number().min(0, 'Weight must be at least 0').max(100, 'Weight must be at most 100').optional()
  ),
});

export const createEventSchema = z
  .object({
    title: z.string().min(3, 'Title must be at least 3 characters').trim(),
    description: z.string().optional(),
    domains: z.array(z.string().min(1)).min(1, 'At least one domain is required'),
    category: z
      .enum(['Tech', 'Cultural', 'Sports', 'Workshop', 'General'])
      .optional()
      .default('General'),
    slots: z.array(slotSchema).min(1, 'At least 1 judging slot is required'),
    rubric: z.object({
      criteria: z.array(criterionSchema).min(1, 'At least one rubric criterion is required'),
    }),
    registrationDeadline: z
      .string()
      .min(1, 'Registration deadline is required')
      .transform((s) => String(s).trim()),
    eventStartDate: z.string().min(1, 'Event start date is required').transform((s) => String(s).trim()),
    eventEndDate: z.string().min(1, 'Event end date is required').transform((s) => String(s).trim()),
  })
  .superRefine((data, ctx) => {
    const dr = validateEventDateRules({
      eventStartDate: data.eventStartDate,
      eventEndDate: data.eventEndDate,
      registrationDeadline: data.registrationDeadline,
    });
    if (!dr.ok) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: dr.message, path: ['eventStartDate'] });
    }
    const sr = validateSlotsForEvent(data.slots, data.eventStartDate, data.eventEndDate);
    if (!sr.ok) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: sr.message, path: ['slots'] });
    }
  });

export const extendRegistrationDeadlineSchema = z.object({
  registrationDeadline: z.string().min(1, 'Registration deadline is required'),
});

export const updateStatusSchema = z.object({
  status: z.enum(['draft', 'open', 'assigning', 'judging', 'completed'], {
    errorMap: () => ({ message: 'Invalid status value' }),
  }),
});
