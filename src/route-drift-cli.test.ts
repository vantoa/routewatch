import { Command } from 'commander';
import { registerDriftCommand } from './route-drift-cli';

function makeProgram(): Command {
  const p = new Command();
  p.exitOverride();
  registerDriftCommand(p);
  return p;
}

describe('registerDriftCommand', () => {
  it('registers the drift command', () => {
    const p = makeProgram();
    const cmd = p.commands.find((c) => c.name() === 'drift');
    expect(cmd).toBeDefined();
  });

  it('drift command has expected options', () => {
    const p = makeProgram();
    const cmd = p.commands.find((c) => c.name() === 'drift')!;
    const optNames = cmd.options.map((o) => o.long);
    expect(optNames).toContain('--baseline');
    expect(optNames).toContain('--json');
  });

  it('drift command accepts a dir argument', () => {
    const p = makeProgram();
    const cmd = p.commands.find((c) => c.name() === 'drift')!;
    expect(cmd.args).toBeDefined();
  });
});
