import { Command } from 'commander';
import { startWatchDiff } from './watch-diff';
import { formatDiff } from './formatter';
import * as path from 'path';

export function registerWatchDiffCommand(program: Command): void {
  program
    .command('watch-diff <dir>')
    .description('Watch a Next.js project and print route diffs on change')
    .option('--interval <ms>', 'polling interval in ms', '1000')
    .action((dir: string, opts: { interval: string }) => {
      const absDir = path.resolve(dir);
      const interval = parseInt(opts.interval, 10);
      console.log(`Watching ${absDir} for route changes...`);

      startWatchDiff({
        dir: absDir,
        interval,
        onDiff: (diff) => {
          console.log('\n--- Route Diff Detected ---');
          console.log(formatDiff(diff));
        },
        onError: (err) => {
          console.error('watch-diff error:', err.message);
        },
      });
    });
}
