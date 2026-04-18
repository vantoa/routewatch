import { Command } from 'commander';
import { scanRoutes } from './scanner';
import { diffRoutes } from './differ';
import { loadBaseline } from './baseline';
import { computeStats, formatStats } from './stats';

export function registerStatsCommand(program: Command): void {
  program
    .command('stats <appDir>')
    .description('Show summary statistics of route changes against the saved baseline')
    .option('--baseline <name>', 'Baseline name to compare against', 'default')
    .option('--json', 'Output stats as JSON')
    .action(async (appDir: string, options: { baseline: string; json: boolean }) => {
      const baseline = loadBaseline(options.baseline);
      if (!baseline) {
        console.error(`No baseline found: ${options.baseline}`);
        process.exit(1);
      }

      let current;
      try {
        current = await scanRoutes(appDir);
      } catch (err) {
        console.error(`Failed to scan routes: ${(err as Error).message}`);
        process.exit(1);
      }

      const diff = diffRoutes(baseline.routes, current);
      const stats = computeStats(diff);

      if (options.json) {
        console.log(JSON.stringify(stats, null, 2));
      } else {
        console.log(formatStats(stats));
      }
    });
}
