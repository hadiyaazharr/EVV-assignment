import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { AppError } from '../utils/error';

/**
 * Helper to verify shift ownership for a caregiver.
 */
async function verifyShiftOwnership(shiftId: string, caregiverId: string) {
  const shift = await prisma.shift.findFirst({
    where: { id: shiftId, caregiverId }
  });
  if (!shift) throw new AppError('Shift not found', 404);
  return shift;
}

/**
 * Get all current and future shifts for the authenticated caregiver.
 */
export const getShifts = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const caregiverId = req.user?.id;
    if (!caregiverId) throw new AppError('Unauthorized', 401);

    const shifts = await prisma.shift.findMany({
      where: {
        caregiverId,
        date: { gte: new Date() }
      },
      include: {
        client: true,
        caregiver: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true
          }
        },
        visits: true
      },
      orderBy: { date: 'asc' }
    });

    res.json({ data: { shifts } });
  } catch (error) {
    next(error);
  }
};

/**
 * Log the start of a visit for a shift.
 */
export const logVisitStart = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { shiftId, latitude, longitude } = req.body;
    const caregiverId = req.user?.id;
    if (!caregiverId) throw new AppError('Unauthorized', 401);

    await verifyShiftOwnership(shiftId, caregiverId);

    const existingLog = await prisma.visit.findFirst({
      where: { shiftId, type: 'START' }
    });
    if (existingLog) throw new AppError('Visit already started', 400);

    const visit = await prisma.visit.create({
      data: { type: 'START', latitude, longitude, shiftId, caregiverId }
    });

    res.json({ data: { visit } });
  } catch (error) {
    next(error);
  }
};

/**
 * Log the end of a visit for a shift.
 */
export const logVisitEnd = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { shiftId, latitude, longitude } = req.body;
    const caregiverId = req.user?.id;
    if (!caregiverId) throw new AppError('Unauthorized', 401);

    await verifyShiftOwnership(shiftId, caregiverId);

    const startLog = await prisma.visit.findFirst({
      where: { shiftId, type: 'START' }
    });
    if (!startLog) throw new AppError('Visit has not been started', 400);

    const existingEndLog = await prisma.visit.findFirst({
      where: { shiftId, type: 'END' }
    });
    if (existingEndLog) throw new AppError('Visit already ended', 400);

    const visit = await prisma.visit.create({
      data: { type: 'END', latitude, longitude, shiftId, caregiverId }
    });

    res.json({ data: { visit } });
  } catch (error) {
    next(error);
  }
};

export const createShift = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { date, clientId, caregiverId } = req.body;

    // Verify client exists
    const client = await prisma.client.findUnique({ where: { id: clientId } });
    if (!client) throw new AppError('Client not found', 404);

    // Verify caregiver exists
    const caregiver = await prisma.user.findUnique({ where: { id: caregiverId } });
    if (!caregiver) throw new AppError('Caregiver not found', 404);

    const shift = await prisma.shift.create({
      data: {
        date: new Date(date),
        clientId,
        caregiverId,
        status: 'pending'
      }
    });
    res.status(201).json({ data: { shift } });
  } catch (error) {
    next(error);
  }
}; 