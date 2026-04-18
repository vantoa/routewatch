import { Command } from 'commander';
import { scanRoutes } from './scanner';
import { diffRoutes } from './differ';
import { loadConfig, mergeConfig } from './config';
import { generateSummary, formatSummary } from './summary';

export function registerSummaryCommand(program: Command): void {
  program
    .command('summary <oldDir> <newDir>')
    .description('Print a high-level summary of route changes between two Next.js app directories')
    .option('--json', 'Output summary as JSON')
    .option('--config <path>', 'Path to routewatch config file')
    .action(async (oldDir: string, newDir: string, opts: { json?: boolean; config?: string }) => {
      try {
        const fileConfig = await loadConfig(opts.config);
        const config = mergeConfig(fileConfig);

        const oldRoutes = await scanRoutes(oldDir);
        const newRoutes = await scanRoutes(newDir);
        const diff = diffRoutes(oldRoutes, newRoutes);

        const summary = generateSummary(diff);

        if (opts.json) {
          console.log(JSON.stringify(summary, null, 2));
        } else {
          console.log(formatSummary(summary));
        }

        if (summary.breaking) {
          process.exit(1);
        }
      } catch (err) {
        console.error('Error generating summary:', (err as Error).message);
        process.exit(2);
      }
    });
}
