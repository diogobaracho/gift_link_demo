/**
 * Request schemas for /api/auth.
 */
import { z } from 'zod';

/** Emails are case-insensitive: normalize before validation and storage. */
const email = z.string().trim().toLowerCase().pipe(z.email('must be a valid email address'));

/** bcrypt only uses the first 72 bytes of input, so longer passwords are rejected. */
const password = z.string().min(8, 'must be at least 8 characters').max(72);

const personName = z.string().trim().min(1, 'is required').max(50);

export const registerSchema = z
  .object({ email, password, firstName: personName, lastName: personName })
  .strict();

export const loginSchema = z.object({
  email,
  password: z.string().min(1, 'is required'),
});

export const updateProfileSchema = z
  .object({ firstName: personName.optional(), lastName: personName.optional() })
  .strict()
  .refine((value) => value.firstName !== undefined || value.lastName !== undefined, {
    message: 'Provide at least one field to update',
  });

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
