import { buildHotspotReport, formatHotspotReport } from './route-hotspot';
import type { RouteChange } from './differ';

function makeChange(path: string, methods: string[] = ['GET']): RouteChange {
  return { path, methods, type: 'modified' };
}

describe('buildHotspotReport', () => {
  it('returns empty entries when no change sets provided', () => {
    const report = buildHotspotReport([]);
    expect(report.entries).toHaveLength(0);
    expect(report.topN).toHaveLength(0);
  });

  it('counts changes per route across multiple sets', () => {
    const sets = [
      [makeChange('/api/users'), makeChange('/api/posts')],
      [makeChange('/api/users'), makeChange('/api/comments')],
      [makeChange('/api/users')],
    ];
    const report = buildHotspotReport(sets);
    const users = report.entries.find((e) => e.path === '/api/users');
    expect(users?.changeCount).toBe(3);
    expect(report.entries[0].path).toBe('/api/users');
  });

  it('aggregates methods across change sets', () => {
    const sets = [
      [makeChange('/api/users', ['GET'])],
      [makeChange('/api/users', ['POST'])],
    ];
    const report = buildHotspotReport(sets);
    expect(report.entries[0].methods).toEqual(['GET', 'POST']);
  });

  it('respects topN parameter', () => {
    const paths = ['/a', '/b', '/c', '/d', '/e', '/f'];
    const sets = [paths.map((p) => makeChange(p))];
    const report = buildHotspotReport(sets, 3);
    expect(report.topN).toHaveLength(3);
    expect(report.entries).toHaveLength(6);
  });

  it('computes score relative to number of change sets', () => {
    const sets = [
      [makeChange('/api/x')],
      [makeChange('/api/x')],
    ];
    const report = buildHotspotReport(sets);
    expect(report.entries[0].score).toBe(1);
  });
});

describe('formatHotspotReport', () => {
  it('returns a no-hotspot message for empty report', () => {
    const report = buildHotspotReport([]);
    expect(formatHotspotReport(report)).toBe('No hotspots detected.');
  });

  it('includes route paths and change counts in output', () => {
    const sets = [[makeChange('/api/users', ['GET', 'POST'])]];
    const report = buildHotspotReport(sets);
    const output = formatHotspotReport(report);
    expect(output).toContain('/api/users');
    expect(output).toContain('GET');
    expect(output).toContain('changes: 1');
  });

  it('shows overflow message when entries exceed topN', () => {
    const paths = ['/a', '/b', '/c', '/d', '/e', '/f', '/g'];
    const sets = [paths.map((p) => makeChange(p))];
    const report = buildHotspotReport(sets, 5);
    const output = formatHotspotReport(report);
    expect(output).toContain('2 more route(s)');
  });
});
