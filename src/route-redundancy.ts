import { RouteInfo } from './scanner';

export interface RedundancyPair {
  a: RouteInfo;
  b: RouteInfo;
  reason: string;
  score: number;
}

export interface RedundancyReport {
  pairs: RedundancyPair[];
  totalRoutes: number;
  redundantRoutes: number;
}

function normalizePath(path: string): string {
  return path.replace(/\[.*?\]/g, ':param').replace(/\/+/g, '/').toLowerCase();
}

function methodOverlap(a: string[], b: string[]): number {
  const setA = new Set(a.map(m => m.toUpperCase()));
  const shared = b.filter(m => setA.has(m.toUpperCase()));
  return shared.length / Math.max(setA.size, b.length);
}

function isSameNormalized(a: RouteInfo, b: RouteInfo): boolean {
  return normalizePath(a.path) === normalizePath(b.path);
}

function isSubpath(a: RouteInfo, b: RouteInfo): boolean {
  const na = normalizePath(a.path);
  const nb = normalizePath(b.path);
  return na !== nb && (nb.startsWith(na + '/') || na.startsWith(nb + '/'));
}

export function detectRedundancy(routes: RouteInfo[]): RedundancyPair[] {
  const pairs: RedundancyPair[] = [];

  for (let i = 0; i < routes.length; i++) {
    for (let j = i + 1; j < routes.length; j++) {
      const a = routes[i];
      const b = routes[j];
      const overlap = methodOverlap(a.methods, b.methods);

      if (isSameNormalized(a, b) && overlap > 0) {
        pairs.push({
          a,
          b,
          reason: 'Duplicate normalized path with overlapping methods',
          score: overlap,
        });
      } else if (isSubpath(a, b) && overlap >= 0.75) {
        pairs.push({
          a,
          b,
          reason: 'Subpath relationship with high method overlap',
          score: overlap * 0.6,
        });
      }
    }
  }

  return pairs.sort((x, y) => y.score - x.score);
}

export function buildRedundancyReport(routes: RouteInfo[]): RedundancyReport {
  const pairs = detectRedundancy(routes);
  const redundant = new Set<string>();
  pairs.forEach(p => {
    redundant.add(p.a.path);
    redundant.add(p.b.path);
  });
  return { pairs, totalRoutes: routes.length, redundantRoutes: redundant.size };
}

export function formatRedundancyReport(report: RedundancyReport): string {
  const lines: string[] = [];
  lines.push(`Route Redundancy Report`);
  lines.push(`Total routes: ${report.totalRoutes}  Redundant: ${report.redundantRoutes}`);
  lines.push('');
  if (report.pairs.length === 0) {
    lines.push('No redundant routes detected.');
    return lines.join('\n');
  }
  for (const p of report.pairs) {
    lines.push(`[score: ${p.score.toFixed(2)}] ${p.reason}`);
    lines.push(`  A: ${p.a.path} [${p.a.methods.join(', ')}]`);
    lines.push(`  B: ${p.b.path} [${p.b.methods.join(', ')}]`);
  }
  return lines.join('\n');
}
