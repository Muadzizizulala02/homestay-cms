import express, { type NextFunction, type Request, type Response } from 'express';
import { requireAdmin } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validate.middleware';
import {
  createAccommodationSchema,
  idParamSchema,
  updateAccommodationSchema,
} from '../../validation/accommodation.schema';
import * as accommodationService from '../../services/accommodation.service';

const router = express.Router();

router.use(requireAdmin);

router.get('/', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    res.status(200).json(await accommodationService.listAccommodations());
  } catch (err) {
    next(err);
  }
});

router.get(
  '/:id',
  validate(idParamSchema, 'params'),
  async (req: Request<{ id: string }>, res: Response, next: NextFunction) => {
    try {
      res.status(200).json(await accommodationService.getAccommodation(req.params.id));
    } catch (err) {
      next(err);
    }
  }
);

router.post('/', validate(createAccommodationSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    res.status(201).json(await accommodationService.createAccommodation(req.body));
  } catch (err) {
    next(err);
  }
});

router.put(
  '/:id',
  validate(idParamSchema, 'params'),
  validate(updateAccommodationSchema),
  async (req: Request<{ id: string }>, res: Response, next: NextFunction) => {
    try {
      res.status(200).json(await accommodationService.updateAccommodation(req.params.id, req.body));
    } catch (err) {
      next(err);
    }
  }
);

router.delete(
  '/:id',
  validate(idParamSchema, 'params'),
  async (req: Request<{ id: string }>, res: Response, next: NextFunction) => {
    try {
      await accommodationService.deleteAccommodation(req.params.id);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  }
);

export default router;
