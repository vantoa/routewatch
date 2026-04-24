import { Command } from 'commander';
import { scanRoutes } from './scanner';
import { buildDependencyReport, formatDependencyReport } from './route-dependency';
import { handleOutput } from './output';

export function registerDependencyCommand(program: Command): void {
  program
    .command('dependency <dir>')
    .description('Analyse dependencies between routes based on shared structure and parameters')
    .option('--min-strength <number>', 'Minimum dependency strength to show (0-1)', '0')
    .option('--hubs-only', 'Show only hub routes', false)
    .option('--isolated-only', 'Show only isolated routes', false)
    .option('--json', 'Output as JSON')
    .option('-o, --output <file>', 'Write output to file')
    .action(async (dir: string, opts) => {
      const routes = await scanRoutes(dir);
      let report = buildDependencyReport(routes);

      const minStrength = parseFloat(opts.minStrength ?? '0');
      if (minStrength > 0) {
        report = {
          ...report,
          dependencies: report.dependencies.filter(d => d.strength >= minStrength),
        };
      }

      if (opts.hubsOnly) {
        const text = ['Hubs:', ...report.hubs.map(h => `  • ${h}`)].join('\n');
        await handleOutput(text, opts);
        return;
      }

      if (opts.isolatedOnly) {
        const text = ['Isolated:', ...report.isolated.map(r => `  • ${r}`)].join('\n');
        await handleOutput(text, opts);
        return;
      }

      if (opts.json) {
        await handleOutput(JSON.stringify(report, null, 2), opts);
        return;
      }

      await handleOutput(formatDependencyReport(report), opts);
    });
}
