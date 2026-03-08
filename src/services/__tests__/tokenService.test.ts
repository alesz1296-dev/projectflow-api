import { TokenService } from '../tokenService';
import { prisma } from '../../lib/prisma';
import jwt from 'jsonwebtoken';
import { AppError } from '../../middlewares/errorHandler';

// Set mock environment variable
process.env.JWT_SECRET = 'test-secret-key';

jest.mock('../../lib/prisma', () => ({
  prisma: {
    refreshTokenRecord: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      deleteMany: jest.fn(),
    },
  },
}));

jest.mock('jsonwebtoken');

describe('TokenService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('generateTokens', () => {
    test('should generate jwt and refresh tokens', async () => {
      const mockJwtSign = jwt.sign as jest.Mock;
      const mockCreate = prisma.refreshTokenRecord.create as jest.Mock;

      mockJwtSign
        .mockReturnValueOnce('jwt_token')
        .mockReturnValueOnce('refresh_token');
      mockCreate.mockResolvedValueOnce({
        id: 1,
        token: 'refresh_token',
        userId: 1,
        expiresAt: new Date(),
        revokedAt: null,
      });

      const result = await TokenService.generateTokens(1, 'user@test.com');

      expect(result.jwtToken).toBe('jwt_token');
      expect(result.refreshToken).toBe('refresh_token');
    });

    test('should store refresh token in database', async () => {
      const mockJwtSign = jwt.sign as jest.Mock;
      const mockCreate = prisma.refreshTokenRecord.create as jest.Mock;

      mockJwtSign
        .mockReturnValueOnce('jwt_token')
        .mockReturnValueOnce('refresh_token');
      mockCreate.mockResolvedValueOnce({
        token: 'refresh_token',
        userId: 1,
      });

      await TokenService.generateTokens(1, 'user@test.com');

      expect(mockCreate).toHaveBeenCalled();
    });
  });

  describe('verifyRefreshToken', () => {
    test('should verify and return user data from valid token', async () => {
      const mockJwtVerify = jwt.verify as jest.Mock;
      const mockFindUnique = prisma.refreshTokenRecord.findUnique as jest.Mock;
      const mockJwtSign = jwt.sign as jest.Mock;

      mockJwtVerify.mockReturnValueOnce({
        id: 1,
        email: 'user@test.com',
      });
      mockFindUnique.mockResolvedValueOnce({
        token: 'valid_token',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        revokedAt: null,
      });
      mockJwtSign.mockReturnValueOnce('new_jwt');

      const result = await TokenService.verifyRefreshToken('valid_token');

      expect(result.id).toBe(1);
      expect(result.email).toBe('user@test.com');
      expect(result.jwtToken).toBe('new_jwt');
    });

    test('should throw error if token not found in database', async () => {
      const mockJwtVerify = jwt.verify as jest.Mock;
      const mockFindUnique = prisma.refreshTokenRecord.findUnique as jest.Mock;

      mockJwtVerify.mockReturnValueOnce({ id: 1, email: 'user@test.com' });
      mockFindUnique.mockResolvedValueOnce(null);

      await expect(
        TokenService.verifyRefreshToken('invalid_token')
      ).rejects.toThrow(AppError);
      await expect(
        TokenService.verifyRefreshToken('invalid_token')
      ).rejects.toThrow('Refresh token not found');
    });

    test('should throw error if token is revoked', async () => {
      const mockJwtVerify = jwt.verify as jest.Mock;
      const mockFindUnique = prisma.refreshTokenRecord.findUnique as jest.Mock;

      mockJwtVerify.mockReturnValueOnce({ id: 1, email: 'user@test.com' });
      mockFindUnique.mockResolvedValueOnce({
        token: 'revoked_token',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        revokedAt: new Date(),
      });

      await expect(
        TokenService.verifyRefreshToken('revoked_token')
      ).rejects.toThrow('revoked');
    });

    test('should throw error if token is expired', async () => {
      const mockJwtVerify = jwt.verify as jest.Mock;
      const mockFindUnique = prisma.refreshTokenRecord.findUnique as jest.Mock;

      mockJwtVerify.mockReturnValueOnce({ id: 1, email: 'user@test.com' });
      mockFindUnique.mockResolvedValueOnce({
        token: 'expired_token',
        expiresAt: new Date(Date.now() - 1000),
        revokedAt: null,
      });

      await expect(
        TokenService.verifyRefreshToken('expired_token')
      ).rejects.toThrow('expired');
    });
  });

  describe('revokeRefreshToken', () => {
    test('should revoke a refresh token', async () => {
      const mockFindUnique = prisma.refreshTokenRecord.findUnique as jest.Mock;
      const mockUpdate = prisma.refreshTokenRecord.update as jest.Mock;

      mockFindUnique.mockResolvedValueOnce({
        token: 'token_to_revoke',
        userId: 1,
      });
      mockUpdate.mockResolvedValueOnce({
        token: 'token_to_revoke',
        revokedAt: new Date(),
      });

      const result = await TokenService.revokeRefreshToken('token_to_revoke');

      expect(result.success).toBe(true);
      expect(mockUpdate).toHaveBeenCalled();
    });

    test('should throw error if token not found', async () => {
      const mockFindUnique = prisma.refreshTokenRecord.findUnique as jest.Mock;

      mockFindUnique.mockResolvedValueOnce(null);

      await expect(
        TokenService.revokeRefreshToken('nonexistent_token')
      ).rejects.toThrow(AppError);
      await expect(
        TokenService.revokeRefreshToken('nonexistent_token')
      ).rejects.toThrow('Refresh token not found');
    });
  });

  describe('revokeAllUserTokens', () => {
    test('should revoke all user tokens', async () => {
      const mockUpdateMany = prisma.refreshTokenRecord.updateMany as jest.Mock;

      mockUpdateMany.mockResolvedValueOnce({
        count: 3,
      });

      const result = await TokenService.revokeAllUserTokens(1);

      expect(result.success).toBe(true);
      expect(result.revokedCount).toBe(3);
      expect(mockUpdateMany).toHaveBeenCalledWith({
        where: { userId: 1 },
        data: { revokedAt: expect.any(Date) },
      });
    });

    test('should throw error on database failure', async () => {
      const mockUpdateMany = prisma.refreshTokenRecord.updateMany as jest.Mock;

      mockUpdateMany.mockRejectedValueOnce(new Error('Database error'));

      try {
        await TokenService.revokeAllUserTokens(1);
        fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeInstanceOf(AppError);
        expect((error as AppError).statusCode).toBe(500);
        expect((error as AppError).message).toBe(
          'Failed to revoke user tokens'
        );
      }
    });
  });

  describe('generateNewJWT', () => {
    test('should generate a new JWT token', () => {
      const mockJwtSign = jwt.sign as jest.Mock;
      mockJwtSign.mockReturnValueOnce('new_jwt_token');

      const result = TokenService.generateNewJWT(1, 'user@test.com');

      expect(result).toBe('new_jwt_token');
      expect(mockJwtSign).toHaveBeenCalledWith(
        { id: 1, email: 'user@test.com' },
        'test-secret-key',
        { expiresIn: '15m' }
      );
    });
  });
});
