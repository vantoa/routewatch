import { Command } from 'commander';
import { readFileSync } from 'fs';
import { detectDeadRoutes, formatDeadRouteReport } from './route-dead';
import { scanRoutes } from './scanner';

export function registerDeadCommand(program: Command): void {
  program
    .command('dead <dir>')
    .description('Detect dead (inactive) routes based on change history')
    .option('--history <file>', 'Path to JSON history file')
    .option('--threshold <days>', 'Days without change to consider dead', '180')
    .option('--json', 'Output as JSON')
    .action(async (dir: string, opts: { history?: string; threshold: string; json?: boolean }) => {
      const routes = await scanRoutes(dir);
      let history: unknown[] = [];

      if (opts.history) {
        try {
          history = JSON.parse(readFileSync(opts.history, 'utf-8'));
        } catch {
          console.error(`Failed to read history file: ${opts.history}`);
          process.exit(1);
        }
      }

      const threshold = parseInt(opts.threshold, 10);
      const report = detectDeadRoutes(routes, history as any[], threshold);

      if (opts.json) {
        console.log(JSON.stringify(report, null, 2));
      } else {
        console.log(formatDeadRouteReport(report));
      }
    });
}
