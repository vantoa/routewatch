import { mergeRoutes, formatMergeResult } from './merge';
import { RouteInfo } from './scanner';

const r = (path: string, methods: string[]): RouteInfo => ({ path, methods });

describe('mergeRoutes', () => {
  it('combines disjoint route sets', () => {
    const left = [r('/api/users', ['GET']), r('/api/posts', ['GET', 'POST'])];
    const right = [r('/api/comments', ['GET'])];
    const { routes, conflicts } = mergeRoutes(left, right);
    expect(routes).toHaveLength(3);
    expect(conflicts).toHaveLength(0);
  });

  it('prefers left on conflict by default', () => {
    const left = [r('/api/users', ['GET'])];
    const right = [r('/api/users', ['GET', 'POST'])];
    const { routes, conflicts } = mergeRoutes(left, right);
    expect(routes).toHaveLength(1);
    expect(routes[0].methods).toEqual(['GET']);
    expect(conflicts).toHaveLength(1);
    expect(conflicts[0].path).toBe('/api/users');
  });

  it('prefers right when preferLeft=false', () => {
    const left = [r('/api/users', ['GET'])];
    const right = [r('/api/users', ['GET', 'POST'])];
    const { routes } = mergeRoutes(left, right, { preferLeft: false });
    expect(routes[0].methods).toEqual(['GET', 'POST']);
  });

  it('dedupes identical routes', () => {
    const left = [r('/api/users', ['GET']), r('/api/users', ['GET'])];
    const right: RouteInfo[] = [];
    const { routes } = mergeRoutes(left, right);
    expect(routes).toHaveLength(1);
  });

  it('returns no conflicts for matching methods', () => {
    const left = [r('/api/users', ['GET', 'POST'])];
    const right = [r('/api/users', ['GET', 'POST'])];
    const { conflicts } = mergeRoutes(left, right);
    expect(conflicts).toHaveLength(0);
  });
});

describe('formatMergeResult', () => {
  it('shows no conflicts message', () => {
    const result = mergeRoutes([r('/a', ['GET'])], [r('/b', ['POST'])]);
    const out = formatMergeResult(result);
    expect(out).toContain('Merged routes: 2');
    expect(out).toContain('No conflicts.');
  });

  it('lists conflicts', () => {
    const result = mergeRoutes([r('/a', ['GET'])], [r('/a', ['POST'])]);
    const out = formatMergeResult(result);
    expect(out).toContain('Conflicts (1)');
    expect(out).toContain('/a');
  });
});
