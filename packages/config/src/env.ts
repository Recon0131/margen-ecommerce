export interface AppConfig { databaseUrl:string; redisUrl:string; sessionSecret:string; appOrigin:string; corsOrigins:string[]; mpAccessToken:string; mpWebhookSecret:string; s3Endpoint:string; s3Bucket:string; s3AccessKeyId:string; s3SecretAccessKey:string; }
export class ValidationError extends Error {}
export function loadConfig(env:NodeJS.ProcessEnv):AppConfig {
  const required=['DATABASE_URL','REDIS_URL','SESSION_SECRET','APP_ORIGIN','CORS_ORIGINS','MP_ACCESS_TOKEN','MP_WEBHOOK_SECRET','S3_ENDPOINT','S3_BUCKET','S3_ACCESS_KEY_ID','S3_SECRET_ACCESS_KEY'] as const;
  const missing=required.filter((key)=>!env[key]?.trim());
  if(missing.length) throw new ValidationError(`Missing required environment variables: ${missing.join(', ')}`);
  const urls=['DATABASE_URL','REDIS_URL','APP_ORIGIN','S3_ENDPOINT'] as const;
  for(const key of urls) { try { new URL(env[key]!); } catch { throw new ValidationError(`${key} must be a valid URL`); } }
  const corsOrigins=env.CORS_ORIGINS!.split(',').map((v)=>v.trim()).filter(Boolean);
  if(!corsOrigins.length) throw new ValidationError('CORS_ORIGINS must contain at least one origin');
  for(const origin of corsOrigins) { try { new URL(origin); } catch { throw new ValidationError('CORS_ORIGINS must contain valid URLs'); } }
  return {databaseUrl:env.DATABASE_URL!,redisUrl:env.REDIS_URL!,sessionSecret:env.SESSION_SECRET!,appOrigin:env.APP_ORIGIN!,corsOrigins,mpAccessToken:env.MP_ACCESS_TOKEN!,mpWebhookSecret:env.MP_WEBHOOK_SECRET!,s3Endpoint:env.S3_ENDPOINT!,s3Bucket:env.S3_BUCKET!,s3AccessKeyId:env.S3_ACCESS_KEY_ID!,s3SecretAccessKey:env.S3_SECRET_ACCESS_KEY!};
}
