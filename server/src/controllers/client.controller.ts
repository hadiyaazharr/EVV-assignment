import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { AppError } from '../utils/error';

/**
 * Get all clients
 */
export const getAllClients = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { skip = 0, limit = 10, sortBy = 'name', sortOrder = 'asc' } = req.pagination || {};
    const clients = await prisma.client.findMany({
      skip,
      take: limit,
      orderBy: { [sortBy]: sortOrder },
      include: {
        shifts: true
      }
    });
    res.json({ data: { clients } });
  } catch (error) {
    next(error);
  }
};

/**
 * Get a specific client by ID
 */
export const getClientById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const client = await prisma.client.findUnique({
      where: { id },
      include: {
        shifts: true
      }
    });
    if (!client) throw new AppError('Client not found', 404);
    res.json({ data: { client } });
  } catch (error) {
    next(error);
  }
};

/**
 * Create a new client
 */
export const createClient = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, address } = req.body;
    const client = await prisma.client.create({
      data: { name, address }
    });
    res.status(201).json({ data: { client } });
  } catch (error) {
    next(error);
  }
};

/**
 * Update an existing client
 */
export const updateClient = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { name, address } = req.body;
    const client = await prisma.client.update({
      where: { id },
      data: { name, address }
    });
    res.json({ data: { client } });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a client
 */
export const deleteClient = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    await prisma.client.delete({
      where: { id }
    });
    res.status(204).json({ data: { message: 'Client deleted successfully' } });
  } catch (error) {
    next(error);
  }
}; 