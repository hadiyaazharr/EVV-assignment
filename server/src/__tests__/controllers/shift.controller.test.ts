import { Request, Response } from 'express';
import { prisma } from '../../config/database';
import {
  getAllShifts,
  getCaregiverShifts,
  createShift,
  updateShift,
  deleteShift,
  getAllCaregiverShifts
} from '../../controllers/shift.controller';
import { AppError } from '../../utils/error';
import { ROLES } from '../../types/roles';

// Mock prisma
jest.mock('../../config/database', () => ({
  prisma: {
    shift: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn()
    },
    client: {
      findUnique: jest.fn()
    },
    user: {
      findUnique: jest.fn()
    }
  }
}));

describe('Shift Controller', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: jest.Mock;

  beforeEach(() => {
    mockRequest = {
      user: { id: '1', role: ROLES.CAREGIVER, email: 'caregiver@example.com' }
    };
    mockResponse = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis(),
      send: jest.fn()
    };
    mockNext = jest.fn();
    jest.clearAllMocks();
  });

  describe('getAllShifts', () => {
    it('should return paginated shifts with default parameters', async () => {
      const mockShifts = [
        {
          id: '1',
          date: new Date(),
          client: { id: '1', name: 'Client 1' },
          caregiver: {
            id: '1',
            firstName: 'John',
            lastName: 'Doe',
            email: 'caregiver@example.com'
          },
          visits: []
        }
      ];

      (prisma.shift.findMany as jest.Mock).mockResolvedValue(mockShifts);

      mockRequest.pagination = { page: 1, limit: 10, skip: 0 };

      await getAllShifts(mockRequest as Request, mockResponse as Response, mockNext);

      expect(prisma.shift.findMany).toHaveBeenCalledWith({
        skip: 0,
        take: 10,
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
        orderBy: { date: 'asc' }
      });

      expect(mockResponse.json).toHaveBeenCalledWith({
        data: { shifts: mockShifts }
      });
    });

    it('should handle custom pagination and sorting parameters', async () => {
      const mockShifts = [
        {
          id: '1',
          date: new Date(),
          client: { id: '1', name: 'Client 1' },
          caregiver: {
            id: '1',
            firstName: 'John',
            lastName: 'Doe',
            email: 'caregiver@example.com'
          },
          visits: []
        }
      ];

      (prisma.shift.findMany as jest.Mock).mockResolvedValue(mockShifts);

      mockRequest.pagination = {
        page: 2,
        limit: 5,
        skip: 5,
        sortBy: 'status',
        sortOrder: 'desc'
      };

      await getAllShifts(mockRequest as Request, mockResponse as Response, mockNext);

      expect(prisma.shift.findMany).toHaveBeenCalledWith({
        skip: 5,
        take: 5,
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
        orderBy: { status: 'desc' }
      });
    });
  });

  describe('getCaregiverShifts', () => {
    it('should return current and future shifts for caregiver', async () => {
      const mockShifts = [
        {
          id: '1',
          date: new Date(),
          client: { id: '1', name: 'Client 1' },
          caregiver: {
            id: '1',
            firstName: 'John',
            lastName: 'Doe',
            email: 'caregiver@example.com',
            role: ROLES.CAREGIVER
          },
          visits: []
        }
      ];

      (prisma.shift.findMany as jest.Mock).mockResolvedValue(mockShifts);

      mockRequest.pagination = { page: 1, limit: 10, skip: 0 };

      await getCaregiverShifts(mockRequest as Request, mockResponse as Response, mockNext);

      expect(prisma.shift.findMany).toHaveBeenCalledWith({
        where: {
          caregiverId: '1',
          date: { gte: expect.any(Date) }
        },
        skip: 0,
        take: 10,
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

      expect(mockResponse.json).toHaveBeenCalledWith({
        data: { shifts: mockShifts }
      });
    });

    it('should handle unauthorized access', async () => {
      mockRequest.user = undefined;

      await getCaregiverShifts(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
    });
  });

  describe('createShift', () => {
    it('should create shift successfully', async () => {
      const mockClient = { id: '1', name: 'Client 1' };
      const mockCaregiver = { id: '1', name: 'Caregiver 1' };
      const mockShift = {
        id: '1',
        date: new Date(),
        startTime: new Date(),
        endTime: new Date(),
        clientId: '1',
        caregiverId: '1',
        status: 'pending',
        client: mockClient,
        caregiver: mockCaregiver
      };

      (prisma.client.findUnique as jest.Mock).mockResolvedValue(mockClient);
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockCaregiver);
      (prisma.shift.create as jest.Mock).mockResolvedValue(mockShift);

      mockRequest.body = {
        date: new Date().toISOString(),
        startTime: new Date().toISOString(),
        endTime: new Date().toISOString(),
        clientId: '1',
        caregiverId: '1'
      };

      await createShift(mockRequest as Request, mockResponse as Response, mockNext);

      expect(prisma.shift.create).toHaveBeenCalledWith({
        data: {
          date: expect.any(Date),
          startTime: expect.any(Date),
          endTime: expect.any(Date),
          clientId: '1',
          caregiverId: '1',
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

      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith({
        data: { shift: mockShift }
      });
    });

    it('should handle non-existent client', async () => {
      (prisma.client.findUnique as jest.Mock).mockResolvedValue(null);

      mockRequest.body = {
        date: new Date().toISOString(),
        clientId: '999',
        caregiverId: '1'
      };

      await createShift(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
    });

    it('should handle non-existent caregiver', async () => {
      const mockClient = { id: '1', name: 'Client 1' };

      (prisma.client.findUnique as jest.Mock).mockResolvedValue(mockClient);
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      mockRequest.body = {
        date: new Date().toISOString(),
        clientId: '1',
        caregiverId: '999'
      };

      await createShift(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
    });
  });

  describe('updateShift', () => {
    it('should update shift successfully', async () => {
      const mockShift = {
        id: '1',
        date: new Date(),
        startTime: new Date(),
        endTime: new Date(),
        clientId: '1',
        caregiverId: '1',
        status: 'completed',
        client: { id: '1', name: 'Client 1' },
        caregiver: {
          id: '1',
          firstName: 'John',
          lastName: 'Doe',
          email: 'caregiver@example.com'
        }
      };

      (prisma.shift.update as jest.Mock).mockResolvedValue(mockShift);

      mockRequest.params = { id: '1' };
      mockRequest.body = {
        date: new Date().toISOString(),
        startTime: new Date().toISOString(),
        endTime: new Date().toISOString(),
        clientId: '1',
        caregiverId: '1',
        status: 'completed'
      };

      await updateShift(mockRequest as Request, mockResponse as Response, mockNext);

      expect(prisma.shift.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: {
          date: expect.any(Date),
          startTime: expect.any(Date),
          endTime: expect.any(Date),
          clientId: '1',
          caregiverId: '1',
          status: 'completed'
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

      expect(mockResponse.json).toHaveBeenCalledWith({
        data: { shift: mockShift }
      });
    });

    it('should handle partial update', async () => {
      const mockShift = {
        id: '1',
        date: new Date(),
        clientId: '1',
        caregiverId: '1',
        status: 'pending',
        client: { id: '1', name: 'Client 1' },
        caregiver: {
          id: '1',
          firstName: 'John',
          lastName: 'Doe',
          email: 'caregiver@example.com'
        }
      };

      (prisma.shift.update as jest.Mock).mockResolvedValue(mockShift);

      mockRequest.params = { id: '1' };
      mockRequest.body = {
        status: 'pending'
      };

      await updateShift(mockRequest as Request, mockResponse as Response, mockNext);

      expect(prisma.shift.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: {
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
    });
  });

  describe('deleteShift', () => {
    it('should delete shift successfully', async () => {
      mockRequest.params = { id: '1' };

      await deleteShift(mockRequest as Request, mockResponse as Response, mockNext);

      expect(prisma.shift.delete).toHaveBeenCalledWith({
        where: { id: '1' }
      });

      expect(mockResponse.status).toHaveBeenCalledWith(204);
      expect(mockResponse.send).toHaveBeenCalled();
    });
  });

  describe('getAllCaregiverShifts', () => {
    it('should return all shifts for all caregivers', async () => {
      const mockShifts = [
        {
          id: '1',
          date: new Date(),
          client: { id: '1', name: 'Client 1' },
          caregiver: {
            id: '1',
            firstName: 'John',
            lastName: 'Doe',
            email: 'caregiver@example.com',
            role: ROLES.CAREGIVER
          },
          visits: []
        }
      ];

      (prisma.shift.findMany as jest.Mock).mockResolvedValue(mockShifts);

      await getAllCaregiverShifts(mockRequest as Request, mockResponse as Response, mockNext);

      expect(prisma.shift.findMany).toHaveBeenCalledWith({
        include: {
          caregiver: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              role: true
            }
          },
          client: true,
          visits: true
        },
        orderBy: { date: 'desc' }
      });

      expect(mockResponse.json).toHaveBeenCalledWith({
        data: { shifts: mockShifts }
      });
    });
  });
}); 