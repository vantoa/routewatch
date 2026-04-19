import { Command } from 'commander';
import { scanRoutes } from './scanner';
import { validateRoutes, formatValidationReport } from './validate';
import { loadConfig, mergeConfig } from './config';

export function registerValidateCommand(program: Command): void {
  program
    .command('validate <dir>')
    .description('Validate route conventions in a Next.js project')
    .option('--json', 'Output results as JSON')
    .option('--config <path>', 'Path to config file')
    .action(async (dir: string, opts: { json?: boolean; config?: string }) => {
      const fileConfig = await loadConfig(opts.config);
      const config = mergeConfig(fileConfig);

      const routes = await scanRoutes(dir);
      const report = validateRoutes(routes);

      if (opts.json) {
        console.log(JSON.stringify(report, null, 2));
      } else {
        console.log(formatValidationReport(report));
      }

      if (!report.valid) {
        process.exitCode = 1;
      }
    });
}
