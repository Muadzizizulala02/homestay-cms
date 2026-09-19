import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { auth } from '../../../config/firebase';
import { app } from '../../../app';
import { signInAndGetIdToken } from '../../../test/auth-emulator';

const ADMIN_EMAIL = 'admin-test@example.com';
const NON_ADMIN_EMAIL = 'guest-test@example.com';
const PASSWORD = 'Password123!';

async function ensureUser(email: string, claims: Record<string, unknown> | null): Promise<string> {
  let user;
  try {
    user = await auth.getUserByEmail(email);
  } catch {
    user = await auth.createUser({ email, password: PASSWORD, emailVerified: true });
  }
  await auth.setCustomUserClaims(user.uid, claims);
  return user.uid;
}

// supertest talks to the Express `app` object directly, bypassing the Cloud Function/emulator
// URL layer entirely — so it must use the path Express is actually mounted at (/v1/...), not
// the full client-facing URL (.../api/v1/...) a browser or curl would use. See app.ts.
describe('GET /v1/admin/me', () => {
  let adminUid: string;

  beforeAll(async () => {
    adminUid = await ensureUser(ADMIN_EMAIL, { role: 'admin' });
    await ensureUser(NON_ADMIN_EMAIL, null);
  });

  it('rejects a request with no Authorization header', async () => {
    const res = await request(app).get('/v1/admin/me');
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHENTICATED');
  });

  it('rejects a garbage bearer token', async () => {
    const res = await request(app).get('/v1/admin/me').set('Authorization', 'Bearer not-a-real-token');
    expect(res.status).toBe(401);
  });

  it('rejects a valid token that lacks the admin claim', async () => {
    const token = await signInAndGetIdToken(NON_ADMIN_EMAIL, PASSWORD);
    const res = await request(app).get('/v1/admin/me').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('FORBIDDEN');
  });

  it('returns the caller profile for a valid admin token', async () => {
    const token = await signInAndGetIdToken(ADMIN_EMAIL, PASSWORD);
    const res = await request(app).get('/v1/admin/me').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ uid: adminUid, email: ADMIN_EMAIL });
  });
});
