import type { NextFunction, Request, Response } from 'express';
import { auth } from '../config/firebase';
import { AppError } from '../utils/app-error';

export interface AuthenticatedRequest extends Request {
  user?: { uid: string; email?: string };
}

/**
 * Verifies the Firebase Auth ID token on the Authorization header and requires
 * the `role: admin` custom claim. There is no public registration endpoint —
 * admin accounts are provisioned out-of-band via the Admin SDK.
 */
export async function requireAdmin(
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
      throw new AppError(401, 'Missing bearer token', 'UNAUTHENTICATED');
    }

    const idToken = header.slice('Bearer '.length);
    const decoded = await auth.verifyIdToken(idToken);

    if (decoded.role !== 'admin') {
      throw new AppError(403, 'Admin access required', 'FORBIDDEN');
    }

    req.user = { uid: decoded.uid, email: decoded.email };
    next();
  } catch (err) {
    if (err instanceof AppError) {
      next(err);
      return;
    }
    next(new AppError(401, 'Invalid or expired token', 'UNAUTHENTICATED'));
  }
}
