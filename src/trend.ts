import { RouteChange } from './differ';

export interface TrendEntry {
  date: string;
  added: number;
  removed: number;
  modified: number;
  breaking: number;
}

export interface TrendReport {
  entries: TrendEntry[];
  totalAdded: number;
  totalRemoved: number;
  totalModified: number;
  totalBreaking: number;
}

export function buildTrendEntry(date: string, changes: RouteChange[]): TrendEntry {
  const added = changes.filter(c => c.type === 'added').length;
  const removed = changes.filter(c => c.type === 'removed').length;
  const modified = changes.filter(c => c.type === 'modified').length;
  const breaking = changes.filter(c => c.type === 'removed' || (c.type === 'modified' && c.oldMethods && c.oldMethods.some(m => !c.newMethods?.includes(m)))).length;
  return { date, added, removed, modified, breaking };
}

export function buildTrendReport(entries: TrendEntry[]): TrendReport {
  return {
    entries,
    totalAdded: entries.reduce((s, e) => s + e.added, 0),
    totalRemoved: entries.reduce((s, e) => s + e.removed, 0),
    totalModified: entries.reduce((s, e) => s + e.modified, 0),
    totalBreaking: entries.reduce((s, e) => s + e.breaking, 0),
  };
}

export function formatTrendReport(report: TrendReport): string {
  const lines: string[] = ['## Route Change Trend\n'];
  lines.push('Date       | Added | Removed | Modified | Breaking');
  lines.push('-----------|-------|---------|----------|---------');
  for (const e of report.entries) {
    lines.push(`${e.date} | ${e.added}     | ${e.removed}       | ${e.modified}        | ${e.breaking}`);
  }
  lines.push('');
  lines.push(`Totals: +${report.totalAdded} -${report.totalRemoved} ~${report.totalModified} ⚠${report.totalBreaking}`);
  return lines.join('\n');
}
