import { computeRisk, formatRiskReport } from './route-risk';
import { ClassifiedChange } from './severity';
import { RouteChange } from './differ';

function makeClassified(
  path: string,
  severity: 'breaking' | 'warning' | 'info',
  removedMethods: string[] = [],
  addedMethods: string[] = []
): ClassifiedChange {
  const change: RouteChange = {
    type: removedMethods.length && addedMethods.length ? 'modified' : removedMethods.length ? 'removed' : 'added',
    path,
    removedMethods,
    addedMethods,
  };
  return { change, severity };
}

describe('computeRisk', () => {
  it('returns empty report for no changes', () => {
    const r = computeRisk([]);
    expect(r.entries).toHaveLength(0);
    expect(r.summary).toEqual({ low: 0, medium: 0, high: 0, critical: 0 });
  });

  it('assigns breaking change factor', () => {
    const r = computeRisk([makeClassified('/api/users', 'breaking', ['GET'])]);
    expect(r.entries[0].factors).toContain('breaking change');
    expect(r.entries[0].riskScore).toBeGreaterThanOrEqual(40);
  });

  it('increases score for high churn', () => {
    const c = makeClassified('/api/orders', 'info');
    const r = computeRisk([c], { '/api/orders': 12 });
    expect(r.entries[0].factors).toContain('high churn (12)');
    expect(r.entries[0].riskScore).toBeGreaterThanOrEqual(30);
  });

  it('detects deep nesting', () => {
    const r = computeRisk([makeClassified('/a/b/c/d/e/f', 'info')]);
    expect(r.entries[0].factors).toContain('deep nesting');
  });

  it('detects mutating methods', () => {
    const r = computeRisk([makeClassified('/api/items', 'info', ['DELETE'])]);
    expect(r.entries[0].factors).toContain('mutating methods');
  });

  it('classifies critical when score >= 80', () => {
    const c = makeClassified('/api/x', 'breaking', ['DELETE']);
    const r = computeRisk([c], { '/api/x': 15 });
    expect(r.entries[0].riskLevel).toBe('critical');
    expect(r.summary.critical).toBe(1);
  });

  it('sorts entries by descending risk score', () => {
    const a = makeClassified('/low', 'info');
    const b = makeClassified('/high', 'breaking', ['DELETE']);
    const r = computeRisk([a, b], { '/high': 12 });
    expect(r.entries[0].path).toBe('/high');
  });
});

describe('formatRiskReport', () => {
  it('includes summary and entries', () => {
    const r = computeRisk([makeClassified('/api/users', 'breaking', ['GET'])]);
    const out = formatRiskReport(r);
    expect(out).toContain('Route Risk Report');
    expect(out).toContain('/api/users');
    expect(out).toContain('breaking change');
  });
});
