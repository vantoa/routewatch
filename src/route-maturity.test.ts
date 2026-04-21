import { describe, it, expect } from 'vitest';
import {
  scoreMaturity,
  classifyMaturity,
  computeMaturity,
  formatMaturityReport,
} from './route-maturity';
import { RouteInfo } from './scanner';
import { ChangeRecord } from './differ';

function makeRoute(route: string, methods: string[] = ['GET']): RouteInfo {
  return { route, methods };
}

function makeChange(
  route: string,
  type: 'added' | 'removed' | 'modified'
): ChangeRecord {
  return { route, type, methods: { before: [], after: ['GET'] } };
}

describe('scoreMaturity', () => {
  it('gives full score for simple stable route', () => {
    const route = makeRoute('/api/users');
    const { score, reasons } = scoreMaturity(route, []);
    expect(score).toBe(100);
    expect(reasons).toHaveLength(0);
  });

  it('penalises dynamic segments', () => {
    const route = makeRoute('/api/users/[id]');
    const { score } = scoreMaturity(route, []);
    expect(score).toBe(90);
  });

  it('penalises catch-all segments more', () => {
    const route = makeRoute('/api/[...slug]');
    const { score } = scoreMaturity(route, []);
    expect(score).toBe(80);
  });

  it('penalises high churn', () => {
    const route = makeRoute('/api/users');
    const changes = Array.from({ length: 6 }, () => makeChange('/api/users', 'modified'));
    const { score, reasons } = scoreMaturity(route, changes);
    expect(score).toBeLessThan(100);
    expect(reasons.some(r => r.includes('High churn'))).toBe(true);
  });

  it('penalises removed routes', () => {
    const route = makeRoute('/api/old');
    const changes = [makeChange('/api/old', 'removed')];
    const { score } = scoreMaturity(route, changes);
    expect(score).toBeLessThanOrEqual(60);
  });
});

describe('classifyMaturity', () => {
  it('classifies 100 as stable', () => expect(classifyMaturity(100)).toBe('stable'));
  it('classifies 70 as beta', () => expect(classifyMaturity(70)).toBe('beta'));
  it('classifies 40 as experimental', () => expect(classifyMaturity(40)).toBe('experimental'));
  it('classifies 10 as deprecated', () => expect(classifyMaturity(10)).toBe('deprecated'));
});

describe('computeMaturity', () => {
  it('produces a report with summary counts', () => {
    const routes = [makeRoute('/api/stable'), makeRoute('/api/[...all]')];
    const report = computeMaturity(routes, []);
    expect(report.routes).toHaveLength(2);
    const total = Object.values(report.summary).reduce((a, b) => a + b, 0);
    expect(total).toBe(2);
  });
});

describe('formatMaturityReport', () => {
  it('includes route and level information', () => {
    const routes = [makeRoute('/api/users')];
    const report = computeMaturity(routes, []);
    const output = formatMaturityReport(report);
    expect(output).toContain('/api/users');
    expect(output).toContain('STABLE');
    expect(output).toContain('Summary');
  });
});
