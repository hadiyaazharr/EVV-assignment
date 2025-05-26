import { z } from 'zod';

export const createRoleSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Role name is required'),
    description: z.string().optional()
  })
});

export const updateRoleSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid role ID')
  }),
  body: z.object({
    name: z.string().min(1, 'Role name is required'),
    description: z.string().optional()
  })
});

export const roleIdSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid role ID')
  })
}); 