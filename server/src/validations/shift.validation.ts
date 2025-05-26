import { z } from 'zod';

// Schema for creating a shift
export const createShiftSchema = z.object({
  body: z.object({
    date: z.string().datetime().optional(), // optional if not used
    startTime: z.string().datetime().optional(),
    endTime: z.string().datetime().optional(),
    clientId: z.string(),
    caregiverId: z.string(),
  }),
});

// Schema for updating a shift
export const updateShiftSchema = z.object({
  body: z.object({
    date: z.string().datetime().optional(),
    startTime: z.string().datetime().optional(),
    endTime: z.string().datetime().optional(),
    clientId: z.string().optional(),
    caregiverId: z.string().optional(),
    status: z.string().optional(),
  }),
});

// Schema for validating shift ID in params
export const shiftIdSchema = z.object({
  params: z.object({
    id: z.string(),
  }),
}); 