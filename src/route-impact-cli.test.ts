import { Command } from 'commander';
import { registerImpactCommand } from './route-impact-cli';

function makeProgram() {
  const program = new Command();
  program.exitOverride();
  registerImpactCommand(program);
  return program;
}

describe('registerImpactCommand', () => {
  it('registers the impact command', () => {
    const program = makeProgram();
    const cmd = program.commands.find(c => c.name() === 'impact');
    expect(cmd).toBeDefined();
  });

  it('impact command has oldDir and newDir args', () => {
    const program = makeProgram();
    const cmd = program.commands.find(c => c.name() === 'impact')!;
    expect(cmd.registeredArguments.length).toBe(2);
  });

  it('impact command has --json option', () => {
    const program = makeProgram();
    const cmd = program.commands.find(c => c.name() === 'impact')!;
    const opt = cmd.options.find(o => o.long === '--json');
    expect(opt).toBeDefined();
  });

  it('impact command has --min-score option', () => {
    const program = makeProgram();
    const cmd = program.commands.find(c => c.name() === 'impact')!;
    const opt = cmd.options.find(o => o.long === '--min-score');
    expect(opt).toBeDefined();
  });
});
