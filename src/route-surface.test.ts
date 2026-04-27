import { describe, it, expect } from 'vitest';
import { scoreSurface, buildSurfaceReport, formatSurfaceReport } from './route-surface';
import { RouteInfo } from './scanner';
import { ChangeRecord } from './differ';

function makeRoute(path: string, methods: string[]): RouteInfo {
  return { path, methods };
}

describe('scoreSurface', () => {
  it('scores a shallow static route low', () => {
    expect(scoreSurface(makeRoute('/api/users', ['GET']))).toBe(3); // depth 2 + 0 params + 1 method
  });

  it('adds weight for dynamic segments', () => {
    const score = scoreSurface(makeRoute('/api/users/[id]', ['GET', 'DELETE']));
    expect(score).toBe(5); // depth 3 + 1 param*2 + 2 methods... wait: 3+2+2=7
    // recalculate: depth=3, params=1 (*2=2), methods=2 => 7
    expect(score).toBe(7);
  });

  it('handles deeply nested dynamic routes', () => {
    const score = scoreSurface(makeRoute('/api/orgs/[orgId]/repos/[repoId]', ['GET']));
    // depth=5, params=2 (*2=4), methods=1 => 10
    expect(score).toBe(10);
  });
});

describe('buildSurfaceReport', () => {
  const routes: RouteInfo[] = [
    makeRoute('/api/users', ['GET', 'POST']),
    makeRoute('/api/users/[id]', ['GET', 'DELETE']),
    makeRoute('/api/health', ['GET']),
  ];

  it('builds entries for all routes', () => {
    const report = buildSurfaceReport(routes);
    expect(report.entries).toHaveLength(3);
  });

  it('computes totals correctly', () => {
    const report = buildSurfaceReport(routes);
    expect(report.totalScore).toBeGreaterThan(0);
    expect(report.averageScore).toBeCloseTo(report.totalScore / 3, 2);
  });

  it('marks dynamic routes', () => {
    const report = buildSurfaceReport(routes);
    const dynamic = report.entries.find((e) => e.path === '/api/users/[id]');
    expect(dynamic?.isDynamic).toBe(true);
    expect(dynamic?.paramCount).toBe(1);
  });

  it('computes deltas from modified changes', () => {
    const changes: ChangeRecord[] = [
      { type: 'modified', path: '/api/users', before: ['GET'], after: ['GET', 'POST', 'PUT'] },
    ];
    const report = buildSurfaceReport(routes, changes);
    expect(report.deltas).toHaveLength(1);
    expect(report.deltas[0].delta).toBeGreaterThan(0);
  });

  it('returns empty deltas when no changes', () => {
    const report = buildSurfaceReport(routes);
    expect(report.deltas).toHaveLength(0);
  });
});

describe('formatSurfaceReport', () => {
  it('includes summary line', () => {
    const report = buildSurfaceReport([makeRoute('/api/ping', ['GET'])]);
    const output = formatSurfaceReport(report);
    expect(output).toContain('API Surface Report');
    expect(output).toContain('1 routes');
  });

  it('shows delta section when deltas exist', () => {
    const routes = [makeRoute('/api/users', ['GET'])];
    const changes: ChangeRecord[] = [
      { type: 'modified', path: '/api/users', before: ['GET'], after: ['GET', 'POST'] },
    ];
    const report = buildSurfaceReport(routes, changes);
    const output = formatSurfaceReport(report);
    expect(output).toContain('Surface Deltas');
  });
});
