import { RouteInfo } from './scanner';

export interface ComplexityScore {
  route: string;
  segments: number;
  dynamicSegments: number;
  catchAll: boolean;
  optionalCatchAll: boolean;
  methodCount: number;
  score: number;
}

export interface ComplexityReport {
  routes: ComplexityScore[];
  averageScore: number;
  maxScore: number;
  minScore: number;
  mostComplex: ComplexityScore | null;
}

export function scoreRoute(route: RouteInfo): ComplexityScore {
  const parts = route.path.split('/').filter(Boolean);
  const dynamicSegments = parts.filter(p => p.startsWith('[') && !p.startsWith('[...')).length;
  const catchAll = parts.some(p => p.startsWith('[...') && !p.startsWith('[[...'));
  const optionalCatchAll = parts.some(p => p.startsWith('[[...'));
  const methodCount = route.methods.length;

  const score =
    parts.length * 1 +
    dynamicSegments * 2 +
    (catchAll ? 4 : 0) +
    (optionalCatchAll ? 6 : 0) +
    methodCount * 0.5;

  return {
    route: route.path,
    segments: parts.length,
    dynamicSegments,
    catchAll,
    optionalCatchAll,
    methodCount,
    score: Math.round(score * 10) / 10,
  };
}

export function computeComplexity(routes: RouteInfo[]): ComplexityReport {
  const scored = routes.map(scoreRoute);
  if (scored.length === 0) {
    return { routes: [], averageScore: 0, maxScore: 0, minScore: 0, mostComplex: null };
  }
  const scores = scored.map(s => s.score);
  const averageScore = Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10;
  const maxScore = Math.max(...scores);
  const minScore = Math.min(...scores);
  const mostComplex = scored.find(s => s.score === maxScore) ?? null;
  return { routes: scored, averageScore, maxScore, minScore, mostComplex };
}

export function formatComplexityReport(report: ComplexityReport): string {
  const lines: string[] = ['Route Complexity Report', '======================='];
  if (report.routes.length === 0) {
    lines.push('No routes found.');
    return lines.join('\n');
  }
  lines.push(`Average Score : ${report.averageScore}`);
  lines.push(`Max Score     : ${report.maxScore}`);
  lines.push(`Min Score     : ${report.minScore}`);
  if (report.mostComplex) {
    lines.push(`Most Complex  : ${report.mostComplex.route} (score: ${report.mostComplex.score})`);
  }
  lines.push('');
  const sorted = [...report.routes].sort((a, b) => b.score - a.score);
  for (const r of sorted) {
    lines.push(`  ${r.route.padEnd(40)} score=${r.score}  methods=${r.methodCount}  dynamic=${r.dynamicSegments}`);
  }
  return lines.join('\n');
}

/**
 * Returns all routes whose complexity score exceeds the given threshold.
 * Useful for flagging overly complex routes in CI or lint checks.
 */
export function getRoutesAboveThreshold(
  report: ComplexityReport,
  threshold: number
): ComplexityScore[] {
  return report.routes.filter(r => r.score > threshold);
}
