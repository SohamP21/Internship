import { z } from 'zod';

const scoreSchema = z.object({
  criterionName: z.string().min(1, 'Criterion name is required'),
  maxScore:      z.number({ invalid_type_error: 'Max score must be a number' }).min(1),
  score:         z.number({ invalid_type_error: 'Score must be a number' }).min(0),
});

export const submitEvaluationSchema = z.object({
  scores:  z.array(scoreSchema).min(1, 'At least one score is required'),
  remarks: z.string().optional(),
}).refine(
  (data) => data.scores.every((s) => s.score <= s.maxScore),
  { message: 'One or more scores exceed the maximum allowed score' }
);