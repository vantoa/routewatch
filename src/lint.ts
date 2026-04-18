import { RouteChange } from './differ';
import { getSeverity } from './severity';

export interface LintRule {
  id: string;
  description: string;
  check: (change: RouteChange) => string | null;
}

export interface LintResult {
  changeId: string;
  route: string;
  ruleId: string;
  message: string;
  severity: 'error' | 'warning' | 'info';
}

const rules: LintRule[] = [
  {
    id: 'no-delete-without-deprecation',
    description: 'Removed routes should be deprecated before deletion',
    check: (change) =>
      change.status === 'removed'
        ? `Route "${change.route}" was removed without a prior deprecation tag`
        : null,
  },
  {
    id: 'no-method-removal',
    description: 'HTTP methods should not be silently removed',
    check: (change) => {
      if (change.status !== 'modified') return null;
      const removed = (change.before ?? []).filter(
        (m) => !(change.after ?? []).includes(m)
      );
      return removed.length > 0
        ? `Route "${change.route}" removed methods: ${removed.join(', ')}`
        : null;
    },
  },
  {
    id: 'prefer-explicit-methods',
    description: 'Routes should declare explicit HTTP methods',
    check: (change) =>
      change.status === 'added' && (change.after ?? []).length === 0
        ? `Route "${change.route}" has no HTTP methods defined`
        : null,
  },
];

export function lintChanges(changes: RouteChange[]): LintResult[] {
  const results: LintResult[] = [];
  for (const change of changes) {
    for (const rule of rules) {
      const message = rule.check(change);
      if (message) {
        const sev = getSeverity(change);
        results.push({
          changeId: `${change.route}:${change.status}`,
          route: change.route,
          ruleId: rule.id,
          message,
          severity: sev === 'breaking' ? 'error' : sev === 'warning' ? 'warning' : 'info',
        });
      }
    }
  }
  return results;
}

export function formatLintResults(results: LintResult[]): string {
  if (results.length === 0) return 'No lint issues found.';
  return results
    .map((r) => `[${r.severity.toUpperCase()}] (${r.ruleId}) ${r.message}`)
    .join('\n');
}
