import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Response } from 'express';

vi.mock('../../config/firebase', () => ({
  auth: { verifyIdToken: vi.fn() },
}));

import { auth } from '../../config/firebase';
import { requireAdmin, type AuthenticatedRequest } from '../auth.middleware';
import { AppError } from '../../utils/app-error';

const verifyIdToken = auth.verifyIdToken as unknown as ReturnType<typeof vi.fn>;

function makeReq(authorization?: string): AuthenticatedRequest {
  return { headers: authorization ? { authorization } : {} } as AuthenticatedRequest;
}

describe('requireAdmin', () => {
  beforeEach(() => {
    verifyIdToken.mockReset();
  });

  it('rejects a request with no Authorization header', async () => {
    const next = vi.fn();
    await requireAdmin(makeReq(), {} as Response, next);
    expect(next).toHaveBeenCalledTimes(1);
    const err = next.mock.calls[0][0] as AppError;
    expect(err).toBeInstanceOf(AppError);
    expect(err.statusCode).toBe(401);
  });

  it('rejects a token without the admin claim', async () => {
    verifyIdToken.mockResolvedValue({ uid: 'u1', email: 'a@b.com' });
    const next = vi.fn();
    await requireAdmin(makeReq('Bearer sometoken'), {} as Response, next);
    const err = next.mock.calls[0][0] as AppError;
    expect(err.statusCode).toBe(403);
  });

  it('attaches the user and calls next() with no error for a valid admin token', async () => {
    verifyIdToken.mockResolvedValue({ uid: 'u1', email: 'a@b.com', role: 'admin' });
    const req = makeReq('Bearer sometoken');
    const next = vi.fn();
    await requireAdmin(req, {} as Response, next);
    expect(req.user).toEqual({ uid: 'u1', email: 'a@b.com' });
    expect(next).toHaveBeenCalledWith();
  });

  it('rejects an invalid or expired token', async () => {
    verifyIdToken.mockRejectedValue(new Error('bad token'));
    const next = vi.fn();
    await requireAdmin(makeReq('Bearer sometoken'), {} as Response, next);
    const err = next.mock.calls[0][0] as AppError;
    expect(err.statusCode).toBe(401);
  });
});
