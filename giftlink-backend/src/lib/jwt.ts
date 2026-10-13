/**
 * JSON Web Token helpers (stateless auth, see ADR-0005).
 *
 * A token is `base64url(header).base64url(claims).HMAC-SHA256(secret)`. Anyone can
 * read the claims, so they contain only identifiers and no secrets. Only the server can
 * produce a valid signature. The algorithm is pinned to HS256 on verify to block
 * `alg: none` and algorithm-confusion attacks.
 */
import jwt from 'jsonwebtoken';

import type { AppConfig } from '../config/env.js';

export interface AuthClaims {
  /** Subject: the user's id. */
  sub: string;
  email: string;
}

const ALGORITHM = 'HS256';

export function signToken(claims: AuthClaims, options: AppConfig['jwt']): string {
  return jwt.sign({ email: claims.email }, options.secret, {
    subject: claims.sub,
    expiresIn: options.expiresIn,
    algorithm: ALGORITHM,
  });
}

/**
 * Verifies signature, algorithm and expiry, then checks that the claims have the shape we
 * issue.
 *
 * @throws {Error} (from jsonwebtoken, or for malformed claims): callers map it to 401.
 */
export function verifyToken(token: string, secret: string): AuthClaims {
  const payload = jwt.verify(token, secret, { algorithms: [ALGORITHM] });
  if (typeof payload === 'string' || !payload.sub || typeof payload.email !== 'string') {
    throw new Error('Malformed token claims');
  }
  return { sub: payload.sub, email: payload.email };
}
