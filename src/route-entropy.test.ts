import { buildEntropyReport, formatEntropyReport } from './route-entropy';
import { RouteChange } from './differ';

function makeChange(
  path: string,
  status: 'added' | 'removed' | 'modified',
  beforeMethods?: string[],
  afterMethods?: string[]
): RouteChange {
  return {
    status,
    before: beforeMethods ? { path, methods: beforeMethods } : undefined,
    after: afterMethods ? { path, methods: afterMethods } : undefined,
  } as RouteChange;
}

describe('buildEntropyReport', () => {
  it('returns empty report when no changes', () => {
    const report = buildEntropyReport([]);
    expect(report.entries).toHaveLength(0);
    expect(report.averageEntropy).toBe(0);
  });

  it('computes entropy for a single route with one method', () => {
    const changes = [makeChange('/api/users', 'added', undefined, ['GET'])];
    const report = buildEntropyReport(changes);
    expect(report.entries).toHaveLength(1);
    expect(report.entries[0].path).toBe('/api/users');
    expect(report.entries[0].entropy).toBe(0);
    expect(report.entries[0].label).toBe('low');
  });

  it('computes higher entropy for multiple methods', () => {
    const changes = [
      makeChange('/api/items', 'modified', ['GET'], ['GET', 'POST', 'DELETE']),
    ];
    const report = buildEntropyReport(changes);
    expect(report.entries[0].entropy).toBeGreaterThan(0);
    expect(report.entries[0].uniqueMethods).toBeGreaterThanOrEqual(2);
  });

  it('groups changes by path', () => {
    const changes = [
      makeChange('/api/orders', 'added', undefined, ['GET']),
      makeChange('/api/orders', 'modified', ['GET'], ['GET', 'POST']),
    ];
    const report = buildEntropyReport(changes);
    expect(report.entries).toHaveLength(1);
    expect(report.entries[0].changeCount).toBe(2);
  });

  it('labels entries correctly against threshold', () => {
    const changes = [
      makeChange('/api/x', 'modified', ['GET', 'POST'], ['DELETE', 'PATCH']),
    ];
    const report = buildEntropyReport(changes, 0.1);
    expect(report.entries[0].label).toBe('high');
  });

  it('sorts entries by entropy descending', () => {
    const changes = [
      makeChange('/api/a', 'added', undefined, ['GET']),
      makeChange('/api/b', 'modified', ['GET', 'POST'], ['DELETE', 'PATCH']),
    ];
    const report = buildEntropyReport(changes);
    expect(report.entries[0].entropy).toBeGreaterThanOrEqual(
      report.entries[1].entropy
    );
  });
});

describe('formatEntropyReport', () => {
  it('includes header and average entropy', () => {
    const report = buildEntropyReport([]);
    const text = formatEntropyReport(report);
    expect(text).toContain('Route Entropy Report');
    expect(text).toContain('Average entropy');
    expect(text).toContain('No route changes');
  });

  it('renders entries with label and stats', () => {
    const changes = [
      makeChange('/api/users', 'modified', ['GET'], ['GET', 'POST']),
    ];
    const report = buildEntropyReport(changes);
    const text = formatEntropyReport(report);
    expect(text).toContain('/api/users');
    expect(text).toContain('entropy=');
  });
});
