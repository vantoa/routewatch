import { RouteChange } from './differ';
import { generateJsonReport, generateMarkdownReport } from './reporter';
import { computeStats } from './stats';
import { classifyChanges } from './severity';
import { generateSummary } from './summary';
import * as fs from 'fs';
import * as path from 'path';

export type ExportFormat = 'json' | 'markdown' | 'csv';

export interface ExportOptions {
  format: ExportFormat;
  outputPath: string;
  includeSummary?: boolean;
  includeStats?: boolean;
}

export function exportToCsv(changes: RouteChange[]): string {
  const header = 'type,route,methods_before,methods_after';
  const rows = changes.map((c) => {
    const before = c.methodsBefore ? c.methodsBefore.join('|') : '';
    const after = c.methodsAfter ? c.methodsAfter.join('|') : '';
    return `${c.type},${c.route},${before},${after}`;
  });
  return [header, ...rows].join('\n');
}

export function exportChanges(changes: RouteChange[], options: ExportOptions): string {
  const { format, includeSummary, includeStats } = options;

  let content: string;

  if (format === 'json') {
    const payload: Record<string, unknown> = { changes };
    if (includeStats) payload.stats = computeStats(changes);
    if (includeSummary) payload.summary = generateSummary(changes);
    payload.severity = classifyChanges(changes);
    content = JSON.stringify(payload, null, 2);
  } else if (format === 'markdown') {
    content = generateMarkdownReport(changes);
    if (includeStats) {
      const { computeStats, formatStats } = require('./stats');
      content += '\n\n' + formatStats(computeStats(changes));
    }
  } else {
    content = exportToCsv(changes);
  }

  return content;
}

export function writeExport(changes: RouteChange[], options: ExportOptions): void {
  const content = exportChanges(changes, options);
  const dir = path.dirname(options.outputPath);
  if (dir && dir !== '.') fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(options.outputPath, content, 'utf-8');
}
