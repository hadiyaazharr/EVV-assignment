import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient();

export const setupDatabase = () => {
  // Add any database initialization logic here
  console.log('Database initialized');
}; 