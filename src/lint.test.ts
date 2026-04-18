import { lintChanges, formatLintResults } from './lint';
import { RouteChange } from './differ';

const removed: RouteChange = { route: '/api/users', status: 'removed', before: ['GET'], after: [] };
const added: RouteChange = { route: '/api/posts', status: 'added', before: [], after: ['POST'] };
const addedNoMethods: RouteChange = { route: '/api/empty', status: 'added', before: [], after: [] };
const modified: RouteChange = { route: '/api/items', status: 'modified', before: ['GET', 'DELETE'], after: ['GET'] };

describe('lintChanges', () => {
  it('flags removed routes', () => {
    const results = lintChanges([removed]);
    expect(results.some((r) => r.ruleId === 'no-delete-without-deprecation')).toBe(true);
  });

  it('flags method removal on modified routes', () => {
    const results = lintChanges([modified]);
    expect(results.some((r) => r.ruleId === 'no-method-removal')).toBe(true);
  });

  it('flags added routes with no methods', () => {
    const results = lintChanges([addedNoMethods]);
    expect(results.some((r) => r.ruleId === 'prefer-explicit-methods')).toBe(true);
  });

  it('does not flag clean added route', () => {
    const results = lintChanges([added]);
    expect(results.filter((r) => r.ruleId === 'prefer-explicit-methods')).toHaveLength(0);
  });

  it('returns empty array for no changes', () => {
    expect(lintChanges([])).toEqual([]);
  });

  it('assigns error severity to breaking changes', () => {
    const results = lintChanges([removed]);
    const r = results.find((x) => x.ruleId === 'no-delete-without-deprecation');
    expect(r?.severity).toBe('error');
  });
});

describe('formatLintResults', () => {
  it('returns no-issue message when empty', () => {
    expect(formatLintResults([])).toBe('No lint issues found.');
  });

  it('formats results with severity and rule id', () => {
    const results = lintChanges([removed]);
    const output = formatLintResults(results);
    expect(output).toMatch(/\[ERROR\]/);
    expect(output).toMatch(/no-delete-without-deprecation/);
  });
});
