import { RouteChange } from './differ';

export interface VelocityEntry {
  route: string;
  changesPerDay: number;
  totalChanges: number;
  firstSeen: Date;
  lastSeen: Date;
  trend: 'accelerating' | 'steady' | 'decelerating' | 'idle';
}

export interface VelocityReport {
  entries: VelocityEntry[];
  averageVelocity: number;
  fastestRoute: string | null;
  slowestRoute: string | null;
}

function daysBetween(a: Date, b: Date): number {
  const ms = Math.abs(b.getTime() - a.getTime());
  return Math.max(1, Math.round(ms / (1000 * 60 * 60 * 24)));
}

function classifyTrend(
  changesPerDay: number,
  average: number
): VelocityEntry['trend'] {
  if (changesPerDay === 0) return 'idle';
  if (changesPerDay > average * 1.5) return 'accelerating';
  if (changesPerDay < average * 0.5) return 'decelerating';
  return 'steady';
}

export function buildVelocityReport(
  history: Array<{ changes: RouteChange[]; date: Date }>
): VelocityReport {
  const routeMap = new Map<
    string,
    { count: number; first: Date; last: Date }
  >();

  for (const { changes, date } of history) {
    for (const change of changes) {
      const key = change.route;
      const existing = routeMap.get(key);
      if (!existing) {
        routeMap.set(key, { count: 1, first: date, last: date });
      } else {
        existing.count += 1;
        if (date < existing.first) existing.first = date;
        if (date > existing.last) existing.last = date;
      }
    }
  }

  const entries: VelocityEntry[] = [];
  for (const [route, { count, first, last }] of routeMap) {
    const days = daysBetween(first, last);
    entries.push({
      route,
      changesPerDay: parseFloat((count / days).toFixed(3)),
      totalChanges: count,
      firstSeen: first,
      lastSeen: last,
      trend: 'steady',
    });
  }

  const avg =
    entries.length > 0
      ? entries.reduce((s, e) => s + e.changesPerDay, 0) / entries.length
      : 0;

  for (const entry of entries) {
    entry.trend = classifyTrend(entry.changesPerDay, avg);
  }

  entries.sort((a, b) => b.changesPerDay - a.changesPerDay);

  return {
    entries,
    averageVelocity: parseFloat(avg.toFixed(3)),
    fastestRoute: entries[0]?.route ?? null,
    slowestRoute: entries[entries.length - 1]?.route ?? null,
  };
}

export function formatVelocityReport(report: VelocityReport): string {
  const lines: string[] = ['Route Velocity Report', '='.repeat(40)];
  lines.push(
    `Average velocity: ${report.averageVelocity} changes/day`,
    `Fastest: ${report.fastestRoute ?? 'N/A'}`,
    `Slowest: ${report.slowestRoute ?? 'N/A'}`,
    ''
  );
  for (const e of report.entries) {
    lines.push(
      `${e.route}  [${e.trend}]  ${e.changesPerDay}/day  (${e.totalChanges} total)`
    );
  }
  return lines.join('\n');
}
