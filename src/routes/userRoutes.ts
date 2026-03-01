import { Router } from 'express';
import {
  registerUser,
  loginUser,
  refreshAccessToken,
  logoutUser,
  logoutAllDevices,
  getAllUsers,
  getUserById,
  updateUserById,
  deleteUserById,
} from '../controllers/userController';
import { validate } from '../middlewares/validationMiddleware';
import {
  registerUserSchema,
  loginUserSchema,
  updateUserSchema,
} from '../validators/userValidationSchemas';
import { authenticate } from '../middlewares/authMiddleware';
import { authLimiterTokenBucket } from '../middlewares/rateLimiter';
import { asyncHandler } from '../middlewares/errorHandler';

const router = Router();

/**
 * @swagger
 * /api/v1/auth/register:
 *   post:
 *     summary: Register a new user
 *     description: Create a new user account with email and password. Returns access and refresh tokens.
 *     tags:
 *       - Authentication
 *     requestBody:
 *       $ref: '#/components/requestBodies/RegisterUser'
 *     responses:
 *       201:
 *         $ref: '#/components/responses/AuthSuccess'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       409:
 *         $ref: '#/components/responses/Conflict'
 */
router.post(
  '/register',
  authLimiterTokenBucket,
  validate(registerUserSchema),
  asyncHandler(registerUser)
);

/**
 * @swagger
 * /api/v1/auth/login:
 *   post:
 *     summary: Login user
 *     description: Authenticate user with email and password. Returns access and refresh tokens.
 *     tags:
 *       - Authentication
 *     requestBody:
 *       $ref: '#/components/requestBodies/LoginUser'
 *     responses:
 *       200:
 *         $ref: '#/components/responses/AuthSuccess'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.post(
  '/login',
  authLimiterTokenBucket,
  validate(loginUserSchema),
  asyncHandler(loginUser)
);

/**
 * @swagger
 * /api/v1/auth/refresh:
 *   post:
 *     summary: Refresh access token
 *     description: Use refresh token to obtain a new access token. Refresh token should be sent in request body or cookies.
 *     tags:
 *       - Authentication
 *     requestBody:
 *       $ref: '#/components/requestBodies/RefreshToken'
 *     responses:
 *       200:
 *         $ref: '#/components/responses/TokenRefreshed'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.post('/refresh', asyncHandler(refreshAccessToken));

/**
 * @swagger
 * /api/v1/auth/logout:
 *   post:
 *     summary: Logout user
 *     description: Logout user by invalidating current refresh token. Clears session on current device.
 *     tags:
 *       - Authentication
 *     requestBody:
 *       $ref: '#/components/requestBodies/LogoutUser'
 *     responses:
 *       200:
 *         description: Logged out successfully
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
 *                   example: 'Logged out successfully'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.post('/logout', asyncHandler(logoutUser));

/**
 * @swagger
 * /api/v1/auth/logout-all:
 *   post:
 *     summary: Logout from all devices
 *     description: Invalidate all refresh tokens for the user. Logs out user from all devices/sessions.
 *     tags:
 *       - Authentication
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logged out from all devices successfully
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
 *                   example: 'Logged out from all devices successfully'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.post('/logout-all', authenticate, asyncHandler(logoutAllDevices));

/**
 * @swagger
 * /api/v1/users:
 *   get:
 *     summary: Get all users
 *     description: Retrieve a list of all users in the system. Requires authentication.
 *     tags:
 *       - Users
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         $ref: '#/components/responses/UsersRetrieved'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get('/', authenticate, asyncHandler(getAllUsers));

/**
 * @swagger
 * /api/v1/users/{userId}:
 *   get:
 *     summary: Get user by ID
 *     description: Retrieve details of a specific user by their ID.
 *     tags:
 *       - Users
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *         description: User ID
 *         example: 1
 *     responses:
 *       200:
 *         $ref: '#/components/responses/UserRetrieved'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.get('/:id', authenticate, asyncHandler(getUserById));

/**
 * @swagger
 * /api/v1/users/{userId}:
 *   patch:
 *     summary: Update user
 *     description: Update user profile information. Users can only update their own profile.
 *     tags:
 *       - Users
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *         description: User ID
 *         example: 1
 *     requestBody:
 *       $ref: '#/components/requestBodies/UpdateUser'
 *     responses:
 *       200:
 *         $ref: '#/components/responses/UserUpdated'
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
  authenticate,
  validate(updateUserSchema),
  asyncHandler(updateUserById)
);

/**
 * @swagger
 * /api/v1/users/{userId}:
 *   delete:
 *     summary: Delete user
 *     description: Permanently delete a user account. Users can only delete their own account. This action cannot be undone.
 *     tags:
 *       - Users
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *         description: User ID
 *         example: 1
 *     responses:
 *       200:
 *         description: User deleted successfully
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
 *                   example: 'User deleted successfully'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.delete('/:id', authenticate, asyncHandler(deleteUserById));

export default router;
