import { z } from 'zod';

const memberSchema = z.object({
  name:  z.string().min(1, 'Member name is required').trim(),
  email: z.string().email('Invalid member email'),
  role:  z.string().optional(),
});

export const registerTeamSchema = z.object({
  teamName: z.string().min(1, 'Team name is required').trim(),
  domains:  z.array(z.string().min(1)).min(1, 'Select at least one domain'),
  members:  z.array(memberSchema)
    .min(1, 'At least 1 member is required')
    .max(6, 'Maximum 6 members allowed'),
  githubLink: z.string().url('Invalid GitHub URL').optional().or(z.literal('')),
  driveLink:  z.string().url('Invalid Drive URL').optional().or(z.literal('')),
});