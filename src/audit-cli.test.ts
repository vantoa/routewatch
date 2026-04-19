import { Command } from 'commander';
import { registerAuditCommand } from './audit-cli';
import * as audit from './audit';
import * as scanner from './scanner';
import * as differ from './differ';

function makeProgram() {
  const program = new Command();
  program.exitOverride();
  registerAuditCommand(program);
  return program;
}

const fakeRoutes = [{ route: '/api/test', methods: ['GET'] }];
const fakeChanges = [
  {
    route: '/api/test',
    status: 'removed' as const,
    before: { route: '/api/test', methods: ['GET'] },
    after: undefined,
  },
];

beforeEach(() => {
  jest.spyOn(scanner, 'scanRoutes').mockResolvedValue(fakeRoutes);
  jest.spyOn(differ, 'diffRoutes').mockReturnValue(fakeChanges);
});

afterEach(() => jest.restoreAllMocks());

describe('registerAuditCommand', () => {
  it('registers audit command', () => {
    const program = makeProgram();
    const cmd = program.commands.find((c) => c.name() === 'audit');
    expect(cmd).toBeDefined();
  });

  it('calls scanRoutes for both dirs and diffs them', async () => {
    const program = makeProgram();
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    await program.parseAsync(['node', 'rw', 'audit', './old', './new']);
    expect(scanner.scanRoutes).toHaveBeenCalledWith('./old');
    expect(scanner.scanRoutes).toHaveBeenCalledWith('./new');
    expect(differ.diffRoutes).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it('outputs JSON when --json flag is passed', async () => {
    const program = makeProgram();
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    await program.parseAsync(['node', 'rw', 'audit', './old', './new', '--json']);
    const output = consoleSpy.mock.calls.map((c) => c[0]).join('');
    expect(output).toContain('generatedAt');
    consoleSpy.mockRestore();
  });

  it('prints no changes message when diff is empty', async () => {
    jest.spyOn(differ, 'diffRoutes').mockReturnValue([]);
    const program = makeProgram();
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    await program.parseAsync(['node', 'rw', 'audit', './old', './new']);
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('No route changes'));
    consoleSpy.mockRestore();
  });
});
