import { DiffResult } from './differ';

export interface RouteStats {
  totalAdded: number;
  totalRemoved: number;
  totalModified: number;
  totalUnchanged: number;
  methodBreakdown: Record<string, { added: number; removed: number }>;
}

export function computeStats(diff: DiffResult[]): RouteStats {
  const stats: RouteStats = {
    totalAdded: 0,
    totalRemoved: 0,
    totalModified: 0,
    totalUnchanged: 0,
    methodBreakdown: {},
  };

  for (const change of diff) {
    if (change.type === 'added') {
      stats.totalAdded++;
      for (const method of change.methods ?? []) {
        ensureMethod(stats.methodBreakdown, method);
        stats.methodBreakdown[method].added++;
      }
    } else if (change.type === 'removed') {
      stats.totalRemoved++;
      for (const method of change.methods ?? []) {
        ensureMethod(stats.methodBreakdown, method);
        stats.methodBreakdown[method].removed++;
      }
    } else if (change.type === 'modified') {
      stats.totalModified++;
      for (const method of change.addedMethods ?? []) {
        ensureMethod(stats.methodBreakdown, method);
        stats.methodBreakdown[method].added++;
      }
      for (const method of change.removedMethods ?? []) {
        ensureMethod(stats.methodBreakdown, method);
        stats.methodBreakdown[method].removed++;
      }
    } else {
      stats.totalUnchanged++;
    }
  }

  return stats;
}

/** Ensures a method key exists in the breakdown map. */
function ensureMethod(
  breakdown: Record<string, { added: number; removed: number }>,
  method: string
): void {
  if (!breakdown[method]) breakdown[method] = { added: 0, removed: 0 };
}

export function formatStats(stats: RouteStats): string {
  const lines: string[] = [
    '--- Route Stats ---',
    `Added:     ${stats.totalAdded}`,
    `Removed:   ${stats.totalRemoved}`,
    `Modified:  ${stats.totalModified}`,
    `Unchanged: ${stats.totalUnchanged}`,
  ];

  const methods = Object.keys(stats.methodBreakdown);
  if (methods.length > 0) {
    lines.push('\nMethod Breakdown:');
    for (const method of methods.sort()) {
      const { added, removed } = stats.methodBreakdown[method];
      lines.push(`  ${method}: +${added} -${removed}`);
    }
  }

  return lines.join('\n');
}
