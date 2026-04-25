import { assessReachability, buildReachabilityReport, formatReachabilityReport } from './route-reachability';
import { RouteInfo } from './scanner';

function makeRoute(path: string, methods: string[] = ['GET']): RouteInfo {
  return { path, methods };
}

describe('assessReachability', () => {
  it('marks normal routes as reachable', () => {
    const routes = [makeRoute('/api/users'), makeRoute('/api/posts', ['GET', 'POST'])];
    const entries = assessReachability(routes);
    expect(entries).toHaveLength(2);
    expect(entries[0].reachable).toBe(true);
    expect(entries[1].reachable).toBe(true);
  });

  it('marks /internal routes as unreachable', () => {
    const routes = [makeRoute('/internal/metrics')];
    const entries = assessReachability(routes);
    expect(entries[0].reachable).toBe(false);
    expect(entries[0].reason).toMatch(/blocked prefix/);
  });

  it('marks /private routes as unreachable', () => {
    const entries = assessReachability([makeRoute('/private/data')]);
    expect(entries[0].reachable).toBe(false);
  });

  it('marks /_ prefixed routes as unreachable', () => {
    const entries = assessReachability([makeRoute('/_next/static')]);
    expect(entries[0].reachable).toBe(false);
  });

  it('marks routes with __ segments as unreachable', () => {
    const entries = assessReachability([makeRoute('/api/__health')]);
    expect(entries[0].reachable).toBe(false);
    expect(entries[0].reason).toMatch(/__health/);
  });

  it('preserves methods on entries', () => {
    const entries = assessReachability([makeRoute('/api/items', ['GET', 'DELETE'])]);
    expect(entries[0].methods).toEqual(['GET', 'DELETE']);
  });
});

describe('buildReachabilityReport', () => {
  it('counts totals correctly', () => {
    const routes = [
      makeRoute('/api/users'),
      makeRoute('/internal/admin'),
      makeRoute('/private/keys'),
    ];
    const report = buildReachabilityReport(routes);
    expect(report.total).toBe(3);
    expect(report.reachable).toBe(1);
    expect(report.unreachable).toBe(2);
  });

  it('returns empty report for empty input', () => {
    const report = buildReachabilityReport([]);
    expect(report.total).toBe(0);
    expect(report.reachable).toBe(0);
    expect(report.unreachable).toBe(0);
  });
});

describe('formatReachabilityReport', () => {
  it('includes summary counts', () => {
    const report = buildReachabilityReport([makeRoute('/api/users'), makeRoute('/internal/x')]);
    const output = formatReachabilityReport(report);
    expect(output).toContain('Total:       2');
    expect(output).toContain('Reachable:   1');
    expect(output).toContain('Unreachable: 1');
  });

  it('lists unreachable routes', () => {
    const report = buildReachabilityReport([makeRoute('/internal/secret')]);
    const output = formatReachabilityReport(report);
    expect(output).toContain('/internal/secret');
  });

  it('shows all-clear message when everything reachable', () => {
    const report = buildReachabilityReport([makeRoute('/api/ping')]);
    const output = formatReachabilityReport(report);
    expect(output).toContain('All routes appear publicly reachable');
  });
});
