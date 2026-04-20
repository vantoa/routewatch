import { buildRouteDiffSummary, formatRouteDiffSummary } from './route-diff-summary';
import { RouteChange } from './differ';

const changes: RouteChange[] = [
  { type: 'added', route: '/api/users', methods: ['GET', 'POST'] },
  { type: 'removed', route: '/api/legacy', methods: ['GET'] },
  { type: 'modified', route: '/api/posts', before: ['GET'], after: ['GET', 'PUT'] },
];

describe('buildRouteDiffSummary', () => {
  it('categorises changes correctly', () => {
    const summary = buildRouteDiffSummary(changes);
    expect(summary.added.routes).toEqual(['/api/users']);
    expect(summary.removed.routes).toEqual(['/api/legacy']);
    expect(summary.modified.routes).toEqual(['/api/posts']);
    expect(summary.total).toBe(3);
  });

  it('returns empty sections when no changes', () => {
    const summary = buildRouteDiffSummary([]);
    expect(summary.added.routes).toHaveLength(0);
    expect(summary.removed.routes).toHaveLength(0);
    expect(summary.modified.routes).toHaveLength(0);
    expect(summary.total).toBe(0);
  });
});

describe('formatRouteDiffSummary', () => {
  it('includes section headers and routes', () => {
    const summary = buildRouteDiffSummary(changes);
    const output = formatRouteDiffSummary(summary);
    expect(output).toContain('Added (1)');
    expect(output).toContain('Removed (1)');
    expect(output).toContain('Modified (1)');
    expect(output).toContain('/api/users');
    expect(output).toContain('/api/legacy');
    expect(output).toContain('/api/posts');
  });

  it('shows no changes message when empty', () => {
    const summary = buildRouteDiffSummary([]);
    const output = formatRouteDiffSummary(summary);
    expect(output).toContain('No changes detected.');
  });

  it('omits sections with no routes', () => {
    const summary = buildRouteDiffSummary([{ type: 'added', route: '/api/new', methods: ['GET'] }]);
    const output = formatRouteDiffSummary(summary);
    expect(output).not.toContain('Removed');
    expect(output).not.toContain('Modified');
  });
});
