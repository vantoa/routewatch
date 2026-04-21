import { RouteInfo } from './scanner';
import { RouteDiff } from './differ';

export interface FreshnessEntry {
  path: string;
  methods: string[];
  lastChanged: string; // ISO date string
  daysSinceChange: number;
  status: 'fresh' | 'stale' | 'aging';
}

export interface FreshnessReport {
  entries: FreshnessEntry[];
  staleCount: number;
  agingCount: number;
  freshCount: number;
  asOf: string;
}

const STALE_DAYS = 180;
const AGING_DAYS = 90;

export function classifyFreshness(daysSinceChange: number): 'fresh' | 'aging' | 'stale' {
  if (daysSinceChange >= STALE_DAYS) return 'stale';
  if (daysSinceChange >= AGING_DAYS) return 'aging';
  return 'fresh';
}

export function buildFreshnessReport(
  routes: RouteInfo[],
  changeLog: Array<{ path: string; date: string }>
): FreshnessReport {
  const now = new Date();
  const lastChangedMap = new Map<string, string>();

  for (const entry of changeLog) {
    const existing = lastChangedMap.get(entry.path);
    if (!existing || new Date(entry.date) > new Date(existing)) {
      lastChangedMap.set(entry.path, entry.date);
    }
  }

  const entries: FreshnessEntry[] = routes.map((route) => {
    const lastChanged = lastChangedMap.get(route.path) ?? now.toISOString();
    const daysSinceChange = Math.floor(
      (now.getTime() - new Date(lastChanged).getTime()) / (1000 * 60 * 60 * 24)
    );
    const status = classifyFreshness(daysSinceChange);
    return { path: route.path, methods: route.methods, lastChanged, daysSinceChange, status };
  });

  return {
    entries,
    staleCount: entries.filter((e) => e.status === 'stale').length,
    agingCount: entries.filter((e) => e.status === 'aging').length,
    freshCount: entries.filter((e) => e.status === 'fresh').length,
    asOf: now.toISOString(),
  };
}

export function formatFreshnessReport(report: FreshnessReport): string {
  const lines: string[] = [
    `Route Freshness Report (as of ${report.asOf})`,
    `Fresh: ${report.freshCount}  Aging: ${report.agingCount}  Stale: ${report.staleCount}`,
    '',
  ];

  for (const entry of report.entries) {
    const label = entry.status.toUpperCase().padEnd(6);
    lines.push(`[${label}] ${entry.path} (${entry.methods.join(', ')}) — ${entry.daysSinceChange}d ago`);
  }

  return lines.join('\n');
}
