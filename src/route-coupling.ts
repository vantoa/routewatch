import { RouteInfo } from './scanner';

export interface CouplingPair {
  routeA: string;
  routeB: string;
  sharedSegments: number;
  sharedMethods: number;
  score: number;
}

export interface CouplingReport {
  pairs: CouplingPair[];
  stronglyCoupled: CouplingPair[];
  threshold: number;
}

function getSegments(path: string): string[] {
  return path.split('/').filter(Boolean);
}

function countSharedSegments(a: string, b: string): number {
  const segsA = getSegments(a);
  const segsB = getSegments(b);
  const setB = new Set(segsB);
  return segsA.filter(s => setB.has(s) && !s.startsWith('[')).length;
}

function countSharedMethods(a: RouteInfo, b: RouteInfo): number {
  const setB = new Set(b.methods);
  return a.methods.filter(m => setB.has(m)).length;
}

export function computeCoupling(
  routes: RouteInfo[],
  threshold = 0.5
): CouplingReport {
  const pairs: CouplingPair[] = [];

  for (let i = 0; i < routes.length; i++) {
    for (let j = i + 1; j < routes.length; j++) {
      const a = routes[i];
      const b = routes[j];
      const sharedSegments = countSharedSegments(a.route, b.route);
      const sharedMethods = countSharedMethods(a, b);
      const maxSegs = Math.max(
        getSegments(a.route).length,
        getSegments(b.route).length,
        1
      );
      const maxMethods = Math.max(a.methods.length, b.methods.length, 1);
      const score =
        (sharedSegments / maxSegs) * 0.6 +
        (sharedMethods / maxMethods) * 0.4;

      if (score > 0) {
        pairs.push({ routeA: a.route, routeB: b.route, sharedSegments, sharedMethods, score });
      }
    }
  }

  pairs.sort((a, b) => b.score - a.score);
  const stronglyCoupled = pairs.filter(p => p.score >= threshold);

  return { pairs, stronglyCoupled, threshold };
}

export function formatCouplingReport(report: CouplingReport): string {
  const lines: string[] = [
    `Route Coupling Report (threshold: ${report.threshold})`,
    `Total pairs analysed: ${report.pairs.length}`,
    `Strongly coupled pairs: ${report.stronglyCoupled.length}`,
    '',
  ];

  if (report.stronglyCoupled.length === 0) {
    lines.push('No strongly coupled routes found.');
  } else {
    for (const p of report.stronglyCoupled) {
      lines.push(
        `  [${p.score.toFixed(2)}] ${p.routeA}  <-->  ${p.routeB}` +
          `  (segments: ${p.sharedSegments}, methods: ${p.sharedMethods})`
      );
    }
  }

  return lines.join('\n');
}
