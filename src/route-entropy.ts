import { RouteChange } from './differ';

export interface EntropyEntry {
  path: string;
  changeCount: number;
  uniqueMethods: number;
  entropy: number;
  label: string;
}

export interface EntropyReport {
  entries: EntropyEntry[];
  averageEntropy: number;
  highEntropyThreshold: number;
}

function log2(n: number): number {
  return n <= 0 ? 0 : Math.log2(n);
}

function computeEntropy(changes: RouteChange[]): number {
  if (changes.length === 0) return 0;
  const methodCounts: Record<string, number> = {};
  for (const change of changes) {
    const methods = [
      ...(change.before?.methods ?? []),
      ...(change.after?.methods ?? []),
    ];
    for (const m of methods) {
      methodCounts[m] = (methodCounts[m] ?? 0) + 1;
    }
  }
  const total = Object.values(methodCounts).reduce((a, b) => a + b, 0);
  if (total === 0) return 0;
  return -Object.values(methodCounts)
    .map((c) => (c / total) * log2(c / total))
    .reduce((a, b) => a + b, 0);
}

function labelEntropy(entropy: number, threshold: number): string {
  if (entropy >= threshold) return 'high';
  if (entropy >= threshold / 2) return 'medium';
  return 'low';
}

export function buildEntropyReport(
  changes: RouteChange[],
  threshold = 1.5
): EntropyReport {
  const grouped: Record<string, RouteChange[]> = {};
  for (const change of changes) {
    const key = change.after?.path ?? change.before?.path ?? 'unknown';
    grouped[key] = grouped[key] ?? [];
    grouped[key].push(change);
  }

  const entries: EntropyEntry[] = Object.entries(grouped).map(
    ([path, group]) => {
      const uniqueMethods = new Set(
        group.flatMap((c) => [
          ...(c.before?.methods ?? []),
          ...(c.after?.methods ?? []),
        ])
      ).size;
      const entropy = computeEntropy(group);
      return {
        path,
        changeCount: group.length,
        uniqueMethods,
        entropy: Math.round(entropy * 1000) / 1000,
        label: labelEntropy(entropy, threshold),
      };
    }
  );

  entries.sort((a, b) => b.entropy - a.entropy);

  const averageEntropy =
    entries.length > 0
      ? Math.round(
          (entries.reduce((s, e) => s + e.entropy, 0) / entries.length) * 1000
        ) / 1000
      : 0;

  return { entries, averageEntropy, highEntropyThreshold: threshold };
}

export function formatEntropyReport(report: EntropyReport): string {
  const lines: string[] = [
    '=== Route Entropy Report ===',
    `Average entropy: ${report.averageEntropy}  (threshold: ${report.highEntropyThreshold})`,
    '',
  ];
  for (const e of report.entries) {
    lines.push(
      `[${e.label.toUpperCase()}] ${e.path}  entropy=${e.entropy}  changes=${e.changeCount}  methods=${e.uniqueMethods}`
    );
  }
  if (report.entries.length === 0) lines.push('No route changes to analyse.');
  return lines.join('\n');
}
