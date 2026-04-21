import { Command } from 'commander';
import * as fs from 'fs';
import { scanRoutes } from './scanner';
import { buildFreshnessReport, formatFreshnessReport } from './route-freshness';

export function registerFreshnessCommand(program: Command): void {
  program
    .command('freshness <dir>')
    .description('Report how recently each route was changed based on a changelog file')
    .option('--changelog <file>', 'Path to a JSON changelog file', 'routewatch-changelog.json')
    .option('--json', 'Output as JSON')
    .option('--stale-only', 'Only show stale routes')
    .action(async (dir: string, opts: { changelog: string; json?: boolean; staleOnly?: boolean }) => {
      const routes = await scanRoutes(dir);

      let changeLog: Array<{ path: string; date: string }> = [];
      if (fs.existsSync(opts.changelog)) {
        try {
          changeLog = JSON.parse(fs.readFileSync(opts.changelog, 'utf-8'));
        } catch {
          console.error(`Failed to parse changelog: ${opts.changelog}`);
          process.exit(1);
        }
      }

      const report = buildFreshnessReport(routes, changeLog);

      if (opts.staleOnly) {
        report.entries = report.entries.filter((e) => e.status === 'stale');
      }

      if (opts.json) {
        console.log(JSON.stringify(report, null, 2));
      } else {
        console.log(formatFreshnessReport(report));
      }

      if (report.staleCount > 0) {
        process.exit(1);
      }
    });
}
