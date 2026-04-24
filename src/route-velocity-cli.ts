import { Command } from 'commander';
import * as fs from 'fs';
import { buildVelocityReport, formatVelocityReport } from './route-velocity';
import { RouteChange } from './differ';

interface HistoryEntry {
  date: string;
  changes: RouteChange[];
}

export function registerVelocityCommand(program: Command): void {
  program
    .command('velocity <historyFile>')
    .description('Show rate of change per route from a history JSON file')
    .option('--top <n>', 'Show only top N routes by velocity', '10')
    .option('--json', 'Output as JSON')
    .action((historyFile: string, opts: { top: string; json?: boolean }) => {
      if (!fs.existsSync(historyFile)) {
        console.error(`History file not found: ${historyFile}`);
        process.exit(1);
      }

      let raw: HistoryEntry[];
      try {
        raw = JSON.parse(fs.readFileSync(historyFile, 'utf-8'));
      } catch {
        console.error('Failed to parse history file as JSON.');
        process.exit(1);
      }

      const history = raw.map((entry) => ({
        changes: entry.changes,
        date: new Date(entry.date),
      }));

      const report = buildVelocityReport(history);
      const topN = parseInt(opts.top, 10);
      if (!isNaN(topN) && topN > 0) {
        report.entries = report.entries.slice(0, topN);
      }

      if (opts.json) {
        console.log(JSON.stringify(report, null, 2));
      } else {
        console.log(formatVelocityReport(report));
      }
    });
}
