import type { NextFunction, Request, Response } from 'express';
import { AppError } from '../utils/app-error';

/** Central error handler — never leaks stack traces or internal details to the client. */
export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({ error: { message: err.message, code: err.code } });
    return;
  }
  console.error(err);
  res.status(500).json({ error: { message: 'Internal server error' } });
}
