import { describe, it, expect } from 'vitest';
import {
  matchesOwnershipPattern,
  assignOwnership,
  formatOwnershipReport,
  OwnershipRule,
} from './route-ownership';
import { RouteInfo } from './scanner';

function makeRoute(route: string, methods: string[] = ['GET']): RouteInfo {
  return { route, methods, filePath: `/app${route}/route.ts` };
}

const rules: OwnershipRule[] = [
  { pattern: '/api/users*', owner: 'alice', team: 'identity' },
  { pattern: '/api/products*', owner: 'bob', team: 'catalog' },
  { pattern: '/api/admin*', owner: 'charlie' },
];

describe('matchesOwnershipPattern', () => {
  it('matches exact route', () => {
    expect(matchesOwnershipPattern('/api/users', '/api/users')).toBe(true);
  });

  it('matches wildcard suffix', () => {
    expect(matchesOwnershipPattern('/api/users/123', '/api/users*')).toBe(true);
  });

  it('does not match unrelated route', () => {
    expect(matchesOwnershipPattern('/api/orders', '/api/users*')).toBe(false);
  });
});

describe('assignOwnership', () => {
  it('assigns owners based on matching rules', () => {
    const routes = [
      makeRoute('/api/users'),
      makeRoute('/api/users/[id]', ['GET', 'PUT', 'DELETE']),
      makeRoute('/api/products'),
    ];
    const report = assignOwnership(routes, rules);
    expect(report.owned).toHaveLength(3);
    expect(report.unowned).toHaveLength(0);
    expect(report.owned[0].owner).toBe('alice');
    expect(report.owned[0].team).toBe('identity');
    expect(report.owned[2].owner).toBe('bob');
  });

  it('places unmatched routes in unowned', () => {
    const routes = [makeRoute('/api/orders'), makeRoute('/api/users')];
    const report = assignOwnership(routes, rules);
    expect(report.owned).toHaveLength(1);
    expect(report.unowned).toHaveLength(1);
    expect(report.unowned[0].route).toBe('/api/orders');
  });

  it('handles empty routes', () => {
    const report = assignOwnership([], rules);
    expect(report.owned).toHaveLength(0);
    expect(report.unowned).toHaveLength(0);
  });
});

describe('formatOwnershipReport', () => {
  it('formats owned and unowned sections', () => {
    const routes = [makeRoute('/api/users'), makeRoute('/api/orders')];
    const report = assignOwnership(routes, rules);
    const output = formatOwnershipReport(report);
    expect(output).toContain('Owned Routes:');
    expect(output).toContain('alice');
    expect(output).toContain('[identity]');
    expect(output).toContain('Unowned Routes:');
    expect(output).toContain('/api/orders');
    expect(output).toContain('1 owned, 1 unowned');
  });
});
