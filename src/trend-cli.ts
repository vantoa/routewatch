import { Command } from 'commander';
import * as fs from 'fs';
import { buildTrendReport, formatTrendReport } from './trend';

export function registerTrendCommand(program: Command): void {
  program
    .command('trend <trendFile>')
    .description('Display trend report from a saved trend JSON file')
    .option('--limit <n>', 'Limit number of entries shown', '10')
    .option('--json', 'Output raw JSON')
    .action((trendFile: string, opts) => {
      if (!fs.existsSync(trendFile)) {
        console.error(`Trend file not found: ${trendFile}`);
        process.exit(1);
      }
      const raw = JSON.parse(fs.readFileSync(trendFile, 'utf-8'));
      const limit = parseInt(opts.limit, 10);
      const report = buildTrendReport(raw.slice(0, limit));
      if (opts.json) {
        console.log(JSON.stringify(report, null, 2));
      } else {
        console.log(formatTrendReport(report));
      }
    });
}
