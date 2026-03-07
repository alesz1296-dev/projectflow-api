// Mock MUST be at top level, before any imports
jest.mock('../../middlewares/rateLimiter', () => ({
  authLimiterTokenBucket: (_req: any, _res: any, next: any) => next(),
  generalLimiterTokenBucket: (_req: any, _res: any, next: any) => next(),
  writeLimiterTokenBucket: (_req: any, _res: any, next: any) => next(),
  healthCheckLimiterTokenBucket: (_req: any, _res: any, next: any) => next(),
}));

jest.mock('../../middlewares/validationMiddleware', () => ({
  validate: () => (_req: any, _res: any, next: any) => next(),
}));

jest.mock('../../middlewares/authMiddleware', () => ({
  authenticate: (_req: any, _res: any, next: any) => {
    _req.user = { id: 1 };
    next();
  },
}));

jest.mock('../../services/userService', () => ({
  UserService: {
    registerUser: jest.fn(),
    loginUser: jest.fn(),
    getAllUsers: jest.fn(),
    getUserById: jest.fn(),
    updateUserById: jest.fn(),
    deleteUserById: jest.fn(),
  },
}));

jest.mock('../../services/tokenService', () => ({
  TokenService: {
    generateTokens: jest.fn(),
    verifyRefreshToken: jest.fn(),
    revokeRefreshToken: jest.fn(),
    revokeAllUserTokens: jest.fn(),
  },
}));

import request from 'supertest';
import express, { Express } from 'express';
import cors from 'cors';
import { errorHandler, notFoundHandler } from '../../middlewares/errorHandler';
import userRoutes from '../userRoutes';
import { UserService } from '../../services/userService';
import { TokenService } from '../../services/tokenService';

describe('User Routes Integration Tests', () => {
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

    // Use ISO string for createdAt to match JSON serialization
    mockUser = {
      id: 1,
      email: 'test@example.com',
      firstName: 'John',
      lastName: 'Doe',
      avatar: null,
      createdAt: new Date().toISOString(),
    };

    mockToken = {
      jwtToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
      refreshToken: 'refresh_token_123',
      expiresIn: 3600,
    };
  });

  describe('POST /api/users/register', () => {
    it('should register a new user successfully', async () => {
      const registerData = {
        email: 'newuser@example.com',
        password: 'Password123!',
        firstName: 'Jane',
        lastName: 'Smith',
      };

      (UserService.registerUser as jest.Mock).mockResolvedValueOnce(mockUser);
      (TokenService.generateTokens as jest.Mock).mockResolvedValueOnce(
        mockToken
      );

      const response = await request(app)
        .post('/api/users/register')
        .send(registerData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user).toEqual(mockUser);
    });
  });

  describe('Error handling', () => {
    it('should handle validation errors', async () => {
      const invalidData = {
        email: 'invalid-email',
        password: 'Password123!',
      };

      const response = await request(app)
        .post('/api/users/register')
        .send(invalidData);

      expect(response.status).toBeGreaterThanOrEqual(400);
    });

    it('should handle missing refresh token on logout', async () => {
      const response = await request(app).post('/api/users/logout').send({});

      expect(response.status).toBeGreaterThanOrEqual(400);
    });

    it('should fail when user not found', async () => {
      (UserService.getUserById as jest.Mock).mockRejectedValueOnce(
        new Error('User not found')
      );

      const response = await request(app).get('/api/users/999');

      expect(response.status).toBeGreaterThanOrEqual(400);
    });

    it('should handle invalid credentials', async () => {
      (UserService.loginUser as jest.Mock).mockRejectedValueOnce(
        new Error('Invalid credentials')
      );

      const response = await request(app).post('/api/users/login').send({
        email: 'test@example.com',
        password: 'WrongPassword123!',
      });

      expect(response.status).toBeGreaterThanOrEqual(400);
    });

    it('should handle invalid refresh token', async () => {
      (TokenService.verifyRefreshToken as jest.Mock).mockRejectedValueOnce(
        new Error('Invalid refresh token')
      );

      const response = await request(app)
        .post('/api/users/refresh')
        .send({ refreshToken: 'invalid_token' });

      expect(response.status).toBeGreaterThanOrEqual(400);
    });
  });

  describe('Protected Routes', () => {
    it('should get all users', async () => {
      const mockUsers = [mockUser];
      (UserService.getAllUsers as jest.Mock).mockResolvedValueOnce(mockUsers);

      const response = await request(app).get('/api/users');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockUsers);
    });

    it('should get user by id', async () => {
      (UserService.getUserById as jest.Mock).mockResolvedValueOnce(mockUser);

      const response = await request(app).get('/api/users/1');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockUser);
    });

    it('should logout from all devices', async () => {
      (TokenService.revokeAllUserTokens as jest.Mock).mockResolvedValueOnce({
        revokedCount: 3,
      });

      const response = await request(app).post('/api/users/logout-all');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });
});
