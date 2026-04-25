import { Command } from 'commander';
import { registerBloomCommand } from './route-bloom-cli';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

function makeProgram() {
  const p = new Command();
  p.exitOverride();
  registerBloomCommand(p);
  return p;
}

function makeTempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'bloom-test-'));
}

function writeRoute(dir: string, name: string, content: string) {
  const full = path.join(dir, name);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, content);
}

function cleanup(...dirs: string[]) {
  for (const d of dirs) fs.rmSync(d, { recursive: true, force: true });
}

describe('registerBloomCommand', () => {
  it('registers bloom command', () => {
    const p = makeProgram();
    const cmd = p.commands.find((c) => c.name() === 'bloom');
    expect(cmd).toBeDefined();
  });

  it('runs without error on empty dirs', async () => {
    const oldDir = makeTempDir();
    const newDir = makeTempDir();
    try {
      const p = makeProgram();
      const logs: string[] = [];
      jest.spyOn(console, 'log').mockImplementation((m) => logs.push(m));
      await p.parseAsync(['node', 'rw', 'bloom', oldDir, newDir]);
      expect(logs.join('')).toContain('No new routes');
    } finally {
      cleanup(oldDir, newDir);
      jest.restoreAllMocks();
    }
  });

  it('outputs JSON when --json flag is set', async () => {
    const oldDir = makeTempDir();
    const newDir = makeTempDir();
    writeRoute(newDir, 'app/api/users/route.ts', 'export async function GET() {}');
    try {
      const p = makeProgram();
      const logs: string[] = [];
      jest.spyOn(console, 'log').mockImplementation((m) => logs.push(m));
      await p.parseAsync(['node', 'rw', 'bloom', oldDir, newDir, '--json']);
      const parsed = JSON.parse(logs[0]);
      expect(parsed).toHaveProperty('entries');
      expect(parsed).toHaveProperty('topGrowing');
    } finally {
      cleanup(oldDir, newDir);
      jest.restoreAllMocks();
    }
  });
});
