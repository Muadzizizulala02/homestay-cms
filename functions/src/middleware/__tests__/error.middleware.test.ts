import { describe, it, expect, vi } from 'vitest';
import type { Request, Response } from 'express';
import { errorHandler } from '../error.middleware';
import { AppError } from '../../utils/app-error';

function mockRes(): Response {
  const res = {} as Response;
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
}

describe('errorHandler', () => {
  it('formats an AppError using its own status code and message', () => {
    const res = mockRes();
    errorHandler(new AppError(404, 'Not found', 'NOT_FOUND'), {} as Request, res, vi.fn());
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: { message: 'Not found', code: 'NOT_FOUND' } });
  });

  it('masks an unexpected error as a generic 500 without leaking its message', () => {
    const res = mockRes();
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    errorHandler(new Error('secret internal detail'), {} as Request, res, vi.fn());
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: { message: 'Internal server error' } });
    consoleSpy.mockRestore();
  });
});
