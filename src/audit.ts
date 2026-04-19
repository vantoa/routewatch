import { RouteChange } from './differ';
import { getSeverity } from './severity';

export interface AuditEntry {
  timestamp: string;
  route: string;
  method: string;
  status: 'added' | 'removed' | 'modified';
  severity: 'breaking' | 'non-breaking' | 'info';
  details?: string;
}

export interface AuditReport {
  generatedAt: string;
  totalChanges: number;
  breakingCount: number;
  entries: AuditEntry[];
}

export function buildAuditEntries(changes: RouteChange[]): AuditEntry[] {
  const entries: AuditEntry[] = [];
  const timestamp = new Date().toISOString();

  for (const change of changes) {
    const methods =
      change.status === 'added'
        ? change.after?.methods ?? []
        : change.before?.methods ?? [];

    for (const method of methods.length ? methods : ['*']) {
      const severity = getSeverity(change);
      entries.push({
        timestamp,
        route: change.route,
        method,
        status: change.status,
        severity,
        details:
          change.status === 'modified'
            ? `before: [${change.before?.methods.join(',')}] after: [${change.after?.methods.join(',')}]`
            : undefined,
      });
    }
  }

  return entries;
}

export function buildAuditReport(changes: RouteChange[]): AuditReport {
  const entries = buildAuditEntries(changes);
  return {
    generatedAt: new Date().toISOString(),
    totalChanges: entries.length,
    breakingCount: entries.filter((e) => e.severity === 'breaking').length,
    entries,
  };
}

export function formatAuditReport(report: AuditReport): string {
  const lines: string[] = [
    `Audit Report — ${report.generatedAt}`,
    `Total: ${report.totalChanges}  Breaking: ${report.breakingCount}`,
    '',
  ];
  for (const e of report.entries) {
    const sev = e.severity === 'breaking' ? '[BREAKING]' : e.severity === 'non-breaking' ? '[change]  ' : '[info]    ';
    lines.push(`${sev} ${e.status.toUpperCase().padEnd(8)} ${e.method.padEnd(7)} ${e.route}${e.details ? '  // ' + e.details : ''}`);
  }
  return lines.join('\n');
}
