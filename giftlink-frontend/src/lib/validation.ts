/**
 * Client-side validation mirroring the API's zod rules. The server stays the source of
 * truth; this only gives instant feedback without a round trip.
 */
export type FieldErrors<K extends string> = Partial<Record<K, string>>;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateEmail(value: string): string | undefined {
  if (!value.trim()) return 'Email is required';
  if (!EMAIL.test(value.trim())) return 'Enter a valid email address';
  return undefined;
}

export function validatePassword(
  value: string,
  { checkStrength = false } = {},
): string | undefined {
  if (!value) return 'Password is required';
  if (checkStrength && value.length < 8) return 'Password must be at least 8 characters';
  if (checkStrength && value.length > 72) return 'Password must be at most 72 characters';
  return undefined;
}

export function validateRequired(value: string, label: string, max = 50): string | undefined {
  if (!value.trim()) return `${label} is required`;
  if (value.trim().length > max) return `${label} must be at most ${max} characters`;
  return undefined;
}

/** Drops undefined entries, so `Object.keys(errors).length === 0` means valid. */
export function compact<K extends string>(errors: Record<K, string | undefined>): FieldErrors<K> {
  return Object.fromEntries(
    Object.entries(errors).filter(([, message]) => message !== undefined),
  ) as FieldErrors<K>;
}

/** Maps the API's `details: [{ path, message }]` onto form fields. */
export function apiFieldErrors<K extends string>(
  details: unknown,
  fields: readonly K[],
): FieldErrors<K> {
  if (!Array.isArray(details)) return {};
  const errors: FieldErrors<K> = {};
  for (const item of details as { path?: unknown; message?: unknown }[]) {
    const field = fields.find((f) => f === item.path);
    if (field && typeof item.message === 'string') errors[field] = item.message;
  }
  return errors;
}
