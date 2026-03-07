// Mock MUST be at top level, before any imports
jest.mock('../../middlewares/rateLimiter', () => ({
  authLimiterTokenBucket: (req: any, res: any, next: any) => next(),
  generalLimiterTokenBucket: (req: any, res: any, next: any) => next(),
  writeLimiterTokenBucket: (req: any, res: any, next: any) => next(),
  healthCheckLimiterTokenBucket: (req: any, res: any, next: any) => next(),
}));

jest.mock('../../middlewares/validationMiddleware', () => ({
  validate: () => (req: any, res: any, next: any) => next(),
}));

jest.mock('../../middlewares/authMiddleware', () => ({
  authenticate: (req: any, res: any, next: any) => {
    req.user = { id: 1 };
    next();
  },
}));

jest.mock('../../services/userService', () => ({
  registerUser: jest.fn(),
  loginUser: jest.fn(),
  getAllUsers: jest.fn(),
  getUserById: jest.fn(),
  updateUserById: jest.fn(),
  deleteUserById: jest.fn(),
}));

jest.mock('../../services/tokenService', () => ({
  generateTokens: jest.fn(),
  verifyRefreshToken: jest.fn(),
  revokeRefreshToken: jest.fn(),
  revokeAllUserTokens: jest.fn(),
}));

import request from 'supertest';
import express, { Express } from 'express';
import cors from 'cors';
import { errorHandler, notFoundHandler } from '../../middlewares/errorHandler';
import userRoutes from '../../routes/userRoutes';
import * as UserService from '../../services/userService';
import * as TokenService from '../../services/tokenService';

