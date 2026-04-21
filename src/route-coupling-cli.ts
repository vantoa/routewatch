import { Command } from 'commander';
import { scanRoutes } from './scanner';
import { computeCoupling, formatCouplingReport } from './route-coupling';

export function registerCouplingCommand(program: Command): void {
  program
    .command('coupling <dir>')
    .description('Detect strongly coupled routes in a Next.js project')
    .option(
      '-t, --threshold <number>',
      'Coupling score threshold (0-1)',
      '0.5'
    )
    .option('--json', 'Output as JSON')
    .action(async (dir: string, opts: { threshold: string; json?: boolean }) => {
      const threshold = parseFloat(opts.threshold);
      if (isNaN(threshold) || threshold < 0 || threshold > 1) {
        console.error('Error: threshold must be a number between 0 and 1');
        process.exit(1);
      }

      const routes = await scanRoutes(dir);

      if (routes.length === 0) {
        console.log('No routes found.');
        return;
      }

      const report = computeCoupling(routes, threshold);

      if (opts.json) {
        console.log(JSON.stringify(report, null, 2));
      } else {
        console.log(formatCouplingReport(report));
      }

      if (report.stronglyCoupled.length > 0) {
        process.exit(1);
      }
    });
}
