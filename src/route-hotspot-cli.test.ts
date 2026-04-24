import { Command } from 'commander';
import { writeFileSync, mkdtempSync, rmSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { registerHotspotCommand } from './route-hotspot-cli';
import * as hotspot from './route-hotspot';

function makeProgram() {
  const program = new Command();
  program.exitOverride();
  registerHotspotCommand(program);
  return program;
}

describe('registerHotspotCommand', () => {
  let tmpDir: string;
  let historyFile: string;

  beforeEach(() => {
    tmpDir = mkdtempSync(join(tmpdir(), 'routewatch-hotspot-'));
    historyFile = join(tmpDir, 'history.json');
    writeFileSync(historyFile, JSON.stringify([]));
    jest.spyOn(hotspot, 'buildHotspotReport').mockReturnValue({ hotspots: [], total: 0 } as any);
    jest.spyOn(hotspot, 'formatHotspotReport').mockReturnValue('No hotspots.');
  });

  afterEach(() => {
    jest.restoreAllMocks();
    rmSync(tmpDir, { recursive: true, force: true });
  });

  it('registers hotspot command', () => {
    const program = makeProgram();
    const cmd = program.commands.find(c => c.name() === 'hotspot');
    expect(cmd).toBeDefined();
  });

  it('calls buildHotspotReport with parsed history', async () => {
    const program = makeProgram();
    await program.parseAsync(['node', 'test', 'hotspot', '--history', historyFile]);
    expect(hotspot.buildHotspotReport).toHaveBeenCalledWith([], 10);
  });

  it('respects --top option', async () => {
    const program = makeProgram();
    await program.parseAsync(['node', 'test', 'hotspot', '--history', historyFile, '--top', '5']);
    expect(hotspot.buildHotspotReport).toHaveBeenCalledWith([], 5);
  });

  it('outputs JSON when --json flag is set', async () => {
    const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
    const program = makeProgram();
    await program.parseAsync(['node', 'test', 'hotspot', '--history', historyFile, '--json']);
    const output = spy.mock.calls[0][0];
    expect(() => JSON.parse(output)).not.toThrow();
    spy.mockRestore();
  });
});
