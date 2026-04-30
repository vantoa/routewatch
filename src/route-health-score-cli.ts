import { Command } from 'commander';
import { scanRoutes } from './scanner';
import { buildHealthScoreReport, formatHealthScoreReport } from './route-health-score';
import { loadCache } from './cache';

export function registerHealthScoreCommand(program: Command): void {
  program
    .command('health-score <dir>')
    .description('Compute per-route health scores based on stability, complexity, naming, and coverage')
    .option('--min-score <number>', 'Only show routes at or below this score', parseInt)
    .option('--grade <grade>', 'Filter by grade (A, B, C, D, F)')
    .option('--json', 'Output as JSON')
    .action(async (dir: string, opts: { minScore?: number; grade?: string; json?: boolean }) => {
      const routes = await scanRoutes(dir);
      const cache = await loadCache(dir).catch(() => null);
      const changes = cache?.routes ? [] : [];

      let report = buildHealthScoreReport(routes, changes);

      if (opts.minScore !== undefined) {
        report = { ...report, routes: report.routes.filter(r => r.score <= opts.minScore!) };
      }

      if (opts.grade) {
        const g = opts.grade.toUpperCase();
        report = { ...report, routes: report.routes.filter(r => r.grade === g) };
      }

      if (opts.json) {
        console.log(JSON.stringify(report, null, 2));
      } else {
        console.log(formatHealthScoreReport(report));
      }
    });
}
