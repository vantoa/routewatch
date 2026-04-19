import { RouteChange } from './differ';
import { tagRoutes, TaggedRoute } from './tag';
import { RouteInfo } from './scanner';

export interface RouteNode {
  path: string;
  methods: string[];
  tags: string[];
  status: 'added' | 'removed' | 'modified' | 'unchanged';
}

export interface RouteGraph {
  nodes: RouteNode[];
  edges: Array<{ from: string; to: string; relation: 'prefix' | 'sibling' }>;
}

function sharedPrefix(a: string, b: string): string {
  const pa = a.split('/');
  const pb = b.split('/');
  const shared: string[] = [];
  for (let i = 0; i < Math.min(pa.length, pb.length); i++) {
    if (pa[i] === pb[i]) shared.push(pa[i]);
    else break;
  }
  return shared.join('/');
}

export function buildRouteGraph(
  routes: RouteInfo[],
  changes: RouteChange[]
): RouteGraph {
  const changeMap = new Map<string, RouteChange['type']>();
  for (const c of changes) {
    changeMap.set(c.route, c.type);
  }

  const tagged = tagRoutes(routes);
  const nodes: RouteNode[] = tagged.map((r: TaggedRoute) => ({
    path: r.route,
    methods: r.methods,
    tags: r.tags,
    status: (changeMap.get(r.route) as RouteNode['status']) ?? 'unchanged',
  }));

  const edges: RouteGraph['edges'] = [];
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const prefix = sharedPrefix(nodes[i].path, nodes[j].path);
      if (prefix.length > 1) {
        const relation =
          nodes[i].path.startsWith(nodes[j].path) ||
          nodes[j].path.startsWith(nodes[i].path)
            ? 'prefix'
            : 'sibling';
        edges.push({ from: nodes[i].path, to: nodes[j].path, relation });
      }
    }
  }

  return { nodes, edges };
}

export function formatGraph(graph: RouteGraph): string {
  const lines: string[] = ['Route Graph:', ''];
  for (const node of graph.nodes) {
    const marker =
      node.status === 'added' ? '+' :
      node.status === 'removed' ? '-' :
      node.status === 'modified' ? '~' : ' ';
    lines.push(`  [${marker}] ${node.path} (${node.methods.join(', ')}) [${node.tags.join(', ')}]`);
  }
  lines.push('');
  lines.push(`Edges: ${graph.edges.length}`);
  for (const e of graph.edges) {
    lines.push(`  ${e.from} --${e.relation}--> ${e.to}`);
  }
  return lines.join('\n');
}
