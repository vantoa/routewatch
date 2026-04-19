import { buildTrendEntry, buildTrendReport, formatTrendReport } from './trend';
import { RouteChange } from './differ';

const changes: RouteChange[] = [
  { type: 'added', route: '/api/users', newMethods: ['GET'] },
  { type: 'removed', route: '/api/old', oldMethods: ['POST'] },
  { type: 'modified', route: '/api/items', oldMethods: ['GET', 'POST'], newMethods: ['GET'] },
];

describe('buildTrendEntry', () => {
  it('counts change types correctly', () => {
    const entry = buildTrendEntry('2024-01-01', changes);
    expect(entry.date).toBe('2024-01-01');
    expect(entry.added).toBe(1);
    expect(entry.removed).toBe(1);
    expect(entry.modified).toBe(1);
  });

  it('returns zeros for empty changes', () => {
    const entry = buildTrendEntry('2024-01-02', []);
    expect(entry.added).toBe(0);
    expect(entry.removed).toBe(0);
    expect(entry.modified).toBe(0);
    expect(entry.breaking).toBe(0);
  });

  it('counts breaking changes', () => {
    const entry = buildTrendEntry('2024-01-01', changes);
    expect(entry.breaking).toBeGreaterThan(0);
  });
});

describe('buildTrendReport', () => {
  it('aggregates totals across entries', () => {
    const e1 = buildTrendEntry('2024-01-01', changes);
    const e2 = buildTrendEntry('2024-01-02', [{ type: 'added', route: '/api/new', newMethods: ['GET'] }]);
    const report = buildTrendReport([e1, e2]);
    expect(report.totalAdded).toBe(2);
    expect(report.totalRemoved).toBe(1);
    expect(report.entries).toHaveLength(2);
  });
});

describe('formatTrendReport', () => {
  it('includes header and totals', () => {
    const entry = buildTrendEntry('2024-01-01', changes);
    const report = buildTrendReport([entry]);
    const output = formatTrendReport(report);
    expect(output).toContain('Route Change Trend');
    expect(output).toContain('Totals:');
    expect(output).toContain('2024-01-01');
  });
});
