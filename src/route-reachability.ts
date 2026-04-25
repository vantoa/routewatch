import { RouteInfo } from './scanner';

export interface ReachabilityEntry {
  path: string;
  methods: string[];
  reachable: boolean;
  reason?: string;
}

export interface ReachabilityReport {
  total: number;
  reachable: number;
  unreachable: number;
  entries: ReachabilityEntry[];
}

const BLOCKED_PREFIXES = ['/internal', '/private', '/_'];
const BLOCKED_SEGMENTS = ['__', '_middleware'];

function isLikelyUnreachable(path: string): { blocked: boolean; reason?: string } {
  for (const prefix of BLOCKED_PREFIXES) {
    if (path.startsWith(prefix)) {
      return { blocked: true, reason: `matches blocked prefix '${prefix}'` };
    }
  }
  const segments = path.split('/').filter(Boolean);
  for (const seg of segments) {
    for (const blocked of BLOCKED_SEGMENTS) {
      if (seg.startsWith(blocked)) {
        return { blocked: true, reason: `segment '${seg}' matches blocked pattern '${blocked}'` };
      }
    }
  }
  if (segments.length === 0) {
    return { blocked: false };
  }
  return { blocked: false };
}

export function assessReachability(routes: RouteInfo[]): ReachabilityEntry[] {
  return routes.map((route) => {
    const { blocked, reason } = isLikelyUnreachable(route.path);
    return {
      path: route.path,
      methods: route.methods,
      reachable: !blocked,
      ...(reason ? { reason } : {}),
    };
  });
}

export function buildReachabilityReport(routes: RouteInfo[]): ReachabilityReport {
  const entries = assessReachability(routes);
  const reachable = entries.filter((e) => e.reachable).length;
  return {
    total: entries.length,
    reachable,
    unreachable: entries.length - reachable,
    entries,
  };
}

export function formatReachabilityReport(report: ReachabilityReport): string {
  const lines: string[] = [
    `Route Reachability Report`,
    `  Total:       ${report.total}`,
    `  Reachable:   ${report.reachable}`,
    `  Unreachable: ${report.unreachable}`,
    '',
  ];
  const unreachable = report.entries.filter((e) => !e.reachable);
  if (unreachable.length === 0) {
    lines.push('  All routes appear publicly reachable.');
  } else {
    lines.push('  Unreachable Routes:');
    for (const entry of unreachable) {
      lines.push(`    ${entry.path} [${entry.methods.join(', ')}] — ${entry.reason}`);
    }
  }
  return lines.join('\n');
}
