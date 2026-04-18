import { computeStats, formatStats } from './stats';
import { DiffResult } from './differ';

const sampleDiff: DiffResult[] = [
  { type: 'added', route: '/api/users', methods: ['GET', 'POST'] },
  { type: 'removed', route: '/api/legacy', methods: ['GET'] },
  { type: 'modified', route: '/api/posts', addedMethods: ['PUT'], removedMethods: ['DELETE'] },
  { type: 'unchanged', route: '/api/health', methods: ['GET'] },
];

describe('computeStats', () => {
  it('counts added, removed, modified, unchanged', () => {
    const stats = computeStats(sampleDiff);
    expect(stats.totalAdded).toBe(1);
    expect(stats.totalRemoved).toBe(1);
    expect(stats.totalModified).toBe(1);
    expect(stats.totalUnchanged).toBe(1);
  });

  it('builds method breakdown for added routes', () => {
    const stats = computeStats(sampleDiff);
    expect(stats.methodBreakdown['GET'].added).toBe(1);
    expect(stats.methodBreakdown['POST'].added).toBe(1);
  });

  it('builds method breakdown for removed routes', () => {
    const stats = computeStats(sampleDiff);
    expect(stats.methodBreakdown['GET'].removed).toBe(1);
  });

  it('builds method breakdown for modified routes', () => {
    const stats = computeStats(sampleDiff);
    expect(stats.methodBreakdown['PUT'].added).toBe(1);
    expect(stats.methodBreakdown['DELETE'].removed).toBe(1);
  });

  it('returns zero counts for empty diff', () => {
    const stats = computeStats([]);
    expect(stats.totalAdded).toBe(0);
    expect(stats.totalRemoved).toBe(0);
    expect(stats.totalModified).toBe(0);
    expect(stats.totalUnchanged).toBe(0);
    expect(Object.keys(stats.methodBreakdown)).toHaveLength(0);
  });
});

describe('formatStats', () => {
  it('includes all count lines', () => {
    const stats = computeStats(sampleDiff);
    const output = formatStats(stats);
    expect(output).toContain('Added:     1');
    expect(output).toContain('Removed:   1');
    expect(output).toContain('Modified:  1');
    expect(output).toContain('Unchanged: 1');
  });

  it('includes method breakdown when present', () => {
    const stats = computeStats(sampleDiff);
    const output = formatStats(stats);
    expect(output).toContain('Method Breakdown:');
    expect(output).toContain('GET: +1 -1');
  });

  it('omits method breakdown when empty', () => {
    const stats = computeStats([]);
    const output = formatStats(stats);
    expect(output).not.toContain('Method Breakdown:');
  });
});
