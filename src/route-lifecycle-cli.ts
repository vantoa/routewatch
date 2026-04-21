import { Command } from 'commander';
import { scanRoutes } from './scanner';
import { diffRoutes } from './differ';
import { buildLifecycleReport, formatLifecycleReport } from './route-lifecycle';
import * as fs from 'fs';

export function registerLifecycleCommand(program: Command): void {
  program
    .command('lifecycle <oldDir> <newDir>')
    .description('Show route lifecycle changes between two Next.js project versions')
    .option('--json', 'Output as JSON')
    .option('-o, --output <file>', 'Write output to file')
    .action(async (oldDir: string, newDir: string, opts: { json?: boolean; output?: string }) => {
      try {
        const oldRoutes = await scanRoutes(oldDir);
        const newRoutes = await scanRoutes(newDir);
        const changes = diffRoutes(oldRoutes, newRoutes);

        if (changes.length === 0) {
          console.log('No route changes detected.');
          return;
        }

        const report = buildLifecycleReport(changes);

        let out: string;
        if (opts.json) {
          out = JSON.stringify(report, null, 2);
        } else {
          out = formatLifecycleReport(report);
        }

        if (opts.output) {
          fs.writeFileSync(opts.output, out, 'utf-8');
          console.log(`Lifecycle report written to ${opts.output}`);
        } else {
          console.log(out);
        }
      } catch (err) {
        console.error('Error generating lifecycle report:', (err as Error).message);
        process.exit(1);
      }
    });
}
