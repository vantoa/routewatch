import { describe, it, expect } from 'vitest';
import {
  scoreRouteHealth,
  buildHealthScoreReport,
  formatHealthScoreReport,
  deriveGrade,
} from './route-health-score';
import { RouteInfo } from './scanner';
import { RouteChange } from './differ';

function makeRoute(path: string, methods: string[] = ['GET']): RouteInfo {
  return { path, methods };
}

function makeChange(path: string): RouteChange {
  return { type: 'modified', path, from: ['GET'], to: ['GET', 'POST'] };
}

describe('deriveGrade', () => {
  it('returns A for >= 90', () => expect(deriveGrade(95)).toBe('A'));
  it('returns B for >= 75', () => expect(deriveGrade(80)).toBe('B'));
  it('returns C for >= 60', () => expect(deriveGrade(65)).toBe('C'));
  it('returns D for >= 45', () => expect(deriveGrade(50)).toBe('D'));
  it('returns F for < 45', () => expect(deriveGrade(30)).toBe('F'));
});

describe('scoreRouteHealth', () => {
  it('scores a simple stable route highly', () => {
    const r = scoreRouteHealth(makeRoute('/api/users'), []);
    expect(r.score).toBeGreaterThan(75);
    expect(r.grade).toMatch(/[AB]/);
    expect(r.suggestions).toHaveLength(0);
  });

  it('penalizes deeply nested routes', () => {
    const r = scoreRouteHealth(makeRoute('/api/a/b/c/d/e/f'), []);
    expect(r.factors.complexity).toBeLessThan(100);
  });

  it('penalizes routes with many dynamic segments', () => {
    const r = scoreRouteHealth(makeRoute('/api/[a]/[b]/[c]'), []);
    expect(r.factors.naming).toBeLessThan(100);
    expect(r.suggestions.length).toBeGreaterThan(0);
  });

  it('penalizes frequently changed routes', () => {
    const changes = Array.from({ length: 8 }, () => makeChange('/api/users'));
    const r = scoreRouteHealth(makeRoute('/api/users'), changes);
    expect(r.factors.stability).toBeLessThan(50);
    expect(r.suggestions.some(s => s.includes('frequently'))).toBe(true);
  });

  it('penalizes routes with no methods', () => {
    const r = scoreRouteHealth(makeRoute('/api/empty', []), []);
    expect(r.factors.coverage).toBe(50);
    expect(r.suggestions.some(s => s.includes('No HTTP methods'))).toBe(true);
  });
});

describe('buildHealthScoreReport', () => {
  it('computes average and distribution', () => {
    const routes = [makeRoute('/api/a'), makeRoute('/api/b'), makeRoute('/api/c')];
    const report = buildHealthScoreReport(routes, []);
    expect(report.average).toBeGreaterThan(0);
    expect(Object.keys(report.distribution)).toEqual(['A', 'B', 'C', 'D', 'F']);
    expect(report.routes).toHaveLength(3);
  });

  it('returns average 0 for empty routes', () => {
    const report = buildHealthScoreReport([], []);
    expect(report.average).toBe(0);
  });
});

describe('formatHealthScoreReport', () => {
  it('includes header and average', () => {
    const routes = [makeRoute('/api/users')];
    const report = buildHealthScoreReport(routes, []);
    const out = formatHealthScoreReport(report);
    expect(out).toContain('Route Health Scores');
    expect(out).toContain('Average Score');
    expect(out).toContain('/api/users');
  });
});
