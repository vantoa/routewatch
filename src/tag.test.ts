import { inferTags, tagRoutes, filterByTag, groupByTag } from './tag';
import { RouteInfo } from './scanner';

function makeRoute(route: string, methods: string[]): RouteInfo {
  return { route, methods, file: `app${route}/route.ts` };
}

describe('inferTags', () => {
  it('tags dynamic routes', () => {
    const tags = inferTags(makeRoute('/users/[id]', ['GET']));
    expect(tags).toContain('dynamic');
  });

  it('tags catch-all routes', () => {
    const tags = inferTags(makeRoute('/docs/[...slug]', ['GET']));
    expect(tags).toContain('catch-all');
    expect(tags).toContain('dynamic');
  });

  it('tags root route', () => {
    const tags = inferTags(makeRoute('/', ['GET']));
    expect(tags).toContain('root');
  });

  it('tags top-level routes', () => {
    const tags = inferTags(makeRoute('/users', ['GET']));
    expect(tags).toContain('top-level');
  });

  it('tags nested routes', () => {
    const tags = inferTags(makeRoute('/api/v1/users', ['GET']));
    expect(tags).toContain('nested');
  });

  it('tags read-only routes', () => {
    const tags = inferTags(makeRoute('/users', ['GET']));
    expect(tags).toContain('read-only');
  });

  it('tags mutating routes', () => {
    const tags = inferTags(makeRoute('/users', ['GET', 'POST']));
    expect(tags).toContain('mutating');
    expect(tags).not.toContain('read-only');
  });
});

describe('tagRoutes', () => {
  it('adds tags to all routes', () => {
    const routes = [makeRoute('/users', ['GET']), makeRoute('/users/[id]', ['PUT', 'DELETE'])];
    const tagged = tagRoutes(routes);
    expect(tagged).toHaveLength(2);
    expect(tagged[0].tags).toBeDefined();
    expect(tagged[1].tags).toContain('dynamic');
  });
});

describe('filterByTag', () => {
  it('filters routes by tag', () => {
    const tagged = tagRoutes([makeRoute('/users', ['GET']), makeRoute('/users/[id]', ['GET'])]);
    const dynamic = filterByTag(tagged, 'dynamic');
    expect(dynamic).toHaveLength(1);
    expect(dynamic[0].route).toBe('/users/[id]');
  });
});

describe('groupByTag', () => {
  it('groups routes by their tags', () => {
    const tagged = tagRoutes([makeRoute('/users', ['GET']), makeRoute('/posts', ['POST'])]);
    const groups = groupByTag(tagged);
    expect(groups['read-only']).toHaveLength(1);
    expect(groups['mutating']).toHaveLength(1);
  });
});
