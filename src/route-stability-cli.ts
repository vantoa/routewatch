import { Command } from 'commander';
import * as fs from 'fs';
import { buildStabilityReport, formatStabilityReport } from './route-stability';

export function registerStabilityCommand(program: Command): void {
  program
    .command('stability')
    .description('Analyse route stability across a change history log')
    .requiredOption('--history <file>', 'Path to a JSON history file (array of {date, changes})')
    .option('--json', 'Output as JSON')
    .option('--min-score <number>', 'Only show routes below this stability score', parseInt)
    .action((opts) => {
      if (!fs.existsSync(opts.history)) {
        console.error(`History file not found: ${opts.history}`);
        process.exit(1);
      }

      let history: Array<{ date: string; changes: any[] }>;
      try {
        history = JSON.parse(fs.readFileSync(opts.history, 'utf-8'));
      } catch {
        console.error('Failed to parse history file as JSON');
        process.exit(1);
      }

      let report = buildStabilityReport(history);

      if (opts.minScore !== undefined) {
        report = {
          ...report,
          entries: report.entries.filter((e) => e.stabilityScore < opts.minScore),
          mostVolatile: report.mostVolatile.filter((e) => e.stabilityScore < opts.minScore),
          mostStable: report.mostStable.filter((e) => e.stabilityScore < opts.minScore),
        };
      }

      if (opts.json) {
        console.log(JSON.stringify(report, null, 2));
      } else {
        console.log(formatStabilityReport(report));
      }
    });
}
