import { RouteInfo } from './scanner';
import { DiffResult } from './differ';

export interface RouteCoverageReport {
  total: number;
  added: number;
  removed: number;
  modified: number;
  unchanged: number;
  coveragePercent: number;
  testedRoutes: string[];
  untestedRoutes: string[];
}

export interface CoverageOptions {
  testedPaths?: string[];
}

export function computeCoverage(
  routes: RouteInfo[],
  diff: DiffResult,
  options: CoverageOptions = {}
): RouteCoverageReport {
  const tested = new Set(options.testedPaths ?? []);

  const added = diff.added.length;
  const removed = diff.removed.length;
  const modified = diff.modified.length;
  const total = routes.length;
  const unchanged = total - added - modified;

  const testedRoutes: string[] = [];
  const untestedRoutes: string[] = [];

  for (const route of routes) {
    if (tested.has(route.route)) {
      testedRoutes.push(route.route);
    } else {
      untestedRoutes.push(route.route);
    }
  }

  const coveragePercent =
    total === 0 ? 100 : Math.round((testedRoutes.length / total) * 100);

  return {
    total,
    added,
    removed,
    modified,
    unchanged: Math.max(0, unchanged),
    coveragePercent,
    testedRoutes,
    untestedRoutes,
  };
}

export function formatCoverageReport(report: RouteCoverageReport): string {
  const lines: string[] = [];
  lines.push('## Route Coverage Report');
  lines.push('');
  lines.push(`- Total routes : ${report.total}`);
  lines.push(`- Added        : ${report.added}`);
  lines.push(`- Removed      : ${report.removed}`);
  lines.push(`- Modified     : ${report.modified}`);
  lines.push(`- Unchanged    : ${report.unchanged}`);
  lines.push(`- Coverage     : ${report.coveragePercent}%`);

  if (report.untestedRoutes.length > 0) {
    lines.push('');
    lines.push('### Untested Routes');
    for (const r of report.untestedRoutes) {
      lines.push(`  - ${r}`);
    }
  }

  return lines.join('\n');
}
