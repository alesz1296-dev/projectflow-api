/**
 * Environmental Authentication Middleware
 *
 * Development Mode:
 *   - Allows requests without token
 *   - Uses mock user for testing
 *
 * Production Mode:
 *   - Requires valid JWT token
 *   - Validates token before proceeding
 */

import jwt from 'jsonwebtoken';

export const environmentalAuthMiddleware = (
  req: any,
  res: any,
  next: any
): void => {
  const token = req.headers.authorization?.split(' ')[1];
  const isProduction = process.env.NODE_ENV === 'production';

  // Production: Token is REQUIRED
  if (isProduction && !token) {
    res.status(401).json({
      error: 'Missing or invalid authorization header',
      message: 'Production environment requires valid JWT token',
    });
    return;
  }

  // If token is provided, validate it
  if (token) {
    try {
      const secret = process.env.JWT_SECRET || 'your-secret-key';
      const decoded = jwt.verify(token, secret) as any;

      // Attach user to request
      req.user = {
        id: decoded.id,
        email: decoded.email,
      };

      next();
    } catch (err) {
      // Log error for debugging
      console.error('Token verification failed:', err);
      res.status(401).json({
        error: 'Invalid or expired token',
        message: 'Please provide a valid JWT token',
      });
    }
  } else {
    // Development: Use mock user if no token provided
    if (!isProduction) {
      req.user = {
        id: 1,
        email: 'dev-test@example.com',
        name: 'Development Test User',
      };
      next();
    }
  }
};
