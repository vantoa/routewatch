import { RouteInfo } from './scanner';
import { ChangeRecord } from './differ';

export interface SurfaceEntry {
  path: string;
  methods: string[];
  isDynamic: boolean;
  paramCount: number;
  depth: number;
  surfaceScore: number;
}

export interface SurfaceDelta {
  path: string;
  before: number;
  after: number;
  delta: number;
}

export interface SurfaceReport {
  entries: SurfaceEntry[];
  totalScore: number;
  averageScore: number;
  deltas: SurfaceDelta[];
  summary: string;
}

export function scoreSurface(route: RouteInfo): number {
  const depth = route.path.split('/').filter(Boolean).length;
  const params = (route.path.match(/\[/g) || []).length;
  const methodWeight = route.methods.length;
  return depth + params * 2 + methodWeight;
}

export function buildSurfaceReport(
  routes: RouteInfo[],
  changes: ChangeRecord[] = []
): SurfaceReport {
  const entries: SurfaceEntry[] = routes.map((r) => {
    const depth = r.path.split('/').filter(Boolean).length;
    const paramCount = (r.path.match(/\[/g) || []).length;
    const isDynamic = paramCount > 0;
    return {
      path: r.path,
      methods: r.methods,
      isDynamic,
      paramCount,
      depth,
      surfaceScore: scoreSurface(r),
    };
  });

  const totalScore = entries.reduce((s, e) => s + e.surfaceScore, 0);
  const averageScore = entries.length ? totalScore / entries.length : 0;

  const deltas: SurfaceDelta[] = changes
    .filter((c) => c.type === 'modified')
    .map((c) => {
      const before = scoreSurface({ path: c.path, methods: c.before ?? [] });
      const after = scoreSurface({ path: c.path, methods: c.after ?? [] });
      return { path: c.path, before, after, delta: after - before };
    });

  const summary = `${entries.length} routes | total surface: ${totalScore} | avg: ${averageScore.toFixed(2)}`;

  return { entries, totalScore, averageScore, deltas, summary };
}

export function formatSurfaceReport(report: SurfaceReport): string {
  const lines: string[] = ['## API Surface Report', report.summary, ''];

  const sorted = [...report.entries].sort((a, b) => b.surfaceScore - a.surfaceScore);
  for (const e of sorted) {
    const tag = e.isDynamic ? '[dynamic]' : '[static] ';
    lines.push(`  ${tag} ${e.path.padEnd(45)} score: ${e.surfaceScore}  methods: ${e.methods.join(',') || '-'}`);
  }

  if (report.deltas.length) {
    lines.push('', '### Surface Deltas (modified routes)');
    for (const d of report.deltas) {
      const sign = d.delta >= 0 ? `+${d.delta}` : `${d.delta}`;
      lines.push(`  ${d.path.padEnd(45)} ${d.before} → ${d.after}  (${sign})`);
    }
  }

  return lines.join('\n');
}
