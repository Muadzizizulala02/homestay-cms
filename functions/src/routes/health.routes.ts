import express from 'express';

const router = express.Router();

router.get('/health', (_req: express.Request, res: express.Response) => {
  res.status(200).json({ status: 'ok' });
});

export default router;
