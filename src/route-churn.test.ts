import { buildChurnReport, formatChurnReport } from './route-churn';
import { RouteChange } from './differ';

function makeChange(path: string, status: 'added' | 'removed' | 'modified'): RouteChange {
  return {
    path,
    status,
    methods: status === 'removed' ? ['GET'] : ['GET'],
    ...(status === 'modified' ? { addedMethods: [], removedMethods: [] } : {}),
  } as unknown as RouteChange;
}

describe('buildChurnReport', () => {
  it('returns empty report for no change sets', () => {
    const report = buildChurnReport([]);
    expect(report.entries).toHaveLength(0);
    expect(report.totalChurn).toBe(0);
    expect(report.mostChurned).toBeNull();
  });

  it('counts changes per route across sets', () => {
    const sets = [
      [makeChange('/api/users', 'added'), makeChange('/api/posts', 'removed')],
      [makeChange('/api/users', 'modified')],
    ];
    const report = buildChurnReport(sets);
    const user = report.entries.find(e => e.path === '/api/users')!;
    expect(user.changes).toBe(2);
    expect(user.added).toBe(1);
    expect(user.modified).toBe(1);
  });

  it('assigns higher churn score to removed routes', () => {
    const sets = [
      [makeChange('/api/a', 'removed'), makeChange('/api/b', 'added')],
    ];
    const report = buildChurnReport(sets);
    const a = report.entries.find(e => e.path === '/api/a')!;
    const b = report.entries.find(e => e.path === '/api/b')!;
    expect(a.churnScore).toBeGreaterThan(b.churnScore);
  });

  it('sorts entries by churn score descending', () => {
    const sets = [
      [makeChange('/api/low', 'added'), makeChange('/api/high', 'removed')],
    ];
    const report = buildChurnReport(sets);
    expect(report.entries[0].path).toBe('/api/high');
  });

  it('identifies the most churned route', () => {
    const sets = [
      [makeChange('/api/x', 'removed'), makeChange('/api/x', 'removed')],
      [makeChange('/api/y', 'added')],
    ];
    const report = buildChurnReport(sets);
    expect(report.mostChurned?.path).toBe('/api/x');
  });
});

describe('formatChurnReport', () => {
  it('returns message when no data', () => {
    expect(formatChurnReport({ entries: [], totalChurn: 0, mostChurned: null })).toContain('No churn');
  });

  it('includes route path and scores', () => {
    const sets = [[makeChange('/api/items', 'modified')]];
    const report = buildChurnReport(sets);
    const output = formatChurnReport(report);
    expect(output).toContain('/api/items');
    expect(output).toContain('score=');
    expect(output).toContain('Most churned');
  });
});
