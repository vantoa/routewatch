import { Command } from 'commander';
import { registerChurnCommand } from './route-churn-cli';
import * as snapshot from './snapshot';
import * as differ from './differ';
import * as churn from './route-churn';

function makeProgram() {
  const program = new Command();
  program.exitOverride();
  registerChurnCommand(program);
  return program;
}

describe('registerChurnCommand', () => {
  afterEach(() => jest.restoreAllMocks());

  it('registers the churn command', () => {
    const program = makeProgram();
    const cmd = program.commands.find(c => c.name() === 'churn');
    expect(cmd).toBeDefined();
  });

  it('exits with error when fewer than 2 snapshots provided', async () => {
    const program = makeProgram();
    jest.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });
    await expect(
      program.parseAsync(['node', 'test', 'churn', 'snap1'])
    ).rejects.toThrow('exit');
  });

  it('prints formatted report for two snapshots', async () => {
    const fakeSnapshot = { routes: [{ path: '/api/test', methods: ['GET'] }] };
    jest.spyOn(snapshot, 'loadSnapshot').mockResolvedValue(fakeSnapshot as any);
    jest.spyOn(differ, 'diffRoutes').mockReturnValue([{ path: '/api/test', status: 'modified', methods: ['GET'], addedMethods: [], removedMethods: [] } as any]);
    jest.spyOn(churn, 'buildChurnReport').mockReturnValue({ entries: [], totalChurn: 0, mostChurned: null });
    jest.spyOn(churn, 'formatChurnReport').mockReturnValue('churn output');
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

    const program = makeProgram();
    await program.parseAsync(['node', 'test', 'churn', 'snap1', 'snap2']);

    expect(consoleSpy).toHaveBeenCalledWith('churn output');
  });

  it('outputs JSON when --json flag is passed', async () => {
    const fakeSnapshot = { routes: [] };
    jest.spyOn(snapshot, 'loadSnapshot').mockResolvedValue(fakeSnapshot as any);
    jest.spyOn(differ, 'diffRoutes').mockReturnValue([]);
    const report = { entries: [], totalChurn: 0, mostChurned: null };
    jest.spyOn(churn, 'buildChurnReport').mockReturnValue(report);
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

    const program = makeProgram();
    await program.parseAsync(['node', 'test', 'churn', 'snap1', 'snap2', '--json']);

    expect(consoleSpy).toHaveBeenCalledWith(JSON.stringify(report, null, 2));
  });
});
