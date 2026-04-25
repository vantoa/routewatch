import { RouteChange } from './differ';

export interface BloomEntry {
  path: string;
  firstSeen: string;
  addedMethods: string[];
  growthScore: number;
}

export interface BloomReport {
  entries: BloomEntry[];
  topGrowing: BloomEntry[];
}

function computeGrowthScore(addedMethods: string[]): number {
  const weights: Record<string, number> = {
    GET: 1,
    POST: 2,
    PUT: 2,
    PATCH: 1.5,
    DELETE: 3,
  };
  return addedMethods.reduce((sum, m) => sum + (weights[m] ?? 1), 0);
}

export function buildBloomReport(
  changes: RouteChange[],
  history: Array<{ path: string; date: string }> = []
): BloomReport {
  const firstSeenMap = new Map(history.map((h) => [h.path, h.date]));

  const added = changes.filter((c) => c.status === 'added');

  const entries: BloomEntry[] = added.map((c) => {
    const addedMethods = c.methods ?? [];
    return {
      path: c.path,
      firstSeen: firstSeenMap.get(c.path) ?? new Date().toISOString().slice(0, 10),
      addedMethods,
      growthScore: computeGrowthScore(addedMethods),
    };
  });

  const topGrowing = [...entries]
    .sort((a, b) => b.growthScore - a.growthScore)
    .slice(0, 5);

  return { entries, topGrowing };
}

export function formatBloomReport(report: BloomReport): string {
  if (report.entries.length === 0) {
    return 'No new routes detected.';
  }

  const lines: string[] = ['=== Route Bloom Report ===', ''];

  for (const e of report.entries) {
    lines.push(`  ${e.path}`);
    lines.push(`    First seen : ${e.firstSeen}`);
    lines.push(`    Methods    : ${e.addedMethods.join(', ') || 'none'}`);
    lines.push(`    Growth     : ${e.growthScore.toFixed(1)}`);
    lines.push('');
  }

  lines.push('Top Growing Routes:');
  report.topGrowing.forEach((e, i) => {
    lines.push(`  ${i + 1}. ${e.path} (score: ${e.growthScore.toFixed(1)})`);
  });

  return lines.join('\n');
}
