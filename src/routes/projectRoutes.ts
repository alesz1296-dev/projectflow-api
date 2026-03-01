import { Router } from 'express';
import { environmentalAuthMiddleware } from '../middlewares/environmentalAuthMiddleware';
import { asyncHandler } from '../middlewares/errorHandler';
import { validate } from '../middlewares/validationMiddleware';
import {
  createProject,
  getProjectsByOrganization,
  getProject,
  updateProject,
  deleteProject,
  getProjectsByStatus,
  addProjectMember,
  getProjectMembers,
  updateProjectMemberRole,
  removeProjectMember,
} from '../controllers/projectController';
import { createTask } from '../controllers/taskController';
import {
  createProjectSchema,
  updateProjectSchema,
} from '../validators/projectValidationSchemas';
import { createTaskSchema } from '../validators/taskValidationSchemas';

const router = Router();

/**
 * @swagger
 * /api/v1/organizations/{orgId}/projects:
 *   post:
 *     summary: Create a new project
 *     description: Create a new project within an organization. Only organization members can create projects.
 *     tags:
 *       - Projects
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
 *       $ref: '#/components/requestBodies/CreateProject'
 *     responses:
 *       201:
 *         $ref: '#/components/responses/ProjectCreated'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.post(
  '/organizations/:orgId/projects',
  environmentalAuthMiddleware,
  validate(createProjectSchema),
  asyncHandler(createProject)
);

/**
 * @swagger
 * /api/v1/organizations/{orgId}/projects:
 *   get:
 *     summary: Get all projects in organization
 *     description: Retrieve all projects within an organization. Can filter by status.
 *     tags:
 *       - Projects
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
 *           enum: [ACTIVE, ARCHIVED]
 *         description: Filter by project status
 *     responses:
 *       200:
 *         $ref: '#/components/responses/ProjectsRetrieved'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.get(
  '/organizations/:orgId/projects',
  environmentalAuthMiddleware,
  asyncHandler(getProjectsByOrganization)
);

/**
 * @swagger
 * /api/v1/projects/{projectId}:
 *   get:
 *     summary: Get project by ID
 *     description: Retrieve details of a specific project.
 *     tags:
 *       - Projects
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Project ID
 *         example: 1
 *     responses:
 *       200:
 *         $ref: '#/components/responses/ProjectRetrieved'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.get(
  '/projects/:id',
  environmentalAuthMiddleware,
  asyncHandler(getProject)
);

/**
 * @swagger
 * /api/v1/projects/{projectId}:
 *   patch:
 *     summary: Update project by ID
 *     description: Update project details. Only project admins can update.
 *     tags:
 *       - Projects
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Project ID
 *         example: 1
 *     requestBody:
 *       $ref: '#/components/requestBodies/UpdateProject'
 *     responses:
 *       200:
 *         $ref: '#/components/responses/ProjectUpdated'
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
  '/projects/:id',
  environmentalAuthMiddleware,
  validate(updateProjectSchema),
  asyncHandler(updateProject)
);

/**
 * @swagger
 * /api/v1/projects/{projectId}:
 *   delete:
 *     summary: Delete project by ID
 *     description: Permanently delete a project. Only project admins can delete. This action cannot be undone.
 *     tags:
 *       - Projects
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Project ID
 *         example: 1
 *     responses:
 *       200:
 *         $ref: '#/components/responses/ProjectDeleted'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.delete(
  '/projects/:id',
  environmentalAuthMiddleware,
  asyncHandler(deleteProject)
);

/**
 * @swagger
 * /api/v1/projects/status/{status}:
 *   get:
 *     summary: Get all projects by status
 *     description: Retrieve all projects with a specific status across all accessible organizations.
 *     tags:
 *       - Projects
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: status
 *         required: true
 *         schema:
 *           type: string
 *           enum: [ACTIVE, ARCHIVED]
 *         description: Project status to filter by
 *         example: ACTIVE
 *     responses:
 *       200:
 *         $ref: '#/components/responses/ProjectsRetrieved'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get(
  '/projects/status/:status',
  environmentalAuthMiddleware,
  asyncHandler(getProjectsByStatus)
);

/**
 * @swagger
 * /api/v1/projects/{projectId}/tasks:
 *   post:
 *     summary: Create task in project
 *     description: Create a new task within a project. Only project members can create tasks.
 *     tags:
 *       - Projects
 *       - Tasks
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Project ID
 *         example: 1
 *     requestBody:
 *       $ref: '#/components/requestBodies/CreateTask'
 *     responses:
 *       201:
 *         $ref: '#/components/responses/TaskCreated'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.post(
  '/projects/:projectId/tasks',
  environmentalAuthMiddleware,
  validate(createTaskSchema),
  asyncHandler(createTask)
);

/**
 * @swagger
 * /api/v1/projects/{projectId}/members:
 *   post:
 *     summary: Add member to project
 *     description: Add a user to a project with a specified role. Only project admins can add members.
 *     tags:
 *       - Projects
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Project ID
 *         example: 1
 *     requestBody:
 *       $ref: '#/components/requestBodies/AddProjectMember'
 *     responses:
 *       201:
 *         $ref: '#/components/responses/ProjectMembershipCreated'
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
  '/projects/:projectId/members',
  environmentalAuthMiddleware,
  asyncHandler(addProjectMember)
);

/**
 * @swagger
 * /api/v1/projects/{projectId}/members:
 *   get:
 *     summary: Get all project members
 *     description: Retrieve all members of a project with their roles and details.
 *     tags:
 *       - Projects
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Project ID
 *         example: 1
 *     responses:
 *       200:
 *         $ref: '#/components/responses/ProjectMembersRetrieved'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.get(
  '/projects/:projectId/members',
  environmentalAuthMiddleware,
  asyncHandler(getProjectMembers)
);

/**
 * @swagger
 * /api/v1/projects/{projectId}/members/{userId}:
 *   patch:
 *     summary: Update project member role
 *     description: Change a member's role in the project. Only project admins can update roles.
 *     tags:
 *       - Projects
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Project ID
 *         example: 1
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *         description: User ID to update
 *         example: 2
 *     requestBody:
 *       $ref: '#/components/requestBodies/UpdateProjectMemberRole'
 *     responses:
 *       200:
 *         $ref: '#/components/responses/ProjectMembershipUpdated'
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
  '/projects/:projectId/members/:userId',
  environmentalAuthMiddleware,
  asyncHandler(updateProjectMemberRole)
);

/**
 * @swagger
 * /api/v1/projects/{projectId}/members/{userId}:
 *   delete:
 *     summary: Remove member from project
 *     description: Remove a user from a project. Only project admins can remove members.
 *     tags:
 *       - Projects
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Project ID
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
 *         $ref: '#/components/responses/ProjectMembershipDeleted'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.delete(
  '/projects/:projectId/members/:userId',
  environmentalAuthMiddleware,
  asyncHandler(removeProjectMember)
);

export default router;
