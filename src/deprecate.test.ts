import { matchesDeprecationRule, findDeprecatedRoutes, formatDeprecated } from './deprecate';
import { RouteChange } from './differ';

const changes: RouteChange[] = [
  { route: '/api/v1/users', status: 'removed', methods: ['GET', 'POST'] },
  { route: '/api/v1/posts', status: 'removed', methods: ['GET'] },
  { route: '/api/v2/users', status: 'added', methods: ['GET'] },
];

describe('matchesDeprecationRule', () => {
  it('matches exact route', () => {
    expect(matchesDeprecationRule('/api/v1/users', '/api/v1/users')).toBe(true);
  });

  it('matches wildcard pattern', () => {
    expect(matchesDeprecationRule('/api/v1/users', '/api/v1/*')).toBe(true);
  });

  it('does not match unrelated route', () => {
    expect(matchesDeprecationRule('/api/v2/users', '/api/v1/*')).toBe(false);
  });
});

describe('findDeprecatedRoutes', () => {
  it('returns empty array when no rules', () => {
    expect(findDeprecatedRoutes(changes, [])).toEqual([]);
  });

  it('finds deprecated routes matching pattern', () => {
    const rules = [{ pattern: '/api/v1/*', reason: 'v1 is retired', since: '2.0.0' }];
    const result = findDeprecatedRoutes(changes, rules);
    expect(result).toHaveLength(2);
    expect(result[0].route).toBe('/api/v1/users');
    expect(result[0].reason).toBe('v1 is retired');
    expect(result[0].since).toBe('2.0.0');
  });

  it('ignores added routes', () => {
    const rules = [{ pattern: '/api/v2/*' }];
    const result = findDeprecatedRoutes(changes, rules);
    expect(result).toHaveLength(0);
  });
});

describe('formatDeprecated', () => {
  it('returns message when none found', () => {
    expect(formatDeprecated([])).toBe('No deprecated routes found.');
  });

  it('formats deprecated routes', () => {
    const deprecated = [{ route: '/api/v1/users', methods: ['GET'], reason: 'old', since: '1.0' }];
    const output = formatDeprecated(deprecated);
    expect(output).toContain('/api/v1/users');
    expect(output).toContain('old');
    expect(output).toContain('1.0');
  });
});
