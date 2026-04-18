import { DiffResult } from './differ';
import { computeStats } from './stats';
import { hasBreakingChanges, classifyChanges } from './severity';

export interface SummaryReport {
  totalRoutes: number;
  added: number;
  removed: number;
  modified: number;
  breaking: boolean;
  severityCounts: Record<string, number>;
  topChanged: string[];
}

export function generateSummary(diff: DiffResult[]): SummaryReport {
  const stats = computeStats(diff);
  const classified = classifyChanges(diff);

  const severityCounts: Record<string, number> = {};
  for (const c of classified) {
    severityCounts[c.severity] = (severityCounts[c.severity] ?? 0) + 1;
  }

  const topChanged = diff
    .filter(d => d.type === 'modified')
    .slice(0, 5)
    .map(d => d.route);

  return {
    totalRoutes: stats.totalRoutes,
    added: stats.added,
    removed: stats.removed,
    modified: stats.modified,
    breaking: hasBreakingChanges(diff),
    severityCounts,
    topChanged,
  };
}

export function formatSummary(summary: SummaryReport): string {
  const lines: string[] = [];
  lines.push('=== Route Summary ===');
  lines.push(`Total routes: ${summary.totalRoutes}`);
  lines.push(`Added: ${summary.added}  Removed: ${summary.removed}  Modified: ${summary.modified}`);
  lines.push(`Breaking changes: ${summary.breaking ? 'YES' : 'No'}`);
  if (Object.keys(summary.severityCounts).length > 0) {
    lines.push('Severity breakdown:');
    for (const [sev, count] of Object.entries(summary.severityCounts)) {
      lines.push(`  ${sev}: ${count}`);
    }
  }
  if (summary.topChanged.length > 0) {
    lines.push('Top modified routes:');
    for (const r of summary.topChanged) {
      lines.push(`  - ${r}`);
    }
  }
  return lines.join('\n');
}
