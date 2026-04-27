import { Command } from 'commander';
import { scanRoutes } from './scanner';
import { auditRouteNaming, formatNamingReport } from './route-naming';

export function registerNamingCommand(program: Command): void {
  program
    .command('naming <dir>')
    .description('Audit route naming conventions in a Next.js app directory')
    .option('--json', 'Output results as JSON')
    .option('--errors-only', 'Only show errors, suppress warnings')
    .action(async (dir: string, opts: { json?: boolean; errorsOnly?: boolean }) => {
      let routes;
      try {
        routes = await scanRoutes(dir);
      } catch (err: any) {
        console.error(`Failed to scan routes: ${err.message}`);
        process.exit(1);
      }

      let report = auditRouteNaming(routes);

      if (opts.errorsOnly) {
        report = {
          ...report,
          violations: report.violations.filter((v) => v.severity === 'error'),
          total: report.violations.filter((v) => v.severity === 'error').length,
          warningCount: 0,
        };
      }

      if (opts.json) {
        console.log(JSON.stringify(report, null, 2));
      } else {
        console.log(formatNamingReport(report));
      }

      if (report.errorCount > 0) {
        process.exit(1);
      }
    });
}
