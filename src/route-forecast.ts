import { RouteChange } from './differ';

export interface ForecastEntry {
  path: string;
  changeCount: number;
  avgDaysBetweenChanges: number | null;
  predictedNextChangeDays: number | null;
  confidence: 'high' | 'medium' | 'low';
}

export interface ForecastReport {
  generatedAt: string;
  entries: ForecastEntry[];
}

function groupChangesByPath(history: RouteChange[][]): Map<string, number[]> {
  const timestamps: Map<string, number[]> = new Map();
  history.forEach((snapshot, idx) => {
    snapshot.forEach((change) => {
      const key = change.path;
      if (!timestamps.has(key)) timestamps.set(key, []);
      timestamps.get(key)!.push(idx);
    });
  });
  return timestamps;
}

function avgGap(indices: number[]): number | null {
  if (indices.length < 2) return null;
  const sorted = [...indices].sort((a, b) => a - b);
  let total = 0;
  for (let i = 1; i < sorted.length; i++) {
    total += sorted[i] - sorted[i - 1];
  }
  return total / (sorted.length - 1);
}

function deriveConfidence(count: number): 'high' | 'medium' | 'low' {
  if (count >= 5) return 'high';
  if (count >= 2) return 'medium';
  return 'low';
}

export function buildForecastReport(
  history: RouteChange[][],
  daysPerSnapshot = 7
): ForecastReport {
  const grouped = groupChangesByPath(history);
  const entries: ForecastEntry[] = [];

  grouped.forEach((indices, path) => {
    const changeCount = indices.length;
    const gap = avgGap(indices);
    const avgDaysBetweenChanges = gap !== null ? gap * daysPerSnapshot : null;
    const lastIdx = Math.max(...indices);
    const snapshotsSinceLast = history.length - 1 - lastIdx;
    const daysSinceLast = snapshotsSinceLast * daysPerSnapshot;
    const predictedNextChangeDays =
      avgDaysBetweenChanges !== null
        ? Math.max(0, avgDaysBetweenChanges - daysSinceLast)
        : null;

    entries.push({
      path,
      changeCount,
      avgDaysBetweenChanges,
      predictedNextChangeDays,
      confidence: deriveConfidence(changeCount),
    });
  });

  entries.sort((a, b) => {
    const aVal = a.predictedNextChangeDays ?? Infinity;
    const bVal = b.predictedNextChangeDays ?? Infinity;
    return aVal - bVal;
  });

  return { generatedAt: new Date().toISOString(), entries };
}

export function formatForecastReport(report: ForecastReport): string {
  const lines: string[] = [
    `Route Forecast (generated ${report.generatedAt})`,
    '='.repeat(52),
  ];
  if (report.entries.length === 0) {
    lines.push('No forecast data available.');
    return lines.join('\n');
  }
  for (const e of report.entries) {
    const avg =
      e.avgDaysBetweenChanges !== null
        ? `avg ${e.avgDaysBetweenChanges.toFixed(1)}d between changes`
        : 'insufficient data';
    const next =
      e.predictedNextChangeDays !== null
        ? `next change ~${e.predictedNextChangeDays.toFixed(1)}d`
        : 'unpredictable';
    lines.push(
      `  ${e.path}  [${e.changeCount} changes, ${avg}, ${next}, confidence: ${e.confidence}]`
    );
  }
  return lines.join('\n');
}
