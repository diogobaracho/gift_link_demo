/**
 * Escapes every regex metacharacter so user text matches literally.
 *
 * Without this, a search like `.*` matches everything, `(` throws a 500, and a crafted
 * pattern such as `(a+)+$` can pin the database CPU (ReDoS). The course skeleton passed
 * `req.query.name` straight into `$regex`.
 */
export function escapeRegex(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
