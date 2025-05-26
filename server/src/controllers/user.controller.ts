import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { AppError } from '../utils/error';
import bcrypt from 'bcryptjs';

// GET /api/users - list users with pagination, search, sorting
export const getAllUsers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page = 1, limit = 10, search = '', sortBy = 'createdAt', order = 'desc' } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    const where = search
      ? {
          OR: [
            { firstName: { contains: String(search), mode: 'insensitive' } },
            { lastName: { contains: String(search), mode: 'insensitive' } },
            { email: { contains: String(search), mode: 'insensitive' } },
            { role: { name: { contains: String(search), mode: 'insensitive' } } }
          ]
        }
      : {};
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        skip,
        take: Number(limit),
        where,
        orderBy: { [String(sortBy)]: String(order) },
        include: { 
          role: true,
          shifts: {
            include: {
              client: true,
              visits: true
            }
          }
        }
      }),
      prisma.user.count({ where })
    ]);
    res.json({ data: { users: users.map(u => ({ ...u, password: undefined })), total, page: Number(page), limit: Number(limit) } });
  } catch (error) {
    next(error);
  }
};

// GET /api/users/:id - get user by id
export const getUserById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const user = await prisma.user.findUnique({ where: { id }, include: { role: true } });
    if (!user) throw new AppError('User not found', 404);
    res.json({ data: { user: { ...user, password: undefined } } });
  } catch (error) {
    next(error);
  }
};

// POST /api/users - create user
export const createUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password, firstName, lastName, roleId } = req.body;
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) throw new AppError('User already exists', 400);
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { email, password: hashedPassword, firstName, lastName, roleId },
      include: { role: true }
    });
    res.status(201).json({ data: { user: { ...user, password: undefined } } });
  } catch (error) {
    next(error);
  }
};

// PUT /api/users/:id - update user
export const updateUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { email, password, firstName, lastName, roleId } = req.body;
    const data: any = { email, firstName, lastName, roleId };
    if (password) {
      data.password = await bcrypt.hash(password, 10);
    }
    const user = await prisma.user.update({
      where: { id },
      data,
      include: { role: true }
    });
    res.json({ data: { user: { ...user, password: undefined } } });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/users/:id - delete user
export const deleteUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    await prisma.user.delete({ where: { id } });
    res.status(204).json({ data: { message: 'User deleted successfully' } });
  } catch (error) {
    next(error);
  }
}; 