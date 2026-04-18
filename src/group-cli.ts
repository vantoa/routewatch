import { Command } from 'commander';
import { scanRoutes } from './scanner';
import { diffRoutes } from './differ';
import { groupChanges, GroupKey } from './group';
import { loadConfig, mergeConfig } from './config';

export function registerGroupCommand(program: Command): void {
  program
    .command('group <before> <after>')
    .description('Show route changes grouped by method, prefix, or status')
    .option('--by <key>', 'Group key: method | prefix | status', 'status')
    .option('--config <path>', 'Path to config file')
    .action(async (before: string, after: string, opts) => {
      const fileConfig = loadConfig(opts.config);
      const config = mergeConfig(fileConfig);
      const by = (opts.by ?? 'status') as GroupKey;

      const beforeRoutes = await scanRoutes(before);
      const afterRoutes = await scanRoutes(after);
      const diff = diffRoutes(beforeRoutes, afterRoutes);

      const grouped = groupChanges(diff, by);

      if (grouped.length === 0) {
        console.log('No changes found.');
        return;
      }

      for (const group of grouped) {
        console.log(`\n[${group.key}] (${group.changes.length} change${group.changes.length !== 1 ? 's' : ''})`);
        for (const change of group.changes) {
          const detail =
            change.type === 'modified'
              ? `+[${(change.added ?? []).join(',')}] -[${(change.removed ?? []).join(',')}]`
              : `[${change.methods.join(',')}]`;
          console.log(`  ${change.type.toUpperCase().padEnd(8)} ${change.route}  ${detail}`);
        }
      }
    });
}
