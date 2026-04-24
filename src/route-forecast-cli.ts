import { Command } from 'commander';
import * as fs from 'fs';
import { buildForecastReport, formatForecastReport } from './route-forecast';
import { RouteChange } from './differ';

function loadHistoryFile(filePath: string): RouteChange[][] {
  const raw = fs.readFileSync(filePath, 'utf-8');
  const parsed = JSON.parse(raw);
  if (!Array.isArray(parsed)) {
    throw new Error('History file must be a JSON array of RouteChange arrays.');
  }
  return parsed as RouteChange[][];
}

export function registerForecastCommand(program: Command): void {
  program
    .command('forecast <historyFile>')
    .description(
      'Predict future route changes based on historical diff snapshots'
    )
    .option(
      '--days-per-snapshot <number>',
      'Number of days each snapshot represents',
      '7'
    )
    .option('--json', 'Output as JSON')
    .option('--min-confidence <level>', 'Filter by confidence: low|medium|high')
    .action(
      (
        historyFile: string,
        opts: { daysPerSnapshot: string; json?: boolean; minConfidence?: string }
      ) => {
        const history = loadHistoryFile(historyFile);
        const daysPerSnapshot = parseInt(opts.daysPerSnapshot, 10);
        let report = buildForecastReport(history, daysPerSnapshot);

        if (opts.minConfidence) {
          const order = { low: 0, medium: 1, high: 2 };
          const minLevel = order[opts.minConfidence as keyof typeof order] ?? 0;
          report = {
            ...report,
            entries: report.entries.filter(
              (e) => order[e.confidence] >= minLevel
            ),
          };
        }

        if (opts.json) {
          console.log(JSON.stringify(report, null, 2));
        } else {
          console.log(formatForecastReport(report));
        }
      }
    );
}
