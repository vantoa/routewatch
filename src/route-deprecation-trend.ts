import { RouteChange } from './differ';
import { findDeprecatedRoutes, DeprecationRule } from './deprecate';
import { ScannedRoute } from './scanner';

export interface DeprecationTrendEntry {
  timestamp: string;
  totalRoutes: number;
  deprecatedCount: number;
  deprecatedPaths: string[];
  ratio: number;
}

export interface DeprecationTrendReport {
  entries: DeprecationTrendEntry[];
  averageRatio: number;
  peakDeprecated: number;
  trend: 'increasing' | 'decreasing' | 'stable';
}

export function buildDeprecationTrendEntry(
  routes: ScannedRoute[],
  rules: DeprecationRule[],
  timestamp?: string
): DeprecationTrendEntry {
  const deprecated = findDeprecatedRoutes(routes, rules);
  const deprecatedPaths = deprecated.map((d) => d.route.path);
  const totalRoutes = routes.length;
  const deprecatedCount = deprecated.length;
  const ratio = totalRoutes === 0 ? 0 : deprecatedCount / totalRoutes;

  return {
    timestamp: timestamp ?? new Date().toISOString(),
    totalRoutes,
    deprecatedCount,
    deprecatedPaths,
    ratio: Math.round(ratio * 1000) / 1000,
  };
}

export function buildDeprecationTrendReport(
  entries: DeprecationTrendEntry[]
): DeprecationTrendReport {
  if (entries.length === 0) {
    return { entries, averageRatio: 0, peakDeprecated: 0, trend: 'stable' };
  }

  const averageRatio =
    entries.reduce((sum, e) => sum + e.ratio, 0) / entries.length;
  const peakDeprecated = Math.max(...entries.map((e) => e.deprecatedCount));

  let trend: 'increasing' | 'decreasing' | 'stable' = 'stable';
  if (entries.length >= 2) {
    const first = entries[0].ratio;
    const last = entries[entries.length - 1].ratio;
    if (last - first > 0.05) trend = 'increasing';
    else if (first - last > 0.05) trend = 'decreasing';
  }

  return {
    entries,
    averageRatio: Math.round(averageRatio * 1000) / 1000,
    peakDeprecated,
    trend,
  };
}

export function formatDeprecationTrendReport(
  report: DeprecationTrendReport
): string {
  const lines: string[] = ['Deprecation Trend Report', '========================'];
  lines.push(`Trend: ${report.trend}`);
  lines.push(`Average Deprecation Ratio: ${(report.averageRatio * 100).toFixed(1)}%`);
  lines.push(`Peak Deprecated Routes: ${report.peakDeprecated}`);
  lines.push('');
  for (const entry of report.entries) {
    const pct = (entry.ratio * 100).toFixed(1);
    lines.push(
      `  [${entry.timestamp}] ${entry.deprecatedCount}/${entry.totalRoutes} (${pct}%)`
    );
    for (const p of entry.deprecatedPaths) {
      lines.push(`    - ${p}`);
    }
  }
  return lines.join('\n');
}
