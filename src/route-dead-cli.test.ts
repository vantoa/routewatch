import { Command } from 'commander';
import { registerDeadCommand } from './route-dead-cli';
import * as scanner from './scanner';
import * as dead from './route-dead';

function makeProgram() {
  const program = new Command();
  program.exitOverride();
  registerDeadCommand(program);
  return program;
}

describe('registerDeadCommand', () => {
  beforeEach(() => {
    jest.spyOn(scanner, 'scanRoutes').mockResolvedValue([]);
    jest.spyOn(dead, 'detectDeadRoutes').mockReturnValue({ dead: [], total: 0, thresholdDays: 180 });
    jest.spyOn(dead, 'formatDeadRouteReport').mockReturnValue('No dead routes found.');
  });

  afterEach(() => jest.restoreAllMocks());

  it('registers dead command', () => {
    const program = makeProgram();
    const cmd = program.commands.find(c => c.name() === 'dead');
    expect(cmd).toBeDefined();
  });

  it('calls scanRoutes with provided dir', async () => {
    const program = makeProgram();
    await program.parseAsync(['node', 'test', 'dead', '/some/dir']);
    expect(scanner.scanRoutes).toHaveBeenCalledWith('/some/dir');
  });

  it('outputs JSON when --json flag is set', async () => {
    const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
    const program = makeProgram();
    await program.parseAsync(['node', 'test', 'dead', '/some/dir', '--json']);
    const output = spy.mock.calls[0][0];
    expect(() => JSON.parse(output)).not.toThrow();
    spy.mockRestore();
  });

  it('uses default threshold of 180', async () => {
    const program = makeProgram();
    await program.parseAsync(['node', 'test', 'dead', '/some/dir']);
    expect(dead.detectDeadRoutes).toHaveBeenCalledWith([], [], 180);
  });

  it('respects custom threshold', async () => {
    const program = makeProgram();
    await program.parseAsync(['node', 'test', 'dead', '/some/dir', '--threshold', '90']);
    expect(dead.detectDeadRoutes).toHaveBeenCalledWith([], [], 90);
  });
});
