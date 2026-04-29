import { RouteInfo } from './scanner';
import { RouteDiff } from './differ';

export interface BottleneckEntry {
  path: string;
  methods: string[];
  score: number;
  reasons: string[];
}

export interface BottleneckReport {
  entries: BottleneckEntry[];
  topBottleneck: BottleneckEntry | null;
}

function scoreBottleneck(route: RouteInfo, changeFrequency: Map<string, number>): { score: number; reasons: string[] } {
  const reasons: string[] = [];
  let score = 0;

  const segments = route.path.split('/').filter(Boolean);
  const dynamicCount = segments.filter(s => s.startsWith('[') && s.endsWith(']')).length;
  if (dynamicCount >= 2) {
    score += dynamicCount * 10;
    reasons.push(`${dynamicCount} dynamic segments`);
  }

  const methodCount = route.methods.length;
  if (methodCount >= 4) {
    score += methodCount * 8;
    reasons.push(`${methodCount} HTTP methods`);
  }

  const depth = segments.length;
  if (depth >= 4) {
    score += depth * 5;
    reasons.push(`depth ${depth}`);
  }

  const freq = changeFrequency.get(route.path) ?? 0;
  if (freq >= 3) {
    score += freq * 12;
    reasons.push(`changed ${freq} times`);
  }

  return { score, reasons };
}

export function buildBottleneckReport(
  routes: RouteInfo[],
  history: RouteDiff[][]
): BottleneckReport {
  const changeFrequency = new Map<string, number>();
  for (const diff of history) {
    for (const change of diff) {
      const key = change.path;
      changeFrequency.set(key, (changeFrequency.get(key) ?? 0) + 1);
    }
  }

  const entries: BottleneckEntry[] = routes
    .map(route => {
      const { score, reasons } = scoreBottleneck(route, changeFrequency);
      return { path: route.path, methods: route.methods, score, reasons };
    })
    .filter(e => e.score > 0)
    .sort((a, b) => b.score - a.score);

  return {
    entries,
    topBottleneck: entries[0] ?? null,
  };
}

export function formatBottleneckReport(report: BottleneckReport): string {
  if (report.entries.length === 0) return 'No bottleneck routes detected.';

  const lines: string[] = ['Route Bottleneck Report', '======================='];
  for (const entry of report.entries) {
    lines.push(`\n${entry.path} [${entry.methods.join(', ')}]`);
    lines.push(`  Score : ${entry.score}`);
    lines.push(`  Reasons: ${entry.reasons.join('; ')}`);
  }
  return lines.join('\n');
}
