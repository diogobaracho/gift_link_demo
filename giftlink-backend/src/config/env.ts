/**
 * Typed, validated application configuration (12-factor: everything comes from the env).
 *
 * The raw `process.env` is parsed once with zod at startup, so a missing or malformed
 * variable fails fast with a readable message instead of surfacing later as a confusing
 * runtime error (e.g. "invalid signature" because JWT_SECRET was empty).
 */
import { z } from 'zod';

/** Splits a comma-separated env value into a trimmed, non-empty list. */
const commaSeparatedList = z.string().transform((value) =>
  value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean),
);

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().min(1).max(65_535).default(3060),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).default('info'),

  MONGO_URL: z
    .string()
    .regex(/^mongodb(\+srv)?:\/\//, 'must be a mongodb:// or mongodb+srv:// connection string'),
  MONGO_DB_NAME: z.string().min(1).default('giftdb'),

  JWT_SECRET: z.string().min(16, 'must be at least 16 characters'),
  JWT_EXPIRES_IN: z
    .string()
    .regex(/^\d+[smhd]$/, 'must look like 15m, 1h or 7d')
    .default('1h'),

  SENTIMENT_URL: z.url().optional(),
  SENTIMENT_TIMEOUT_MS: z.coerce.number().int().positive().default(1500),

  CORS_ORIGIN: commaSeparatedList.default(['http://localhost:5173', 'http://localhost:9000']),
  AUTH_RATE_LIMIT_MAX: z.coerce.number().int().positive().default(100),
});

/** Application configuration in idiomatic camelCase, decoupled from env var names. */
export interface AppConfig {
  env: 'development' | 'test' | 'production';
  port: number;
  logLevel: z.infer<typeof envSchema>['LOG_LEVEL'];
  mongo: { url: string; dbName: string };
  jwt: { secret: string; expiresIn: `${number}${'s' | 'm' | 'h' | 'd'}` };
  sentiment: { url: string | undefined; timeoutMs: number };
  corsOrigins: string[];
  authRateLimitMax: number;
}

/** Thrown when the environment does not satisfy {@link envSchema}. */
export class ConfigError extends Error {
  override readonly name = 'ConfigError';
}

/**
 * Parses and validates configuration from an env-like record.
 *
 * @param env - defaults to `process.env`; tests pass a plain object instead.
 * @throws {ConfigError} listing every invalid variable at once.
 */
export function loadConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
  const parsed = envSchema.safeParse(env);
  if (!parsed.success) {
    const problems = parsed.error.issues
      .map((issue) => `  - ${issue.path.join('.')}: ${issue.message}`)
      .join('\n');
    throw new ConfigError(`Invalid environment configuration:\n${problems}`);
  }

  const e = parsed.data;
  // Template values copied from `.env.example` must never run in production.
  if (e.NODE_ENV === 'production' && /change[_-]?me/i.test(`${e.JWT_SECRET} ${e.MONGO_URL}`)) {
    throw new ConfigError(
      'Invalid environment configuration:\n  - JWT_SECRET/MONGO_URL: placeholder CHANGE_ME value in production',
    );
  }
  return {
    env: e.NODE_ENV,
    port: e.PORT,
    logLevel: e.LOG_LEVEL,
    mongo: { url: e.MONGO_URL, dbName: e.MONGO_DB_NAME },
    jwt: { secret: e.JWT_SECRET, expiresIn: e.JWT_EXPIRES_IN as AppConfig['jwt']['expiresIn'] },
    sentiment: { url: e.SENTIMENT_URL, timeoutMs: e.SENTIMENT_TIMEOUT_MS },
    corsOrigins: e.CORS_ORIGIN,
    authRateLimitMax: e.AUTH_RATE_LIMIT_MAX,
  };
}
