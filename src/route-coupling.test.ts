import { computeCoupling, formatCouplingReport } from './route-coupling';
import { RouteInfo } from './scanner';

function makeRoute(route: string, methods: string[]): RouteInfo {
  return { route, methods, filePath: `/app${route}/route.ts` };
}

describe('computeCoupling', () => {
  const routes: RouteInfo[] = [
    makeRoute('/api/users', ['GET', 'POST']),
    makeRoute('/api/users/[id]', ['GET', 'PUT', 'DELETE']),
    makeRoute('/api/posts', ['GET', 'POST']),
    makeRoute('/api/comments', ['GET']),
  ];

  it('returns pairs for all route combinations', () => {
    const report = computeCoupling(routes, 0.5);
    // 4 routes => 6 pairs max, but only pairs with score > 0
    expect(report.pairs.length).toBeGreaterThan(0);
  });

  it('pairs are sorted by score descending', () => {
    const report = computeCoupling(routes, 0.0);
    for (let i = 1; i < report.pairs.length; i++) {
      expect(report.pairs[i - 1].score).toBeGreaterThanOrEqual(report.pairs[i].score);
    }
  });

  it('identifies strongly coupled routes above threshold', () => {
    const report = computeCoupling(routes, 0.5);
    expect(report.stronglyCoupled.every(p => p.score >= 0.5)).toBe(true);
  });

  it('/api/users and /api/users/[id] have high coupling', () => {
    const report = computeCoupling(routes, 0.0);
    const pair = report.pairs.find(
      p =>
        (p.routeA === '/api/users' && p.routeB === '/api/users/[id]') ||
        (p.routeB === '/api/users' && p.routeA === '/api/users/[id]')
    );
    expect(pair).toBeDefined();
    expect(pair!.sharedMethods).toBeGreaterThan(0);
  });

  it('returns empty stronglyCoupled when threshold is 1', () => {
    const report = computeCoupling(routes, 1.0);
    expect(report.stronglyCoupled).toHaveLength(0);
  });

  it('handles empty route list', () => {
    const report = computeCoupling([], 0.5);
    expect(report.pairs).toHaveLength(0);
    expect(report.stronglyCoupled).toHaveLength(0);
  });
});

describe('formatCouplingReport', () => {
  it('includes header and threshold', () => {
    const routes = [
      makeRoute('/api/users', ['GET']),
      makeRoute('/api/users/[id]', ['GET']),
    ];
    const report = computeCoupling(routes, 0.5);
    const output = formatCouplingReport(report);
    expect(output).toContain('Route Coupling Report');
    expect(output).toContain('0.5');
  });

  it('shows no-coupling message when list is empty', () => {
    const report = computeCoupling([], 0.5);
    const output = formatCouplingReport(report);
    expect(output).toContain('No strongly coupled routes found.');
  });

  it('lists coupled pairs with score', () => {
    const routes = [
      makeRoute('/api/users', ['GET', 'POST']),
      makeRoute('/api/users/[id]', ['GET', 'PUT']),
    ];
    const report = computeCoupling(routes, 0.0);
    const output = formatCouplingReport(report);
    expect(output).toMatch(/\[\d+\.\d+\]/);
  });
});
