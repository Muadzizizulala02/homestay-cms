import { z } from 'zod';

export const signUploadSchema = z.object({
  folder: z.string().min(1).max(100).optional(),
});

const associationSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('gallery') }),
  z.object({ type: z.literal('accommodation'), accommodationId: z.string().min(1) }),
]);

export const recordMediaSchema = z.object({
  cloudinaryPublicId: z.string().min(1),
  url: z.string().url(),
  altText: z.string().min(1).max(300),
  association: associationSchema,
});

export const updateMediaSchema = z.object({
  altText: z.string().min(1).max(300).optional(),
  order: z.number().int().min(0).optional(),
  association: associationSchema.optional(),
});

export const mediaIdParamSchema = z.object({ id: z.string().min(1) });
