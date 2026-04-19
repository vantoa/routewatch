import { Command } from 'commander';
import { registerWatchDiffCommand } from './watch-diff-cli';

function makeProgram() {
  const program = new Command();
  program.exitOverride();
  registerWatchDiffCommand(program);
  return program;
}

test('registers watch-diff command', () => {
  const program = makeProgram();
  const cmd = program.commands.find((c) => c.name() === 'watch-diff');
  expect(cmd).toBeDefined();
});

test('watch-diff command has interval option', () => {
  const program = makeProgram();
  const cmd = program.commands.find((c) => c.name() === 'watch-diff')!;
  const opt = cmd.options.find((o) => o.long === '--interval');
  expect(opt).toBeDefined();
});
