import type { NextFunction, Request, Response } from 'express';
import type { ZodType } from 'zod';
import { AppError } from '../utils/app-error';

type RequestPart = 'body' | 'query' | 'params';

/** Validates (and replaces) a request part against a Zod schema before it reaches a controller. */
export function validate(schema: ZodType, part: RequestPart = 'body') {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req[part]);
    if (!result.success) {
      next(new AppError(400, 'Validation failed', 'VALIDATION_ERROR'));
      return;
    }
    (req as Record<RequestPart, unknown>)[part] = result.data;
    next();
  };
}
