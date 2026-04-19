import { Command } from 'commander';
import { scanRoutes } from './scanner';
import { diffRoutes } from './differ';
import { buildAuditReport, formatAuditReport } from './audit';
import { writeOutput } from './output';

export function registerAuditCommand(program: Command): void {
  program
    .command('audit <before> <after>')
    .description('Generate an audit report of route changes between two app directories')
    .option('--json', 'Output as JSON')
    .option('-o, --output <file>', 'Write report to file')
    .action(async (before: string, after: string, opts: { json?: boolean; output?: string }) => {
      try {
        const beforeRoutes = await scanRoutes(before);
        const afterRoutes = await scanRoutes(after);
        const changes = diffRoutes(beforeRoutes, afterRoutes);

        if (changes.length === 0) {
          console.log('No route changes detected.');
          return;
        }

        const report = buildAuditReport(changes);

        if (opts.json) {
          const content = JSON.stringify(report, null, 2);
          if (opts.output) {
            await writeOutput(content, opts.output);
            console.log(`Audit report written to ${opts.output}`);
          } else {
            console.log(content);
          }
        } else {
          const content = formatAuditReport(report);
          if (opts.output) {
            await writeOutput(content, opts.output);
            console.log(`Audit report written to ${opts.output}`);
          } else {
            console.log(content);
          }
        }

        if (report.breakingCount > 0) {
          process.exitCode = 1;
        }
      } catch (err) {
        console.error('audit error:', (err as Error).message);
        process.exit(1);
      }
    });
}
