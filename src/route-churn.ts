import { RouteChange } from './differ';

export interface ChurnEntry {
  path: string;
  changes: number;
  added: number;
  removed: number;
  modified: number;
  churnScore: number;
}

export interface ChurnReport {
  entries: ChurnEntry[];
  totalChurn: number;
  mostChurned: ChurnEntry | null;
}

export function buildChurnReport(changeSets: RouteChange[][]): ChurnReport {
  const counts: Record<string, ChurnEntry> = {};

  for (const changes of changeSets) {
    for (const change of changes) {
      const key = change.path;
      if (!counts[key]) {
        counts[key] = { path: key, changes: 0, added: 0, removed: 0, modified: 0, churnScore: 0 };
      }
      counts[key].changes++;
      if (change.status === 'added') counts[key].added++;
      else if (change.status === 'removed') counts[key].removed++;
      else if (change.status === 'modified') counts[key].modified++;
    }
  }

  const entries = Object.values(counts).map(entry => ({
    ...entry,
    churnScore: entry.added * 1 + entry.removed * 2 + entry.modified * 1.5,
  }));

  entries.sort((a, b) => b.churnScore - a.churnScore);

  const totalChurn = entries.reduce((sum, e) => sum + e.churnScore, 0);
  const mostChurned = entries[0] ?? null;

  return { entries, totalChurn, mostChurned };
}

export function formatChurnReport(report: ChurnReport): string {
  if (report.entries.length === 0) return 'No churn data available.';

  const lines: string[] = ['Route Churn Report', '=================='];

  for (const entry of report.entries) {
    lines.push(
      `${entry.path}  score=${entry.churnScore.toFixed(1)}` +
      `  changes=${entry.changes} (+${entry.added} -${entry.removed} ~${entry.modified})`
    );
  }

  lines.push('');
  lines.push(`Total churn score: ${report.totalChurn.toFixed(1)}`);
  if (report.mostChurned) {
    lines.push(`Most churned: ${report.mostChurned.path}`);
  }

  return lines.join('\n');
}
