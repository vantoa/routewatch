import { Command } from 'commander';
import { registerOwnershipCommand } from './route-ownership-cli';

function makeProgram(): Command {
  const program = new Command();
  program.exitOverride();
  registerOwnershipCommand(program);
  return program;
}

describe('registerOwnershipCommand', () => {
  it('registers the ownership command', () => {
    const program = makeProgram();
    const cmd = program.commands.find(c => c.name() === 'ownership');
    expect(cmd).toBeDefined();
  });

  it('has required dir arguments', () => {
    const program = makeProgram();
    const cmd = program.commands.find(c => c.name() === 'ownership')!;
    const args = cmd.registeredArguments;
    expect(args.length).toBeGreaterThanOrEqual(1);
  });

  it('has --rules option', () => {
    const program = makeProgram();
    const cmd = program.commands.find(c => c.name() === 'ownership')!;
    const opts = cmd.options.map(o => o.long);
    expect(opts).toContain('--rules');
  });

  it('has --format option', () => {
    const program = makeProgram();
    const cmd = program.commands.find(c => c.name() === 'ownership')!;
    const opts = cmd.options.map(o => o.long);
    expect(opts).toContain('--format');
  });

  it('has --output option', () => {
    const program = makeProgram();
    const cmd = program.commands.find(c => c.name() === 'ownership')!;
    const opts = cmd.options.map(o => o.long);
    expect(opts).toContain('--output');
  });

  it('throws on missing dir argument', () => {
    const program = makeProgram();
    expect(() =>
      program.parse(['node', 'routewatch', 'ownership'], { from: 'user' })
    ).toThrow();
  });
});
