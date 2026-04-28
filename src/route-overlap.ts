import { RouteInfo } from './scanner';

export interface OverlapEntry {
  pathA: string;
  pathB: string;
  sharedMethods: string[];
  reason: string;
}

export interface OverlapReport {
  entries: OverlapEntry[];
  total: number;
}

function segmentsMatch(a: string, b: string): boolean {
  const partsA = a.split('/');
  const partsB = b.split('/');
  if (partsA.length !== partsB.length) return false;
  return partsA.every((seg, i) => {
    const isDynA = seg.startsWith('[') && seg.endsWith(']');
    const isDynB = partsB[i].startsWith('[') && partsB[i].endsWith(']');
    return isDynA || isDynB || seg === partsB[i];
  });
}

function intersect(a: string[], b: string[]): string[] {
  return a.filter(m => b.includes(m));
}

export function detectOverlaps(routes: RouteInfo[]): OverlapReport {
  const entries: OverlapEntry[] = [];

  for (let i = 0; i < routes.length; i++) {
    for (let j = i + 1; j < routes.length; j++) {
      const a = routes[i];
      const b = routes[j];
      if (a.route === b.route) continue;
      if (!segmentsMatch(a.route, b.route)) continue;
      const shared = intersect(a.methods, b.methods);
      if (shared.length === 0) continue;
      entries.push({
        pathA: a.route,
        pathB: b.route,
        sharedMethods: shared,
        reason: `Both routes match the same URL pattern with methods: ${shared.join(', ')}`,
      });
    }
  }

  return { entries, total: entries.length };
}

export function formatOverlapReport(report: OverlapReport): string {
  if (report.total === 0) return 'No overlapping routes detected.';
  const lines: string[] = [`Route Overlap Report (${report.total} conflict(s)):\n`];
  for (const e of report.entries) {
    lines.push(`  ${e.pathA}  <->  ${e.pathB}`);
    lines.push(`    Methods : ${e.sharedMethods.join(', ')}`);
    lines.push(`    Reason  : ${e.reason}`);
    lines.push('');
  }
  return lines.join('\n').trimEnd();
}
