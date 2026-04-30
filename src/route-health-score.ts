import { RouteInfo } from './scanner';
import { RouteChange } from './differ';

export interface RouteHealthScore {
  path: string;
  score: number;
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  factors: {
    stability: number;
    complexity: number;
    coverage: number;
    naming: number;
  };
  suggestions: string[];
}

export interface HealthScoreReport {
  routes: RouteHealthScore[];
  average: number;
  distribution: Record<string, number>;
}

export function deriveGrade(score: number): 'A' | 'B' | 'C' | 'D' | 'F' {
  if (score >= 90) return 'A';
  if (score >= 75) return 'B';
  if (score >= 60) return 'C';
  if (score >= 45) return 'D';
  return 'F';
}

export function scoreRouteHealth(
  route: RouteInfo,
  changes: RouteChange[]
): RouteHealthScore {
  const suggestions: string[] = [];
  const segments = route.path.split('/').filter(Boolean);

  const depthPenalty = Math.max(0, segments.length - 4) * 5;
  const complexityScore = Math.max(0, 100 - depthPenalty);

  const dynamicCount = segments.filter(s => s.startsWith('[')).length;
  const namingScore = dynamicCount > 2 ? 60 : dynamicCount === 2 ? 80 : 100;
  if (dynamicCount > 2) suggestions.push('Too many dynamic segments; consider flattening the route.');

  const routeChanges = changes.filter(c => c.path === route.path);
  const stabilityScore = Math.max(0, 100 - routeChanges.length * 10);
  if (routeChanges.length > 5) suggestions.push('Route has changed frequently; consider stabilizing its contract.');

  const methodCount = route.methods.length;
  const coverageScore = methodCount === 0 ? 50 : Math.min(100, methodCount * 20);
  if (methodCount === 0) suggestions.push('No HTTP methods detected.');

  const score = Math.round(
    (complexityScore * 0.25 + namingScore * 0.25 + stabilityScore * 0.3 + coverageScore * 0.2)
  );

  return {
    path: route.path,
    score,
    grade: deriveGrade(score),
    factors: {
      stability: stabilityScore,
      complexity: complexityScore,
      coverage: coverageScore,
      naming: namingScore,
    },
    suggestions,
  };
}

export function buildHealthScoreReport(
  routes: RouteInfo[],
  changes: RouteChange[]
): HealthScoreReport {
  const scored = routes.map(r => scoreRouteHealth(r, changes));
  const average = scored.length
    ? Math.round(scored.reduce((s, r) => s + r.score, 0) / scored.length)
    : 0;
  const distribution: Record<string, number> = { A: 0, B: 0, C: 0, D: 0, F: 0 };
  for (const r of scored) distribution[r.grade]++;
  return { routes: scored, average, distribution };
}

export function formatHealthScoreReport(report: HealthScoreReport): string {
  const lines: string[] = ['Route Health Scores', '==================='];
  lines.push(`Average Score: ${report.average}`);
  lines.push(`Distribution: ${Object.entries(report.distribution).map(([g, c]) => `${g}:${c}`).join('  ')}`);
  lines.push('');
  for (const r of report.routes.sort((a, b) => a.score - b.score)) {
    lines.push(`[${r.grade}] ${r.path} (${r.score})`);
    for (const s of r.suggestions) lines.push(`    ⚠ ${s}`);
  }
  return lines.join('\n');
}
