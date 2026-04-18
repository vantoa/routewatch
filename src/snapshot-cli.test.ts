import { Command } from 'commander';
import { registerSnapshotCommands } from './snapshot-cli';
import * as snapshotMod from './snapshot';
import * as scannerMod from './scanner';
import * as differMod from './differ';
import * as formatterMod from './formatter';

function makeProgram() {
  const program = new Command();
  program.exitOverride();
  registerSnapshotCommands(program);
  return program;
}

describe('snapshot-cli', () => {
  beforeEach(() => jest.restoreAllMocks());

  it('save: scans and saves snapshot', async () => {
    const routes = [{ path: '/api/users', methods: ['GET'] }];
    jest.spyOn(scannerMod, 'scanRoutes').mockResolvedValue(routes as any);
    const create = jest.spyOn(snapshotMod, 'createSnapshot').mockReturnValue({ name: 'v1', routes, createdAt: Date.now() } as any);
    const save = jest.spyOn(snapshotMod, 'saveSnapshot').mockResolvedValue(undefined);
    const log = jest.spyOn(console, 'log').mockImplementation();

    await makeProgram().parseAsync(['node', 'test', 'snapshot', 'save', 'v1', './app']);

    expect(create).toHaveBeenCalledWith('v1', routes);
    expect(save).toHaveBeenCalled();
    expect(log).toHaveBeenCalledWith(expect.stringContaining('v1'));
  });

  it('diff: prints no changes when identical', async () => {
    const routes = [{ path: '/api/users', methods: ['GET'] }];
    jest.spyOn(snapshotMod, 'loadSnapshot').mockResolvedValue({ name: 'v1', routes, createdAt: Date.now() } as any);
    jest.spyOn(scannerMod, 'scanRoutes').mockResolvedValue(routes as any);
    jest.spyOn(differMod, 'diffRoutes').mockReturnValue([]);
    const log = jest.spyOn(console, 'log').mockImplementation();

    await makeProgram().parseAsync(['node', 'test', 'snapshot', 'diff', 'v1', './app']);

    expect(log).toHaveBeenCalledWith('No changes since snapshot.');
  });

  it('diff: exits with error when snapshot missing', async () => {
    jest.spyOn(snapshotMod, 'loadSnapshot').mockResolvedValue(null);
    jest.spyOn(console, 'error').mockImplementation();
    const exit = jest.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });

    await expect(makeProgram().parseAsync(['node', 'test', 'snapshot', 'diff', 'missing', './app'])).rejects.toThrow('exit');
    expect(exit).toHaveBeenCalledWith(1);
  });

  it('list: shows snapshots', async () => {
    jest.spyOn(snapshotMod, 'listSnapshots').mockResolvedValue([
      { name: 'v1', routes: [], createdAt: new Date('2024-01-01').getTime() }
    ] as any);
    const log = jest.spyOn(console, 'log').mockImplementation();

    await makeProgram().parseAsync(['node', 'test', 'snapshot', 'list']);

    expect(log).toHaveBeenCalledWith(expect.stringContaining('v1'));
  });
});
