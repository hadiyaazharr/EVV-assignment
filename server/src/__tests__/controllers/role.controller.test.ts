import { Request, Response } from 'express';
import { prisma } from '../../config/database';
import { getAllRoles, getRoleById, createRole, updateRole, deleteRole } from '../../controllers/role.controller';
import { AppError } from '../../utils/error';

// Mock prisma
jest.mock('../../config/database', () => ({
  prisma: {
    role: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn()
    }
  }
}));

describe('Role Controller', () => {
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

  describe('getAllRoles', () => {
    it('should return paginated roles with default parameters', async () => {
      const mockRoles = [
        { id: '1', name: 'ADMIN', description: 'Administrator', _count: { users: 5 } }
      ];

      (prisma.role.findMany as jest.Mock).mockResolvedValue(mockRoles);

      mockRequest.pagination = { page: 1, limit: 10, skip: 0 };

      await getAllRoles(mockRequest as Request, mockResponse as Response, mockNext);

      expect(prisma.role.findMany).toHaveBeenCalledWith({
        skip: 0,
        take: 10,
        orderBy: { name: 'asc' },
        include: {
          _count: {
            select: { users: true }
          }
        }
      });

      expect(mockResponse.json).toHaveBeenCalledWith({
        data: { roles: mockRoles }
      });
    });

    it('should handle custom pagination and sorting parameters', async () => {
      const mockRoles = [
        { id: '1', name: 'ADMIN', description: 'Administrator', _count: { users: 5 } }
      ];

      (prisma.role.findMany as jest.Mock).mockResolvedValue(mockRoles);

      mockRequest.pagination = {
        page: 2,
        limit: 5,
        skip: 5,
        sortBy: 'description',
        sortOrder: 'desc'
      };

      await getAllRoles(mockRequest as Request, mockResponse as Response, mockNext);

      expect(prisma.role.findMany).toHaveBeenCalledWith({
        skip: 5,
        take: 5,
        orderBy: { description: 'desc' },
        include: {
          _count: {
            select: { users: true }
          }
        }
      });
    });
  });

  describe('getRoleById', () => {
    it('should return role by id', async () => {
      const mockRole = {
        id: '1',
        name: 'ADMIN',
        description: 'Administrator',
        _count: { users: 5 }
      };

      (prisma.role.findUnique as jest.Mock).mockResolvedValue(mockRole);

      mockRequest.params = { id: '1' };

      await getRoleById(mockRequest as Request, mockResponse as Response, mockNext);

      expect(prisma.role.findUnique).toHaveBeenCalledWith({
        where: { id: '1' },
        include: {
          _count: {
            select: { users: true }
          }
        }
      });

      expect(mockResponse.json).toHaveBeenCalledWith({
        data: { role: mockRole }
      });
    });

    it('should handle non-existent role', async () => {
      (prisma.role.findUnique as jest.Mock).mockResolvedValue(null);

      mockRequest.params = { id: '999' };

      await getRoleById(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
    });
  });

  describe('createRole', () => {
    it('should create a new role', async () => {
      const mockRole = {
        id: '1',
        name: 'NEW_ROLE',
        description: 'New Role Description'
      };

      (prisma.role.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.role.create as jest.Mock).mockResolvedValue(mockRole);

      mockRequest.body = {
        name: 'NEW_ROLE',
        description: 'New Role Description'
      };

      await createRole(mockRequest as Request, mockResponse as Response, mockNext);

      expect(prisma.role.create).toHaveBeenCalledWith({
        data: {
          name: 'NEW_ROLE',
          description: 'New Role Description'
        }
      });

      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith({
        data: { role: mockRole }
      });
    });

    it('should handle existing role', async () => {
      (prisma.role.findUnique as jest.Mock).mockResolvedValue({ id: '1' });

      mockRequest.body = {
        name: 'EXISTING_ROLE',
        description: 'Existing Role Description'
      };

      await createRole(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
    });
  });

  describe('updateRole', () => {
    it('should update an existing role', async () => {
      const mockRole = {
        id: '1',
        name: 'UPDATED_ROLE',
        description: 'Updated Role Description'
      };

      (prisma.role.findUnique as jest.Mock).mockResolvedValueOnce({ id: '1', name: 'OLD_ROLE' }).mockResolvedValueOnce(null);
      (prisma.role.update as jest.Mock).mockResolvedValue(mockRole);

      mockRequest.params = { id: '1' };
      mockRequest.body = {
        name: 'UPDATED_ROLE',
        description: 'Updated Role Description'
      };

      await updateRole(mockRequest as Request, mockResponse as Response, mockNext);

      expect(prisma.role.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: {
          name: 'UPDATED_ROLE',
          description: 'Updated Role Description'
        }
      });

      expect(mockResponse.json).toHaveBeenCalledWith({
        data: { role: mockRole }
      });
    });

    it('should handle non-existent role', async () => {
      (prisma.role.findUnique as jest.Mock).mockResolvedValue(null);

      mockRequest.params = { id: '999' };
      mockRequest.body = {
        name: 'UPDATED_ROLE',
        description: 'Updated Role Description'
      };

      await updateRole(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
    });

    it('should handle name conflict', async () => {
      (prisma.role.findUnique as jest.Mock).mockResolvedValueOnce({ id: '1', name: 'OLD_ROLE' }).mockResolvedValueOnce({ id: '2' });

      mockRequest.params = { id: '1' };
      mockRequest.body = {
        name: 'CONFLICT_ROLE',
        description: 'Conflict Role Description'
      };

      await updateRole(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
    });
  });

  describe('deleteRole', () => {
    it('should delete a role with no associated users', async () => {
      const mockRole = {
        id: '1',
        name: 'ROLE_TO_DELETE',
        description: 'Role to Delete',
        _count: { users: 0 }
      };

      (prisma.role.findUnique as jest.Mock).mockResolvedValue(mockRole);

      mockRequest.params = { id: '1' };

      await deleteRole(mockRequest as Request, mockResponse as Response, mockNext);

      expect(prisma.role.delete).toHaveBeenCalledWith({
        where: { id: '1' }
      });

      expect(mockResponse.status).toHaveBeenCalledWith(204);
      expect(mockResponse.json).toHaveBeenCalledWith({
        data: { message: 'Role deleted successfully' }
      });
    });

    it('should handle non-existent role', async () => {
      (prisma.role.findUnique as jest.Mock).mockResolvedValue(null);

      mockRequest.params = { id: '999' };

      await deleteRole(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
    });

    it('should handle role with associated users', async () => {
      const mockRole = {
        id: '1',
        name: 'ROLE_WITH_USERS',
        description: 'Role with Users',
        _count: { users: 5 }
      };

      (prisma.role.findUnique as jest.Mock).mockResolvedValue(mockRole);

      mockRequest.params = { id: '1' };

      await deleteRole(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
    });
  });
}); 