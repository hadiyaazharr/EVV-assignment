import { Request, Response } from 'express';
import { prisma } from '../../config/database';
import { register, login } from '../../controllers/auth.controller';
import { AppError } from '../../utils/error';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// Mock prisma
jest.mock('../../config/database', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      create: jest.fn()
    },
    role: {
      findUnique: jest.fn()
    }
  }
}));

// Mock bcrypt
jest.mock('bcryptjs', () => ({
  genSalt: jest.fn().mockResolvedValue('salt'),
  hash: jest.fn().mockResolvedValue('hashedPassword'),
  compare: jest.fn()
}));

// Mock jwt
jest.mock('jsonwebtoken', () => ({
  sign: jest.fn().mockReturnValue('mockToken')
}));

describe('Auth Controller', () => {
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
    process.env.JWT_SECRET = 'test-secret';
  });

  describe('register', () => {
    it('should register a new user successfully', async () => {
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        role: { name: 'ADMIN' }
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.role.findUnique as jest.Mock).mockResolvedValue({ id: '1', name: 'ADMIN' });
      (prisma.user.create as jest.Mock).mockResolvedValue(mockUser);

      mockRequest.body = {
        email: 'test@example.com',
        password: 'password123',
        firstName: 'Test',
        lastName: 'User',
        roleId: '1'
      };

      await register(mockRequest as Request, mockResponse as Response, mockNext);

      expect(bcrypt.genSalt).toHaveBeenCalledWith(10);
      expect(bcrypt.hash).toHaveBeenCalledWith('password123', 'salt');
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
      expect(jwt.sign).toHaveBeenCalledWith(
        { userId: '1' },
        'test-secret',
        { expiresIn: '24h' }
      );
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith({
        data: {
          token: 'mockToken',
          user: {
            id: '1',
            email: 'test@example.com',
            firstName: 'Test',
            lastName: 'User',
            role: 'ADMIN'
          }
        }
      });
    });

    it('should handle existing user', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: '1' });

      mockRequest.body = {
        email: 'existing@example.com',
        password: 'password123',
        firstName: 'Test',
        lastName: 'User',
        roleId: '1'
      };

      await register(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
    });

    it('should handle invalid role', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.role.findUnique as jest.Mock).mockResolvedValue(null);

      mockRequest.body = {
        email: 'test@example.com',
        password: 'password123',
        firstName: 'Test',
        lastName: 'User',
        roleId: '999'
      };

      await register(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
    });
  });

  describe('login', () => {
    it('should login user successfully', async () => {
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        password: 'hashedPassword',
        role: { name: 'ADMIN' }
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      mockRequest.body = {
        email: 'test@example.com',
        password: 'password123'
      };

      await login(mockRequest as Request, mockResponse as Response, mockNext);

      expect(bcrypt.compare).toHaveBeenCalledWith('password123', 'hashedPassword');
      expect(jwt.sign).toHaveBeenCalledWith(
        { userId: '1' },
        'test-secret',
        { expiresIn: '24h' }
      );
      expect(mockResponse.json).toHaveBeenCalledWith({
        data: {
          token: 'mockToken',
          user: {
            id: '1',
            email: 'test@example.com',
            firstName: 'Test',
            lastName: 'User',
            role: 'ADMIN'
          }
        }
      });
    });

    it('should handle non-existent user', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      mockRequest.body = {
        email: 'nonexistent@example.com',
        password: 'password123'
      };

      await login(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
    });

    it('should handle invalid password', async () => {
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        password: 'hashedPassword',
        role: { name: 'ADMIN' }
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      mockRequest.body = {
        email: 'test@example.com',
        password: 'wrongpassword'
      };

      await login(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
    });
  });
}); 