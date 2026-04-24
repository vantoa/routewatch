import { Command } from 'commander';
import { scanRoutes } from './scanner';
import { diffRoutes } from './differ';
import { classifyChanges } from './severity';
import { computeRisk, formatRiskReport } from './route-risk';
import { loadCache, getCachedRoutes } from './cache';

export function registerRiskCommand(program: Command): void {
  program
    .command('risk <dir>')
    .description('Assess risk of route changes compared to a baseline snapshot')
    .option('--baseline <path>', 'Path to baseline routes JSON')
    .option('--churn <path>', 'Path to churn counts JSON (Record<string,number>)')
    .option('--min-level <level>', 'Minimum risk level to display (low|medium|high|critical)', 'low')
    .option('--json', 'Output as JSON')
    .action(async (dir: string, opts) => {
      let before: Awaited<ReturnType<typeof scanRoutes>> = [];

      if (opts.baseline) {
        const fs = await import('fs');
        before = JSON.parse(fs.readFileSync(opts.baseline, 'utf8'));
      } else {
        const cache = await loadCache(dir);
        before = await getCachedRoutes(dir, cache);
      }

      const after = await scanRoutes(dir);
      const changes = diffRoutes(before, after);
      const classified = classifyChanges(changes);

      let churnCounts: Record<string, number> = {};
      if (opts.churn) {
        const fs = await import('fs');
        churnCounts = JSON.parse(fs.readFileSync(opts.churn, 'utf8'));
      }

      const report = computeRisk(classified, churnCounts);

      const levels = ['low', 'medium', 'high', 'critical'];
      const minIdx = levels.indexOf(opts.minLevel ?? 'low');
      report.entries = report.entries.filter(
        (e) => levels.indexOf(e.riskLevel) >= minIdx
      );

      if (opts.json) {
        console.log(JSON.stringify(report, null, 2));
      } else {
        console.log(formatRiskReport(report));
      }
    });
}
