import { RouteChange } from './differ';
import { ScannedRoute } from './scanner';

export interface AnomalyEntry {
  path: string;
  type: 'orphan' | 'duplicate' | 'unusual-method' | 'deep-nesting';
  detail: string;
  severity: 'low' | 'medium' | 'high';
}

export interface AnomalyReport {
  anomalies: AnomalyEntry[];
  total: number;
}

const STANDARD_METHODS = new Set(['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS']);
const MAX_DEPTH = 6;

export function detectOrphans(routes: ScannedRoute[]): AnomalyEntry[] {
  const paths = new Set(routes.map(r => r.path));
  return routes
    .filter(r => {
      const segments = r.path.split('/').filter(Boolean);
      if (segments.length < 2) return false;
      const parent = '/' + segments.slice(0, -1).join('/');
      return !paths.has(parent);
    })
    .map(r => ({
      path: r.path,
      type: 'orphan' as const,
      detail: `No parent route found for ${r.path}`,
      severity: 'low' as const,
    }));
}

export function detectDuplicates(routes: ScannedRoute[]): AnomalyEntry[] {
  const seen = new Map<string, number>();
  for (const r of routes) seen.set(r.path, (seen.get(r.path) ?? 0) + 1);
  return Array.from(seen.entries())
    .filter(([, count]) => count > 1)
    .map(([path]) => ({
      path,
      type: 'duplicate' as const,
      detail: `Route ${path} appears ${seen.get(path)} times`,
      severity: 'high' as const,
    }));
}

export function detectUnusualMethods(routes: ScannedRoute[]): AnomalyEntry[] {
  const entries: AnomalyEntry[] = [];
  for (const r of routes) {
    const unusual = r.methods.filter(m => !STANDARD_METHODS.has(m.toUpperCase()));
    if (unusual.length > 0) {
      entries.push({
        path: r.path,
        type: 'unusual-method',
        detail: `Non-standard HTTP methods: ${unusual.join(', ')}`,
        severity: 'medium',
      });
    }
  }
  return entries;
}

export function detectDeepNesting(routes: ScannedRoute[]): AnomalyEntry[] {
  return routes
    .filter(r => r.path.split('/').filter(Boolean).length > MAX_DEPTH)
    .map(r => ({
      path: r.path,
      type: 'deep-nesting' as const,
      detail: `Route exceeds depth of ${MAX_DEPTH} segments`,
      severity: 'medium' as const,
    }));
}

export function detectAnomalies(routes: ScannedRoute[]): AnomalyReport {
  const anomalies = [
    ...detectOrphans(routes),
    ...detectDuplicates(routes),
    ...detectUnusualMethods(routes),
    ...detectDeepNesting(routes),
  ];
  return { anomalies, total: anomalies.length };
}

export function formatAnomalyReport(report: AnomalyReport): string {
  if (report.total === 0) return 'No anomalies detected.';
  const lines: string[] = [`Anomalies detected: ${report.total}\n`];
  for (const a of report.anomalies) {
    lines.push(`[${a.severity.toUpperCase()}] (${a.type}) ${a.path}`);
    lines.push(`  ${a.detail}`);
  }
  return lines.join('\n');
}
