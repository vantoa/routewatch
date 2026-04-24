import { Command } from 'commander';
import * as path from 'path';
import { scanRoutes } from './scanner';
import { detectAnomalies, formatAnomalyReport } from './route-anomaly';

export function registerAnomalyCommand(program: Command): void {
  program
    .command('anomaly <dir>')
    .description('Detect anomalies in Next.js API routes (orphans, duplicates, unusual methods, deep nesting)')
    .option('--json', 'Output results as JSON')
    .option('--severity <level>', 'Filter by minimum severity: low, medium, high')
    .action(async (dir: string, opts: { json?: boolean; severity?: string }) => {
      const resolved = path.resolve(dir);
      let routes;
      try {
        routes = await scanRoutes(resolved);
      } catch (err) {
        console.error(`Failed to scan routes in ${resolved}:`, err);
        process.exit(1);
      }

      const report = detectAnomalies(routes);

      const severityOrder: Record<string, number> = { low: 0, medium: 1, high: 2 };
      const minLevel = severityOrder[opts.severity ?? 'low'] ?? 0;
      const filtered = {
        ...report,
        anomalies: report.anomalies.filter(
          a => (severityOrder[a.severity] ?? 0) >= minLevel
        ),
        total: 0,
      };
      filtered.total = filtered.anomalies.length;

      if (opts.json) {
        console.log(JSON.stringify(filtered, null, 2));
      } else {
        console.log(formatAnomalyReport(filtered));
      }

      if (filtered.anomalies.some(a => a.severity === 'high')) {
        process.exit(1);
      }
    });
}
