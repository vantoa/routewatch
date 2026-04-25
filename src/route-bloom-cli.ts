import { Command } from 'commander';
import { scanRoutes } from './scanner';
import { diffRoutes } from './differ';
import { buildBloomReport, formatBloomReport } from './route-bloom';
import * as fs from 'fs';

export function registerBloomCommand(program: Command): void {
  program
    .command('bloom <oldDir> <newDir>')
    .description('Show newly blooming (added) routes with growth scores')
    .option('--history <file>', 'JSON file mapping path -> firstSeen date')
    .option('--json', 'Output as JSON')
    .option('--top <n>', 'Number of top growing routes to display', '5')
    .action(async (oldDir: string, newDir: string, opts) => {
      const oldRoutes = await scanRoutes(oldDir);
      const newRoutes = await scanRoutes(newDir);
      const changes = diffRoutes(oldRoutes, newRoutes);

      let history: Array<{ path: string; date: string }> = [];
      if (opts.history && fs.existsSync(opts.history)) {
        try {
          history = JSON.parse(fs.readFileSync(opts.history, 'utf-8'));
        } catch {
          console.error('Warning: could not parse history file');
        }
      }

      const report = buildBloomReport(changes, history);

      const topN = parseInt(opts.top, 10);
      report.topGrowing = report.topGrowing.slice(0, topN);

      if (opts.json) {
        console.log(JSON.stringify(report, null, 2));
      } else {
        console.log(formatBloomReport(report));
      }
    });
}
