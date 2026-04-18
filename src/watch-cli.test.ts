import { Command } from 'commander';
import { registerWatchCommand } from './watch-cli';

describe('registerWatchCommand', () => {
  it('registers a watch command on the program', () => {
    const program = new Command();
    registerWatchCommand(program);
    const cmd = program.commands.find((c) => c.name() === 'watch');
    expect(cmd).toBeDefined();
  });

  it('watch command has correct description', () => {
    const program = new Command();
    registerWatchCommand(program);
    const cmd = program.commands.find((c) => c.name() === 'watch')!;
    expect(cmd.description()).toBe('Watch for API route changes in a Next.js project');
  });

  it('watch command accepts debounce option', () => {
    const program = new Command();
    registerWatchCommand(program);
    const cmd = program.commands.find((c) => c.name() === 'watch')!;
    const debounceOpt = cmd.options.find((o) => o.long === '--debounce');
    expect(debounceOpt).toBeDefined();
  });

  it('watch command accepts report option', () => {
    const program = new Command();
    registerWatchCommand(program);
    const cmd = program.commands.find((c) => c.name() === 'watch')!;
    const reportOpt = cmd.options.find((o) => o.long === '--report');
    expect(reportOpt).toBeDefined();
  });

  it('watch command accepts out option', () => {
    const program = new Command();
    registerWatchCommand(program);
    const cmd = program.commands.find((c) => c.name() === 'watch')!;
    const outOpt = cmd.options.find((o) => o.long === '--out');
    expect(outOpt).toBeDefined();
  });
});
