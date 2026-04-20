import { scoreRoute, computeComplexity, formatComplexityReport } from './route-complexity';
import { RouteInfo } from './scanner';

function makeRoute(path: string, methods: string[]): RouteInfo {
  return { path, methods };
}

describe('scoreRoute', () => {
  it('scores a static route with one method', () => {
    const result = scoreRoute(makeRoute('/api/users', ['GET']));
    expect(result.segments).toBe(2);
    expect(result.dynamicSegments).toBe(0);
    expect(result.catchAll).toBe(false);
    expect(result.optionalCatchAll).toBe(false);
    expect(result.score).toBe(2.5);
  });

  it('scores a dynamic segment route', () => {
    const result = scoreRoute(makeRoute('/api/users/[id]', ['GET', 'PUT']));
    expect(result.dynamicSegments).toBe(1);
    expect(result.methodCount).toBe(2);
    expect(result.score).toBe(3 + 2 + 1);
  });

  it('scores a catch-all route', () => {
    const result = scoreRoute(makeRoute('/api/[...slug]', ['GET']));
    expect(result.catchAll).toBe(true);
    expect(result.optionalCatchAll).toBe(false);
    expect(result.score).toBe(1 + 4 + 0.5);
  });

  it('scores an optional catch-all route higher than catch-all', () => {
    const a = scoreRoute(makeRoute('/api/[...slug]', ['GET']));
    const b = scoreRoute(makeRoute('/api/[[...slug]]', ['GET']));
    expect(b.score).toBeGreaterThan(a.score);
    expect(b.optionalCatchAll).toBe(true);
  });
});

describe('computeComplexity', () => {
  it('returns empty report for no routes', () => {
    const report = computeComplexity([]);
    expect(report.routes).toHaveLength(0);
    expect(report.mostComplex).toBeNull();
    expect(report.averageScore).toBe(0);
  });

  it('identifies the most complex route', () => {
    const routes = [
      makeRoute('/api/users', ['GET']),
      makeRoute('/api/users/[id]/posts/[postId]', ['GET', 'DELETE']),
      makeRoute('/api/health', ['GET']),
    ];
    const report = computeComplexity(routes);
    expect(report.mostComplex?.route).toBe('/api/users/[id]/posts/[postId]');
    expect(report.maxScore).toBeGreaterThan(report.minScore);
  });

  it('computes correct average', () => {
    const routes = [makeRoute('/a', ['GET']), makeRoute('/b', ['GET'])];
    const report = computeComplexity(routes);
    expect(report.averageScore).toBe(report.routes[0].score);
  });
});

describe('formatComplexityReport', () => {
  it('shows no routes message when empty', () => {
    const output = formatComplexityReport(computeComplexity([]));
    expect(output).toContain('No routes found.');
  });

  it('includes summary statistics', () => {
    const routes = [makeRoute('/api/users/[id]', ['GET', 'POST'])];
    const output = formatComplexityReport(computeComplexity(routes));
    expect(output).toContain('Average Score');
    expect(output).toContain('Most Complex');
    expect(output).toContain('/api/users/[id]');
  });
});
