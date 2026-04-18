import { Command } from 'commander';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { registerBaselineCommands } from './baseline-cli';
import { saveBaseline, getBaselinePath } from './baseline';
import { RouteInfo } from './scanner';

const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'baseline-cli-test-'));

const sampleRoutes: RouteInfo[] = [
  { route: '/api/hello', methods: ['GET'], filePath: 'app/api/hello/route.ts' },
];

function makeProgram() {
  const program = new Command();
  program.exitOverride();
  registerBaselineCommands(program);
  return program;
}

afterAll(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

describe('baseline-cli', () => {
  it('registers baseline subcommands', () => {
    const program = makeProgram();
    const names = program.commands.map((c) => c.name());
    expect(names).toContain('baseline');
    const baselineCmd = program.commands.find((c) => c.name() === 'baseline')!;
    const subNames = baselineCmd.commands.map((c) => c.name());
    expect(subNames).toContain('save');
    expect(subNames).toContain('diff');
    expect(subNames).toContain('delete');
    expect(subNames).toContain('show');
  });

  it('show prints error when no baseline exists', async () => {
    const program = makeProgram();
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    await expect(
      program.parseAsync(['node', 'cli', 'baseline', 'show', '-d', tmpDir])
    ).rejects.toThrow();
    expect(spy).toHaveBeenCalledWith(expect.stringContaining('No baseline found'));
    spy.mockRestore();
  });

  it('show prints routes after saving baseline', async () => {
    saveBaseline(sampleRoutes, getBaselinePath(tmpDir));
    const program = makeProgram();
    const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
    await program.parseAsync(['node', 'cli', 'baseline', 'show', '-d', tmpDir]);
    expect(spy).toHaveBeenCalledWith(expect.stringContaining('/api/hello'));
    spy.mockRestore();
  });
});
