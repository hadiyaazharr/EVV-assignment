import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { AppError } from '../utils/error';

/**
 * Get all roles with user count.
 */
export const getAllRoles = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { skip = 0, limit = 10, sortBy = 'name', sortOrder = 'asc' } = req.pagination || {};
    const roles = await prisma.role.findMany({
      skip,
      take: limit,
      orderBy: { [sortBy]: sortOrder },
      include: {
        _count: {
          select: { users: true }
        }
      }
    });
    res.json({ data: { roles } });
  } catch (error) {
    next(error);
  }
};

/**
 * Get a specific role by ID.
 */
export const getRoleById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const role = await prisma.role.findUnique({
      where: { id },
      include: {
        _count: {
          select: { users: true }
        }
      }
    });
    if (!role) throw new AppError('Role not found', 404);
    res.json({ data: { role } });
  } catch (error) {
    next(error);
  }
};

/**
 * Create a new role.
 */
export const createRole = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, description } = req.body;
    const existingRole = await prisma.role.findUnique({ where: { name } });
    if (existingRole) throw new AppError('Role already exists', 400);
    const role = await prisma.role.create({ data: { name, description } });
    res.status(201).json({ data: { role } });
  } catch (error) {
    next(error);
  }
};

/**
 * Update an existing role.
 */
export const updateRole = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;
    const existingRole = await prisma.role.findUnique({ where: { id } });
    if (!existingRole) throw new AppError('Role not found', 404);
    if (name !== existingRole.name) {
      const nameConflict = await prisma.role.findUnique({ where: { name } });
      if (nameConflict) throw new AppError('Role name already exists', 400);
    }
    const role = await prisma.role.update({ where: { id }, data: { name, description } });
    res.json({ data: { role } });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a role (only if no users are associated).
 */
export const deleteRole = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const role = await prisma.role.findUnique({
      where: { id },
      include: { _count: { select: { users: true } } }
    });
    if (!role) throw new AppError('Role not found', 404);
    if (role._count.users > 0) throw new AppError('Cannot delete role with associated users', 400);
    await prisma.role.delete({ where: { id } });
    res.status(204).json({ data: { message: 'Role deleted successfully' } });
  } catch (error) {
    next(error);
  }
}; 