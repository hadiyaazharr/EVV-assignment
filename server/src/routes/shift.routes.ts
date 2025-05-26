import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { validate } from '../middleware/validation.middleware';
import { paginationMiddleware } from '../middleware/pagination.middleware';
import {
  getAllShifts,
  getCaregiverShifts,
  createShift,
  updateShift,
  deleteShift,
  getAllCaregiverShifts
} from '../controllers/shift.controller';
import {
  createShiftSchema,
  updateShiftSchema,
  shiftIdSchema
} from '../validations/shift.validation';

const router = Router();

/**
 * @swagger
 * /api/shifts:
 *   get:
 *     tags:
 *       - Shifts
 *     summary: Get all shifts
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: "Page number (default: 1)"
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *         description: "Number of items per page (default: 10)"
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *         description: "Field to sort by (e.g. date, status)"
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *         description: "Sort order (asc or desc, default: asc)"
 *     responses:
 *       200:
 *         description: List of shifts
 */
router.get('/', authenticate, paginationMiddleware(), getAllShifts);

/**
 * @swagger
 * /api/shifts/caregiver:
 *   get:
 *     tags:
 *       - Shifts
 *     summary: Get all shifts for the authenticated caregiver
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: "Page number (default: 1)"
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *         description: "Number of items per page (default: 10)"
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *         description: "Field to sort by (e.g. date, status)"
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *         description: "Sort order (asc or desc, default: asc)"
 *     responses:
 *       200:
 *         description: List of caregiver's shifts
 */
router.get('/caregiver', authenticate, paginationMiddleware(), getCaregiverShifts);

/**
 * @swagger
 * /api/shifts/caregivers:
 *   get:
 *     tags:
 *       - Shifts
 *     summary: Get all shifts for all caregivers
 *     responses:
 *       200:
 *         description: List of all caregiver shifts
 *   post:
 *     tags:
 *       - Shifts
 *     summary: Create a shift for any caregiver
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - date
 *               - startTime
 *               - endTime
 *               - clientId
 *               - caregiverId
 *             properties:
 *               date:
 *                 type: string
 *                 format: date-time
 *               startTime:
 *                 type: string
 *                 format: date-time
 *               endTime:
 *                 type: string
 *                 format: date-time
 *               clientId:
 *                 type: string
 *               caregiverId:
 *                 type: string
 *     responses:
 *       201:
 *         description: Shift created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     shift:
 *                       type: object
 *   put:
 *     tags:
 *       - Shifts
 *     summary: Update a shift for any caregiver
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               date:
 *                 type: string
 *                 format: date-time
 *               startTime:
 *                 type: string
 *                 format: date-time
 *               endTime:
 *                 type: string
 *                 format: date-time
 *               clientId:
 *                 type: string
 *               caregiverId:
 *                 type: string
 *               status:
 *                 type: string
 *     responses:
 *       200:
 *         description: Shift updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     shift:
 *                       type: object
 */
router.get('/caregivers', getAllCaregiverShifts);
router.post('/caregivers', createShift);
router.put('/caregivers/:id', updateShift);

router.post('/', authenticate, authorize(['ADMIN']), validate(createShiftSchema), createShift);
router.put('/:id', authenticate, authorize(['ADMIN']), validate(updateShiftSchema), updateShift);
router.delete('/:id', authenticate, authorize(['ADMIN']), validate(shiftIdSchema), deleteShift);

export default router; 