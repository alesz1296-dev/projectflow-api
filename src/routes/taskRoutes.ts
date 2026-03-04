import { Router } from 'express';
import { environmentalAuthMiddleware } from '../middlewares/environmentalAuthMiddleware';
import { asyncHandler } from '../middlewares/errorHandler';
import { validate } from '../middlewares/validationMiddleware';
import {
  updateTaskSchema,
  createTaskSchema,
} from '../validators/taskValidationSchemas';
import {
  createTask,
  getTask,
  updateTask,
  deleteTask,
  getTasksByProject,
  getMyTasks,
  getTasksByUser,
  getAllTasksInOrganization,
  getProjectTasksWithDetails,
} from '../controllers/taskController';

const router = Router();

/**
 * @swagger
 * /api/v1/projects/{projectId}/tasks:
 *   get:
 *     summary: Get tasks by project
 *     description: Retrieve all tasks in a project with optional filtering by status, priority, or assignee.
 *     tags:
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
 *         $ref: '#/components/responses/TasksRetrieved'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.get(
  '/projects/:projectId/tasks',
  environmentalAuthMiddleware,
  asyncHandler(getTasksByProject)
);

/**
 * @swagger
 * /api/v1/projects/{projectId}/tasks/details:
 *   get:
 *     summary: Get project tasks with summary
 *     description: Retrieve all tasks in a project with detailed summary statistics (count by status and priority).
 *     tags:
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
 *         $ref: '#/components/responses/TasksRetrievedWithSummary'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.get(
  '/projects/:projectId/tasks/details',
  environmentalAuthMiddleware,
  asyncHandler(getProjectTasksWithDetails)
);

/**
 * @swagger
 * /api/v1/organizations/{orgId}/my-tasks:
 *   get:
 *     summary: Get my assigned tasks
 *     description: Retrieve all tasks assigned to the current user in an organization.
 *     tags:
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
 *     responses:
 *       200:
 *         $ref: '#/components/responses/TasksRetrieved'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.get(
  '/organizations/:orgId/my-tasks',
  environmentalAuthMiddleware,
  asyncHandler(getMyTasks)
);

/**
 * @swagger
 * /api/v1/organizations/{orgId}/users/{userId}/tasks:
 *   get:
 *     summary: Get tasks assigned to a user
 *     description: Retrieve all tasks assigned to a specific user in an organization. Only admins can view other users' tasks.
 *     tags:
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
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *         description: User ID
 *         example: 2
 *     responses:
 *       200:
 *         $ref: '#/components/responses/TasksRetrieved'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.get(
  '/organizations/:orgId/users/:userId/tasks',
  environmentalAuthMiddleware,
  asyncHandler(getTasksByUser)
);

/**
 * @swagger
 * /api/v1/organizations/{orgId}/tasks:
 *   get:
 *     summary: Get all tasks in organization
 *     description: Retrieve all tasks across all projects in an organization with optional filtering.
 *     tags:
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
 *         $ref: '#/components/responses/TasksRetrieved'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.get(
  '/organizations/:orgId/tasks',
  environmentalAuthMiddleware,
  asyncHandler(getAllTasksInOrganization)
);

/**
 * @swagger
 * /api/v1/tasks/{taskId}:
 *   get:
 *     summary: Get task by ID
 *     description: Retrieve details of a specific task including title, description, status, priority, and assignee.
 *     tags:
 *       - Tasks
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: taskId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Task ID
 *         example: 1
 *     responses:
 *       200:
 *         $ref: '#/components/responses/TaskRetrieved'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.get('/:id', environmentalAuthMiddleware, asyncHandler(getTask));

/**
 * @swagger
 * /api/v1/tasks/{taskId}:
 *   patch:
 *     summary: Update task
 *     description: Update task details including title, description, status, priority, assignee, and due date. Only task assignee or project members can update.
 *     tags:
 *       - Tasks
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: taskId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Task ID
 *         example: 1
 *     requestBody:
 *       $ref: '#/components/requestBodies/UpdateTask'
 *     responses:
 *       200:
 *         $ref: '#/components/responses/TaskUpdated'
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
  '/:id',
  environmentalAuthMiddleware,
  validate(updateTaskSchema),
  asyncHandler(updateTask)
);

/**
 * @swagger
 * /api/v1/tasks/{taskId}:
 *   delete:
 *     summary: Delete task
 *     description: Permanently delete a task. Only project admins or task creator can delete. This action cannot be undone.
 *     tags:
 *       - Tasks
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: taskId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Task ID
 *         example: 1
 *     responses:
 *       200:
 *         $ref: '#/components/responses/TaskDeleted'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.delete('/:id', environmentalAuthMiddleware, asyncHandler(deleteTask));

/**
 * @swagger
 * /api/v1/projects/{projectId}/tasks:
 *   post:
 *     summary: Create task in project
 *     description: Create a new task within a project. Only project members can create tasks.
 *     tags:
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

export default router;
