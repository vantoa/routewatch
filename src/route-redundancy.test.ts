import { detectRedundancy, buildRedundancyReport, formatRedundancyReport } from './route-redundancy';
import { RouteInfo } from './scanner';

function makeRoute(path: string, methods: string[]): RouteInfo {
  return { path, methods };
}

describe('detectRedundancy', () => {
  it('detects duplicate normalized paths', () => {
    const routes = [
      makeRoute('/api/users/[id]', ['GET']),
      makeRoute('/api/users/[slug]', ['GET']),
    ];
    const pairs = detectRedundancy(routes);
    expect(pairs).toHaveLength(1);
    expect(pairs[0].reason).toMatch(/Duplicate normalized path/);
    expect(pairs[0].score).toBe(1);
  });

  it('ignores non-overlapping methods on duplicate paths', () => {
    const routes = [
      makeRoute('/api/users/[id]', ['GET']),
      makeRoute('/api/users/[slug]', ['POST']),
    ];
    expect(detectRedundancy(routes)).toHaveLength(0);
  });

  it('detects subpath with high method overlap', () => {
    const routes = [
      makeRoute('/api/users', ['GET', 'POST', 'PUT', 'DELETE']),
      makeRoute('/api/users/list', ['GET', 'POST', 'PUT']),
    ];
    const pairs = detectRedundancy(routes);
    expect(pairs).toHaveLength(1);
    expect(pairs[0].reason).toMatch(/Subpath/);
  });

  it('ignores unrelated routes', () => {
    const routes = [
      makeRoute('/api/users', ['GET']),
      makeRoute('/api/posts', ['GET']),
    ];
    expect(detectRedundancy(routes)).toHaveLength(0);
  });

  it('sorts pairs by descending score', () => {
    const routes = [
      makeRoute('/api/a/[id]', ['GET']),
      makeRoute('/api/a/[slug]', ['GET']),
      makeRoute('/api/b/[id]', ['GET', 'POST']),
      makeRoute('/api/b/[slug]', ['GET', 'POST']),
    ];
    const pairs = detectRedundancy(routes);
    expect(pairs[0].score).toBeGreaterThanOrEqual(pairs[pairs.length - 1].score);
  });
});

describe('buildRedundancyReport', () => {
  it('counts redundant routes correctly', () => {
    const routes = [
      makeRoute('/api/x/[id]', ['GET']),
      makeRoute('/api/x/[slug]', ['GET']),
      makeRoute('/api/y', ['POST']),
    ];
    const report = buildRedundancyReport(routes);
    expect(report.totalRoutes).toBe(3);
    expect(report.redundantRoutes).toBe(2);
  });

  it('returns zero redundant when no duplicates', () => {
    const routes = [makeRoute('/a', ['GET']), makeRoute('/b', ['POST'])];
    const report = buildRedundancyReport(routes);
    expect(report.redundantRoutes).toBe(0);
  });
});

describe('formatRedundancyReport', () => {
  it('includes header and route details', () => {
    const routes = [
      makeRoute('/api/items/[id]', ['GET', 'DELETE']),
      makeRoute('/api/items/[key]', ['GET', 'DELETE']),
    ];
    const report = buildRedundancyReport(routes);
    const output = formatRedundancyReport(report);
    expect(output).toContain('Route Redundancy Report');
    expect(output).toContain('/api/items/[id]');
    expect(output).toContain('score:');
  });

  it('shows clean message when no redundancy', () => {
    const report = buildRedundancyReport([makeRoute('/only', ['GET'])]);
    expect(formatRedundancyReport(report)).toContain('No redundant routes detected.');
  });
});
