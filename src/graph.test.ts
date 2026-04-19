import { buildRouteGraph, formatGraph } from './graph';
import { RouteInfo } from './scanner';
import { RouteChange } from './differ';

const routes: RouteInfo[] = [
  { route: '/api/users', methods: ['GET', 'POST'] },
  { route: '/api/users/[id]', methods: ['GET', 'PUT', 'DELETE'] },
  { route: '/api/posts', methods: ['GET'] },
];

const changes: RouteChange[] = [
  { route: '/api/users', type: 'modified', before: ['GET'], after: ['GET', 'POST'] },
  { route: '/api/posts', type: 'added', before: [], after: ['GET'] },
];

describe('buildRouteGraph', () => {
  it('creates a node for each route', () => {
    const graph = buildRouteGraph(routes, changes);
    expect(graph.nodes).toHaveLength(3);
  });

  it('assigns correct status from changes', () => {
    const graph = buildRouteGraph(routes, changes);
    const users = graph.nodes.find(n => n.path === '/api/users');
    const posts = graph.nodes.find(n => n.path === '/api/posts');
    const userId = graph.nodes.find(n => n.path === '/api/users/[id]');
    expect(users?.status).toBe('modified');
    expect(posts?.status).toBe('added');
    expect(userId?.status).toBe('unchanged');
  });

  it('creates prefix edges for nested routes', () => {
    const graph = buildRouteGraph(routes, changes);
    const prefixEdges = graph.edges.filter(e => e.relation === 'prefix');
    expect(prefixEdges.length).toBeGreaterThan(0);
  });

  it('creates sibling edges for same-level routes', () => {
    const graph = buildRouteGraph(routes, changes);
    const siblingEdges = graph.edges.filter(e => e.relation === 'sibling');
    expect(siblingEdges.length).toBeGreaterThan(0);
  });

  it('includes tags on nodes', () => {
    const graph = buildRouteGraph(routes, changes);
    for (const node of graph.nodes) {
      expect(Array.isArray(node.tags)).toBe(true);
    }
  });
});

describe('formatGraph', () => {
  it('returns a non-empty string', () => {
    const graph = buildRouteGraph(routes, changes);
    const output = formatGraph(graph);
    expect(typeof output).toBe('string');
    expect(output).toContain('Route Graph');
  });

  it('marks added routes with +', () => {
    const graph = buildRouteGraph(routes, changes);
    const output = formatGraph(graph);
    expect(output).toContain('[+]');
  });

  it('marks modified routes with ~', () => {
    const graph = buildRouteGraph(routes, changes);
    const output = formatGraph(graph);
    expect(output).toContain('[~]');
  });
});
