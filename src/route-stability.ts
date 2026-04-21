import { RouteChange } from './differ';

export interface RouteStabilityEntry {
  path: string;
  changeCount: number;
  firstSeen: string;
  lastChanged: string;
  stabilityScore: number;
  label: 'stable' | 'volatile' | 'unstable';
}

export interface StabilityReport {
  entries: RouteStabilityEntry[];
  averageScore: number;
  mostVolatile: RouteStabilityEntry[];
  mostStable: RouteStabilityEntry[];
}

export function classifyStability(score: number): 'stable' | 'volatile' | 'unstable' {
  if (score >= 75) return 'stable';
  if (score >= 40) return 'volatile';
  return 'unstable';
}

export function computeStabilityScore(changeCount: number, ageInDays: number): number {
  if (ageInDays === 0) return 100;
  const changesPerDay = changeCount / ageInDays;
  const raw = Math.max(0, 100 - changesPerDay * 50);
  return Math.round(raw);
}

export function buildStabilityReport(
  history: Array<{ date: string; changes: RouteChange[] }>
): StabilityReport {
  const counts: Record<string, { count: number; first: string; last: string }> = {};

  for (const entry of history) {
    for (const change of entry.changes) {
      const key = change.path;
      if (!counts[key]) {
        counts[key] = { count: 0, first: entry.date, last: entry.date };
      }
      counts[key].count += 1;
      if (entry.date > counts[key].last) counts[key].last = entry.date;
      if (entry.date < counts[key].first) counts[key].first = entry.date;
    }
  }

  const entries: RouteStabilityEntry[] = Object.entries(counts).map(([path, data]) => {
    const firstMs = new Date(data.first).getTime();
    const lastMs = new Date(data.last).getTime();
    const ageInDays = Math.max(1, Math.round((lastMs - firstMs) / 86400000));
    const stabilityScore = computeStabilityScore(data.count, ageInDays);
    return {
      path,
      changeCount: data.count,
      firstSeen: data.first,
      lastChanged: data.last,
      stabilityScore,
      label: classifyStability(stabilityScore),
    };
  });

  entries.sort((a, b) => a.stabilityScore - b.stabilityScore);

  const averageScore =
    entries.length > 0
      ? Math.round(entries.reduce((s, e) => s + e.stabilityScore, 0) / entries.length)
      : 100;

  return {
    entries,
    averageScore,
    mostVolatile: entries.slice(0, 3),
    mostStable: entries.slice(-3).reverse(),
  };
}

export function formatStabilityReport(report: StabilityReport): string {
  const lines: string[] = ['Route Stability Report', '======================'];
  lines.push(`Average Stability Score: ${report.averageScore}`);
  lines.push('');
  lines.push('All Routes:');
  for (const e of report.entries) {
    lines.push(`  ${e.label.toUpperCase().padEnd(10)} ${e.path} (score: ${e.stabilityScore}, changes: ${e.changeCount})`);
  }
  lines.push('');
  lines.push('Most Volatile:');
  for (const e of report.mostVolatile) {
    lines.push(`  ${e.path} — ${e.changeCount} changes`);
  }
  return lines.join('\n');
}
