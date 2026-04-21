import { detectDrift, buildDriftReport, formatDriftReport } from './route-drift';
import { RouteInfo } from './scanner';

function makeRoute(route: string, methods: string[]): RouteInfo {
  return { route, methods, filePath: `/app${route}/route.ts` };
}

describe('detectDrift', () => {
  it('returns empty when no drift', () => {
    const baseline = [makeRoute('/api/users', ['GET', 'POST'])];
    const current = [makeRoute('/api/users', ['GET', 'POST'])];
    expect(detectDrift(baseline, current)).toEqual([]);
  });

  it('detects unexpected methods', () => {
    const baseline = [makeRoute('/api/users', ['GET'])];
    const current = [makeRoute('/api/users', ['GET', 'DELETE'])];
    const result = detectDrift(baseline, current);
    expect(result).toHaveLength(1);
    expect(result[0].driftedMethods).toEqual(['DELETE']);
    expect(result[0].missingMethods).toEqual([]);
  });

  it('detects missing methods', () => {
    const baseline = [makeRoute('/api/users', ['GET', 'POST'])];
    const current = [makeRoute('/api/users', ['GET'])];
    const result = detectDrift(baseline, current);
    expect(result[0].missingMethods).toEqual(['POST']);
  });

  it('skips routes not in current', () => {
    const baseline = [makeRoute('/api/gone', ['GET'])];
    const current: RouteInfo[] = [];
    expect(detectDrift(baseline, current)).toEqual([]);
  });

  it('handles multiple drifted routes', () => {
    const baseline = [
      makeRoute('/api/a', ['GET']),
      makeRoute('/api/b', ['POST']),
    ];
    const current = [
      makeRoute('/api/a', ['GET', 'PUT']),
      makeRoute('/api/b', ['GET']),
    ];
    const result = detectDrift(baseline, current);
    expect(result).toHaveLength(2);
  });
});

describe('buildDriftReport', () => {
  it('builds report with correct totals', () => {
    const entries = [{ route: '/api/x', lastSeen: '', currentMethods: ['GET'], expectedMethods: ['POST'], driftedMethods: ['GET'], missingMethods: ['POST'] }];
    const report = buildDriftReport(entries);
    expect(report.totalDrifted).toBe(1);
    expect(report.entries).toHaveLength(1);
  });
});

describe('formatDriftReport', () => {
  it('returns no-drift message when empty', () => {
    const report = buildDriftReport([]);
    expect(formatDriftReport(report)).toBe('No route drift detected.');
  });

  it('includes route and method info', () => {
    const entries = [{ route: '/api/users', lastSeen: '', currentMethods: ['GET', 'DELETE'], expectedMethods: ['GET'], driftedMethods: ['DELETE'], missingMethods: [] }];
    const output = formatDriftReport(buildDriftReport(entries));
    expect(output).toContain('/api/users');
    expect(output).toContain('DELETE');
  });
});
