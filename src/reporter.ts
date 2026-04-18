import { DiffResult } from './differ';
import { formatDiff } from './formatter';
import * as fs from 'fs';
import * as path from 'path';

export type ReportFormat = 'text' | 'json' | 'markdown';

export interface ReportOptions {
  format: ReportFormat;
  outputFile?: string;
}

export function generateJsonReport(diff: DiffResult): string {
  return JSON.stringify(diff, null, 2);
}

export function generateMarkdownReport(diff: DiffResult): string {
  const lines: string[] = ['# API Route Diff Report', ''];

  if (diff.added.length === 0 && diff.removed.length === 0 && diff.changed.length === 0) {
    lines.push('_No route changes detected._');
    return lines.join('\n');
  }

  if (diff.added.length > 0) {
    lines.push('## Added Routes', '');
    for (const route of diff.added) {
      lines.push(`- \`${route.path}\` — ${route.methods.join(', ')}`);
    }
    lines.push('');
  }

  if (diff.removed.length > 0) {
    lines.push('## Removed Routes', '');
    for (const route of diff.removed) {
      lines.push(`- \`${route.path}\` — ${route.methods.join(', ')}`);
    }
    lines.push('');
  }

  if (diff.changed.length > 0) {
    lines.push('## Changed Routes', '');
    for (const change of diff.changed) {
      lines.push(`- \`${change.path}\``);
      if (change.addedMethods.length > 0) lines.push(`  - Added methods: ${change.addedMethods.join(', ')}`);
      if (change.removedMethods.length > 0) lines.push(`  - Removed methods: ${change.removedMethods.join(', ')}`);
    }
    lines.push('');
  }

  return lines.join('\n');
}

export function writeReport(content: string, outputFile: string): void {
  const dir = path.dirname(outputFile);
  if (dir && dir !== '.') fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(outputFile, content, 'utf-8');
}

export function generateReport(diff: DiffResult, options: ReportOptions): string {
  let content: string;
  if (options.format === 'json') content = generateJsonReport(diff);
  else if (options.format === 'markdown') content = generateMarkdownReport(diff);
  else content = formatDiff(diff);

  if (options.outputFile) writeReport(content, options.outputFile);
  return content;
}
