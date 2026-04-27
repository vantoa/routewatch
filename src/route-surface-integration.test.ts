import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { mkdtempSync, writeFileSync, mkdirSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { scanRoutes } from './scanner';
import { buildSurfaceReport, formatSurfaceReport, scoreSurface } from './route-surface';

let tmpDir: string;

function writeRoute(rel: string, content: string) {
  const full = join(tmpDir, rel);
  mkdirSync(full.replace(/\/[^/]+$/, ''), { recursive: true });
  writeFileSync(full, content);
}

beforeAll(() => {
  tmpDir = mkdtempSync(join(tmpdir(), 'rw-surface-int-'));
  writeRoute('app/api/users/route.ts', 'export async function GET() {} export async function POST() {}');
  writeRoute('app/api/users/[id]/route.ts', 'export async function GET() {} export async function DELETE() {}');
  writeRoute('app/api/orgs/[orgId]/repos/[repoId]/route.ts', 'export async function GET() {}');
  writeRoute('app/api/health/route.ts', 'export async function GET() {}');
});

afterAll(() => {
  rmSync(tmpDir, { recursive: true, force: true });
});

describe('route-surface integration', () => {
  it('scans and scores all routes', async () => {
    const routes = await scanRoutes(tmpDir);
    expect(routes.length).toBeGreaterThanOrEqual(4);
    const report = buildSurfaceReport(routes);
    expect(report.entries.length).toBe(routes.length);
  });

  it('deeply nested dynamic route has highest score', async () => {
    const routes = await scanRoutes(tmpDir);
    const report = buildSurfaceReport(routes);
    const sorted = [...report.entries].sort((a, b) => b.surfaceScore - a.surfaceScore);
    expect(sorted[0].path).toContain('repoId');
  });

  it('total score equals sum of individual scores', async () => {
    const routes = await scanRoutes(tmpDir);
    const report = buildSurfaceReport(routes);
    const manual = routes.reduce((s, r) => s + scoreSurface(r), 0);
    expect(report.totalScore).toBe(manual);
  });

  it('format output contains route paths', async () => {
    const routes = await scanRoutes(tmpDir);
    const report = buildSurfaceReport(routes);
    const output = formatSurfaceReport(report);
    expect(output).toContain('/api/users');
    expect(output).toContain('/api/health');
  });

  it('average score is within expected range', async () => {
    const routes = await scanRoutes(tmpDir);
    const report = buildSurfaceReport(routes);
    expect(report.averageScore).toBeGreaterThan(0);
    expect(report.averageScore).toBeLessThanOrEqual(report.totalScore);
  });
});
