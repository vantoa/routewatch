import { Command } from 'commander';
import { scanRoutes } from './scanner';
import { diffRoutes } from './differ';
import { loadCache } from './cache';
import { computeMaturity, formatMaturityReport, MaturityLevel } from './route-maturity';

export function registerMaturityCommand(program: Command): void {
  program
    .command('maturity <dir>')
    .description('Assess the maturity level of routes based on churn and structure')
    .option('--filter <level>', 'Show only routes at a specific maturity level')
    .option('--json', 'Output as JSON')
    .action(async (dir: string, opts: { filter?: string; json?: boolean }) => {
      const routes = await scanRoutes(dir);
      const cache = await loadCache(dir);
      const previous = cache?.routes ?? [];
      const changes = diffRoutes(previous, routes);

      const report = computeMaturity(routes, changes);

      if (opts.filter) {
        const level = opts.filter as MaturityLevel;
        report.routes = report.routes.filter(r => r.level === level);
      }

      if (opts.json) {
        console.log(JSON.stringify(report, null, 2));
      } else {
        console.log(formatMaturityReport(report));
      }
    });
}
