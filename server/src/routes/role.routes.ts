import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { validate } from '../middleware/validation.middleware';
import { paginationMiddleware } from '../middleware/pagination.middleware';
import {
  getAllRoles,
  getRoleById,
  createRole,
  updateRole,
  deleteRole
} from '../controllers/role.controller';
import {
  createRoleSchema,
  updateRoleSchema,
  roleIdSchema
} from '../validations/role.validation';

const router = Router();

/**
 * @swagger
 * /api/roles:
 *   get:
 *     tags:
 *       - Roles
 *     summary: Get all roles
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
 *         description: List of roles
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 roles:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         format: uuid
 *                       name:
 *                         type: string
 *                       description:
 *                         type: string
 *                       _count:
 *                         type: object
 *                         properties:
 *                           users:
 *                             type: number
 */
router.get('/', paginationMiddleware(), getAllRoles);

/**
 * @swagger
 * /api/roles/{id}:
 *   get:
 *     tags:
 *       - Roles
 *     summary: Get role by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Role ID
 *     responses:
 *       200:
 *         description: Role details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 role:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       format: uuid
 *                     name:
 *                       type: string
 *                     description:
 *                       type: string
 *                     _count:
 *                       type: object
 *                       properties:
 *                         users:
 *                           type: number
 *       404:
 *         description: Role not found
 */
router.get('/:id', authenticate, validate(roleIdSchema), getRoleById);

/**
 * @swagger
 * /api/roles:
 *   post:
 *     tags:
 *       - Roles
 *     summary: Create a new role
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
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       201:
 *         description: Role created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   format: uuid
 *                 name:
 *                   type: string
 *                 description:
 *                   type: string
 *       400:
 *         description: Validation error or role already exists
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.post('/',
  authenticate,
  authorize(['ADMIN']),
  validate(createRoleSchema),
  createRole
);

/**
 * @swagger
 * /api/roles/{id}:
 *   put:
 *     tags:
 *       - Roles
 *     summary: Update a role
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Role ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       200:
 *         description: Role updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   format: uuid
 *                 name:
 *                   type: string
 *                 description:
 *                   type: string
 *       400:
 *         description: Validation error or role name already exists
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Role not found
 */
router.put('/:id',
  authenticate,
  authorize(['ADMIN']),
  validate(updateRoleSchema),
  updateRole
);

/**
 * @swagger
 * /api/roles/{id}:
 *   delete:
 *     tags:
 *       - Roles
 *     summary: Delete a role
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Role ID
 *     responses:
 *       204:
 *         description: Role deleted successfully
 *       400:
 *         description: Cannot delete role with associated users
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Role not found
 */
router.delete('/:id',
  authenticate,
  authorize(['ADMIN']),
  validate(roleIdSchema),
  deleteRole
);

export default router; 