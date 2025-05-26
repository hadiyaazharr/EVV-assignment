import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/database';
import { AppError } from '../utils/error';

/**
 * Register a new user.
 */
export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password, firstName, lastName, roleId } = req.body;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({ 
      where: { email } 
    });
    if (existingUser) throw new AppError('User already exists', 400);

    // Verify role exists
    const role = await prisma.role.findUnique({ 
      where: { id: roleId } 
    });
    if (!role) throw new AppError('Invalid role', 400);

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const user = await prisma.user.create({
      data: { 
        email, 
        password: hashedPassword, 
        firstName, 
        lastName, 
        roleId 
      },
      include: { role: true }
    });

    // Generate JWT
    const token = jwt.sign(
      { userId: user.id }, 
      process.env.JWT_SECRET!, 
      { expiresIn: '24h' }
    );

    res.status(201).json({
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role.name
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Login user.
 */
export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({ 
      where: { email }, 
      include: { role: true } 
    });
    if (!user) throw new AppError('Invalid credentials', 401);

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) throw new AppError('Invalid credentials', 401);

    const token = jwt.sign(
      { userId: user.id }, 
      process.env.JWT_SECRET!, 
      { expiresIn: '24h' }
    );

    res.json({
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role.name
        }
      }
    });
  } catch (error) {
    next(error);
  }
}; 