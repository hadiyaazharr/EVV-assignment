import { z } from 'zod';

export const createUserSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(6),
    firstName: z.string().min(1),
    lastName: z.string().min(1),
    roleId: z.string().uuid()
  })
});

export const updateUserSchema = z.object({
  body: z.object({
    email: z.string().email().optional(),
    password: z.string().min(6).optional(),
    firstName: z.string().min(1).optional(),
    lastName: z.string().min(1).optional(),
    roleId: z.string().uuid().optional()
  }).refine(data => Object.keys(data).length > 0, {
    message: 'At least one field must be provided for update'
  })
}); 