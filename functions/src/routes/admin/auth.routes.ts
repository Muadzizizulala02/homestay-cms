import express, { type Response } from 'express';
import { requireAdmin, type AuthenticatedRequest } from '../../middleware/auth.middleware';

const router = express.Router();

// The admin login itself happens client-side via the Firebase Auth SDK (there is no
// public registration endpoint — admins are provisioned with functions/scripts/create-admin.js).
// This route lets the frontend confirm a token is genuinely accepted by the backend and
// fetch the caller's profile after login.
router.get('/me', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  res.status(200).json({ uid: req.user!.uid, email: req.user!.email ?? null });
});

export default router;
