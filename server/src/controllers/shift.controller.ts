import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { AppError } from '../utils/error';

/**
 * Get all shifts
 */
export const getAllShifts = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { skip = 0, limit = 10, sortBy = 'date', sortOrder = 'asc' } = req.pagination || {};
    const shifts = await prisma.shift.findMany({
      skip,
      take: limit,
      include: {
        client: true,
        caregiver: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        visits: true
      },
      orderBy: {
        [sortBy]: sortOrder
      }
    });
    res.json({ data: { shifts } });
  } catch (error) {
    next(error);
  }
};

/**
 * Get shifts for a specific caregiver
 */
export const getCaregiverShifts = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const caregiverId = req.user?.id;
    if (!caregiverId) throw new AppError('Unauthorized', 401);
    const { skip = 0, limit = 10, sortBy = 'date', sortOrder = 'asc' } = req.pagination || {};
    const shifts = await prisma.shift.findMany({
      where: {
        caregiverId,
        date: { gte: new Date() }
      },
      skip,
      take: limit,
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
      orderBy: {
        [sortBy]: sortOrder
      }
    });
    res.json({ data: { shifts } });
  } catch (error) {
    next(error);
  }
};

/**
 * Create a new shift
 */
export const createShift = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { date, startTime, endTime, clientId, caregiverId } = req.body;

    // Verify client exists
    const client = await prisma.client.findUnique({
      where: { id: clientId }
    });
    if (!client) throw new AppError('Client not found', 404);

    // Verify caregiver exists
    const caregiver = await prisma.user.findUnique({
      where: { id: caregiverId }
    });
    if (!caregiver) throw new AppError('Caregiver not found', 404);

    const shift = await prisma.shift.create({
      data: {
        date: new Date(date),
        ...(startTime ? { startTime: new Date(startTime) } : {}),
        ...(endTime ? { endTime: new Date(endTime) } : {}),
        clientId,
        caregiverId,
        status: 'pending'
      },
      include: {
        client: true,
        caregiver: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });

    res.status(201).json({ data: { shift } });
  } catch (error) {
    next(error);
  }
};

/**
 * Update a shift
 */
export const updateShift = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { date, startTime, endTime, clientId, caregiverId, status } = req.body;

    const shift = await prisma.shift.update({
      where: { id },
      data: {
        date: date ? new Date(date) : undefined,
        startTime: startTime ? new Date(startTime) : undefined,
        endTime: endTime ? new Date(endTime) : undefined,
        clientId,
        caregiverId,
        status
      },
      include: {
        client: true,
        caregiver: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });

    res.json({ data: { shift } });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a shift
 */
export const deleteShift = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    await prisma.shift.delete({
      where: { id }
    });
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

// GET /api/shifts/caregivers - get all shifts for all caregivers
export const getAllCaregiverShifts = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const shifts = await prisma.shift.findMany({
      include: {
        caregiver: {
          select: { id: true, firstName: true, lastName: true, email: true, role: true }
        },
        client: true,
        visits: true
      },
      orderBy: { date: 'desc' }
    });
    res.json({ data: { shifts } });
  } catch (error) {
    next(error);
  }
}; 