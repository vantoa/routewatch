import { Command } from 'commander';
import { registerBottleneckCommand } from './route-bottleneck-cli';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

function makeProgram(): Command {
  const p = new Command();
  p.exitOverride();
  registerBottleneckCommand(p);
  return p;
}

function makeTempDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'bottleneck-cli-'));
}

function writeRoute(dir: string, rel: string, content = 'export async function GET() {}'): void {
  const full = path.join(dir, rel);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, content);
}

describe('registerBottleneckCommand', () => {
  let tmpDir: string;
  let spy: jest.SpyInstance;

  beforeEach(() => {
    tmpDir = makeTempDir();
    spy = jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
    spy.mockRestore();
  });

  it('runs without history and prints output', async () => {
    writeRoute(tmpDir, 'app/api/[org]/[repo]/[id]/route.ts',
      'export async function GET() {} export async function POST() {} export async function PUT() {} export async function DELETE() {}');
    const program = makeProgram();
    await program.parseAsync(['bottleneck', tmpDir], { from: 'user' });
    expect(spy).toHaveBeenCalled();
  });

  it('outputs JSON when --json flag is set', async () => {
    writeRoute(tmpDir, 'app/api/[a]/[b]/[c]/route.ts',
      'export async function GET() {} export async function POST() {} export async function PUT() {} export async function DELETE() {}');
    const program = makeProgram();
    await program.parseAsync(['bottleneck', tmpDir, '--json'], { from: 'user' });
    const output = spy.mock.calls[0][0];
    const parsed = JSON.parse(output);
    expect(parsed).toHaveProperty('entries');
    expect(parsed).toHaveProperty('topBottleneck');
  });

  it('limits output to --top N entries', async () => {
    for (let i = 0; i < 5; i++) {
      writeRoute(tmpDir, `app/api/[a${i}]/[b${i}]/[c${i}]/route.ts`,
        'export async function GET() {} export async function POST() {} export async function PUT() {} export async function DELETE() {}');
    }
    const program = makeProgram();
    await program.parseAsync(['bottleneck', tmpDir, '--json', '--top', '2'], { from: 'user' });
    const output = spy.mock.calls[0][0];
    const parsed = JSON.parse(output);
    expect(parsed.entries.length).toBeLessThanOrEqual(2);
  });
});
