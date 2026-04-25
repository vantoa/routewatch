import { Command } from 'commander';
import { scanRoutes } from './scanner';
import { diffRoutes } from './differ';
import { buildEntropyReport, formatEntropyReport } from './route-entropy';

export function registerEntropyCommand(program: Command): void {
  program
    .command('entropy <before> <after>')
    .description('Analyse change entropy across routes between two directories')
    .option('-t, --threshold <number>', 'High-entropy threshold', '1.5')
    .option('--json', 'Output as JSON')
    .action(async (before: string, after: string, opts) => {
      const threshold = parseFloat(opts.threshold);
      if (isNaN(threshold) || threshold <= 0) {
        console.error('Error: threshold must be a positive number.');
        process.exit(1);
      }

      let beforeRoutes, afterRoutes;
      try {
        beforeRoutes = await scanRoutes(before);
        afterRoutes = await scanRoutes(after);
      } catch (err: any) {
        console.error(`Error scanning routes: ${err.message}`);
        process.exit(1);
      }

      const changes = diffRoutes(beforeRoutes, afterRoutes);
      const report = buildEntropyReport(changes, threshold);

      if (opts.json) {
        console.log(JSON.stringify(report, null, 2));
      } else {
        console.log(formatEntropyReport(report));
      }
    });
}
