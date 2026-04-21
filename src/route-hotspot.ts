import type { RouteChange } from './differ';

export interface HotspotEntry {
  path: string;
  changeCount: number;
  methods: string[];
  score: number;
}

export interface HotspotReport {
  entries: HotspotEntry[];
  topN: HotspotEntry[];
}

/**
 * Builds a hotspot report by aggregating change frequency per route path.
 * Routes with more frequent changes across multiple snapshots get a higher score.
 */
export function buildHotspotReport(
  changeSets: RouteChange[][],
  topN = 5
): HotspotReport {
  const counts = new Map<string, { methods: Set<string>; count: number }>();

  for (const changes of changeSets) {
    for (const change of changes) {
      const key = change.path;
      if (!counts.has(key)) {
        counts.set(key, { methods: new Set(), count: 0 });
      }
      const entry = counts.get(key)!;
      entry.count += 1;
      for (const m of change.methods ?? []) {
        entry.methods.add(m);
      }
    }
  }

  const totalSets = changeSets.length || 1;

  const entries: HotspotEntry[] = Array.from(counts.entries()).map(
    ([path, { count, methods }]) => ({
      path,
      changeCount: count,
      methods: Array.from(methods).sort(),
      score: Math.round((count / totalSets) * 100) / 100,
    })
  );

  entries.sort((a, b) => b.changeCount - a.changeCount || a.path.localeCompare(b.path));

  return {
    entries,
    topN: entries.slice(0, topN),
  };
}

export function formatHotspotReport(report: HotspotReport): string {
  if (report.entries.length === 0) {
    return 'No hotspots detected.';
  }

  const lines: string[] = ['Route Hotspots (most frequently changed):', ''];

  for (const entry of report.topN) {
    const methods = entry.methods.length > 0 ? ` [${entry.methods.join(', ')}]` : '';
    lines.push(
      `  ${entry.path}${methods}  — changes: ${entry.changeCount}  score: ${entry.score}`
    );
  }

  if (report.entries.length > report.topN.length) {
    lines.push(`  ... and ${report.entries.length - report.topN.length} more route(s)`);
  }

  return lines.join('\n');
}
