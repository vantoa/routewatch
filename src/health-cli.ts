import { Command } from 'commander';
import path from 'path';
import { scanRoutes } from './scanner';
import { diffRoutes } from './differ';
import { computeHealth, formatHealth } from './health';

export function registerHealthCommand(program: Command): void {
  program
    .command('health <oldDir> <newDir>')
    .description('Compute an API health score between two Next.js route directories')
    .option('--json', 'Output as JSON')
    .action(async (oldDir: string, newDir: string, opts: { json?: boolean }) => {
      try {
        const oldRoutes = await scanRoutes(path.resolve(oldDir));
        const newRoutes = await scanRoutes(path.resolve(newDir));
        const changes = diffRoutes(oldRoutes, newRoutes);
        const report = computeHealth(changes);

        if (opts.json) {
          console.log(JSON.stringify(report, null, 2));
        } else {
          console.log(formatHealth(report));
        }

        if (!report.stable) {
          process.exitCode = 1;
        }
      } catch (err) {
        console.error('health error:', (err as Error).message);
        process.exit(1);
      }
    });
}
