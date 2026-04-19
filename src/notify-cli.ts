import { Command } from 'commander';
import { scanRoutes } from './scanner';
import { diffRoutes } from './differ';
import { notify, NotifyLevel } from './notify';

export function registerNotifyCommand(program: Command): void {
  program
    .command('notify <oldDir> <newDir>')
    .description('Diff routes and send a webhook notification on changes')
    .option('--webhook <url>', 'Webhook URL to POST changes to')
    .option(
      '--level <level>',
      'Notification level: all | breaking | none (default: all)',
      'all'
    )
    .action(async (oldDir: string, newDir: string, opts: { webhook?: string; level: string }) => {
      const level = opts.level as NotifyLevel;
      const validLevels: NotifyLevel[] = ['all', 'breaking', 'none'];
      if (!validLevels.includes(level)) {
        console.error(`Invalid level "${level}". Must be one of: ${validLevels.join(', ')}`);
        process.exit(1);
      }

      const oldRoutes = await scanRoutes(oldDir);
      const newRoutes = await scanRoutes(newDir);
      const changes = diffRoutes(oldRoutes, newRoutes);

      if (changes.length === 0) {
        console.log('No route changes detected.');
        return;
      }

      console.log(`Detected ${changes.length} change(s).`);

      try {
        await notify(changes, { level, webhook: opts.webhook });
        console.log('Notification sent.');
      } catch (err: any) {
        console.error('Notification failed:', err.message);
        process.exit(1);
      }
    });
}
