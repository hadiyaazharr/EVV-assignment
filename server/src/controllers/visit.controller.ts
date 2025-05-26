import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { AppError } from '../utils/error';

/**
 * Helper to verify shift ownership for a caregiver
 */
async function verifyShiftOwnership(shiftId: string, caregiverId: string) {
  const shift = await prisma.shift.findFirst({
    where: { id: shiftId, caregiverId }
  });
  if (!shift) throw new AppError('Shift not found', 404);
  return shift;
}

/**
 * Log the start of a visit
 */
export const logVisitStart = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { shiftId, latitude, longitude } = req.body;
    const caregiverId = req.user?.id;
    if (!caregiverId) throw new AppError('Unauthorized', 401);

    await verifyShiftOwnership(shiftId, caregiverId);

    // Check if a start visit already exists
    const existingStart = await prisma.visit.findFirst({
      where: { 
        shiftId,
        type: 'START'
      }
    });
    if (existingStart) throw new AppError('Visit already started', 400);

    const visit = await prisma.visit.create({
      data: {
        type: 'START',
        latitude,
        longitude,
        shiftId,
        caregiverId
      }
    });

    // Update shift status and startTime
    await prisma.shift.update({
      where: { id: shiftId },
      data: { status: 'in_progress', startTime: new Date() }
    });

    res.status(201).json({ data: { visit } });
  } catch (error) {
    next(error);
  }
};

/**
 * Log the end of a visit
 */
export const logVisitEnd = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { shiftId, latitude, longitude } = req.body;
    const caregiverId = req.user?.id;
    if (!caregiverId) throw new AppError('Unauthorized', 401);

    await verifyShiftOwnership(shiftId, caregiverId);

    // Check if a start visit exists
    const startVisit = await prisma.visit.findFirst({
      where: { 
        shiftId,
        type: 'START'
      }
    });
    if (!startVisit) throw new AppError('Visit has not been started', 400);

    // Check if an end visit already exists
    const existingEnd = await prisma.visit.findFirst({
      where: { 
        shiftId,
        type: 'END'
      }
    });
    if (existingEnd) throw new AppError('Visit already ended', 400);

    const visit = await prisma.visit.create({
      data: {
        type: 'END',
        latitude,
        longitude,
        shiftId,
        caregiverId
      }
    });

    // Update shift status and endTime
    await prisma.shift.update({
      where: { id: shiftId },
      data: { status: 'completed', endTime: new Date() }
    });

    res.status(201).json({ data: { visit } });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all visits for a shift
 */
export const getShiftVisits = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { shiftId } = req.params;
    const caregiverId = req.user?.id;
    if (!caregiverId) throw new AppError('Unauthorized', 401);

    await verifyShiftOwnership(shiftId, caregiverId);

    const { skip = 0, limit = 10, sortBy = 'timestamp', sortOrder = 'asc' } = req.pagination || {};
    const visits = await prisma.visit.findMany({
      where: { shiftId },
      skip,
      take: limit,
      orderBy: { [sortBy]: sortOrder }
    });

    res.json({ data: { visits } });
  } catch (error) {
    next(error);
  }
}; 