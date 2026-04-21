import {
  buildDeprecationTrendEntry,
  buildDeprecationTrendReport,
  formatDeprecationTrendReport,
  DeprecationTrendEntry,
} from './route-deprecation-trend';
import { ScannedRoute } from './scanner';
import { DeprecationRule } from './deprecate';

function makeRoute(path: string, methods: string[] = ['GET']): ScannedRoute {
  return { path, methods };
}

const rules: DeprecationRule[] = [
  { pattern: '/api/v1/**', reason: 'Use v2' },
];

describe('buildDeprecationTrendEntry', () => {
  it('counts deprecated routes correctly', () => {
    const routes = [
      makeRoute('/api/v1/users'),
      makeRoute('/api/v1/posts'),
      makeRoute('/api/v2/users'),
    ];
    const entry = buildDeprecationTrendEntry(routes, rules, '2024-01-01T00:00:00.000Z');
    expect(entry.deprecatedCount).toBe(2);
    expect(entry.totalRoutes).toBe(3);
    expect(entry.ratio).toBeCloseTo(0.667, 2);
    expect(entry.timestamp).toBe('2024-01-01T00:00:00.000Z');
  });

  it('returns zero ratio when no routes', () => {
    const entry = buildDeprecationTrendEntry([], rules);
    expect(entry.ratio).toBe(0);
    expect(entry.deprecatedCount).toBe(0);
  });

  it('includes deprecated paths', () => {
    const routes = [makeRoute('/api/v1/users'), makeRoute('/api/v2/items')];
    const entry = buildDeprecationTrendEntry(routes, rules);
    expect(entry.deprecatedPaths).toContain('/api/v1/users');
    expect(entry.deprecatedPaths).not.toContain('/api/v2/items');
  });
});

describe('buildDeprecationTrendReport', () => {
  it('returns stable trend for empty entries', () => {
    const report = buildDeprecationTrendReport([]);
    expect(report.trend).toBe('stable');
    expect(report.averageRatio).toBe(0);
    expect(report.peakDeprecated).toBe(0);
  });

  it('detects increasing trend', () => {
    const entries: DeprecationTrendEntry[] = [
      { timestamp: 't1', totalRoutes: 10, deprecatedCount: 1, deprecatedPaths: [], ratio: 0.1 },
      { timestamp: 't2', totalRoutes: 10, deprecatedCount: 7, deprecatedPaths: [], ratio: 0.7 },
    ];
    const report = buildDeprecationTrendReport(entries);
    expect(report.trend).toBe('increasing');
    expect(report.peakDeprecated).toBe(7);
  });

  it('detects decreasing trend', () => {
    const entries: DeprecationTrendEntry[] = [
      { timestamp: 't1', totalRoutes: 10, deprecatedCount: 8, deprecatedPaths: [], ratio: 0.8 },
      { timestamp: 't2', totalRoutes: 10, deprecatedCount: 1, deprecatedPaths: [], ratio: 0.1 },
    ];
    const report = buildDeprecationTrendReport(entries);
    expect(report.trend).toBe('decreasing');
  });
});

describe('formatDeprecationTrendReport', () => {
  it('includes header and trend info', () => {
    const entries: DeprecationTrendEntry[] = [
      { timestamp: '2024-01-01T00:00:00.000Z', totalRoutes: 5, deprecatedCount: 2, deprecatedPaths: ['/api/v1/a'], ratio: 0.4 },
    ];
    const report = buildDeprecationTrendReport(entries);
    const output = formatDeprecationTrendReport(report);
    expect(output).toContain('Deprecation Trend Report');
    expect(output).toContain('Trend:');
    expect(output).toContain('2/5');
    expect(output).toContain('/api/v1/a');
  });
});
