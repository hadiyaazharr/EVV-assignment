import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { validate } from '../middleware/validation.middleware';
import { paginationMiddleware } from '../middleware/pagination.middleware';
import {
  logVisitStart,
  logVisitEnd,
  getShiftVisits
} from '../controllers/visit.controller';
import {
  visitLogSchema,
  shiftIdSchema
} from '../validations/visit.validation';

const router = Router();

/**
 * @swagger
 * /api/visits/shift/{shiftId}:
 *   get:
 *     tags:
 *       - Visits
 *     summary: Get all visits for a shift
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: shiftId
 *         required: true
 *         schema:
 *           type: string
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
 *         description: "Field to sort by (e.g. timestamp)"
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *         description: "Sort order (asc or desc, default: asc)"
 *     responses:
 *       200:
 *         description: List of visits for the shift
 */
router.get('/shift/:shiftId', 
  authenticate, 
  authorize(['CAREGIVER']), 
  paginationMiddleware(),
  validate(shiftIdSchema),
  getShiftVisits
);

/**
 * @swagger
 * /api/visits/start:
 *   post:
 *     tags:
 *       - Visits
 *     summary: Log the start of a visit
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - shiftId
 *               - latitude
 *               - longitude
 *             properties:
 *               shiftId:
 *                 type: string
 *               latitude:
 *                 type: number
 *               longitude:
 *                 type: number
 *     responses:
 *       201:
 *         description: Visit start logged
 */
router.post('/start',
  authenticate,
  authorize(['CAREGIVER']),
  validate(visitLogSchema),
  logVisitStart
);

/**
 * @swagger
 * /api/visits/end:
 *   post:
 *     tags:
 *       - Visits
 *     summary: Log the end of a visit
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - shiftId
 *               - latitude
 *               - longitude
 *             properties:
 *               shiftId:
 *                 type: string
 *               latitude:
 *                 type: number
 *               longitude:
 *                 type: number
 *     responses:
 *       201:
 *         description: Visit end logged
 */
router.post('/end',
  authenticate,
  authorize(['CAREGIVER']),
  validate(visitLogSchema),
  logVisitEnd
);

export default router; 