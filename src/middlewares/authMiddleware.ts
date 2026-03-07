import { Request, Response, NextFunction } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: JwtPayload & { id: number; email: string };
    }
  }
}

/**
 * ============================================
 * AUTHENTICATE MIDDLEWARE
 * ============================================
 * Verifies JWT token from Authorization header
 * Attaches decoded user to req.user
 */
export const authenticate = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'No token provided',
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify and decode token
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'your-secret-key'
    ) as JwtPayload & { id: number; email: string };

    // Attach user to request
    req.user = decoded;
    next();
  } catch (err) {
    console.error('JWT verification failed:', err);
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token',
    });
  }
};

/**
 * ============================================
 * ENVIRONMENTAL AUTH MIDDLEWARE
 * ============================================
 * Development: Bypasses auth and sets mock user
 * Production: Requires valid JWT token
 */
export const environmentalAuthMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Development mode - skip auth
  if (process.env.NODE_ENV === 'development') {
    req.user = { id: 1, email: 'dev@example.com' } as JwtPayload & {
      id: number;
      email: string;
    };
    return next();
  }

  // Production mode - require auth
  authenticate(req, res, next);
};
