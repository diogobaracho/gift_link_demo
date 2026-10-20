import { describe, expect, it } from 'vitest';

import { ConfigError, loadConfig } from '../../src/config/env.js';

const validEnv = {
  MONGO_URL: 'mongodb://localhost:27017',
  JWT_SECRET: 'a-secret-of-sixteen+',
};

describe('loadConfig', () => {
  it('applies sensible defaults', () => {
    const config = loadConfig(validEnv);

    expect(config).toMatchObject({
      env: 'development',
      port: 3060,
      mongo: { url: validEnv.MONGO_URL, dbName: 'giftdb' },
      jwt: { expiresIn: '1h' },
      sentiment: { url: undefined, timeoutMs: 1500 },
      corsOrigins: ['http://localhost:5173', 'http://localhost:9000'],
    });
  });

  it('coerces numbers and splits comma-separated origins', () => {
    const config = loadConfig({
      ...validEnv,
      PORT: '8000',
      CORS_ORIGIN: 'https://a.example, https://b.example ,',
      SENTIMENT_URL: 'http://sentiment:3000',
    });

    expect(config.port).toBe(8000);
    expect(config.corsOrigins).toEqual(['https://a.example', 'https://b.example']);
    expect(config.sentiment.url).toBe('http://sentiment:3000');
  });

  it('accepts mongodb+srv connection strings (Atlas)', () => {
    expect(() =>
      loadConfig({ ...validEnv, MONGO_URL: 'mongodb+srv://u:p@cluster.mongodb.net' }),
    ).not.toThrow();
  });

  it('reports every invalid variable at once', () => {
    const attempt = () => loadConfig({ MONGO_URL: 'postgres://nope', JWT_SECRET: 'short' });

    expect(attempt).toThrow(ConfigError);
    expect(attempt).toThrow(/MONGO_URL/);
    expect(attempt).toThrow(/JWT_SECRET: must be at least 16 characters/);
  });

  it('rejects .env.example placeholder secrets in production only', () => {
    const placeholder = { ...validEnv, JWT_SECRET: 'CHANGE_ME_openssl_rand_hex_32' };

    expect(() => loadConfig({ ...placeholder, NODE_ENV: 'production' })).toThrow(ConfigError);
    expect(() => loadConfig(placeholder)).not.toThrow();
  });

  it('rejects malformed JWT expiry values', () => {
    expect(() => loadConfig({ ...validEnv, JWT_EXPIRES_IN: 'one hour' })).toThrow(/JWT_EXPIRES_IN/);
  });
});
