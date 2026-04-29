import { Command } from 'commander';
import { scanRoutes } from './scanner';
import { buildBottleneckReport, formatBottleneckReport } from './route-bottleneck';
import { RouteDiff } from './differ';
import * as fs from 'fs';

export function registerBottleneckCommand(program: Command): void {
  program
    .command('bottleneck <dir>')
    .description('Identify high-complexity, high-churn route bottlenecks')
    .option('--history <file>', 'Path to a JSON file containing an array of RouteDiff arrays')
    .option('--top <n>', 'Show only top N bottlenecks', '10')
    .option('--json', 'Output as JSON')
    .action(async (dir: string, opts: { history?: string; top: string; json?: boolean }) => {
      const routes = await scanRoutes(dir);

      let history: RouteDiff[][] = [];
      if (opts.history) {
        try {
          const raw = fs.readFileSync(opts.history, 'utf-8');
          history = JSON.parse(raw);
        } catch {
          console.error(`Failed to read history file: ${opts.history}`);
          process.exit(1);
        }
      }

      const report = buildBottleneckReport(routes, history);
      const topN = parseInt(opts.top, 10);
      const trimmed = { ...report, entries: report.entries.slice(0, topN) };

      if (opts.json) {
        console.log(JSON.stringify(trimmed, null, 2));
      } else {
        console.log(formatBottleneckReport(trimmed));
      }
    });
}
