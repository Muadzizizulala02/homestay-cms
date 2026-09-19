import express, { type NextFunction, type Request, type Response } from 'express';
import { requireAdmin } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validate.middleware';
import {
  mediaIdParamSchema,
  recordMediaSchema,
  signUploadSchema,
  updateMediaSchema,
} from '../../validation/media.schema';
import * as mediaService from '../../services/media.service';

const router = express.Router();

router.use(requireAdmin);

router.post(
  '/sign-upload',
  validate(signUploadSchema),
  (req: Request, res: Response, next: NextFunction) => {
    try {
      res.status(200).json(mediaService.createSignedUploadParams(req.body.folder));
    } catch (err) {
      next(err);
    }
  }
);

router.get('/', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    res.status(200).json(await mediaService.listMedia());
  } catch (err) {
    next(err);
  }
});

router.post('/', validate(recordMediaSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    res.status(201).json(await mediaService.recordMediaItem(req.body));
  } catch (err) {
    next(err);
  }
});

router.put(
  '/:id',
  validate(mediaIdParamSchema, 'params'),
  validate(updateMediaSchema),
  async (req: Request<{ id: string }>, res: Response, next: NextFunction) => {
    try {
      res.status(200).json(await mediaService.updateMediaItem(req.params.id, req.body));
    } catch (err) {
      next(err);
    }
  }
);

router.delete(
  '/:id',
  validate(mediaIdParamSchema, 'params'),
  async (req: Request<{ id: string }>, res: Response, next: NextFunction) => {
    try {
      await mediaService.deleteMediaItem(req.params.id);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  }
);

export default router;
