import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { validate } from '../middleware/validation.middleware';
import { getShifts, createShift } from '../controllers/caregiver.controller';
import { getShiftsSchema, createShiftSchema } from '../validations/caregiver.validation';

const router = Router();

/**
 * @swagger
 * /api/caregiver/shifts:
 *   get:
 *     tags:
 *       - Caregiver
 *     summary: Get caregiver's assigned shifts
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filter shifts from this date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filter shifts until this date
 *     responses:
 *       200:
 *         description: List of assigned shifts
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 shifts:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       date:
 *                         type: string
 *                         format: date
 *                       clientName:
 *                         type: string
 *                       address:
 *                         type: string
 *       401:
 *         description: Unauthorized
 *       400:
 *         description: Validation error
 */
router.get('/shifts', 
  authenticate, 
  authorize(['CAREGIVER']), 
  validate(getShiftsSchema),
  getShifts
);

/**
 * @swagger
 * /api/caregiver/shifts:
 *   post:
 *     tags:
 *       - Caregiver
 *     summary: Create a new shift
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - date
 *               - clientId
 *               - caregiverId
 *             properties:
 *               date:
 *                 type: string
 *                 format: date
 *               clientId:
 *                 type: string
 *                 format: uuid
 *               caregiverId:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       201:
 *         description: Shift created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */
router.post('/shifts',
  authenticate,
  authorize(['CAREGIVER']),
  validate(createShiftSchema),
  createShift
);

export default router; 