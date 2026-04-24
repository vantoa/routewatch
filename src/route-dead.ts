import type { RouteInfo } from './scanner';
import type { ChangeRecord } from './differ';

export interface DeadRouteEntry {
  path: string;
  methods: string[];
  lastSeenAt: string;
  daysSinceLastSeen: number;
  reason: 'removed' | 'no-traffic' | 'deprecated-and-removed';
}

export interface DeadRouteReport {
  entries: DeadRouteEntry[];
  total: number;
  generatedAt: string;
}

function daysBetween(a: Date, b: Date): number {
  return Math.floor((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));
}

export function detectDeadRoutes(
  changes: ChangeRecord[],
  currentRoutes: RouteInfo[],
  deprecatedPaths: string[] = [],
  thresholdDays = 30
): DeadRouteReport {
  const now = new Date();
  const currentPaths = new Set(currentRoutes.map((r) => r.path));

  const removedChanges = changes.filter((c) => c.type === 'removed');

  const entries: DeadRouteEntry[] = removedChanges
    .filter((c) => !currentPaths.has(c.path))
    .map((c) => {
      const lastSeenAt = c.timestamp ?? now.toISOString();
      const daysSinceLastSeen = daysBetween(new Date(lastSeenAt), now);
      const isDeprecated = deprecatedPaths.includes(c.path);
      const reason: DeadRouteEntry['reason'] =
        isDeprecated ? 'deprecated-and-removed' : 'removed';

      return {
        path: c.path,
        methods: c.methods ?? [],
        lastSeenAt,
        daysSinceLastSeen,
        reason,
      };
    })
    .filter((e) => e.daysSinceLastSeen >= thresholdDays);

  return {
    entries,
    total: entries.length,
    generatedAt: now.toISOString(),
  };
}

export function formatDeadRouteReport(report: DeadRouteReport): string {
  if (report.total === 0) {
    return 'No dead routes detected.';
  }

  const lines: string[] = [
    `Dead Routes Report (${report.total} found)`,
    '='.repeat(40),
  ];

  for (const entry of report.entries) {
    lines.push(
      `  ${entry.path} [${entry.methods.join(', ')}]`,
      `    Reason       : ${entry.reason}`,
      `    Last Seen    : ${entry.lastSeenAt}`,
      `    Days Absent  : ${entry.daysSinceLastSeen}`,
      ''
    );
  }

  lines.push(`Generated at: ${report.generatedAt}`);
  return lines.join('\n');
}
