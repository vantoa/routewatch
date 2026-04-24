import { mkdtempSync, writeFileSync, mkdirSync, rmSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { scanRoutes } from './scanner';
import { detectDeadRoutes, formatDeadRouteReport } from './route-dead';

function makeTempDir(): string {
  return mkdtempSync(join(tmpdir(), 'routewatch-dead-'));
}

function writeRoute(dir: string, rel: string): void {
  const full = join(dir, rel);
  mkdirSync(full.replace(/\/[^/]+$/, ''), { recursive: true });
  writeFileSync(full, 'export async function GET() { return Response.json({}); }');
}

function cleanup(dir: string): void {
  rmSync(dir, { recursive: true, force: true });
}

describe('route-dead integration', () => {
  let dir: string;

  beforeEach(() => {
    dir = makeTempDir();
  });

  afterEach(() => cleanup(dir));

  it('detects dead routes with no history', async () => {
    writeRoute(dir, 'app/api/users/route.ts');
    writeRoute(dir, 'app/api/posts/route.ts');
    const routes = await scanRoutes(dir);
    const report = detectDeadRoutes(routes, [], 180);
    expect(report.dead.length).toBe(routes.length);
  });

  it('does not flag recently changed routes as dead', async () => {
    writeRoute(dir, 'app/api/users/route.ts');
    const routes = await scanRoutes(dir);
    const recentHistory = [{
      path: '/api/users',
      method: 'GET',
      date: new Date().toISOString()
    }];
    const report = detectDeadRoutes(routes, recentHistory, 180);
    expect(report.dead.find(d => d.path === '/api/users')).toBeUndefined();
  });

  it('formatDeadRouteReport returns a non-empty string', async () => {
    writeRoute(dir, 'app/api/old/route.ts');
    const routes = await scanRoutes(dir);
    const report = detectDeadRoutes(routes, [], 30);
    const output = formatDeadRouteReport(report);
    expect(typeof output).toBe('string');
    expect(output.length).toBeGreaterThan(0);
  });
});
