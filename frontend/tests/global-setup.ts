const API_HEALTH_URL =
  process.env.PLAYWRIGHT_API_HEALTH_URL || 'http://localhost:3000/api/health';

export default async function globalSetup() {
  try {
    const response = await fetch(API_HEALTH_URL, { signal: AbortSignal.timeout(5000) });
    if (!response.ok) {
      throw new Error(`status ${response.status}`);
    }
  } catch {
    throw new Error(
      [
        'Backend API is not reachable before Playwright E2E tests.',
        'Start it in another terminal:',
        '  cd backend && npm run start:dev',
        `Expected health check at ${API_HEALTH_URL}`,
      ].join('\n'),
    );
  }
}
