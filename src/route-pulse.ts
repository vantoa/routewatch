import { RouteChange } from './differ';

export interface PulseEntry {
  path: string;
  changeCount: number;
  firstSeen: string;
  lastSeen: string;
  intervalDays: number | null;
  pulse: 'active' | 'steady' | 'quiet' | 'dormant';
}

export interface PulseReport {
  entries: PulseEntry[];
  generatedAt: string;
}

function daysBetween(a: string, b: string): number {
  return Math.abs(
    (new Date(b).getTime() - new Date(a).getTime()) / (1000 * 60 * 60 * 24)
  );
}

function classifyPulse(changeCount: number, intervalDays: number | null): PulseEntry['pulse'] {
  if (changeCount === 0) return 'dormant';
  if (intervalDays === null) return changeCount >= 5 ? 'active' : 'steady';
  if (intervalDays <= 7) return 'active';
  if (intervalDays <= 30) return 'steady';
  if (intervalDays <= 90) return 'quiet';
  return 'dormant';
}

export function buildPulseReport(
  history: Array<{ changes: RouteChange[]; date: string }>
): PulseReport {
  const pathData = new Map<string, string[]>();

  for (const entry of history) {
    for (const change of entry.changes) {
      const key = change.path;
      if (!pathData.has(key)) pathData.set(key, []);
      pathData.get(key)!.push(entry.date);
    }
  }

  const entries: PulseEntry[] = [];

  for (const [path, dates] of pathData) {
    const sorted = [...dates].sort();
    const firstSeen = sorted[0];
    const lastSeen = sorted[sorted.length - 1];
    const changeCount = sorted.length;
    const intervalDays =
      sorted.length >= 2
        ? daysBetween(sorted[0], sorted[sorted.length - 1]) / (sorted.length - 1)
        : null;
    const pulse = classifyPulse(changeCount, intervalDays);
    entries.push({ path, changeCount, firstSeen, lastSeen, intervalDays, pulse });
  }

  entries.sort((a, b) => b.changeCount - a.changeCount);

  return { entries, generatedAt: new Date().toISOString() };
}

export function formatPulseReport(report: PulseReport): string {
  if (report.entries.length === 0) return 'No pulse data available.';

  const lines: string[] = ['Route Pulse Report', '=================='];
  for (const e of report.entries) {
    const interval = e.intervalDays !== null ? `${e.intervalDays.toFixed(1)}d avg` : 'single event';
    lines.push(
      `[${e.pulse.toUpperCase()}] ${e.path} — ${e.changeCount} changes (${interval}) | ${e.firstSeen} → ${e.lastSeen}`
    );
  }
  return lines.join('\n');
}
