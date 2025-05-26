import { Request, Response } from 'express';
import { prisma } from '../../config/database';
import { logVisitStart, logVisitEnd, getShiftVisits } from '../../controllers/visit.controller';
import { AppError } from '../../utils/error';
import { ROLES } from '../../types/roles';

// Mock prisma
jest.mock('../../config/database', () => ({
  prisma: {
    shift: {
      findFirst: jest.fn(),
      update: jest.fn()
    },
    visit: {
      findFirst: jest.fn(),
      create: jest.fn(),
      findMany: jest.fn()
    }
  }
}));

describe('Visit Controller', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: jest.Mock;

  beforeEach(() => {
    mockRequest = {};
    mockResponse = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis()
    };
    mockNext = jest.fn();
    jest.clearAllMocks();
  });

  describe('logVisitStart', () => {
    it('should log the start of a visit', async () => {
      const mockShift = { id: '1', caregiverId: '1' };
      const mockVisit = { id: '1', type: 'START', latitude: 123, longitude: 456, shiftId: '1', caregiverId: '1' };

      (prisma.shift.findFirst as jest.Mock).mockResolvedValue(mockShift);
      (prisma.visit.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.visit.create as jest.Mock).mockResolvedValue(mockVisit);

      mockRequest.body = { shiftId: '1', latitude: 123, longitude: 456 };
      mockRequest.user = { id: '1', role: ROLES.CAREGIVER, email: 'caregiver@example.com' };

      await logVisitStart(mockRequest as Request, mockResponse as Response, mockNext);

      expect(prisma.shift.findFirst).toHaveBeenCalledWith({
        where: { id: '1', caregiverId: '1' }
      });

      expect(prisma.visit.create).toHaveBeenCalledWith({
        data: {
          type: 'START',
          latitude: 123,
          longitude: 456,
          shiftId: '1',
          caregiverId: '1'
        }
      });

      expect(prisma.shift.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: { status: 'in_progress', startTime: expect.any(Date) }
      });

      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith({
        data: { visit: mockVisit }
      });
    });

    it('should handle unauthorized access', async () => {
      mockRequest.body = { shiftId: '1', latitude: 123, longitude: 456 };
      mockRequest.user = undefined;

      await logVisitStart(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
    });

    it('should handle existing start visit', async () => {
      const mockShift = { id: '1', caregiverId: '1' };
      const mockExistingVisit = { id: '1', type: 'START' };

      (prisma.shift.findFirst as jest.Mock).mockResolvedValue(mockShift);
      (prisma.visit.findFirst as jest.Mock).mockResolvedValue(mockExistingVisit);

      mockRequest.body = { shiftId: '1', latitude: 123, longitude: 456 };
      mockRequest.user = { id: '1', role: ROLES.CAREGIVER, email: 'caregiver@example.com' };

      await logVisitStart(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
    });
  });

  describe('logVisitEnd', () => {
    it('should log the end of a visit', async () => {
      const mockShift = { id: '1', caregiverId: '1' };
      const mockStartVisit = { id: '1', type: 'START' };
      const mockEndVisit = { id: '2', type: 'END', latitude: 123, longitude: 456, shiftId: '1', caregiverId: '1' };

      (prisma.shift.findFirst as jest.Mock).mockResolvedValue(mockShift);
      (prisma.visit.findFirst as jest.Mock).mockResolvedValueOnce(mockStartVisit).mockResolvedValueOnce(null);
      (prisma.visit.create as jest.Mock).mockResolvedValue(mockEndVisit);

      mockRequest.body = { shiftId: '1', latitude: 123, longitude: 456 };
      mockRequest.user = { id: '1', role: ROLES.CAREGIVER, email: 'caregiver@example.com' };

      await logVisitEnd(mockRequest as Request, mockResponse as Response, mockNext);

      expect(prisma.shift.findFirst).toHaveBeenCalledWith({
        where: { id: '1', caregiverId: '1' }
      });

      expect(prisma.visit.create).toHaveBeenCalledWith({
        data: {
          type: 'END',
          latitude: 123,
          longitude: 456,
          shiftId: '1',
          caregiverId: '1'
        }
      });

      expect(prisma.shift.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: { status: 'completed', endTime: expect.any(Date) }
      });

      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith({
        data: { visit: mockEndVisit }
      });
    });

    it('should handle unauthorized access', async () => {
      mockRequest.body = { shiftId: '1', latitude: 123, longitude: 456 };
      mockRequest.user = undefined;

      await logVisitEnd(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
    });

    it('should handle missing start visit', async () => {
      const mockShift = { id: '1', caregiverId: '1' };

      (prisma.shift.findFirst as jest.Mock).mockResolvedValue(mockShift);
      (prisma.visit.findFirst as jest.Mock).mockResolvedValue(null);

      mockRequest.body = { shiftId: '1', latitude: 123, longitude: 456 };
      mockRequest.user = { id: '1', role: ROLES.CAREGIVER, email: 'caregiver@example.com' };

      await logVisitEnd(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
    });

    it('should handle existing end visit', async () => {
      const mockShift = { id: '1', caregiverId: '1' };
      const mockStartVisit = { id: '1', type: 'START' };
      const mockExistingEndVisit = { id: '2', type: 'END' };

      (prisma.shift.findFirst as jest.Mock).mockResolvedValue(mockShift);
      (prisma.visit.findFirst as jest.Mock).mockResolvedValueOnce(mockStartVisit).mockResolvedValueOnce(mockExistingEndVisit);

      mockRequest.body = { shiftId: '1', latitude: 123, longitude: 456 };
      mockRequest.user = { id: '1', role: ROLES.CAREGIVER, email: 'caregiver@example.com' };

      await logVisitEnd(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
    });
  });

  describe('getShiftVisits', () => {
    it('should return paginated visits for a shift', async () => {
      const mockShift = { id: '1', caregiverId: '1' };
      const mockVisits = [
        { id: '1', type: 'START', latitude: 123, longitude: 456, shiftId: '1', caregiverId: '1' },
        { id: '2', type: 'END', latitude: 789, longitude: 101, shiftId: '1', caregiverId: '1' }
      ];

      (prisma.shift.findFirst as jest.Mock).mockResolvedValue(mockShift);
      (prisma.visit.findMany as jest.Mock).mockResolvedValue(mockVisits);

      mockRequest.params = { shiftId: '1' };
      mockRequest.user = { id: '1', role: ROLES.CAREGIVER, email: 'caregiver@example.com' };
      mockRequest.pagination = { page: 1, limit: 10, skip: 0 };

      await getShiftVisits(mockRequest as Request, mockResponse as Response, mockNext);

      expect(prisma.shift.findFirst).toHaveBeenCalledWith({
        where: { id: '1', caregiverId: '1' }
      });

      expect(prisma.visit.findMany).toHaveBeenCalledWith({
        where: { shiftId: '1' },
        skip: 0,
        take: 10,
        orderBy: { timestamp: 'asc' }
      });

      expect(mockResponse.json).toHaveBeenCalledWith({
        data: { visits: mockVisits }
      });
    });

    it('should handle unauthorized access', async () => {
      mockRequest.params = { shiftId: '1' };
      mockRequest.user = undefined;

      await getShiftVisits(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
    });

    it('should handle non-existent shift', async () => {
      (prisma.shift.findFirst as jest.Mock).mockResolvedValue(null);

      mockRequest.params = { shiftId: '999' };
      mockRequest.user = { id: '1', role: ROLES.CAREGIVER, email: 'caregiver@example.com' };

      await getShiftVisits(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
    });
  });
}); 