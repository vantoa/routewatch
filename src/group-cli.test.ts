import { Command } from 'commander';
import { registerGroupCommand } from './group-cli';
import * as scanner from './scanner';
import * as differ from './differ';
import * as group from './group';

function makeProgram() {
  const program = new Command();
  program.exitOverride();
  registerGroupCommand(program);
  return program;
}

const mockDiff = [
  { type: 'added' as const, route: '/api/users', methods: ['GET'] },
  { type: 'removed' as const, route: '/api/old', methods: ['POST'] },
];

beforeEach(() => {
  jest.spyOn(scanner, 'scanRoutes').mockResolvedValue([]);
  jest.spyOn(differ, 'diffRoutes').mockReturnValue(mockDiff);
});

afterEach(() => jest.restoreAllMocks());

describe('registerGroupCommand', () => {
  it('registers group command', () => {
    const program = makeProgram();
    const cmd = program.commands.find(c => c.name() === 'group');
    expect(cmd).toBeDefined();
  });

  it('calls groupChanges with default status key', async () => {
    const spy = jest.spyOn(group, 'groupChanges').mockReturnValue([]);
    const program = makeProgram();
    await program.parseAsync(['node', 'cli', 'group', './before', './after']);
    expect(spy).toHaveBeenCalledWith(mockDiff, 'status');
  });

  it('calls groupChanges with provided key', async () => {
    const spy = jest.spyOn(group, 'groupChanges').mockReturnValue([]);
    const program = makeProgram();
    await program.parseAsync(['node', 'cli', 'group', './before', './after', '--by', 'prefix']);
    expect(spy).toHaveBeenCalledWith(mockDiff, 'prefix');
  });

  it('prints no changes message when empty', async () => {
    jest.spyOn(group, 'groupChanges').mockReturnValue([]);
    const log = jest.spyOn(console, 'log').mockImplementation(() => {});
    const program = makeProgram();
    await program.parseAsync(['node', 'cli', 'group', './before', './after']);
    expect(log).toHaveBeenCalledWith('No changes found.');
    log.mockRestore();
  });
});
