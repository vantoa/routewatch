import * as fs from 'fs';
import * as path from 'path';

export interface IgnoreConfig {
  patterns: string[];
}

const DEFAULT_IGNORE: string[] = [
  '**/node_modules/**',
  '**/.next/**',
  '**/dist/**',
];

export function loadIgnoreFile(dir: string): string[] {
  const ignorePath = path.join(dir, '.routewatchignore');
  if (!fs.existsSync(ignorePath)) return [];
  const lines = fs.readFileSync(ignorePath, 'utf-8').split('\n');
  return lines
    .map(l => l.trim())
    .filter(l => l.length > 0 && !l.startsWith('#'));
}

export function buildIgnoreList(dir: string, extra: string[] = []): string[] {
  const fromFile = loadIgnoreFile(dir);
  return [...DEFAULT_IGNORE, ...fromFile, ...extra];
}

export function isIgnored(filePath: string, patterns: string[]): boolean {
  const { matchesAnyPattern } = require('./filter');
  return matchesAnyPattern(filePath, patterns);
}
