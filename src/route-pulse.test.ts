import { buildPulseReport, formatPulseReport } from './route-pulse';
import { RouteChange } from './differ';

function makeChange(path: string, type: RouteChange['type'] = 'added'): RouteChange {
  return { path, type, methods: ['GET'] };
}

const history = [
  { date: '2024-01-01', changes: [makeChange('/api/users'), makeChange('/api/posts')] },
  { date: '2024-01-08', changes: [makeChange('/api/users')] },
  { date: '2024-01-15', changes: [makeChange('/api/users'), makeChange('/api/posts')] },
  { date: '2024-03-01', changes: [makeChange('/api/settings')] },
];

describe('buildPulseReport', () => {
  it('counts changes per path', () => {
    const report = buildPulseReport(history);
    const users = report.entries.find(e => e.path === '/api/users');
    expect(users?.changeCount).toBe(3);
  });

  it('records first and last seen dates', () => {
    const report = buildPulseReport(history);
    const users = report.entries.find(e => e.path === '/api/users');
    expect(users?.firstSeen).toBe('2024-01-01');
    expect(users?.lastSeen).toBe('2024-01-15');
  });

  it('classifies active routes', () => {
    const report = buildPulseReport(history);
    const users = report.entries.find(e => e.path === '/api/users');
    expect(users?.pulse).toBe('active');
  });

  it('classifies dormant routes (single change, old)', () => {
    const report = buildPulseReport(history);
    const settings = report.entries.find(e => e.path === '/api/settings');
    expect(settings?.pulse).toBe('steady');
    expect(settings?.intervalDays).toBeNull();
  });

  it('sorts entries by change count descending', () => {
    const report = buildPulseReport(history);
    expect(report.entries[0].changeCount).toBeGreaterThanOrEqual(
      report.entries[report.entries.length - 1].changeCount
    );
  });

  it('returns empty entries for empty history', () => {
    const report = buildPulseReport([]);
    expect(report.entries).toHaveLength(0);
  });

  it('includes generatedAt timestamp', () => {
    const report = buildPulseReport(history);
    expect(report.generatedAt).toBeTruthy();
  });
});

describe('formatPulseReport', () => {
  it('returns no-data message for empty report', () => {
    const result = formatPulseReport({ entries: [], generatedAt: new Date().toISOString() });
    expect(result).toContain('No pulse data');
  });

  it('includes route path in output', () => {
    const report = buildPulseReport(history);
    const result = formatPulseReport(report);
    expect(result).toContain('/api/users');
  });

  it('includes pulse classification in output', () => {
    const report = buildPulseReport(history);
    const result = formatPulseReport(report);
    expect(result).toMatch(/ACTIVE|STEADY|QUIET|DORMANT/);
  });
});
