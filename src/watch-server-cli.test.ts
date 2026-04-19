import { Command } from 'commander';
import { registerWatchServerCommand } from './watch-server-cli';

function makeProgram() {
  const program = new Command();
  program.exitOverride();
  registerWatchServerCommand(program);
  return program;
}

describe('registerWatchServerCommand', () => {
  it('registers watch-server command', () => {
    const program = makeProgram();
    const cmd = program.commands.find((c) => c.name() === 'watch-server');
    expect(cmd).toBeDefined();
  });

  it('has port option', () => {
    const program = makeProgram();
    const cmd = program.commands.find((c) => c.name() === 'watch-server')!;
    const portOpt = cmd.options.find((o) => o.long === '--port');
    expect(portOpt).toBeDefined();
  });

  it('has host option', () => {
    const program = makeProgram();
    const cmd = program.commands.find((c) => c.name() === 'watch-server')!;
    const hostOpt = cmd.options.find((o) => o.long === '--host');
    expect(hostOpt).toBeDefined();
  });

  it('requires a directory argument', () => {
    const program = makeProgram();
    const cmd = program.commands.find((c) => c.name() === 'watch-server')!;
    expect(cmd.registeredArguments.length).toBeGreaterThan(0);
    expect(cmd.registeredArguments[0].name()).toBe('dir');
  });
});
