import { Router } from 'express';
import { environmentalAuthMiddleware } from '../middlewares/environmentalAuthMiddleware';
import { asyncHandler } from '../middlewares/errorHandler';
import { validate } from '../middlewares/validationMiddleware';
import { updateTaskSchema } from '../validators/taskValidationSchemas';
import { getTask, updateTask, deleteTask } from '../controllers/taskController';

const router = Router();

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

export default router;
