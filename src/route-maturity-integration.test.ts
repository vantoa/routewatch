import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync, mkdirSync, writeFileSync } from 'fs';
import { join, tmpdir } from 'path';
import { scanRoutes } from './scanner';
import { diffRoutes } from './differ';
import { computeMaturity, formatMaturityReport } from './route-maturity';

function makeTempDir(): string {
  return mkdtempSync(join(tmpdir(), 'routewatch-maturity-'));
}

function writeRoute(base: string, rel: string, content = ''): void {
  const full = join(base, rel);
  mkdirSync(full.replace(/\/[^/]+$/, ''), { recursive: true });
  writeFileSync(full, content || 'export async function GET() {}');
}

function cleanup(dir: string): void {
  rmSync(dir, { recursive: true, force: true });
}

describe('route-maturity integration', () => {
  let dir: string;

  beforeEach(() => {
    dir = makeTempDir();
  });

  afterEach(() => cleanup(dir));

  it('classifies a simple stable route correctly', async () => {
    writeRoute(dir, 'app/api/users/route.ts');
    const routes = await scanRoutes(dir);
    const report = computeMaturity(routes, []);
    const stable = report.routes.find(r => r.route === '/api/users');
    expect(stable).toBeDefined();
    expect(stable?.level).toBe('stable');
  });

  it('classifies a catch-all route as lower maturity', async () => {
    writeRoute(dir, 'app/api/[...slug]/route.ts');
    const routes = await scanRoutes(dir);
    const report = computeMaturity(routes, []);
    const r = report.routes[0];
    expect(['experimental', 'beta']).toContain(r.level);
  });

  it('detects churn from diff changes', async () => {
    writeRoute(dir, 'app/api/volatile/route.ts');
    const routes = await scanRoutes(dir);
    const fakeChanges = Array.from({ length: 7 }, () => ({
      route: '/api/volatile',
      type: 'modified' as const,
      methods: { before: ['GET'], after: ['GET', 'POST'] },
    }));
    const report = computeMaturity(routes, fakeChanges);
    const r = report.routes.find(r => r.route === '/api/volatile');
    expect(r?.score).toBeLessThan(85);
  });

  it('produces a readable formatted report', async () => {
    writeRoute(dir, 'app/api/health/route.ts');
    const routes = await scanRoutes(dir);
    const report = computeMaturity(routes, []);
    const output = formatMaturityReport(report);
    expect(output).toContain('/api/health');
    expect(output).toContain('Summary');
  });
});
