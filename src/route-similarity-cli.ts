import { Command } from 'commander';
import { scanRoutes } from './scanner';
import { computeSimilarity, formatSimilarityReport } from './route-similarity';

export function registerSimilarityCommand(program: Command): void {
  program
    .command('similarity <dir>')
    .description('Find structurally similar routes within a Next.js project')
    .option(
      '-t, --threshold <number>',
      'Similarity score threshold (0-1)',
      '0.7'
    )
    .option('--json', 'Output as JSON')
    .action(async (dir: string, opts: { threshold: string; json?: boolean }) => {
      const threshold = parseFloat(opts.threshold);
      if (isNaN(threshold) || threshold < 0 || threshold > 1) {
        console.error('Error: threshold must be a number between 0 and 1');
        process.exit(1);
      }

      let routes;
      try {
        routes = await scanRoutes(dir);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error(`Error scanning routes: ${msg}`);
        process.exit(1);
      }

      const report = computeSimilarity(routes, threshold);

      if (opts.json) {
        console.log(JSON.stringify(report, null, 2));
      } else {
        process.stdout.write(formatSimilarityReport(report));
      }
    });
}
