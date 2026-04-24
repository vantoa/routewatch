import { Command } from 'commander';
import { readFileSync } from 'fs';
import { buildHotspotReport, formatHotspotReport } from './route-hotspot';
import { RouteChange } from './differ';

export function registerHotspotCommand(program: Command): void {
  program
    .command('hotspot')
    .description('Identify routes with the highest change frequency (hotspots)')
    .requiredOption('--history <file>', 'Path to JSON change history file')
    .option('--top <n>', 'Number of top hotspots to display', '10')
    .option('--json', 'Output as JSON')
    .action((opts: { history: string; top: string; json?: boolean }) => {
      let history: RouteChange[] = [];

      try {
        history = JSON.parse(readFileSync(opts.history, 'utf-8')) as RouteChange[];
      } catch {
        console.error(`Failed to read history file: ${opts.history}`);
        process.exit(1);
      }

      const top = parseInt(opts.top, 10);
      const report = buildHotspotReport(history, top);

      if (opts.json) {
        console.log(JSON.stringify(report, null, 2));
      } else {
        console.log(formatHotspotReport(report));
      }
    });
}
