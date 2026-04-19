import { buildRouteMap, formatRouteMap } from './route-map';
import { RouteInfo } from './scanner';

const routes: RouteInfo[] = [
  { path: '/api/users', methods: ['GET', 'POST'] },
  { path: '/api/users/[id]', methods: ['GET', 'PUT', 'DELETE'] },
  { path: '/api/posts', methods: ['GET'] },
  { path: '/api/posts/[id]/comments', methods: ['GET', 'POST'] },
];

describe('buildRouteMap', () => {
  it('builds a tree from flat routes', () => {
    const root = buildRouteMap(routes);
    expect(root.children['api']).toBeDefined();
    expect(root.children['api'].children['users']).toBeDefined();
    expect(root.children['api'].children['users'].methods).toEqual(['GET', 'POST']);
  });

  it('nests deep routes correctly', () => {
    const root = buildRouteMap(routes);
    const comments = root.children['api'].children['posts'].children['[id]'].children['comments'];
    expect(comments).toBeDefined();
    expect(comments.methods).toEqual(['GET', 'POST']);
  });

  it('returns empty root for empty input', () => {
    const root = buildRouteMap([]);
    expect(Object.keys(root.children)).toHaveLength(0);
  });

  it('handles top-level routes', () => {
    const root = buildRouteMap([{ path: '/health', methods: ['GET'] }]);
    expect(root.children['health'].methods).toEqual(['GET']);
  });
});

describe('formatRouteMap', () => {
  it('renders a tree string', () => {
    const root = buildRouteMap(routes);
    const output = formatRouteMap(root);
    expect(output).toContain('/users');
    expect(output).toContain('[GET, POST]');
    expect(output).toContain('/comments');
  });

  it('sorts children alphabetically', () => {
    const root = buildRouteMap(routes);
    const output = formatRouteMap(root);
    const postsIdx = output.indexOf('/posts');
    const usersIdx = output.indexOf('/users');
    expect(postsIdx).toBeLessThan(usersIdx);
  });
});
