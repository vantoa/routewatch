import { annotatePinnedChanges, filterPinnedChanges, formatPinnedDiff } from './pin-diff';
import { RouteChange } from './differ';

const changes: RouteChange[] = [
  { route: '/api/users', status: 'added', methods: ['GET', 'POST'] },
  { route: '/api/posts', status: 'removed', methods: ['GET'] },
  { route: '/api/auth', status: 'modified', methods: ['POST'] },
];

describe('annotatePinnedChanges', () => {
  it('marks pinned routes', () => {
    const pins = { '/api/users': ['GET'] };
    const result = annotatePinnedChanges(changes, pins);
    expect(result[0].pinned).toBe(true);
    expect(result[1].pinned).toBe(false);
  });

  it('returns false for routes not in pins', () => {
    const result = annotatePinnedChanges(changes, {});
    result.forEach((r) => expect(r.pinned).toBe(false));
  });
});

describe('filterPinnedChanges', () => {
  it('returns only pinned changes', () => {
    const pins = { '/api/users': ['POST'] };
    const annotated = annotatePinnedChanges(changes, pins);
    const filtered = filterPinnedChanges(annotated);
    expect(filtered).toHaveLength(1);
    expect(filtered[0].change.route).toBe('/api/users');
  });
});

describe('formatPinnedDiff', () => {
  it('formats pinned changes', () => {
    const pins = { '/api/users': ['GET'] };
    const annotated = annotatePinnedChanges(changes, pins);
    const output = formatPinnedDiff(filterPinnedChanges(annotated));
    expect(output).toContain('[PINNED]');
    expect(output).toContain('/api/users');
  });

  it('returns empty message when no pinned changes', () => {
    expect(formatPinnedDiff([])).toBe('No changes to pinned routes.');
  });
});
