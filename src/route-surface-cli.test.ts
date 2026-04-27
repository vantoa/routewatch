import { describe, it, expect } from 'vitest';
import { Command } from 'commander';
import { registerSurfaceCommand } from './route-surface-cli';
import { mkdtempSync, writeFileSync, mkdirSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

function makeProgram() {
  const p = new Command();
  p.exitOverride();
  registerSurfaceCommand(p);
  return p;
}

function makeTempDir(): string {
  return mkdtempSync(join(tmpdir(), 'rw-surface-'));
}

function writeRoute(base: string, rel: string, content = '') {
  const full = join(base, rel);
  mkdirSync(full.replace(/\/[^/]+$/, ''), { recursive: true });
  writeFileSync(full, content || 'export async function GET() {}');
}

describe('registerSurfaceCommand', () => {
  it('registers the surface command', () => {
    const p = makeProgram();
    const cmd = p.commands.find((c) => c.name() === 'surface');
    expect(cmd).toBeDefined();
  });

  it('runs against a temp project without error', async () => {
    const dir = makeTempDir();
    writeRoute(dir, 'app/api/ping/route.ts');
    writeRoute(dir, 'app/api/users/route.ts', 'export async function GET() {} export async function POST() {}');
    const p = makeProgram();
    let output = '';
    const origWrite = process.stdout.write.bind(process.stdout);
    (process.stdout.write as unknown) = (s: string) => { output += s; return true; };
    try {
      await p.parseAsync(['node', 'rw', 'surface', dir]);
    } finally {
      (process.stdout.write as unknown) = origWrite;
      rmSync(dir, { recursive: true, force: true });
    }
    expect(output).toContain('API Surface Report');
  });

  it('outputs json when --json flag is set', async () => {
    const dir = makeTempDir();
    writeRoute(dir, 'app/api/health/route.ts');
    const p = makeProgram();
    let output = '';
    const origWrite = process.stdout.write.bind(process.stdout);
    (process.stdout.write as unknown) = (s: string) => { output += s; return true; };
    try {
      await p.parseAsync(['node', 'rw', 'surface', dir, '--json']);
    } finally {
      (process.stdout.write as unknown) = origWrite;
      rmSync(dir, { recursive: true, force: true });
    }
    const parsed = JSON.parse(output);
    expect(parsed).toHaveProperty('entries');
    expect(parsed).toHaveProperty('totalScore');
  });
});
