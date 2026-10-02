import { describe, it, expect, vi } from 'vitest';
import { z } from 'zod';
import type { Request, Response } from 'express';
import { validate } from '../validate.middleware';
import { AppError } from '../../utils/app-error';

describe('validate', () => {
  const schema = z.object({ name: z.string().min(1) });

  it('calls next() with no error and strips unknown keys from the parsed body', () => {
    const req = { body: { name: 'Alice', extra: 'unexpected' } } as unknown as Request;
    const next = vi.fn();
    validate(schema)(req, {} as Response, next);
    expect(next).toHaveBeenCalledWith();
    expect(req.body).toEqual({ name: 'Alice' });
  });

  it('calls next(AppError) for invalid input', () => {
    const req = { body: { name: '' } } as unknown as Request;
    const next = vi.fn();
    validate(schema)(req, {} as Response, next);
    const err = next.mock.calls[0][0] as AppError;
    expect(err).toBeInstanceOf(AppError);
    expect(err.statusCode).toBe(400);
  });

  it('can validate query params instead of the body', () => {
    const querySchema = z.object({ from: z.string(), to: z.string() });
    const req = { query: { from: '2026-01-01', to: '2026-01-05' } } as unknown as Request;
    const next = vi.fn();
    validate(querySchema, 'query')(req, {} as Response, next);
    expect(next).toHaveBeenCalledWith();
    expect(req.query).toEqual({ from: '2026-01-01', to: '2026-01-05' });
  });
});
