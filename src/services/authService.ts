import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma';
import { LoginDto, SignupDto, JwtPayload, TokenResponse } from '../types/auth';

/** AuthService
 * Contains all authentication logic (password hashing, token creation, database queries)
 */

export class AuthService {
  /**
   * Hash password with bcrypt
   * Store hashed password in database, never store plain text
   */
  static async hashPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt(10); // Generate random salt
    return bcrypt.hash(password, salt); // Hash password with salt
  }

  /**
   * Compare plain password with hashed password
   * When user logs in, check if they typed correct password
   */
  static async comparePassword(
    password: string,
    hash: string
  ): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  /**
   * Create JWT access token (short-lived, 24 hours)
   * Client sends this with every request to prove they're logged in
   */
  static generateAccessToken(payload: JwtPayload): string {
    const secret = process.env.JWT_SECRET;

    if (!secret) {
      throw new Error('JWT_SECRET not configured');
    }

    return jwt.sign(payload, secret as string, {
      expiresIn: '24h',
    });
  }

  /**
   * Create JWT refresh token (long-lived, 7 days)
   * When access token expires, use refresh token to get new access token
   * (without asking user to login again)
   */
  static generateRefreshToken(payload: JwtPayload): string {
    const secret = process.env.JWT_REFRESH_SECRET;

    if (!secret) {
      throw new Error('JWT_REFRESH_SECRET not configured');
    }

    // Cast secret as string to fix type error
    return jwt.sign(payload, secret as string, {
      expiresIn: '7d',
    });
  }

  /**
   * Create both tokens at once
   */
  static generateTokens(payload: JwtPayload): TokenResponse {
    return {
      accessToken: this.generateAccessToken(payload),
      refreshToken: this.generateRefreshToken(payload),
    };
  }

  /**
   * Verify refresh token is valid
   *
   * When client sends refresh token, check if it's not expired/tampered
   */
  static verifyRefreshToken(token: string): JwtPayload | null {
    try {
      return jwt.verify(token, process.env.JWT_REFRESH_SECRET!) as JwtPayload;
    } catch (err) {
      console.error('Auth error:', err);
      return null; // Token invalid or expired
    }
  }

  /**
   * Register new user
   *
   * Steps:
   * 1. Check if user already exists
   * 2. Hash password
   * 3. Create user in database
   * 4. Generate tokens
   * 5. Return user + tokens
   */
  static async signup(data: SignupDto): Promise<any> {
    // Check if ema il already registered
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      throw new Error('User already exists');
    }

    // Hash password before storing
    const passwordHash = await this.hashPassword(data.password);

    // Create user in database
    const user = await prisma.user.create({
      data: {
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        passwordHash, // Store hashed password
      },
    });

    // Generate JWT tokens
    const tokens = this.generateTokens({
      id: user.id,
      email: user.email,
    });

    // Return user data + tokens
    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      },
      ...tokens, // Spread: { accessToken, refreshToken }
    };
  }

  /**
   * Login existing user
   *
   * Steps:
   * 1. Find user by email
   * 2. Compare password with hashed password
   * 3. If match, generate tokens
   * 4. Return user + tokens
   */
  static async login(data: LoginDto): Promise<any> {
    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (!user) {
      throw new Error('Invalid credentials');
    }

    // Check if password matches
    const isValidPassword = await this.comparePassword(
      data.password,
      user.passwordHash
    );

    if (!isValidPassword) {
      throw new Error('Invalid credentials');
    }

    // Generate tokens
    const tokens = this.generateTokens({
      id: user.id,
      email: user.email,
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      },
      ...tokens,
    };
  }

  /**
   * Refresh expired access token
   *
   * Steps:
   * 1. Verify refresh token is valid
   * 2. Check user still exists
   * 3. Generate new tokens
   * 4. Return new tokens
   */
  static async refreshAccessToken(
    refreshToken: string
  ): Promise<TokenResponse> {
    // Verify refresh token
    const payload = this.verifyRefreshToken(refreshToken);

    if (!payload) {
      throw new Error('Invalid refresh token');
    }

    // Make sure user still exists
    const user = await prisma.user.findUnique({
      where: { id: payload.id },
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Generate new tokens
    return this.generateTokens({
      id: user.id,
      email: user.email,
    });
  }
}
