import { Command } from 'commander';
import { registerRedundancyCommand } from './route-redundancy-cli';
import * as redundancyModule from './route-redundancy';
import * as scannerModule from './scanner';

function makeProgram(): Command {
  const p = new Command();
  p.exitOverride();
  registerRedundancyCommand(p);
  return p;
}

describe('registerRedundancyCommand', () => {
  let consoleSpy: jest.SpyInstance;
  let exitSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    exitSpy = jest.spyOn(process, 'exit').mockImplementation((() => {}) as any);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('outputs formatted report when no redundancy found', async () => {
    jest.spyOn(scannerModule, 'scanRoutes').mockResolvedValue([
      { path: '/api/a', methods: ['GET'] },
    ]);
    jest.spyOn(redundancyModule, 'buildRedundancyReport').mockReturnValue({
      pairs: [],
      totalRoutes: 1,
      redundantRoutes: 0,
    });
    jest.spyOn(redundancyModule, 'formatRedundancyReport').mockReturnValue('No redundant routes detected.');

    const program = makeProgram();
    await program.parseAsync(['node', 'cli', 'redundancy', './app']);

    expect(consoleSpy).toHaveBeenCalledWith('No redundant routes detected.');
    expect(exitSpy).not.toHaveBeenCalled();
  });

  it('exits with code 1 when redundant pairs found', async () => {
    jest.spyOn(scannerModule, 'scanRoutes').mockResolvedValue([
      { path: '/api/a/[id]', methods: ['GET'] },
      { path: '/api/a/[slug]', methods: ['GET'] },
    ]);
    jest.spyOn(redundancyModule, 'buildRedundancyReport').mockReturnValue({
      pairs: [{ a: { path: '/api/a/[id]', methods: ['GET'] }, b: { path: '/api/a/[slug]', methods: ['GET'] }, reason: 'Duplicate', score: 1 }],
      totalRoutes: 2,
      redundantRoutes: 2,
    });
    jest.spyOn(redundancyModule, 'formatRedundancyReport').mockReturnValue('Found 1 pair');

    const program = makeProgram();
    await program.parseAsync(['node', 'cli', 'redundancy', './app']);

    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it('outputs JSON when --json flag is set', async () => {
    jest.spyOn(scannerModule, 'scanRoutes').mockResolvedValue([]);
    const mockReport = { pairs: [], totalRoutes: 0, redundantRoutes: 0 };
    jest.spyOn(redundancyModule, 'buildRedundancyReport').mockReturnValue(mockReport);

    const program = makeProgram();
    await program.parseAsync(['node', 'cli', 'redundancy', './app', '--json']);

    expect(consoleSpy).toHaveBeenCalledWith(JSON.stringify(mockReport, null, 2));
  });
});
