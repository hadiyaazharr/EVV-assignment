import { Request, Response } from 'express';
import { prisma } from '../../config/database';
import { getAllUsers, getUserById, createUser, updateUser, deleteUser } from '../../controllers/user.controller';
import { AppError } from '../../utils/error';
import bcrypt from 'bcryptjs';

// Mock prisma
jest.mock('../../config/database', () => ({
  prisma: {
    user: {
      findMany: jest.fn(),
      count: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn()
    }
  }
}));

// Mock bcrypt
jest.mock('bcryptjs', () => ({
  hash: jest.fn().mockResolvedValue('hashedPassword')
}));

describe('User Controller', () => {
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

  describe('getAllUsers', () => {
    it('should return paginated users with default parameters', async () => {
      const mockUsers = [
        { id: '1', email: 'test@example.com', firstName: 'Test', lastName: 'User', role: { name: 'ADMIN' } }
      ];
      const mockTotal = 1;

      (prisma.user.findMany as jest.Mock).mockResolvedValue(mockUsers);
      (prisma.user.count as jest.Mock).mockResolvedValue(mockTotal);

      mockRequest.query = {};

      await getAllUsers(mockRequest as Request, mockResponse as Response, mockNext);

      expect(prisma.user.findMany).toHaveBeenCalledWith({
        skip: 0,
        take: 10,
        where: {},
        orderBy: { createdAt: 'desc' },
        include: {
          role: true,
          shifts: {
            include: {
              client: true,
              visits: true
            }
          }
        }
      });

      expect(mockResponse.json).toHaveBeenCalledWith({
        data: {
          users: mockUsers,
          total: mockTotal,
          page: 1,
          limit: 10
        }
      });
    });

    it('should handle search and sorting parameters', async () => {
      const mockUsers = [
        { id: '1', email: 'test@example.com', firstName: 'Test', lastName: 'User', role: { name: 'ADMIN' } }
      ];
      const mockTotal = 1;

      (prisma.user.findMany as jest.Mock).mockResolvedValue(mockUsers);
      (prisma.user.count as jest.Mock).mockResolvedValue(mockTotal);

      mockRequest.query = {
        page: '2',
        limit: '5',
        search: 'test',
        sortBy: 'firstName',
        order: 'asc'
      };

      await getAllUsers(mockRequest as Request, mockResponse as Response, mockNext);

      expect(prisma.user.findMany).toHaveBeenCalledWith({
        skip: 5,
        take: 5,
        where: {
          OR: [
            { firstName: { contains: 'test', mode: 'insensitive' } },
            { lastName: { contains: 'test', mode: 'insensitive' } },
            { email: { contains: 'test', mode: 'insensitive' } },
            { role: { name: { contains: 'test', mode: 'insensitive' } } }
          ]
        },
        orderBy: { firstName: 'asc' },
        include: {
          role: true,
          shifts: {
            include: {
              client: true,
              visits: true
            }
          }
        }
      });
    });
  });

  describe('getUserById', () => {
    it('should return user by id', async () => {
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        role: { name: 'ADMIN' }
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      mockRequest.params = { id: '1' };

      await getUserById(mockRequest as Request, mockResponse as Response, mockNext);

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: '1' },
        include: { role: true }
      });

      expect(mockResponse.json).toHaveBeenCalledWith({
        data: { user: mockUser }
      });
    });

    it('should handle non-existent user', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      mockRequest.params = { id: '999' };

      await getUserById(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
    });
  });

  describe('createUser', () => {
    it('should create a new user', async () => {
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        role: { name: 'ADMIN' }
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.user.create as jest.Mock).mockResolvedValue(mockUser);

      mockRequest.body = {
        email: 'test@example.com',
        password: 'password123',
        firstName: 'Test',
        lastName: 'User',
        roleId: '1'
      };

      await createUser(mockRequest as Request, mockResponse as Response, mockNext);

      expect(bcrypt.hash).toHaveBeenCalledWith('password123', 10);
      expect(prisma.user.create).toHaveBeenCalledWith({
        data: {
          email: 'test@example.com',
          password: 'hashedPassword',
          firstName: 'Test',
          lastName: 'User',
          roleId: '1'
        },
        include: { role: true }
      });

      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith({
        data: { user: mockUser }
      });
    });

    it('should handle existing user', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: '1' });

      mockRequest.body = {
        email: 'test@example.com',
        password: 'password123',
        firstName: 'Test',
        lastName: 'User',
        roleId: '1'
      };

      await createUser(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
    });
  });

  describe('updateUser', () => {
    it('should update user without password', async () => {
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        role: { name: 'ADMIN' }
      };

      (prisma.user.update as jest.Mock).mockResolvedValue(mockUser);

      mockRequest.params = { id: '1' };
      mockRequest.body = {
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        roleId: '1'
      };

      await updateUser(mockRequest as Request, mockResponse as Response, mockNext);

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: {
          email: 'test@example.com',
          firstName: 'Test',
          lastName: 'User',
          roleId: '1'
        },
        include: { role: true }
      });

      expect(mockResponse.json).toHaveBeenCalledWith({
        data: { user: mockUser }
      });
    });

    it('should update user with password', async () => {
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        role: { name: 'ADMIN' }
      };

      (prisma.user.update as jest.Mock).mockResolvedValue(mockUser);

      mockRequest.params = { id: '1' };
      mockRequest.body = {
        email: 'test@example.com',
        password: 'newpassword',
        firstName: 'Test',
        lastName: 'User',
        roleId: '1'
      };

      await updateUser(mockRequest as Request, mockResponse as Response, mockNext);

      expect(bcrypt.hash).toHaveBeenCalledWith('newpassword', 10);
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: {
          email: 'test@example.com',
          password: 'hashedPassword',
          firstName: 'Test',
          lastName: 'User',
          roleId: '1'
        },
        include: { role: true }
      });
    });
  });

  describe('deleteUser', () => {
    it('should delete user', async () => {
      mockRequest.params = { id: '1' };

      await deleteUser(mockRequest as Request, mockResponse as Response, mockNext);

      expect(prisma.user.delete).toHaveBeenCalledWith({
        where: { id: '1' }
      });

      expect(mockResponse.status).toHaveBeenCalledWith(204);
      expect(mockResponse.json).toHaveBeenCalledWith({
        data: { message: 'User deleted successfully' }
      });
    });
  });
}); 