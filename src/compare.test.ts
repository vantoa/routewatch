import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { compareDirectories } from './compare';

function makeTempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'rw-compare-'));
}

function writeRoute(dir: string, rel: string, content: string) {
  const full = path.join(dir, rel);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, content);
}

function cleanup(...dirs: string[]) {
  for (const d of dirs) fs.rmSync(d, { recursive: true, force: true });
}

describe('compareDirectories', () => {
  let baseDir: string;
  let headDir: string;

  beforeEach(() => {
    baseDir = makeTempDir();
    headDir = makeTempDir();
  });

  afterEach(() => cleanup(baseDir, headDir));

  it('detects added routes', async () => {
    writeRoute(headDir, 'app/api/users/route.ts', 'export function GET() {}');
    const result = await compareDirectories({ baseDir, headDir });
    expect(result.changes.some((c) => c.status === 'added')).toBe(true);
    expect(result.headCount).toBe(1);
    expect(result.baseCount).toBe(0);
  });

  it('detects removed routes', async () => {
    writeRoute(baseDir, 'app/api/users/route.ts', 'export function GET() {}');
    const result = await compareDirectories({ baseDir, headDir });
    expect(result.changes.some((c) => c.status === 'removed')).toBe(true);
  });

  it('detects modified routes', async () => {
    writeRoute(baseDir, 'app/api/users/route.ts', 'export function GET() {}');
    writeRoute(headDir, 'app/api/users/route.ts', 'export function GET() {}\nexport function POST() {}');
    const result = await compareDirectories({ baseDir, headDir });
    expect(result.changes.some((c) => c.status === 'modified')).toBe(true);
  });

  it('returns empty changes when directories are identical', async () => {
    writeRoute(baseDir, 'app/api/health/route.ts', 'export function GET() {}');
    writeRoute(headDir, 'app/api/health/route.ts', 'export function GET() {}');
    const result = await compareDirectories({ baseDir, headDir });
    expect(result.changes).toHaveLength(0);
  });
});
