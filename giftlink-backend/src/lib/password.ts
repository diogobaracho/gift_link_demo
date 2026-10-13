/**
 * Password hashing with bcrypt.
 *
 * bcrypt is deliberately slow and salts every hash, so leaked hashes resist brute force
 * and rainbow tables. Cost 10 is about 2^10 key-expansion rounds: tens of milliseconds
 * per hash, which is fine for login but expensive for an attacker running billions of
 * guesses. `bcryptjs` is pure JS (no native build step in Docker).
 */
import bcrypt from 'bcryptjs';

/**
 * Work factor, overridable via BCRYPT_COST (4-15). Tests use 4 to stay fast; production
 * keeps the default of 10. Read once at module load.
 */
export function resolveCostFactor(raw = process.env.BCRYPT_COST): number {
  const cost = Number(raw ?? 10);
  return Number.isInteger(cost) && cost >= 4 && cost <= 15 ? cost : 10;
}

const COST_FACTOR = resolveCostFactor();

export function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, COST_FACTOR);
}

/** Constant-time comparison of a candidate password against a stored hash. */
export function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}
