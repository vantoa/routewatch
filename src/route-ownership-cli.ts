import { Command } from 'commander';
import { scanRoutes } from './scanner';
import { assignOwnership, formatOwnershipReport, OwnershipRule } from './route-ownership';
import * as fs from 'fs';
import * as path from 'path';

export function registerOwnershipCommand(program: Command): void {
  program
    .command('ownership <dir>')
    .description('Show route ownership based on rules file')
    .option('-r, --rules <file>', 'Path to ownership rules JSON file', 'ownership.json')
    .option('--unowned', 'Show only unowned routes', false)
    .option('--json', 'Output as JSON', false)
    .action(async (dir: string, opts: { rules: string; unowned: boolean; json: boolean }) => {
      const rulesPath = path.resolve(opts.rules);

      if (!fs.existsSync(rulesPath)) {
        console.error(`Rules file not found: ${rulesPath}`);
        process.exit(1);
      }

      let rules: OwnershipRule[];
      try {
        rules = JSON.parse(fs.readFileSync(rulesPath, 'utf-8'));
      } catch {
        console.error('Failed to parse rules file');
        process.exit(1);
      }

      const routes = await scanRoutes(path.resolve(dir));
      const report = assignOwnership(routes, rules);

      if (opts.json) {
        if (opts.unowned) {
          console.log(JSON.stringify(report.unowned, null, 2));
        } else {
          console.log(JSON.stringify(report, null, 2));
        }
        return;
      }

      if (opts.unowned) {
        if (report.unowned.length === 0) {
          console.log('All routes have owners.');
        } else {
          console.log('Unowned Routes:');
          for (const r of report.unowned) {
            console.log(`  ${r.route} (${r.methods.join(', ')})`);
          }
        }
        return;
      }

      console.log(formatOwnershipReport(report));
    });
}
