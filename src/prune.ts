import { RouteInfo } from './scanner';

export interface PruneOptions {
  olderThanDays?: number;
  methods?: string[];
  pathPrefixes?: string[];
}

export interface PruneResult {
  kept: RouteInfo[];
  pruned: RouteInfo[];
}

export function pruneByMethods(routes: RouteInfo[], methods: string[]): RouteInfo[] {
  const upper = methods.map(m => m.toUpperCase());
  return routes.filter(r => !r.methods.every(m => upper.includes(m)));
}

export function pruneByPrefixes(routes: RouteInfo[], prefixes: string[]): RouteInfo[] {
  return routes.filter(r => !prefixes.some(p => r.path.startsWith(p)));
}

export function pruneRoutes(routes: RouteInfo[], options: PruneOptions): PruneResult {
  let remaining = [...routes];
  const pruned: RouteInfo[] = [];

  if (options.methods && options.methods.length > 0) {
    const after = pruneByMethods(remaining, options.methods);
    pruned.push(...remaining.filter(r => !after.includes(r)));
    remaining = after;
  }

  if (options.pathPrefixes && options.pathPrefixes.length > 0) {
    const after = pruneByPrefixes(remaining, options.pathPrefixes);
    pruned.push(...remaining.filter(r => !after.includes(r)));
    remaining = after;
  }

  return { kept: remaining, pruned };
}

export function formatPruneResult(result: PruneResult): string {
  const lines: string[] = [];
  lines.push(`Pruned ${result.pruned.length} route(s), kept ${result.kept.length} route(s).`);
  if (result.pruned.length > 0) {
    lines.push('\nPruned routes:');
    for (const r of result.pruned) {
      lines.push(`  - ${r.path} [${r.methods.join(', ')}]`);
    }
  }
  return lines.join('\n');
}
