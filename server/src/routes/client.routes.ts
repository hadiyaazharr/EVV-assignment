import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { validate } from '../middleware/validation.middleware';
import { paginationMiddleware } from '../middleware/pagination.middleware';
import {
  getAllClients,
  getClientById,
  createClient,
  updateClient,
  deleteClient
} from '../controllers/client.controller';
import {
  createClientSchema,
  updateClientSchema,
  clientIdSchema
} from '../validations/client.validation';

const router = Router();

/**
 * @swagger
 * /api/clients:
 *   get:
 *     tags:
 *       - Clients
 *     summary: Get all clients
 *     security:
 *       - bearerAuth: []
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
 *         description: "Field to sort by (e.g. name, createdAt)"
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *         description: "Sort order (asc or desc, default: asc)"
 *     responses:
 *       200:
 *         description: List of clients
 */
router.get('/', authenticate, paginationMiddleware(), getAllClients);

/**
 * @swagger
 * /api/clients/{id}:
 *   get:
 *     tags:
 *       - Clients
 *     summary: Get a client by ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Client details
 *       404:
 *         description: Client not found
 */
router.get('/:id', authenticate, validate(clientIdSchema), getClientById);

/**
 * @swagger
 * /api/clients:
 *   post:
 *     tags:
 *       - Clients
 *     summary: Create a new client
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - address
 *             properties:
 *               name:
 *                 type: string
 *               address:
 *                 type: string
 *     responses:
 *       201:
 *         description: Client created
 */
router.post('/', authenticate, authorize(['ADMIN']), validate(createClientSchema), createClient);

/**
 * @swagger
 * /api/clients/{id}:
 *   put:
 *     tags:
 *       - Clients
 *     summary: Update a client
 *     security:
 *       - bearerAuth: []
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
 *               name:
 *                 type: string
 *               address:
 *                 type: string
 *     responses:
 *       200:
 *         description: Client updated
 *       404:
 *         description: Client not found
 */
router.put('/:id', authenticate, authorize(['ADMIN']), validate(updateClientSchema), updateClient);

/**
 * @swagger
 * /api/clients/{id}:
 *   delete:
 *     tags:
 *       - Clients
 *     summary: Delete a client
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Client deleted
 *       404:
 *         description: Client not found
 */
router.delete('/:id', authenticate, authorize(['ADMIN']), validate(clientIdSchema), deleteClient);

export default router; 