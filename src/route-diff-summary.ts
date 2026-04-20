import { RouteChange } from './differ';

export interface DiffSummarySection {
  label: string;
  routes: string[];
}

export interface RouteDiffSummary {
  added: DiffSummarySection;
  removed: DiffSummarySection;
  modified: DiffSummarySection;
  total: number;
}

export function buildRouteDiffSummary(changes: RouteChange[]): RouteDiffSummary {
  const added: string[] = [];
  const removed: string[] = [];
  const modified: string[] = [];

  for (const change of changes) {
    switch (change.type) {
      case 'added':
        added.push(change.route);
        break;
      case 'removed':
        removed.push(change.route);
        break;
      case 'modified':
        modified.push(change.route);
        break;
    }
  }

  return {
    added: { label: 'Added', routes: added },
    removed: { label: 'Removed', routes: removed },
    modified: { label: 'Modified', routes: modified },
    total: changes.length,
  };
}

export function formatRouteDiffSummary(summary: RouteDiffSummary): string {
  const lines: string[] = [];
  lines.push(`Route Diff Summary (${summary.total} change(s))`);
  lines.push('='.repeat(40));

  for (const section of [summary.added, summary.removed, summary.modified]) {
    if (section.routes.length === 0) continue;
    lines.push(`\n${section.label} (${section.routes.length}):`);
    for (const route of section.routes) {
      lines.push(`  - ${route}`);
    }
  }

  if (summary.total === 0) {
    lines.push('No changes detected.');
  }

  return lines.join('\n');
}
