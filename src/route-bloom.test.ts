import { buildBloomReport, formatBloomReport } from './route-bloom';
import { RouteChange } from './differ';

function makeChange(path: string, status: RouteChange['status'], methods: string[] = []): RouteChange {
  return { path, status, methods };
}

describe('buildBloomReport', () => {
  it('returns empty entries when no added routes', () => {
    const report = buildBloomReport([
      makeChange('/api/users', 'removed', ['GET']),
    ]);
    expect(report.entries).toHaveLength(0);
    expect(report.topGrowing).toHaveLength(0);
  });

  it('captures added routes with growth scores', () => {
    const changes = [
      makeChange('/api/users', 'added', ['GET', 'POST']),
      makeChange('/api/orders', 'added', ['DELETE']),
    ];
    const report = buildBloomReport(changes);
    expect(report.entries).toHaveLength(2);
    const users = report.entries.find((e) => e.path === '/api/users')!;
    expect(users.addedMethods).toEqual(['GET', 'POST']);
    expect(users.growthScore).toBeCloseTo(3);
  });

  it('uses history for firstSeen date', () => {
    const changes = [makeChange('/api/items', 'added', ['GET'])];
    const history = [{ path: '/api/items', date: '2024-01-15' }];
    const report = buildBloomReport(changes, history);
    expect(report.entries[0].firstSeen).toBe('2024-01-15');
  });

  it('limits topGrowing to 5 entries', () => {
    const changes = Array.from({ length: 8 }, (_, i) =>
      makeChange(`/api/route${i}`, 'added', ['DELETE'])
    );
    const report = buildBloomReport(changes);
    expect(report.topGrowing).toHaveLength(5);
  });

  it('sorts topGrowing by descending score', () => {
    const changes = [
      makeChange('/api/a', 'added', ['GET']),
      makeChange('/api/b', 'added', ['DELETE', 'POST']),
    ];
    const report = buildBloomReport(changes);
    expect(report.topGrowing[0].path).toBe('/api/b');
  });
});

describe('formatBloomReport', () => {
  it('returns message when no entries', () => {
    const out = formatBloomReport({ entries: [], topGrowing: [] });
    expect(out).toContain('No new routes');
  });

  it('includes path and growth score', () => {
    const report = buildBloomReport([makeChange('/api/x', 'added', ['POST'])]);
    const out = formatBloomReport(report);
    expect(out).toContain('/api/x');
    expect(out).toContain('POST');
    expect(out).toContain('Top Growing');
  });
});
