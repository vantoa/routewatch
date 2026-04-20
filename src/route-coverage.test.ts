import { computeCoverage, formatCoverageReport } from './route-coverage';
import { RouteInfo } from './scanner';
import { DiffResult } from './differ';

function makeRoute(route: string, methods: string[] = ['GET']): RouteInfo {
  return { route, methods, filePath: `app${route}/route.ts` };
}

function makeDiff(overrides: Partial<DiffResult> = {}): DiffResult {
  return {
    added: [],
    removed: [],
    modified: [],
    ...overrides,
  };
}

describe('computeCoverage', () => {
  it('returns 100% when no routes exist', () => {
    const report = computeCoverage([], makeDiff());
    expect(report.total).toBe(0);
    expect(report.coveragePercent).toBe(100);
  });

  it('calculates correct coverage percent', () => {
    const routes = [makeRoute('/api/users'), makeRoute('/api/posts'), makeRoute('/api/tags')];
    const report = computeCoverage(routes, makeDiff(), {
      testedPaths: ['/api/users', '/api/posts'],
    });
    expect(report.coveragePercent).toBe(67);
    expect(report.testedRoutes).toHaveLength(2);
    expect(report.untestedRoutes).toEqual(['/api/tags']);
  });

  it('reflects added and removed from diff', () => {
    const routes = [makeRoute('/api/v2/users')];
    const diff = makeDiff({
      added: [makeRoute('/api/v2/users')],
      removed: [makeRoute('/api/v1/users')],
    });
    const report = computeCoverage(routes, diff);
    expect(report.added).toBe(1);
    expect(report.removed).toBe(1);
  });

  it('lists untested routes when none are provided', () => {
    const routes = [makeRoute('/api/a'), makeRoute('/api/b')];
    const report = computeCoverage(routes, makeDiff());
    expect(report.untestedRoutes).toEqual(['/api/a', '/api/b']);
    expect(report.testedRoutes).toHaveLength(0);
    expect(report.coveragePercent).toBe(0);
  });
});

describe('formatCoverageReport', () => {
  it('includes summary lines', () => {
    const routes = [makeRoute('/api/x')];
    const report = computeCoverage(routes, makeDiff(), { testedPaths: ['/api/x'] });
    const output = formatCoverageReport(report);
    expect(output).toContain('Route Coverage Report');
    expect(output).toContain('Coverage     : 100%');
  });

  it('lists untested routes section when present', () => {
    const routes = [makeRoute('/api/missing')];
    const report = computeCoverage(routes, makeDiff());
    const output = formatCoverageReport(report);
    expect(output).toContain('Untested Routes');
    expect(output).toContain('/api/missing');
  });
});
