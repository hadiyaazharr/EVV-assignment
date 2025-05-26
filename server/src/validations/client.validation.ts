import { z } from 'zod';

export const clientIdSchema = z.object({
  params: z.object({
    id: z.string().uuid()
  })
});

export const createClientSchema = z.object({
  body: z.object({
    name: z.string().min(1),
    address: z.string().min(1)
  })
});

export const updateClientSchema = z.object({
  params: z.object({
    id: z.string().uuid()
  }),
  body: z.object({
    name: z.string().min(1).optional(),
    address: z.string().min(1).optional()
  })
}); 