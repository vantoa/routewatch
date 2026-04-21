import { Command } from 'commander';
import { scanRoutes } from './scanner';
import { loadBaseline } from './baseline';
import { detectDrift, buildDriftReport, formatDriftReport } from './route-drift';

export function registerDriftCommand(program: Command): void {
  program
    .command('drift <dir>')
    .description('Detect method drift against a saved baseline')
    .option('-b, --baseline <name>', 'Baseline name to compare against', 'default')
    .option('--json', 'Output as JSON')
    .action(async (dir: string, opts: { baseline: string; json?: boolean }) => {
      const current = await scanRoutes(dir);
      const baseline = loadBaseline(opts.baseline);

      if (!baseline) {
        console.error(`Baseline "${opts.baseline}" not found. Run: routewatch baseline save`);
        process.exit(1);
      }

      const entries = detectDrift(baseline, current);
      const report = buildDriftReport(entries);

      if (opts.json) {
        console.log(JSON.stringify(report, null, 2));
      } else {
        console.log(formatDriftReport(report));
      }

      if (report.totalDrifted > 0) {
        process.exit(1);
      }
    });
}
