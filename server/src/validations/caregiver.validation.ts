import { z } from 'zod';

export const visitLogSchema = z.object({
  body: z.object({
    shiftId: z.string().uuid(),
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180)
  })
});

export const getShiftsSchema = z.object({
  query: z.object({
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional()
  })
});

export const createShiftSchema = z.object({
  body: z.object({
    date: z.string().min(1),
    clientId: z.string().uuid(),
    caregiverId: z.string().uuid()
  })
}); 