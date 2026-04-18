import * as fs from 'fs';
import * as path from 'path';
import { DiffResult } from './differ';
import { generateReport } from './reporter';
import { formatDiff } from './formatter';

export type OutputFormat = 'text' | 'json' | 'markdown';

export interface OutputOptions {
  format: OutputFormat;
  outFile?: string;
  color?: boolean;
}

export function renderOutput(diff: DiffResult, options: OutputOptions): string {
  switch (options.format) {
    case 'json':
      return generateReport(diff, 'json');
    case 'markdown':
      return generateReport(diff, 'markdown');
    case 'text':
    default:
      return formatDiff(diff, { color: options.color ?? true });
  }
}

export function writeOutput(content: string, outFile?: string): void {
  if (outFile) {
    const dir = path.dirname(outFile);
    if (dir && dir !== '.') {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(outFile, content, 'utf-8');
  } else {
    process.stdout.write(content + '\n');
  }
}

export function handleOutput(diff: DiffResult, options: OutputOptions): void {
  const content = renderOutput(diff, options);
  writeOutput(content, options.outFile);
}
