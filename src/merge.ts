import { RouteInfo } from './scanner';

export interface MergeOptions {
  preferLeft?: boolean;
  dedupe?: boolean;
}

export interface MergeResult {
  routes: RouteInfo[];
  conflicts: Array<{ path: string; left: string[]; right: string[] }>;
}

export function mergeRoutes(
  left: RouteInfo[],
  right: RouteInfo[],
  options: MergeOptions = {}
): MergeResult {
  const { preferLeft = true, dedupe = true } = options;
  const map = new Map<string, RouteInfo>();
  const conflicts: MergeResult['conflicts'] = [];

  for (const route of left) {
    map.set(route.path, { ...route });
  }

  for (const route of right) {
    if (map.has(route.path)) {
      const existing = map.get(route.path)!;
      const leftMethods = existing.methods;
      const rightMethods = route.methods;
      const same =
        leftMethods.length === rightMethods.length &&
        leftMethods.every((m) => rightMethods.includes(m));
      if (!same) {
        conflicts.push({ path: route.path, left: leftMethods, right: rightMethods });
        if (!preferLeft) {
          map.set(route.path, { ...route });
        }
      }
    } else {
      map.set(route.path, { ...route });
    }
  }

  let routes = Array.from(map.values());

  if (dedupe) {
    const seen = new Set<string>();
    routes = routes.filter((r) => {
      if (seen.has(r.path)) return false;
      seen.add(r.path);
      return true;
    });
  }

  return { routes, conflicts };
}

export function formatMergeResult(result: MergeResult): string {
  const lines: string[] = [];
  lines.push(`Merged routes: ${result.routes.length}`);
  if (result.conflicts.length > 0) {
    lines.push(`Conflicts (${result.conflicts.length}):`);
    for (const c of result.conflicts) {
      lines.push(`  ${c.path}: [${c.left.join(',')}] vs [${c.right.join(',')}]`);
    }
  } else {
    lines.push('No conflicts.');
  }
  return lines.join('\n');
}
