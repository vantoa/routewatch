import { RouteChange } from './differ';
import { ClassifiedChange } from './severity';

export interface RouteRiskEntry {
  path: string;
  methods: string[];
  riskScore: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  factors: string[];
}

export interface RouteRiskReport {
  entries: RouteRiskEntry[];
  summary: { low: number; medium: number; high: number; critical: number };
}

function classifyRiskLevel(score: number): RouteRiskEntry['riskLevel'] {
  if (score >= 80) return 'critical';
  if (score >= 50) return 'high';
  if (score >= 25) return 'medium';
  return 'low';
}

export function computeRisk(
  changes: ClassifiedChange[],
  churnCounts: Record<string, number> = {}
): RouteRiskReport {
  const entries: RouteRiskEntry[] = changes.map((c) => {
    const factors: string[] = [];
    let score = 0;

    if (c.severity === 'breaking') { score += 40; factors.push('breaking change'); }
    if (c.severity === 'warning') { score += 20; factors.push('warning-level change'); }

    const churn = churnCounts[c.change.path] ?? 0;
    if (churn >= 10) { score += 30; factors.push(`high churn (${churn})`); }
    else if (churn >= 5) { score += 15; factors.push(`moderate churn (${churn})`); }

    const segments = c.change.path.split('/').filter(Boolean);
    if (segments.length >= 5) { score += 10; factors.push('deep nesting'); }

    const methods = [
      ...(c.change.addedMethods ?? []),
      ...(c.change.removedMethods ?? []),
      ...(c.change.before?.methods ?? []),
    ];
    const sensitiveMethod = methods.some((m) => ['DELETE', 'PUT', 'PATCH'].includes(m.toUpperCase()));
    if (sensitiveMethod) { score += 10; factors.push('mutating methods'); }

    return {
      path: c.change.path,
      methods,
      riskScore: Math.min(score, 100),
      riskLevel: classifyRiskLevel(score),
      factors,
    };
  });

  entries.sort((a, b) => b.riskScore - a.riskScore);

  const summary = { low: 0, medium: 0, high: 0, critical: 0 };
  for (const e of entries) summary[e.riskLevel]++;

  return { entries, summary };
}

export function formatRiskReport(report: RouteRiskReport): string {
  const lines: string[] = ['Route Risk Report', '================='];
  const { low, medium, high, critical } = report.summary;
  lines.push(`Summary: critical=${critical} high=${high} medium=${medium} low=${low}`, '');
  for (const e of report.entries) {
    lines.push(`[${e.riskLevel.toUpperCase()}] ${e.path} (score: ${e.riskScore})`);
    lines.push(`  Factors: ${e.factors.join(', ') || 'none'}`);
  }
  return lines.join('\n');
}
