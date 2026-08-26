import { loadConfig, ValidationError } from '@margen/config';

const validEnv = (): NodeJS.ProcessEnv => ({
  DATABASE_URL: 'postgres://localhost/margen', REDIS_URL: 'redis://localhost:6379',
  SESSION_SECRET: 'session-secret', APP_ORIGIN: 'https://margen.example', CORS_ORIGINS: 'https://margen.example',
  MP_ACCESS_TOKEN: 'mp-token', MP_WEBHOOK_SECRET: 'webhook-secret', S3_ENDPOINT: 'https://s3.example',
  S3_BUCKET: 'margen', S3_ACCESS_KEY_ID: 'access-key', S3_SECRET_ACCESS_KEY: 'secret-key',
});

describe('loadConfig', () => {
  it('requires every integration variable and rejects blank secrets', () => {
    const env = validEnv(); delete env.MP_ACCESS_TOKEN;
    expect(() => loadConfig(env)).toThrow(ValidationError);
    expect(() => loadConfig({ ...validEnv(), SESSION_SECRET: '  ' })).toThrow(ValidationError);
  });

  it('rejects malformed URLs and an empty effective CORS origin list', () => {
    expect(() => loadConfig({ ...validEnv(), DATABASE_URL: 'not-a-url' })).toThrow(ValidationError);
    expect(() => loadConfig({ ...validEnv(), CORS_ORIGINS: ' ,  ' })).toThrow(ValidationError);
  });
});
