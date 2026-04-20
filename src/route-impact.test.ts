import { assessImpact, formatImpactReport } from './route-impact';
import { RouteChange } from './differ';

const removed: RouteChange = { route: '/api/users', status: 'removed', oldMethods: ['GET', 'POST'], newMethods: [] };
const added: RouteChange = { route: '/api/products', status: 'added', oldMethods: [], newMethods: ['GET'] };
const modified: RouteChange = { route: '/api/orders', status: 'modified', oldMethods: ['GET', 'DELETE'], newMethods: ['GET'] };

describe('assessImpact', () => {
  it('scores a removed route as breaking', () => {
    const report = assessImpact([removed]);
    expect(report.entries[0].severity).toBe('breaking');
    expect(report.entries[0].score).toBe(10);
  });

  it('scores an added route as additive', () => {
    const report = assessImpact([added]);
    expect(report.entries[0].severity).toBe('additive');
    expect(report.entries[0].score).toBe(1);
  });

  it('scores a modified route with removed methods as breaking', () => {
    const report = assessImpact([modified]);
    expect(report.entries[0].severity).toBe('breaking');
  });

  it('sums total score across entries', () => {
    const report = assessImpact([removed, added]);
    expect(report.totalScore).toBe(11);
  });

  it('sets highestSeverity to breaking when any entry is breaking', () => {
    const report = assessImpact([removed, added]);
    expect(report.highestSeverity).toBe('breaking');
  });

  it('sets highestSeverity to additive when all entries are additive', () => {
    const report = assessImpact([added]);
    expect(report.highestSeverity).toBe('additive');
  });

  it('returns empty report for no changes', () => {
    const report = assessImpact([]);
    expect(report.entries).toHaveLength(0);
    expect(report.totalScore).toBe(0);
  });

  it('includes reason string', () => {
    const report = assessImpact([removed]);
    expect(report.entries[0].reason).toMatch(/removed/);
  });
});

describe('formatImpactReport', () => {
  it('includes total score in header', () => {
    const report = assessImpact([removed, added]);
    const output = formatImpactReport(report);
    expect(output).toMatch(/total score: 11/);
  });

  it('includes route paths', () => {
    const report = assessImpact([removed]);
    const output = formatImpactReport(report);
    expect(output).toContain('/api/users');
  });
});
