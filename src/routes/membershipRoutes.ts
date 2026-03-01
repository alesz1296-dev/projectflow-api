import { Router } from 'express';
import { environmentalAuthMiddleware } from '../middlewares/environmentalAuthMiddleware';
import { asyncHandler } from '../middlewares/errorHandler';
import { validate } from '../middlewares/validationMiddleware';
import {
  addMemberSchema,
  updateMemberRoleSchema,
} from '../validators/membershipValidationSchemas';
import {
  addMember,
  removeMember,
  updateMemberRole,
  getOrganizationMembers,
} from '../controllers/membershipController';

const router = Router();

/**
 * @swagger
 * /api/v1/organizations/{orgId}/members:
 *   post:
 *     summary: Add member to organization by ID
 *     description: Add a user to an organization with a specified role. Only owners and admins can add members.
 *     tags:
 *       - Memberships
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
 *       $ref: '#/components/requestBodies/AddMember'
 *     responses:
 *       201:
 *         $ref: '#/components/responses/MembershipCreated'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.post(
  '/organizations/:orgId/members',
  environmentalAuthMiddleware,
  validate(addMemberSchema),
  asyncHandler(addMember)
);

/**
 * @swagger
 * /api/v1/organizations/{orgId}/members:
 *   get:
 *     summary: Get all members of organization
 *     description: Retrieve all members of an organization with their roles and details.
 *     tags:
 *       - Memberships
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
 *         $ref: '#/components/responses/MembersRetrieved'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.get(
  '/organizations/:orgId/members',
  environmentalAuthMiddleware,
  asyncHandler(getOrganizationMembers)
);

/**
 * @swagger
 * /api/v1/organizations/{orgId}/members/{userId}:
 *   patch:
 *     summary: Update member role by ID
 *     description: Change a member's role in the organization. Only owners can promote/demote other members.
 *     tags:
 *       - Memberships
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
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *         description: User ID to update
 *         example: 2
 *     requestBody:
 *       $ref: '#/components/requestBodies/UpdateMemberRole'
 *     responses:
 *       200:
 *         $ref: '#/components/responses/MembershipUpdated'
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
  '/organizations/:orgId/members/:userId',
  environmentalAuthMiddleware,
  validate(updateMemberRoleSchema),
  asyncHandler(updateMemberRole)
);

/**
 * @swagger
 * /api/v1/organizations/{orgId}/members/{userId}:
 *   delete:
 *     summary: Remove member from organization by ID
 *     description: Remove a user from an organization. Only owners and admins can remove members.
 *     tags:
 *       - Memberships
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
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *         description: User ID to remove
 *         example: 2
 *     responses:
 *       200:
 *         $ref: '#/components/responses/MembershipDeleted'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.delete(
  '/organizations/:orgId/members/:userId',
  environmentalAuthMiddleware,
  asyncHandler(removeMember)
);

export default router;
