import { z } from 'zod';

export const shiftIdSchema = z.object({
  params: z.object({
    shiftId: z.string().uuid()
  })
});

export const visitLogSchema = z.object({
  body: z.object({
    shiftId: z.string().uuid(),
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180)
  })
}); 