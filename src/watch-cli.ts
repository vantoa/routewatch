import * as path from 'path';
import { Command } from 'commander';
import { watchRoutes } from './watcher';
import { loadConfig, mergeConfig } from './config';
import { generateReport } from './reporter';

export function registerWatchCommand(program: Command): void {
  program
    .command('watch')
    .description('Watch for API route changes in a Next.js project')
    .argument('[dir]', 'Project directory to watch', '.')
    .option('--debounce <ms>', 'Debounce delay in milliseconds', '300')
    .option('--config <path>', 'Path to routewatch config file')
    .option('--report <format>', 'Output format for changes: json | markdown')
    .option('--out <file>', 'Write reports to file on each change')
    .action(async (dir: string, opts) => {
      const absDir = path.resolve(dir);
      const fileConfig = loadConfig(opts.config);
      const config = mergeConfig(fileConfig, {});
      const debounceMs = parseInt(opts.debounce, 10) || 300;

      const stop = watchRoutes({
        dir: absDir,
        ignore: config.ignore,
        debounceMs,
        onChange: (diff) => {
          if (opts.report && opts.out) {
            generateReport(diff, {
              format: opts.report as 'json' | 'markdown',
              outputPath: opts.out,
            });
          }
        },
      });

      process.on('SIGINT', () => {
        console.log('\n[routewatch] Stopping watcher.');
        stop();
        process.exit(0);
      });

      process.on('SIGTERM', () => {
        stop();
        process.exit(0);
      });
    });
}
