/**
 * Runs once before Jest spawns workers, so the zone set here is inherited by
 * every test process. A per-test `process.env.TZ` assignment does not reach
 * the worker's Date implementation.
 *
 * CI and production (manifest.yml) both run in UTC, where local-midnight and
 * UTC-midnight date parsing look identical. Pinning a non-UTC zone lets tests
 * catch code that silently depends on the host's timezone.
 */
export default function globalSetup(): void {
  process.env.TZ = 'America/New_York';
}
