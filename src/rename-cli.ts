import { Command } from 'commander';
import { scanRoutes } from './scanner';
import { diffRoutes } from './differ';
import { detectRenames, formatRenameReport } from './rename';

export function registerRenameCommand(program: Command): void {
  program
    .command('rename <oldDir> <newDir>')
    .description('Detect likely route renames between two Next.js app directories')
    .option('--threshold <number>', 'Confidence threshold (0-1)', '0.5')
    .option('--json', 'Output as JSON')
    .action(async (oldDir: string, newDir: string, opts) => {
      const threshold = parseFloat(opts.threshold);
      const before = await scanRoutes(oldDir);
      const after = await scanRoutes(newDir);
      const diff = diffRoutes(before, after);
      const removed = before.filter(r => diff.removed.includes(r.route));
      const added = after.filter(r => diff.added.includes(r.route));
      const candidates = detectRenames(removed, added, threshold);
      if (opts.json) {
        console.log(JSON.stringify(candidates, null, 2));
      } else {
        console.log(formatRenameReport(candidates));
      }
    });
}
