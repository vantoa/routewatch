import { RouteInfo } from './scanner';
import { ChangeRecord } from './differ';

export type MaturityLevel = 'experimental' | 'beta' | 'stable' | 'deprecated';

export interface RouteMaturity {
  route: string;
  methods: string[];
  level: MaturityLevel;
  score: number;
  reasons: string[];
}

export interface MaturityReport {
  routes: RouteMaturity[];
  summary: Record<MaturityLevel, number>;
}

const DYNAMIC_SEGMENT = /\[.*?\]/;
const CATCH_ALL = /\[\.\.\./;

export function scoreMaturity(
  route: RouteInfo,
  changes: ChangeRecord[]
): { score: number; reasons: string[] } {
  let score = 100;
  const reasons: string[] = [];

  const routeChanges = changes.filter(c => c.route === route.route);
  if (routeChanges.length > 5) {
    score -= 30;
    reasons.push(`High churn: ${routeChanges.length} changes recorded`);
  } else if (routeChanges.length > 2) {
    score -= 15;
    reasons.push(`Moderate churn: ${routeChanges.length} changes recorded`);
  }

  if (CATCH_ALL.test(route.route)) {
    score -= 20;
    reasons.push('Uses catch-all segment');
  } else if (DYNAMIC_SEGMENT.test(route.route)) {
    score -= 10;
    reasons.push('Uses dynamic segment');
  }

  if (route.methods.length === 0) {
    score -= 25;
    reasons.push('No HTTP methods defined');
  }

  const hasRemoved = routeChanges.some(c => c.type === 'removed');
  if (hasRemoved) {
    score -= 40;
    reasons.push('Route was previously removed');
  }

  return { score: Math.max(0, score), reasons };
}

export function classifyMaturity(score: number): MaturityLevel {
  if (score >= 85) return 'stable';
  if (score >= 60) return 'beta';
  if (score >= 30) return 'experimental';
  return 'deprecated';
}

export function computeMaturity(
  routes: RouteInfo[],
  changes: ChangeRecord[]
): MaturityReport {
  const summary: Record<MaturityLevel, number> = {
    experimental: 0,
    beta: 0,
    stable: 0,
    deprecated: 0,
  };

  const routeMaturity: RouteMaturity[] = routes.map(route => {
    const { score, reasons } = scoreMaturity(route, changes);
    const level = classifyMaturity(score);
    summary[level]++;
    return { route: route.route, methods: route.methods, level, score, reasons };
  });

  return { routes: routeMaturity, summary };
}

export function formatMaturityReport(report: MaturityReport): string {
  const lines: string[] = ['Route Maturity Report', '='.repeat(40)];

  const order: MaturityLevel[] = ['stable', 'beta', 'experimental', 'deprecated'];
  for (const level of order) {
    const group = report.routes.filter(r => r.level === level);
    if (group.length === 0) continue;
    lines.push(`\n${level.toUpperCase()} (${group.length})`);
    for (const r of group) {
      lines.push(`  ${r.route} [${r.methods.join(', ')}] — score: ${r.score}`);
      for (const reason of r.reasons) {
        lines.push(`    • ${reason}`);
      }
    }
  }

  lines.push('\nSummary:');
  for (const level of order) {
    lines.push(`  ${level}: ${report.summary[level]}`);
  }

  return lines.join('\n');
}
