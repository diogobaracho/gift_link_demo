/**
 * Client-side JWT helpers.
 *
 * The browser cannot verify a token's signature (it does not have the secret) and does
 * not need to: the server verifies on every request. The client only reads `exp` to log
 * the user out proactively instead of waiting for a 401.
 */

/** Decodes the payload of a JWT, or returns null when malformed. */
export function decodeJwtPayload(token: string): Record<string, unknown> | null {
  const payload = token.split('.')[1];
  if (!payload) return null;
  try {
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const decoded: unknown = JSON.parse(atob(base64));
    return decoded && typeof decoded === 'object' ? (decoded as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

/** Milliseconds until the token expires (≤ 0 when expired or unreadable). */
export function msUntilExpiry(token: string, now = Date.now()): number {
  const exp = decodeJwtPayload(token)?.exp;
  return typeof exp === 'number' ? exp * 1000 - now : 0;
}
