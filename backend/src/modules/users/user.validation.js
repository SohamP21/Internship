import { z } from 'zod';

export const updateProfileSchema = z
  .object({
    name: z.string().min(2, 'Name must be at least 2 characters').trim().optional(),
    phone: z.string().trim().optional(),
    gender: z.enum(['male', 'female', 'other', 'prefer_not_to_say']).optional(),
    collegeName: z.string().trim().optional(),
    profilePhoto: z.string().optional(),
  })
  .strict()
  .superRefine((data, ctx) => {
    const has =
      data.name !== undefined ||
      data.phone !== undefined ||
      data.gender !== undefined ||
      data.collegeName !== undefined ||
      data.profilePhoto !== undefined;
    if (!has) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'At least one field is required to update',
      });
    }
  });
