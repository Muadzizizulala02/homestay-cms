import express, { type NextFunction, type Request, type Response } from 'express';
import { requireAdmin } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validate.middleware';
import { updateSiteSettingsSchema } from '../../validation/site-settings.schema';
import * as siteSettingsService from '../../services/site-settings.service';

const router = express.Router();

router.use(requireAdmin);

router.get('/', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    res.status(200).json(await siteSettingsService.getSiteSettings());
  } catch (err) {
    next(err);
  }
});

router.put('/', validate(updateSiteSettingsSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    res.status(200).json(await siteSettingsService.updateSiteSettings(req.body));
  } catch (err) {
    next(err);
  }
});

export default router;
