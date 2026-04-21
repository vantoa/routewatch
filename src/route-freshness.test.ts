import { buildFreshnessReport, classifyFreshness, formatFreshnessReport } from './route-freshness';
import { RouteInfo } from './scanner';

function makeRoute(path: string, methods: string[] = ['GET']): RouteInfo {
  return { path, methods };
}

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

describe('classifyFreshness', () => {
  it('returns fresh for recent routes', () => {
    expect(classifyFreshness(10)).toBe('fresh');
  });

  it('returns aging for routes changed 90-179 days ago', () => {
    expect(classifyFreshness(90)).toBe('aging');
    expect(classifyFreshness(150)).toBe('aging');
  });

  it('returns stale for routes changed 180+ days ago', () => {
    expect(classifyFreshness(180)).toBe('stale');
    expect(classifyFreshness(365)).toBe('stale');
  });
});

describe('buildFreshnessReport', () => {
  const routes = [
    makeRoute('/api/users'),
    makeRoute('/api/posts'),
    makeRoute('/api/legacy'),
  ];

  const changeLog = [
    { path: '/api/users', date: daysAgo(5) },
    { path: '/api/posts', date: daysAgo(100) },
    { path: '/api/legacy', date: daysAgo(200) },
  ];

  it('classifies entries correctly', () => {
    const report = buildFreshnessReport(routes, changeLog);
    const byPath = Object.fromEntries(report.entries.map((e) => [e.path, e]));
    expect(byPath['/api/users'].status).toBe('fresh');
    expect(byPath['/api/posts'].status).toBe('aging');
    expect(byPath['/api/legacy'].status).toBe('stale');
  });

  it('counts statuses correctly', () => {
    const report = buildFreshnessReport(routes, changeLog);
    expect(report.freshCount).toBe(1);
    expect(report.agingCount).toBe(1);
    expect(report.staleCount).toBe(1);
  });

  it('uses current date for routes with no changelog entry', () => {
    const report = buildFreshnessReport([makeRoute('/api/new')], []);
    expect(report.entries[0].status).toBe('fresh');
    expect(report.entries[0].daysSinceChange).toBe(0);
  });

  it('uses the most recent date when multiple log entries exist', () => {
    const log = [
      { path: '/api/users', date: daysAgo(200) },
      { path: '/api/users', date: daysAgo(5) },
    ];
    const report = buildFreshnessReport([makeRoute('/api/users')], log);
    expect(report.entries[0].status).toBe('fresh');
  });
});

describe('formatFreshnessReport', () => {
  it('includes header and route lines', () => {
    const routes = [makeRoute('/api/users')];
    const changeLog = [{ path: '/api/users', date: daysAgo(5) }];
    const report = buildFreshnessReport(routes, changeLog);
    const output = formatFreshnessReport(report);
    expect(output).toContain('Route Freshness Report');
    expect(output).toContain('/api/users');
    expect(output).toContain('FRESH');
  });
});
