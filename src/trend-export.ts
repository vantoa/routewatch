import * as fs from 'fs';
import * as path from 'path';
import { TrendReport, TrendEntry } from './trend';

export function trendToCsv(report: TrendReport): string {
  const header = 'date,added,removed,modified,total';
  const rows = report.entries.map((e: TrendEntry) =>
    `${e.date},${e.added},${e.removed},${e.modified},${e.total}`
  );
  return [header, ...rows].join('\n');
}

export function writeTrendCsv(report: TrendReport, outPath: string): void {
  const csv = trendToCsv(report);
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, csv, 'utf-8');
}

export function appendTrendEntry(filePath: string, entry: TrendEntry): void {
  let entries: TrendEntry[] = [];
  if (fs.existsSync(filePath)) {
    try {
      entries = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    } catch {
      entries = [];
    }
  }
  entries.push(entry);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(entries, null, 2), 'utf-8');
}
