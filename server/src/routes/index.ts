import { Router, Request, Response } from 'express';
import authRoutes from './auth.routes';
import caregiverRoutes from './caregiver.routes';
import roleRoutes from './role.routes';
import clientRoutes from './client.routes';
import visitRoutes from './visit.routes';
import userRoutes from './user.routes';
import shiftRoutes from './shift.routes';

const router = Router();

// Health check endpoint
router.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok' });
});

// API routes
router.use('/auth', authRoutes);
router.use('/caregiver', caregiverRoutes);
router.use('/roles', roleRoutes);
router.use('/clients', clientRoutes);
router.use('/visits', visitRoutes);
router.use('/users', userRoutes);
router.use('/shifts', shiftRoutes);

export default router; 