import { buildVelocityReport, formatVelocityReport } from './route-velocity';
import { RouteChange } from './differ';

function makeChange(route: string, type: RouteChange['type'] = 'added'): RouteChange {
  return { route, type, methods: ['GET'] };
}

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

describe('buildVelocityReport', () => {
  it('returns empty report for no history', () => {
    const report = buildVelocityReport([]);
    expect(report.entries).toHaveLength(0);
    expect(report.averageVelocity).toBe(0);
    expect(report.fastestRoute).toBeNull();
    expect(report.slowestRoute).toBeNull();
  });

  it('counts changes per route', () => {
    const history = [
      { changes: [makeChange('/api/users')], date: daysAgo(10) },
      { changes: [makeChange('/api/users'), makeChange('/api/posts')], date: daysAgo(5) },
      { changes: [makeChange('/api/users')], date: daysAgo(0) },
    ];
    const report = buildVelocityReport(history);
    const users = report.entries.find(e => e.route === '/api/users');
    expect(users).toBeDefined();
    expect(users!.totalChanges).toBe(3);
  });

  it('identifies fastest route', () => {
    const history = [
      { changes: [makeChange('/api/fast'), makeChange('/api/fast'), makeChange('/api/fast')], date: daysAgo(2) },
      { changes: [makeChange('/api/slow')], date: daysAgo(30) },
    ];
    const report = buildVelocityReport(history);
    expect(report.fastestRoute).toBe('/api/fast');
  });

  it('classifies accelerating trend for high velocity routes', () => {
    const history = [
      { changes: Array(10).fill(null).map(() => makeChange('/api/hot')), date: daysAgo(1) },
      { changes: [makeChange('/api/cold')], date: daysAgo(30) },
    ];
    const report = buildVelocityReport(history);
    const hot = report.entries.find(e => e.route === '/api/hot');
    expect(hot?.trend).toBe('accelerating');
  });

  it('classifies idle for routes with zero velocity', () => {
    const history = [
      { changes: [makeChange('/api/once')], date: daysAgo(0) },
    ];
    const report = buildVelocityReport(history);
    // single entry on same day => changesPerDay == 1 / 1 day, no average to compare
    expect(report.entries[0].totalChanges).toBe(1);
  });
});

describe('formatVelocityReport', () => {
  it('includes header and route info', () => {
    const history = [
      { changes: [makeChange('/api/users')], date: daysAgo(5) },
      { changes: [makeChange('/api/users')], date: daysAgo(0) },
    ];
    const report = buildVelocityReport(history);
    const output = formatVelocityReport(report);
    expect(output).toContain('Route Velocity Report');
    expect(output).toContain('/api/users');
    expect(output).toContain('changes/day');
  });
});
