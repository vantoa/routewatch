import { RouteInfo } from './scanner';

export interface RouteMapNode {
  path: string;
  methods: string[];
  children: Record<string, RouteMapNode>;
}

export function buildRouteMap(routes: RouteInfo[]): RouteMapNode {
  const root: RouteMapNode = { path: '', methods: [], children: {} };

  for (const route of routes) {
    const segments = route.path.replace(/^\//, '').split('/');
    let node = root;

    for (const segment of segments) {
      if (!node.children[segment]) {
        node.children[segment] = {
          path: segment,
          methods: [],
          children: {},
        };
      }
      node = node.children[segment];
    }

    node.methods = route.methods;
  }

  return root;
}

function renderNode(node: RouteMapNode, prefix: string, indent: number): string[] {
  const lines: string[] = [];
  const pad = '  '.repeat(indent);
  const label = prefix || '/';
  const methods = node.methods.length ? ` [${node.methods.join(', ')}]` : '';

  if (indent === 0) {
    lines.push(`${label}`);
  } else {
    lines.push(`${pad}/${node.path}${methods}`);
  }

  for (const key of Object.keys(node.children).sort()) {
    lines.push(...renderNode(node.children[key], key, indent + 1));
  }

  return lines;
}

export function formatRouteMap(root: RouteMapNode): string {
  return renderNode(root, '/', 0).join('\n');
}
