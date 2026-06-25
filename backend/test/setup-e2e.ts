process.env.NODE_ENV = process.env.NODE_ENV || 'test';
process.env.OTEL_ENABLED = 'false';
process.env.RLS_AUTO_APPLY = 'false';
process.env.CACHE_STORE = 'memory';
process.env.CACHE_TTL_MS = '300000';
process.env.THROTTLE_USE_REDIS = 'false';

if (!process.env.JWT_SECRET && !process.env.JWT_PRIVATE_KEY_PATH) {
  process.env.JWT_SECRET = 'test-secret';
}
