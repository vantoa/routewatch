import { RouteChange } from './differ';
import { computeStats } from './stats';
import { hasBreakingChanges } from './severity';

export interface HealthReport {
  score: number;
  grade: string;
  stable: boolean;
  breaking: boolean;
  added: number;
  removed: number;
  modified: number;
  total: number;
  summary: string;
}

export function computeHealth(changes: RouteChange[]): HealthReport {
  const stats = computeStats(changes);
  const breaking = hasBreakingChanges(changes);
  const total = stats.added + stats.removed + stats.modified;

  let score = 100;
  score -= stats.removed * 10;
  score -= stats.modified * 3;
  score -= breaking ? 20 : 0;
  score = Math.max(0, Math.min(100, score));

  const grade =
    score >= 90 ? 'A' :
    score >= 75 ? 'B' :
    score >= 60 ? 'C' :
    score >= 40 ? 'D' : 'F';

  const stable = !breaking && stats.removed === 0;

  const summary = `Health: ${grade} (${score}/100) — ${total} change(s), breaking: ${breaking}`;

  return {
    score,
    grade,
    stable,
    breaking,
    added: stats.added,
    removed: stats.removed,
    modified: stats.modified,
    total,
    summary,
  };
}

export function formatHealth(report: HealthReport): string {
  const lines: string[] = [
    `API Health Report`,
    `=================`,
    `Grade   : ${report.grade}`,
    `Score   : ${report.score}/100`,
    `Stable  : ${report.stable}`,
    `Breaking: ${report.breaking}`,
    `Added   : ${report.added}`,
    `Removed : ${report.removed}`,
    `Modified: ${report.modified}`,
    ``,
    report.summary,
  ];
  return lines.join('\n');
}
