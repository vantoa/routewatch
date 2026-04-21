import {
  classifyStability,
  computeStabilityScore,
  buildStabilityReport,
  formatStabilityReport,
} from './route-stability';
import { RouteChange } from './differ';

function makeChange(path: string, status: 'added' | 'removed' | 'modified' = 'modified'): RouteChange {
  return { path, status, methods: ['GET'] };
}

describe('classifyStability', () => {
  it('returns stable for score >= 75', () => {
    expect(classifyStability(100)).toBe('stable');
    expect(classifyStability(75)).toBe('stable');
  });

  it('returns volatile for score 40-74', () => {
    expect(classifyStability(60)).toBe('volatile');
    expect(classifyStability(40)).toBe('volatile');
  });

  it('returns unstable for score < 40', () => {
    expect(classifyStability(39)).toBe('unstable');
    expect(classifyStability(0)).toBe('unstable');
  });
});

describe('computeStabilityScore', () => {
  it('returns 100 for zero age', () => {
    expect(computeStabilityScore(5, 0)).toBe(100);
  });

  it('returns lower score for more changes per day', () => {
    const low = computeStabilityScore(1, 30);
    const high = computeStabilityScore(10, 5);
    expect(high).toBeLessThan(low);
  });

  it('does not go below 0', () => {
    expect(computeStabilityScore(1000, 1)).toBeGreaterThanOrEqual(0);
  });
});

describe('buildStabilityReport', () => {
  const history = [
    { date: '2024-01-01', changes: [makeChange('/api/users'), makeChange('/api/posts')] },
    { date: '2024-01-05', changes: [makeChange('/api/users'), makeChange('/api/users')] },
    { date: '2024-01-10', changes: [makeChange('/api/posts')] },
  ];

  it('builds entries for each unique route', () => {
    const report = buildStabilityReport(history);
    const paths = report.entries.map((e) => e.path);
    expect(paths).toContain('/api/users');
    expect(paths).toContain('/api/posts');
  });

  it('counts changes correctly', () => {
    const report = buildStabilityReport(history);
    const users = report.entries.find((e) => e.path === '/api/users')!;
    expect(users.changeCount).toBe(3);
  });

  it('returns averageScore as a number', () => {
    const report = buildStabilityReport(history);
    expect(typeof report.averageScore).toBe('number');
  });

  it('returns 100 average for empty history', () => {
    const report = buildStabilityReport([]);
    expect(report.averageScore).toBe(100);
    expect(report.entries).toHaveLength(0);
  });

  it('mostVolatile has lowest scores', () => {
    const report = buildStabilityReport(history);
    if (report.mostVolatile.length > 1) {
      expect(report.mostVolatile[0].stabilityScore).toBeLessThanOrEqual(
        report.mostVolatile[1].stabilityScore
      );
    }
  });
});

describe('formatStabilityReport', () => {
  it('includes header and average score', () => {
    const report = buildStabilityReport([
      { date: '2024-01-01', changes: [makeChange('/api/test')] },
    ]);
    const output = formatStabilityReport(report);
    expect(output).toContain('Route Stability Report');
    expect(output).toContain('Average Stability Score');
    expect(output).toContain('/api/test');
  });
});
