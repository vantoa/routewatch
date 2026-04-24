import { detectOrphans, detectDuplicates, detectUnusualMethods, detectDeepNesting, detectAnomalies, formatAnomalyReport } from './route-anomaly';
import { ScannedRoute } from './scanner';

function makeRoute(path: string, methods: string[] = ['GET']): ScannedRoute {
  return { path, methods };
}

describe('detectOrphans', () => {
  it('flags routes with no parent', () => {
    const routes = [makeRoute('/api/users/profile')];
    const result = detectOrphans(routes);
    expect(result).toHaveLength(1);
    expect(result[0].type).toBe('orphan');
  });

  it('does not flag routes whose parent exists', () => {
    const routes = [makeRoute('/api/users'), makeRoute('/api/users/profile')];
    expect(detectOrphans(routes)).toHaveLength(0);
  });

  it('does not flag top-level routes', () => {
    const routes = [makeRoute('/api')];
    expect(detectOrphans(routes)).toHaveLength(0);
  });
});

describe('detectDuplicates', () => {
  it('flags duplicate paths', () => {
    const routes = [makeRoute('/api/users'), makeRoute('/api/users')];
    const result = detectDuplicates(routes);
    expect(result).toHaveLength(1);
    expect(result[0].severity).toBe('high');
  });

  it('returns empty for unique paths', () => {
    const routes = [makeRoute('/api/users'), makeRoute('/api/posts')];
    expect(detectDuplicates(routes)).toHaveLength(0);
  });
});

describe('detectUnusualMethods', () => {
  it('flags non-standard HTTP methods', () => {
    const routes = [makeRoute('/api/data', ['GET', 'SUBSCRIBE'])];
    const result = detectUnusualMethods(routes);
    expect(result).toHaveLength(1);
    expect(result[0].detail).toContain('SUBSCRIBE');
  });

  it('ignores standard methods', () => {
    const routes = [makeRoute('/api/data', ['GET', 'POST', 'DELETE'])];
    expect(detectUnusualMethods(routes)).toHaveLength(0);
  });
});

describe('detectDeepNesting', () => {
  it('flags routes deeper than 6 segments', () => {
    const routes = [makeRoute('/a/b/c/d/e/f/g')];
    const result = detectDeepNesting(routes);
    expect(result).toHaveLength(1);
    expect(result[0].type).toBe('deep-nesting');
  });

  it('does not flag routes within limit', () => {
    const routes = [makeRoute('/a/b/c')];
    expect(detectDeepNesting(routes)).toHaveLength(0);
  });
});

describe('detectAnomalies', () => {
  it('combines all detectors', () => {
    const routes = [
      makeRoute('/api/users'),
      makeRoute('/api/users'),
      makeRoute('/a/b/c/d/e/f/g'),
    ];
    const report = detectAnomalies(routes);
    expect(report.total).toBeGreaterThan(0);
  });
});

describe('formatAnomalyReport', () => {
  it('returns no-anomaly message when empty', () => {
    expect(formatAnomalyReport({ anomalies: [], total: 0 })).toBe('No anomalies detected.');
  });

  it('formats anomalies with severity and type', () => {
    const report = detectAnomalies([makeRoute('/api/users'), makeRoute('/api/users')]);
    const output = formatAnomalyReport(report);
    expect(output).toContain('HIGH');
    expect(output).toContain('duplicate');
  });
});
