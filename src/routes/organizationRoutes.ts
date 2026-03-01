import { Router } from 'express';
import { environmentalAuthMiddleware } from '../middlewares/environmentalAuthMiddleware';
import { asyncHandler } from '../middlewares/errorHandler';
import { validate } from '../middlewares/validationMiddleware';
import {
  createOrganizationSchema,
  updateOrganizationSchema,
} from '../validators/organizationValidationSchemas';
import {
  createOrganization,
  getOrganizationsByUser,
  getOrganization,
  updateOrganization,
  deleteOrganization,
} from '../controllers/organizationController';

import { getAllTasksInOrganization } from '../controllers/taskController';

const router = Router();

/**
 * @swagger
 * /api/v1/organizations:
 *   post:
 *     summary: Create a new organization
 *     description: Create a new organization for the authenticated user. The user automatically becomes the owner.
 *     tags:
 *       - Organizations
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       $ref: '#/components/requestBodies/CreateOrganization'
 *     responses:
 *       201:
 *         $ref: '#/components/responses/OrganizationCreated'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.post(
  '/',
  environmentalAuthMiddleware,
  validate(createOrganizationSchema),
  asyncHandler(createOrganization)
);

/**
 * @swagger
 * /api/v1/organizations:
 *   get:
 *     summary: Get all organizations for authenticated user
 *     description: Retrieve all organizations the authenticated user is a member of or owns.
 *     tags:
 *       - Organizations
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         $ref: '#/components/responses/OrganizationsRetrieved'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get(
  '/',
  environmentalAuthMiddleware,
  asyncHandler(getOrganizationsByUser)
);

/**
 * @swagger
 * /api/v1/organizations/{orgId}:
 *   get:
 *     summary: Get organization by ID
 *     description: Retrieve details of a specific organization by its ID.
 *     tags:
 *       - Organizations
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orgId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Organization ID
 *         example: 1
 *     responses:
 *       200:
 *         $ref: '#/components/responses/OrganizationRetrieved'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.get(
  '/:orgId',
  environmentalAuthMiddleware,
  asyncHandler(getOrganization)
);

/**
 * @swagger
 * /api/v1/organizations/{orgId}:
 *   patch:
 *     summary: Update an organization by ID
 *     description: Update organization details. Only the owner or admins can update.
 *     tags:
 *       - Organizations
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orgId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Organization ID
 *         example: 1
 *     requestBody:
 *       $ref: '#/components/requestBodies/UpdateOrganization'
 *     responses:
 *       200:
 *         $ref: '#/components/responses/OrganizationUpdated'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.patch(
  '/:orgId',
  environmentalAuthMiddleware,
  validate(updateOrganizationSchema),
  asyncHandler(updateOrganization)
);

/**
 * @swagger
 * /api/v1/organizations/{orgId}:
 *   delete:
 *     summary: Delete an organization by ID
 *     description: Permanently delete an organization. Only the owner can delete. This action cannot be undone.
 *     tags:
 *       - Organizations
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orgId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Organization ID
 *         example: 1
 *     responses:
 *       200:
 *         $ref: '#/components/responses/OrganizationDeleted'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.delete(
  '/:orgId',
  environmentalAuthMiddleware,
  asyncHandler(deleteOrganization)
);

/**
 * @swagger
 * /api/v1/organizations/{orgId}/tasks:
 *   get:
 *     summary: Get all tasks in organization
 *     description: Retrieve all tasks across all projects in the organization.
 *     tags:
 *       - Organizations
 *       - Tasks
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orgId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Organization ID
 *         example: 1
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [BACKLOG, TODO, IN_PROGRESS, DONE, CANCELLED]
 *         description: Filter by task status
 *       - in: query
 *         name: priority
 *         schema:
 *           type: string
 *           enum: [LOW, MEDIUM, HIGH, CRITICAL]
 *         description: Filter by task priority
 *       - in: query
 *         name: assignedTo
 *         schema:
 *           type: integer
 *         description: Filter by assignee user ID
 *     responses:
 *       200:
 *         description: Tasks retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Organization tasks retrieved successfully."
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Task'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.get(
  '/:orgId/tasks',
  environmentalAuthMiddleware,
  asyncHandler(getAllTasksInOrganization)
);

export default router;
