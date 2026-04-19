import * as fs from 'fs';
import * as path from 'path';
import { RouteChange } from './differ';

export interface ReplayEntry {
  timestamp: string;
  label: string;
  changes: RouteChange[];
}

export interface ReplayReport {
  entries: ReplayEntry[];
  total: number;
}

export function loadReplayLog(filePath: string): ReplayEntry[] {
  if (!fs.existsSync(filePath)) return [];
  const raw = fs.readFileSync(filePath, 'utf-8');
  try {
    return JSON.parse(raw) as ReplayEntry[];
  } catch {
    return [];
  }
}

export function appendReplayEntry(filePath: string, entry: ReplayEntry): void {
  const entries = loadReplayLog(filePath);
  entries.push(entry);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(entries, null, 2));
}

export function buildReplayReport(entries: ReplayEntry[]): ReplayReport {
  return { entries, total: entries.length };
}

export function formatReplayReport(report: ReplayReport): string {
  if (report.total === 0) return 'No replay entries found.';
  const lines: string[] = [`Replay log (${report.total} entries):\n`];
  for (const entry of report.entries) {
    lines.push(`[${entry.timestamp}] ${entry.label} — ${entry.changes.length} change(s)`);
    for (const c of entry.changes) {
      lines.push(`  ${c.type.toUpperCase()} ${c.route} [${c.methods?.join(', ') ?? ''}]`);
    }
  }
  return lines.join('\n');
}
