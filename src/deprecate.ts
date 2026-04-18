import { RouteChange } from './differ';

export interface DeprecationRule {
  pattern: string;
  reason?: string;
  since?: string;
}

export interface DeprecatedRoute {
  route: string;
  methods: string[];
  reason?: string;
  since?: string;
}

export function matchesDeprecationRule(route: string, pattern: string): boolean {
  const escaped = pattern.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*');
  return new RegExp(`^${escaped}$`).test(route);
}

export function findDeprecatedRoutes(
  changes: RouteChange[],
  rules: DeprecationRule[]
): DeprecatedRoute[] {
  const deprecated: DeprecatedRoute[] = [];

  for (const change of changes) {
    if (change.status === 'removed') {
      for (const rule of rules) {
        if (matchesDeprecationRule(change.route, rule.pattern)) {
          deprecated.push({
            route: change.route,
            methods: change.methods ?? [],
            reason: rule.reason,
            since: rule.since,
          });
          break;
        }
      }
    }
  }

  return deprecated;
}

export function formatDeprecated(deprecated: DeprecatedRoute[]): string {
  if (deprecated.length === 0) return 'No deprecated routes found.';

  const lines: string[] = ['Deprecated Routes:', ''];
  for (const d of deprecated) {
    lines.push(`  - ${d.route} [${d.methods.join(', ')}]`);
    if (d.since) lines.push(`    Since: ${d.since}`);
    if (d.reason) lines.push(`    Reason: ${d.reason}`);
  }
  return lines.join('\n');
}
