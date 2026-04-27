import { Command } from 'commander';
import { scanRoutes } from './scanner';
import { loadCache, getCachedRoutes } from './cache';
import { buildSurfaceReport, formatSurfaceReport } from './route-surface';
import { writeOutput } from './output';

export function registerSurfaceCommand(program: Command): void {
  program
    .command('surface <dir>')
    .description('Analyse the total API surface area of a Next.js project')
    .option('--json', 'Output as JSON')
    .option('-o, --output <file>', 'Write output to file')
    .option('--min-score <n>', 'Only show routes with surface score >= n', parseInt)
    .action(async (dir: string, opts: { json?: boolean; output?: string; minScore?: number }) => {
      let routes;
      try {
        const cache = await loadCache(dir);
        routes = await getCachedRoutes(dir, cache);
      } catch {
        routes = await scanRoutes(dir);
      }

      if (opts.minScore !== undefined) {
        routes = routes.filter((r) => {
          const depth = r.path.split('/').filter(Boolean).length;
          const params = (r.path.match(/\[/g) || []).length;
          return depth + params * 2 + r.methods.length >= opts.minScore!;
        });
      }

      const report = buildSurfaceReport(routes);

      if (opts.json) {
        const out = JSON.stringify(report, null, 2);
        await writeOutput(out, opts.output);
      } else {
        const out = formatSurfaceReport(report);
        await writeOutput(out, opts.output);
      }
    });
}
