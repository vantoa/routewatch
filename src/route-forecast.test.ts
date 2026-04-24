import {
  buildForecastReport,
  formatForecastReport,
  ForecastReport,
} from './route-forecast';
import { RouteChange } from './differ';

function makeChange(path: string, status: 'added' | 'removed' | 'modified' = 'modified'): RouteChange {
  return { path, status, methods: { before: ['GET'], after: ['GET'] } };
}

describe('buildForecastReport', () => {
  it('returns empty entries for empty history', () => {
    const report = buildForecastReport([]);
    expect(report.entries).toHaveLength(0);
  });

  it('returns entry with no prediction for single occurrence', () => {
    const history = [[makeChange('/api/users')]];
    const report = buildForecastReport(history);
    expect(report.entries).toHaveLength(1);
    const entry = report.entries[0];
    expect(entry.path).toBe('/api/users');
    expect(entry.changeCount).toBe(1);
    expect(entry.avgDaysBetweenChanges).toBeNull();
    expect(entry.predictedNextChangeDays).toBeNull();
    expect(entry.confidence).toBe('low');
  });

  it('computes average gap across multiple snapshots', () => {
    const history = [
      [makeChange('/api/orders')],
      [],
      [makeChange('/api/orders')],
      [],
      [makeChange('/api/orders')],
    ];
    const report = buildForecastReport(history, 7);
    const entry = report.entries.find((e) => e.path === '/api/orders')!;
    expect(entry.changeCount).toBe(3);
    expect(entry.avgDaysBetweenChanges).toBeCloseTo(14, 1);
    expect(entry.confidence).toBe('medium');
  });

  it('assigns high confidence for 5+ changes', () => {
    const history = [
      [makeChange('/api/x')],
      [makeChange('/api/x')],
      [makeChange('/api/x')],
      [makeChange('/api/x')],
      [makeChange('/api/x')],
    ];
    const report = buildForecastReport(history);
    expect(report.entries[0].confidence).toBe('high');
  });

  it('sorts entries by predictedNextChangeDays ascending', () => {
    const history = [
      [makeChange('/api/a'), makeChange('/api/b')],
      [makeChange('/api/a')],
      [makeChange('/api/b')],
    ];
    const report = buildForecastReport(history, 1);
    const paths = report.entries.map((e) => e.path);
    expect(paths.indexOf('/api/a')).toBeLessThanOrEqual(paths.indexOf('/api/b'));
  });

  it('includes generatedAt timestamp', () => {
    const report = buildForecastReport([]);
    expect(report.generatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });
});

describe('formatForecastReport', () => {
  it('shows fallback message when no entries', () => {
    const report: ForecastReport = { generatedAt: '2024-01-01T00:00:00.000Z', entries: [] };
    expect(formatForecastReport(report)).toContain('No forecast data available.');
  });

  it('includes route path in output', () => {
    const history = [[makeChange('/api/products')], [makeChange('/api/products')]];
    const report = buildForecastReport(history);
    const output = formatForecastReport(report);
    expect(output).toContain('/api/products');
    expect(output).toContain('confidence:');
  });
});