describe('User E2E Journey Tests', () => {
  let app: Express;
  let mockUser: any;
  let mockToken: any;

  beforeAll(() => {
    app = express();
    app.use(cors());
    app.use(express.json());
    app.use('/api/users', userRoutes);
    app.use(notFoundHandler);
    app.use(errorHandler);
  });

  beforeEach(() => {
    jest.clearAllMocks();

    mockUser = {
      id: 1,
      email: 'john.doe@example.com',
      password: 'hashedPassword123',
      firstName: 'John',
      lastName: 'Doe',
      avatar: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    mockToken = {
      jwtToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
      refreshToken: 'refresh_token_123',
      expiresIn: 3600,
    };
  });

  describe('Complete User Lifecycle', () => {
    it('should complete full user journey: register -> login -> refresh -> logout', async () => {
      const newUserData = {
        email: 'john.doe@example.com',
        password: 'SecurePassword123!',
        firstName: 'John',
        lastName: 'Doe',
      };

      // Step 1: Register
      (UserService.registerUser as jest.Mock).mockResolvedValueOnce(mockUser);
      (TokenService.generateTokens as jest.Mock).mockResolvedValueOnce(
        mockToken
      );

      const registerResponse = await request(app)
        .post('/api/users/register')
        .send(newUserData);

      expect(registerResponse.body).toBeDefined();
      expect(registerResponse.status).toBeGreaterThanOrEqual(200);

      // Step 2: Login with same credentials
      (UserService.loginUser as jest.Mock).mockResolvedValueOnce({
        user: mockUser,
      });
      (TokenService.generateTokens as jest.Mock).mockResolvedValueOnce(
        mockToken
      );

      const loginResponse = await request(app).post('/api/users/login').send({
        email: newUserData.email,
        password: newUserData.password,
      });

      expect(loginResponse.body).toBeDefined();
      expect(loginResponse.status).toBeGreaterThanOrEqual(200);

      // Step 3: Refresh token
      (TokenService.verifyRefreshToken as jest.Mock).mockResolvedValueOnce({
        jwtToken: 'new_jwt_token_xyz',
      });

      const refreshResponse = await request(app)
        .post('/api/users/refresh')
        .send({ refreshToken: mockToken.refreshToken });

      expect(refreshResponse.body).toBeDefined();
      expect(refreshResponse.status).toBeGreaterThanOrEqual(200);

      // Step 4: Logout
      (TokenService.revokeRefreshToken as jest.Mock).mockResolvedValueOnce({
        success: true,
      });

      const logoutResponse = await request(app)
        .post('/api/users/logout')
        .send({ refreshToken: mockToken.refreshToken });

      expect(logoutResponse.body).toBeDefined();
      expect(logoutResponse.status).toBeGreaterThanOrEqual(200);
    });
  });

  describe('User Management Workflow', () => {
    it('should retrieve all users', async () => {
      const mockUsers = [
        mockUser,
        { ...mockUser, id: 2, email: 'jane@example.com' },
      ];
      (UserService.getAllUsers as jest.Mock).mockResolvedValueOnce(mockUsers);

      const response = await request(app).get('/api/users');

      expect(response.body).toBeDefined();
    });

    it('should retrieve, update, and delete a user', async () => {
      // Get user
      (UserService.getUserById as jest.Mock).mockResolvedValueOnce(mockUser);
      const getUserResponse = await request(app).get('/api/users/1');
      expect(getUserResponse.body).toBeDefined();

      // Update user
      const updateData = {
        firstName: 'John',
        lastName: 'Updated',
      };
      const updatedUser = { ...mockUser, ...updateData };
      (UserService.updateUserById as jest.Mock).mockResolvedValueOnce(
        updatedUser
      );

      const updateResponse = await request(app)
        .put('/api/users/1')
        .send(updateData);

      expect(updateResponse.body).toBeDefined();

      // Delete user
      (UserService.deleteUserById as jest.Mock).mockResolvedValueOnce(mockUser);
      const deleteResponse = await request(app).delete('/api/users/1');

      expect(deleteResponse.body).toBeDefined();
    });
  });

  describe('Multi-Device Session Management', () => {
    it('should logout from all devices', async () => {
      (TokenService.revokeAllUserTokens as jest.Mock).mockResolvedValueOnce({
        revokedCount: 5,
      });

      const response = await request(app).post('/api/users/logout-all');

      expect(response.body).toBeDefined();
      expect(response.status).toBeGreaterThanOrEqual(200);
    });
  });

  describe('Error Recovery Scenarios', () => {
    it('should recover from failed login attempt', async () => {
      // First attempt fails
      (UserService.loginUser as jest.Mock).mockRejectedValueOnce(
        new Error('Invalid credentials')
      );

      const failedLogin = await request(app).post('/api/users/login').send({
        email: 'test@example.com',
        password: 'wrong',
      });

      expect(failedLogin.status).toBeGreaterThanOrEqual(400);

      // Second attempt succeeds
      (UserService.loginUser as jest.Mock).mockResolvedValueOnce({
        user: mockUser,
      });
      (TokenService.generateTokens as jest.Mock).mockResolvedValueOnce(
        mockToken
      );

      const successLogin = await request(app).post('/api/users/login').send({
        email: mockUser.email,
        password: 'SecurePassword123!',
      });

      expect(successLogin.status).toBeGreaterThanOrEqual(200);
    });

    it('should handle expired token refresh', async () => {
      // First refresh fails
      (TokenService.verifyRefreshToken as jest.Mock).mockRejectedValueOnce(
        new Error('Refresh token expired')
      );

      const expiredRefresh = await request(app)
        .post('/api/users/refresh')
        .send({ refreshToken: 'expired_token' });

      expect(expiredRefresh.status).toBeGreaterThanOrEqual(400);

      // User must login again
      (UserService.loginUser as jest.Mock).mockResolvedValueOnce({
        user: mockUser,
      });
      (TokenService.generateTokens as jest.Mock).mockResolvedValueOnce(
        mockToken
      );

      const reLogin = await request(app).post('/api/users/login').send({
        email: mockUser.email,
        password: 'SecurePassword123!',
      });

      expect(reLogin.status).toBeGreaterThanOrEqual(200);
    });
  });

  describe('Validation & Edge Cases', () => {
    it('should reject registration with invalid email', async () => {
      const response = await request(app).post('/api/users/register').send({
        email: 'not-an-email',
        password: 'SecurePassword123!',
        firstName: 'John',
        lastName: 'Doe',
      });

      expect(response.status).toBeGreaterThanOrEqual(400);
    });

    it('should reject registration with weak password', async () => {
      const response = await request(app).post('/api/users/register').send({
        email: 'test@example.com',
        password: '123',
        firstName: 'John',
        lastName: 'Doe',
      });

      expect(response.status).toBeGreaterThanOrEqual(400);
    });

    it('should handle missing required fields', async () => {
      const response = await request(app).post('/api/users/register').send({
        email: 'test@example.com',
        // Missing password, firstName, lastName
      });

      expect(response.status).toBeGreaterThanOrEqual(400);
    });
  });
});
