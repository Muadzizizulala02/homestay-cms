import express, { type NextFunction, type Request, type Response } from 'express';
import { z } from 'zod';
import { validate } from '../middleware/validate.middleware';
import { availabilityQuerySchema } from '../validation/booking.schema';
import * as siteSettingsService from '../services/site-settings.service';
import * as accommodationService from '../services/accommodation.service';
import * as mediaService from '../services/media.service';
import * as bookingService from '../services/booking.service';

const router = express.Router();

router.get('/site-settings', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    res.status(200).json(await siteSettingsService.getSiteSettings());
  } catch (err) {
    next(err);
  }
});

router.get('/accommodations', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    res.status(200).json(await accommodationService.listActiveAccommodations());
  } catch (err) {
    next(err);
  }
});

router.get(
  '/accommodations/:slug',
  validate(z.object({ slug: z.string().min(1) }), 'params'),
  async (req: Request<{ slug: string }>, res: Response, next: NextFunction) => {
    try {
      res.status(200).json(await accommodationService.getActiveAccommodationBySlug(req.params.slug));
    } catch (err) {
      next(err);
    }
  }
);

router.get(
  '/accommodations/:id/availability',
  validate(z.object({ id: z.string().min(1) }), 'params'),
  validate(availabilityQuerySchema, 'query'),
  async (req: Request<{ id: string }>, res: Response, next: NextFunction) => {
    try {
      const { from, to } = req.query as unknown as { from: string; to: string };
      res.status(200).json(await bookingService.getAvailability(req.params.id, from, to));
    } catch (err) {
      next(err);
    }
  }
);

router.get('/gallery', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    res.status(200).json(await mediaService.listGalleryMedia());
  } catch (err) {
    next(err);
  }
});

export default router;
