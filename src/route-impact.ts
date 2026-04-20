import { RouteChange } from './differ';
import { getSeverity } from './severity';

export interface ImpactEntry {
  route: string;
  methods: string[];
  severity: 'breaking' | 'non-breaking' | 'additive';
  score: number;
  reason: string;
}

export interface ImpactReport {
  entries: ImpactEntry[];
  totalScore: number;
  highestSeverity: 'breaking' | 'non-breaking' | 'additive';
}

const SEVERITY_SCORE: Record<string, number> = {
  breaking: 10,
  'non-breaking': 3,
  additive: 1,
};

function reasonFor(change: RouteChange): string {
  if (change.status === 'removed') return 'Route removed — existing clients will break';
  if (change.status === 'added') return 'Route added — no impact on existing clients';
  const lost = (change.oldMethods ?? []).filter(m => !(change.newMethods ?? []).includes(m));
  const gained = (change.newMethods ?? []).filter(m => !(change.oldMethods ?? []).includes(m));
  const parts: string[] = [];
  if (lost.length) parts.push(`methods removed: ${lost.join(', ')}`);
  if (gained.length) parts.push(`methods added: ${gained.join(', ')}`);
  return parts.join('; ') || 'method signature changed';
}

export function assessImpact(changes: RouteChange[]): ImpactReport {
  const entries: ImpactEntry[] = changes.map(change => {
    const severity = getSeverity(change);
    const methods =
      change.status === 'removed'
        ? change.oldMethods ?? []
        : change.newMethods ?? [];
    return {
      route: change.route,
      methods,
      severity,
      score: SEVERITY_SCORE[severity] ?? 1,
      reason: reasonFor(change),
    };
  });

  const totalScore = entries.reduce((sum, e) => sum + e.score, 0);
  const highestSeverity: ImpactEntry['severity'] =
    entries.some(e => e.severity === 'breaking')
      ? 'breaking'
      : entries.some(e => e.severity === 'non-breaking')
      ? 'non-breaking'
      : 'additive';

  return { entries, totalScore, highestSeverity };
}

export function formatImpactReport(report: ImpactReport): string {
  const lines: string[] = [
    `Impact Report (total score: ${report.totalScore}, highest: ${report.highestSeverity})`,
    '',
  ];
  for (const e of report.entries) {
    lines.push(`  [${e.severity.toUpperCase()}] ${e.route} [${e.methods.join(', ')}]`);
    lines.push(`    → ${e.reason}`);
  }
  return lines.join('\n');
}
