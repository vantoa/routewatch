import { Command } from 'commander';
import { scanRoutes } from './scanner';
import { diffRoutes } from './differ';
import { loadBaseline } from './baseline';
import { lintChanges, formatLintResults } from './lint';

export function registerLintCommand(program: Command): void {
  program
    .command('lint <dir>')
    .description('Lint API route changes against the saved baseline')
    .option('--json', 'Output results as JSON')
    .option('--fail-on-warning', 'Exit with error code on warnings')
    .action(async (dir: string, opts: { json?: boolean; failOnWarning?: boolean }) => {
      const baseline = loadBaseline(dir);
      if (!baseline) {
        console.error('No baseline found. Run `routewatch baseline save` first.');
        process.exit(1);
      }

      const current = await scanRoutes(dir);
      const changes = diffRoutes(baseline, current);
      const results = lintChanges(changes);

      if (opts.json) {
        console.log(JSON.stringify(results, null, 2));
      } else {
        console.log(formatLintResults(results));
      }

      const hasErrors = results.some((r) => r.severity === 'error');
      const hasWarnings = results.some((r) => r.severity === 'warning');

      if (hasErrors || (opts.failOnWarning && hasWarnings)) {
        process.exit(1);
      }
    });
}
