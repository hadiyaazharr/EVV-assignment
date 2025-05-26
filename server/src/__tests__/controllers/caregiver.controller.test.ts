import { Request, Response } from 'express';
import { prisma } from '../../config/database';
import { getShifts, logVisitStart, logVisitEnd, createShift } from '../../controllers/caregiver.controller';
import { AppError } from '../../utils/error';
import { ROLES } from '../../types/roles';

// Mock prisma
jest.mock('../../config/database', () => ({
  prisma: {
    shift: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn()
    },
    visit: {
      findFirst: jest.fn(),
      create: jest.fn()
    },
    client: {
      findUnique: jest.fn()
    },
    user: {
      findUnique: jest.fn()
    }
  }
}));

describe('Caregiver Controller', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: jest.Mock;

  beforeEach(() => {
    mockRequest = {
      user: { id: '1', role: ROLES.CAREGIVER, email: 'caregiver@example.com' }
    };
    mockResponse = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis()
    };
    mockNext = jest.fn();
    jest.clearAllMocks();
  });

  describe('getShifts', () => {
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

      await getShifts(mockRequest as Request, mockResponse as Response, mockNext);

      expect(prisma.shift.findMany).toHaveBeenCalledWith({
        where: {
          caregiverId: '1',
          date: { gte: expect.any(Date) }
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

      expect(mockResponse.json).toHaveBeenCalledWith({
        data: { shifts: mockShifts }
      });
    });

    it('should handle unauthorized access', async () => {
      mockRequest.user = undefined;

      await getShifts(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
    });
  });

  describe('logVisitStart', () => {
    it('should log visit start successfully', async () => {
      const mockShift = { id: '1', caregiverId: '1' };
      const mockVisit = {
        id: '1',
        type: 'START',
        latitude: 123.456,
        longitude: 789.012,
        shiftId: '1',
        caregiverId: '1'
      };

      (prisma.shift.findFirst as jest.Mock).mockResolvedValue(mockShift);
      (prisma.visit.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.visit.create as jest.Mock).mockResolvedValue(mockVisit);

      mockRequest.body = {
        shiftId: '1',
        latitude: 123.456,
        longitude: 789.012
      };

      await logVisitStart(mockRequest as Request, mockResponse as Response, mockNext);

      expect(prisma.visit.create).toHaveBeenCalledWith({
        data: {
          type: 'START',
          latitude: 123.456,
          longitude: 789.012,
          shiftId: '1',
          caregiverId: '1'
        }
      });

      expect(mockResponse.json).toHaveBeenCalledWith({
        data: { visit: mockVisit }
      });
    });

    it('should handle unauthorized access', async () => {
      mockRequest.user = undefined;
      mockRequest.body = {
        shiftId: '1',
        latitude: 123.456,
        longitude: 789.012
      };

      await logVisitStart(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
    });

    it('should handle non-existent shift', async () => {
      (prisma.shift.findFirst as jest.Mock).mockResolvedValue(null);

      mockRequest.body = {
        shiftId: '999',
        latitude: 123.456,
        longitude: 789.012
      };

      await logVisitStart(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
    });

    it('should handle already started visit', async () => {
      const mockShift = { id: '1', caregiverId: '1' };
      const mockExistingVisit = { id: '1', type: 'START' };

      (prisma.shift.findFirst as jest.Mock).mockResolvedValue(mockShift);
      (prisma.visit.findFirst as jest.Mock).mockResolvedValue(mockExistingVisit);

      mockRequest.body = {
        shiftId: '1',
        latitude: 123.456,
        longitude: 789.012
      };

      await logVisitStart(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
    });
  });

  describe('logVisitEnd', () => {
    it('should log visit end successfully', async () => {
      const mockShift = { id: '1', caregiverId: '1' };
      const mockStartVisit = { id: '1', type: 'START' };
      const mockEndVisit = {
        id: '2',
        type: 'END',
        latitude: 123.456,
        longitude: 789.012,
        shiftId: '1',
        caregiverId: '1'
      };

      (prisma.shift.findFirst as jest.Mock).mockResolvedValue(mockShift);
      (prisma.visit.findFirst as jest.Mock)
        .mockResolvedValueOnce(mockStartVisit)
        .mockResolvedValueOnce(null);
      (prisma.visit.create as jest.Mock).mockResolvedValue(mockEndVisit);

      mockRequest.body = {
        shiftId: '1',
        latitude: 123.456,
        longitude: 789.012
      };

      await logVisitEnd(mockRequest as Request, mockResponse as Response, mockNext);

      expect(prisma.visit.create).toHaveBeenCalledWith({
        data: {
          type: 'END',
          latitude: 123.456,
          longitude: 789.012,
          shiftId: '1',
          caregiverId: '1'
        }
      });

      expect(mockResponse.json).toHaveBeenCalledWith({
        data: { visit: mockEndVisit }
      });
    });

    it('should handle unauthorized access', async () => {
      mockRequest.user = undefined;
      mockRequest.body = {
        shiftId: '1',
        latitude: 123.456,
        longitude: 789.012
      };

      await logVisitEnd(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
    });

    it('should handle non-existent shift', async () => {
      (prisma.shift.findFirst as jest.Mock).mockResolvedValue(null);

      mockRequest.body = {
        shiftId: '999',
        latitude: 123.456,
        longitude: 789.012
      };

      await logVisitEnd(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
    });

    it('should handle visit not started', async () => {
      const mockShift = { id: '1', caregiverId: '1' };

      (prisma.shift.findFirst as jest.Mock).mockResolvedValue(mockShift);
      (prisma.visit.findFirst as jest.Mock).mockResolvedValue(null);

      mockRequest.body = {
        shiftId: '1',
        latitude: 123.456,
        longitude: 789.012
      };

      await logVisitEnd(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
    });

    it('should handle already ended visit', async () => {
      const mockShift = { id: '1', caregiverId: '1' };
      const mockStartVisit = { id: '1', type: 'START' };
      const mockEndVisit = { id: '2', type: 'END' };

      (prisma.shift.findFirst as jest.Mock).mockResolvedValue(mockShift);
      (prisma.visit.findFirst as jest.Mock)
        .mockResolvedValueOnce(mockStartVisit)
        .mockResolvedValueOnce(mockEndVisit);

      mockRequest.body = {
        shiftId: '1',
        latitude: 123.456,
        longitude: 789.012
      };

      await logVisitEnd(mockRequest as Request, mockResponse as Response, mockNext);

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
        clientId: '1',
        caregiverId: '1',
        status: 'pending'
      };

      (prisma.client.findUnique as jest.Mock).mockResolvedValue(mockClient);
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockCaregiver);
      (prisma.shift.create as jest.Mock).mockResolvedValue(mockShift);

      mockRequest.body = {
        date: new Date().toISOString(),
        clientId: '1',
        caregiverId: '1'
      };

      await createShift(mockRequest as Request, mockResponse as Response, mockNext);

      expect(prisma.shift.create).toHaveBeenCalledWith({
        data: {
          date: expect.any(Date),
          clientId: '1',
          caregiverId: '1',
          status: 'pending'
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
}); 