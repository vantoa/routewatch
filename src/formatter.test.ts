import { formatDiff } from './formatter';
import { DiffResult } from './differ';
import { RouteInfo } from './scanner';

const makeRoute = (route: string, methods: string[]): RouteInfo => ({
  route,
  methods,
  filePath: `/app${route}/route.ts`,
});

const emptyDiff: DiffResult = { added: [], removed: [], modified: [], unchanged: [] };

describe('formatDiff', () => {
  it('returns no-change message when diff is empty', () => {
    const output = formatDiff(emptyDiff);
    expect(output).toContain('No route changes detected');
  });

  it('includes added route in output', () => {
    const diff: DiffResult = {
      ...emptyDiff,
      added: [{ type: 'added', route: '/api/users', after: makeRoute('/api/users', ['GET']) }],
    };
    const output = formatDiff(diff);
    expect(output).toContain('/api/users');
    expect(output).toContain('Added');
  });

  it('includes removed route in output', () => {
    const diff: DiffResult = {
      ...emptyDiff,
      removed: [{ type: 'removed', route: '/api/old', before: makeRoute('/api/old', ['DELETE']) }],
    };
    const output = formatDiff(diff);
    expect(output).toContain('/api/old');
    expect(output).toContain('Removed');
  });

  it('includes summary line', () => {
    const diff: DiffResult = {
      ...emptyDiff,
      added: [{ type: 'added', route: '/api/new', after: makeRoute('/api/new', ['POST']) }],
    };
    const output = formatDiff(diff);
    expect(output).toContain('Summary');
  });
});
