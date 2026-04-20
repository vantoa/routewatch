import { RouteInfo } from './scanner';

export interface OwnershipRule {
  pattern: string;
  owner: string;
  team?: string;
}

export interface RouteOwnership {
  route: string;
  methods: string[];
  owner: string;
  team?: string;
}

export interface OwnershipReport {
  owned: RouteOwnership[];
  unowned: RouteInfo[];
}

export function matchesOwnershipPattern(route: string, pattern: string): boolean {
  const escaped = pattern.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*');
  return new RegExp(`^${escaped}$`).test(route);
}

export function assignOwnership(
  routes: RouteInfo[],
  rules: OwnershipRule[]
): OwnershipReport {
  const owned: RouteOwnership[] = [];
  const unowned: RouteInfo[] = [];

  for (const route of routes) {
    const match = rules.find(r => matchesOwnershipPattern(route.route, r.pattern));
    if (match) {
      owned.push({
        route: route.route,
        methods: route.methods,
        owner: match.owner,
        team: match.team,
      });
    } else {
      unowned.push(route);
    }
  }

  return { owned, unowned };
}

export function formatOwnershipReport(report: OwnershipReport): string {
  const lines: string[] = [];

  if (report.owned.length > 0) {
    lines.push('Owned Routes:');
    for (const entry of report.owned) {
      const methods = entry.methods.join(', ');
      const team = entry.team ? ` [${entry.team}]` : '';
      lines.push(`  ${entry.route} (${methods}) — ${entry.owner}${team}`);
    }
  }

  if (report.unowned.length > 0) {
    lines.push('');
    lines.push('Unowned Routes:');
    for (const route of report.unowned) {
      lines.push(`  ${route.route} (${route.methods.join(', ')})`);
    }
  }

  lines.push('');
  lines.push(`Total: ${report.owned.length} owned, ${report.unowned.length} unowned`);
  return lines.join('\n');
}
