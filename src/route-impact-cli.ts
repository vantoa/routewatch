import { Command } from 'commander';
import { scanRoutes } from './scanner';
import { diffRoutes } from './differ';
import { assessImpact, formatImpactReport } from './route-impact';

export function registerImpactCommand(program: Command): void {
  program
    .command('impact <oldDir> <newDir>')
    .description('Assess the impact of route changes between two Next.js app directories')
    .option('--json', 'Output as JSON')
    .option('--min-score <n>', 'Only show entries with score >= n', parseInt)
    .action(async (oldDir: string, newDir: string, opts: { json?: boolean; minScore?: number }) => {
      const oldRoutes = await scanRoutes(oldDir);
      const newRoutes = await scanRoutes(newDir);
      const changes = diffRoutes(oldRoutes, newRoutes);
      let report = assessImpact(changes);

      if (opts.minScore !== undefined) {
        report = {
          ...report,
          entries: report.entries.filter(e => e.score >= opts.minScore!),
        };
      }

      if (opts.json) {
        console.log(JSON.stringify(report, null, 2));
      } else {
        console.log(formatImpactReport(report));
      }

      if (report.highestSeverity === 'breaking') {
        process.exitCode = 1;
      }
    });
}
