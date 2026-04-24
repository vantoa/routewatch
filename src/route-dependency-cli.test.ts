import { Command } from 'commander';
import { registerDependencyCommand } from './route-dependency-cli';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

function makeProgram(): Command {
  const p = new Command();
  p.exitOverride();
  registerDependencyCommand(p);
  return p;
}

function makeTempDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'rw-dep-'));
}

function writeRoute(dir: string, relPath: string, content = ''): void {
  const full = path.join(dir, relPath);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, content || 'export async function GET() {}');
}

function cleanup(dir: string): void {
  fs.rmSync(dir, { recursive: true, force: true });
}

describe('registerDependencyCommand', () => {
  let dir: string;

  beforeEach(() => {
    dir = makeTempDir();
    writeRoute(dir, 'app/api/users/route.ts', 'export async function GET() {} export async function POST() {}');
    writeRoute(dir, 'app/api/users/[id]/route.ts', 'export async function GET() {} export async function DELETE() {}');
    writeRoute(dir, 'app/health/route.ts', 'export async function GET() {}');
  });

  afterEach(() => cleanup(dir));

  it('runs without error', async () => {
    const p = makeProgram();
    await expect(p.parseAsync(['dependency', dir], { from: 'user' })).resolves.not.toThrow();
  });

  it('outputs json when --json flag is set', async () => {
    const logs: string[] = [];
    jest.spyOn(process.stdout, 'write').mockImplementation((s: any) => { logs.push(s); return true; });
    const p = makeProgram();
    await p.parseAsync(['dependency', dir, '--json'], { from: 'user' });
    jest.restoreAllMocks();
    const combined = logs.join('');
    const parsed = JSON.parse(combined);
    expect(parsed).toHaveProperty('dependencies');
    expect(parsed).toHaveProperty('isolated');
    expect(parsed).toHaveProperty('hubs');
  });

  it('outputs only hubs with --hubs-only', async () => {
    const logs: string[] = [];
    jest.spyOn(process.stdout, 'write').mockImplementation((s: any) => { logs.push(s); return true; });
    const p = makeProgram();
    await p.parseAsync(['dependency', dir, '--hubs-only'], { from: 'user' });
    jest.restoreAllMocks();
    expect(logs.join('')).toContain('Hubs');
  });

  it('outputs isolated routes with --isolated-only', async () => {
    const logs: string[] = [];
    jest.spyOn(process.stdout, 'write').mockImplementation((s: any) => { logs.push(s); return true; });
    const p = makeProgram();
    await p.parseAsync(['dependency', dir, '--isolated-only'], { from: 'user' });
    jest.restoreAllMocks();
    expect(logs.join('')).toContain('Isolated');
  });
});
