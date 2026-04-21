import { Command } from 'commander';
import { loadSnapshot } from './snapshot';
import { diffRoutes } from './differ';
import { buildChurnReport, formatChurnReport } from './route-churn';
import { RouteChange } from './differ';

export function registerChurnCommand(program: Command): void {
  program
    .command('churn <snapshots...>')
    .description('Analyse route churn across multiple snapshots')
    .option('--top <n>', 'Show only top N churned routes', '10')
    .option('--json', 'Output as JSON')
    .action(async (snapshotNames: string[], opts) => {
      if (snapshotNames.length < 2) {
        console.error('Provide at least two snapshot names to compare.');
        process.exit(1);
      }

      const changeSets: RouteChange[][] = [];

      for (let i = 0; i < snapshotNames.length - 1; i++) {
        const from = await loadSnapshot(snapshotNames[i]);
        const to = await loadSnapshot(snapshotNames[i + 1]);
        if (!from || !to) {
          console.error(`Snapshot not found: ${snapshotNames[i]} or ${snapshotNames[i + 1]}`);
          process.exit(1);
        }
        changeSets.push(diffRoutes(from.routes, to.routes));
      }

      const report = buildChurnReport(changeSets);
      const top = parseInt(opts.top, 10);
      const trimmed = { ...report, entries: report.entries.slice(0, top) };

      if (opts.json) {
        console.log(JSON.stringify(trimmed, null, 2));
      } else {
        console.log(formatChurnReport(trimmed));
      }
    });
}
