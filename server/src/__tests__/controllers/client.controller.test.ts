import { Request, Response } from 'express';
import { prisma } from '../../config/database';
import { getAllClients, getClientById, createClient, updateClient, deleteClient } from '../../controllers/client.controller';
import { AppError } from '../../utils/error';

// Mock prisma
jest.mock('../../config/database', () => ({
  prisma: {
    client: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn()
    }
  }
}));

describe('Client Controller', () => {
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

  describe('getAllClients', () => {
    it('should return paginated clients with default parameters', async () => {
      const mockClients = [
        { id: '1', name: 'Test Client', address: '123 Test St', shifts: [] }
      ];

      (prisma.client.findMany as jest.Mock).mockResolvedValue(mockClients);

      mockRequest.pagination = { page: 1, limit: 10, skip: 0 };

      await getAllClients(mockRequest as Request, mockResponse as Response, mockNext);

      expect(prisma.client.findMany).toHaveBeenCalledWith({
        skip: 0,
        take: 10,
        orderBy: { name: 'asc' },
        include: { shifts: true }
      });

      expect(mockResponse.json).toHaveBeenCalledWith({
        data: { clients: mockClients }
      });
    });

    it('should handle custom pagination and sorting parameters', async () => {
      const mockClients = [
        { id: '1', name: 'Test Client', address: '123 Test St', shifts: [] }
      ];

      (prisma.client.findMany as jest.Mock).mockResolvedValue(mockClients);

      mockRequest.pagination = { page: 2, limit: 5, skip: 5, sortBy: 'address', sortOrder: 'desc' };

      await getAllClients(mockRequest as Request, mockResponse as Response, mockNext);

      expect(prisma.client.findMany).toHaveBeenCalledWith({
        skip: 5,
        take: 5,
        orderBy: { address: 'desc' },
        include: { shifts: true }
      });
    });
  });

  describe('getClientById', () => {
    it('should return client by id', async () => {
      const mockClient = {
        id: '1',
        name: 'Test Client',
        address: '123 Test St',
        shifts: []
      };

      (prisma.client.findUnique as jest.Mock).mockResolvedValue(mockClient);

      mockRequest.params = { id: '1' };

      await getClientById(mockRequest as Request, mockResponse as Response, mockNext);

      expect(prisma.client.findUnique).toHaveBeenCalledWith({
        where: { id: '1' },
        include: { shifts: true }
      });

      expect(mockResponse.json).toHaveBeenCalledWith({
        data: { client: mockClient }
      });
    });

    it('should handle non-existent client', async () => {
      (prisma.client.findUnique as jest.Mock).mockResolvedValue(null);

      mockRequest.params = { id: '999' };

      await getClientById(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
    });
  });

  describe('createClient', () => {
    it('should create a new client', async () => {
      const mockClient = {
        id: '1',
        name: 'New Client',
        address: '456 New St'
      };

      (prisma.client.create as jest.Mock).mockResolvedValue(mockClient);

      mockRequest.body = {
        name: 'New Client',
        address: '456 New St'
      };

      await createClient(mockRequest as Request, mockResponse as Response, mockNext);

      expect(prisma.client.create).toHaveBeenCalledWith({
        data: {
          name: 'New Client',
          address: '456 New St'
        }
      });

      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith({
        data: { client: mockClient }
      });
    });
  });

  describe('updateClient', () => {
    it('should update an existing client', async () => {
      const mockClient = {
        id: '1',
        name: 'Updated Client',
        address: '789 Updated St'
      };

      (prisma.client.update as jest.Mock).mockResolvedValue(mockClient);

      mockRequest.params = { id: '1' };
      mockRequest.body = {
        name: 'Updated Client',
        address: '789 Updated St'
      };

      await updateClient(mockRequest as Request, mockResponse as Response, mockNext);

      expect(prisma.client.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: {
          name: 'Updated Client',
          address: '789 Updated St'
        }
      });

      expect(mockResponse.json).toHaveBeenCalledWith({
        data: { client: mockClient }
      });
    });
  });

  describe('deleteClient', () => {
    it('should delete a client', async () => {
      mockRequest.params = { id: '1' };

      await deleteClient(mockRequest as Request, mockResponse as Response, mockNext);

      expect(prisma.client.delete).toHaveBeenCalledWith({
        where: { id: '1' }
      });

      expect(mockResponse.status).toHaveBeenCalledWith(204);
      expect(mockResponse.json).toHaveBeenCalledWith({
        data: { message: 'Client deleted successfully' }
      });
    });
  });
}); 