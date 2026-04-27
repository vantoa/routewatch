import { RouteChange } from './differ';

export interface VersionedRoute {
  path: string;
  methods: string[];
  version: string | null;
}

export interface VersionGroup {
  version: string | null;
  routes: VersionedRoute[];
  count: number;
}

export interface VersionReport {
  groups: VersionGroup[];
  unversioned: VersionedRoute[];
  totalVersioned: number;
  totalUnversioned: number;
}

const VERSION_PATTERN = /\/v(\d+)(?:\/|$)/i;

export function extractVersion(path: string): string | null {
  const match = path.match(VERSION_PATTERN);
  return match ? `v${match[1]}` : null;
}

export function buildVersionReport(
  routes: Array<{ path: string; methods: string[] }>
): VersionReport {
  const groupMap = new Map<string, VersionedRoute[]>();
  const unversioned: VersionedRoute[] = [];

  for (const route of routes) {
    const version = extractVersion(route.path);
    const versioned: VersionedRoute = { ...route, version };

    if (version === null) {
      unversioned.push(versioned);
    } else {
      if (!groupMap.has(version)) groupMap.set(version, []);
      groupMap.get(version)!.push(versioned);
    }
  }

  const groups: VersionGroup[] = Array.from(groupMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([version, routes]) => ({ version, routes, count: routes.length }));

  return {
    groups,
    unversioned,
    totalVersioned: groups.reduce((s, g) => s + g.count, 0),
    totalUnversioned: unversioned.length,
  };
}

export function detectVersionChanges(
  changes: RouteChange[]
): Array<RouteChange & { fromVersion: string | null; toVersion: string | null }> {
  return changes.map((c) => ({
    ...c,
    fromVersion: extractVersion(c.path),
    toVersion: extractVersion(c.path),
  }));
}

export function formatVersionReport(report: VersionReport): string {
  const lines: string[] = ['Route Version Report', '==================='];

  if (report.groups.length === 0) {
    lines.push('No versioned routes found.');
  } else {
    for (const group of report.groups) {
      lines.push(`\n[${group.version}] (${group.count} routes)`);
      for (const route of group.routes) {
        lines.push(`  ${route.path}  [${route.methods.join(', ')}]`);
      }
    }
  }

  if (report.totalUnversioned > 0) {
    lines.push(`\n[unversioned] (${report.totalUnversioned} routes)`);
    for (const route of report.unversioned) {
      lines.push(`  ${route.path}  [${route.methods.join(', ')}]`);
    }
  }

  lines.push(
    `\nSummary: ${report.totalVersioned} versioned, ${report.totalUnversioned} unversioned`
  );
  return lines.join('\n');
}
