import { Command } from 'commander';
import { scanRoutes } from './scanner';
import { buildRedundancyReport, formatRedundancyReport } from './route-redundancy';

export function registerRedundancyCommand(program: Command): void {
  program
    .command('redundancy <dir>')
    .description('Detect redundant or duplicate routes in a Next.js project')
    .option('--json', 'Output as JSON')
    .option('--min-score <number>', 'Minimum redundancy score to report (0-1)', '0')
    .action(async (dir: string, opts: { json?: boolean; minScore?: string }) => {
      const minScore = parseFloat(opts.minScore ?? '0');

      let routes;
      try {
        routes = await scanRoutes(dir);
      } catch (err: any) {
        console.error(`Failed to scan routes: ${err.message}`);
        process.exit(1);
      }

      const report = buildRedundancyReport(routes);
      const filtered = {
        ...report,
        pairs: report.pairs.filter(p => p.score >= minScore),
      };

      if (opts.json) {
        console.log(JSON.stringify(filtered, null, 2));
      } else {
        console.log(formatRedundancyReport(filtered));
      }

      if (filtered.pairs.length > 0) {
        process.exit(1);
      }
    });
}
