import { Command } from 'commander';
import { startWatchNotify } from './watch-notify';

export function registerWatchNotifyCommand(program: Command): void {
  program
    .command('watch-notify <dir>')
    .description('Watch for route changes and send webhook notifications')
    .requiredOption('--webhook <url>', 'Webhook URL to POST change payloads to')
    .option('--min-severity <level>', 'Minimum severity to trigger notification (info|warning|breaking)', 'info')
    .option('--debounce <ms>', 'Debounce delay in milliseconds', '500')
    .action(async (dir: string, opts: { webhook: string; minSeverity: string; debounce: string }) => {
      const minSeverity = opts.minSeverity as 'info' | 'warning' | 'breaking';
      const debounceMs = parseInt(opts.debounce, 10);
      console.log(`[routewatch] Watching ${dir} — notifications → ${opts.webhook}`);
      const stop = await startWatchNotify({ dir, webhookUrl: opts.webhook, minSeverity, debounceMs });
      process.on('SIGINT', () => {
        stop();
        console.log('\n[routewatch] Stopped.');
        process.exit(0);
      });
    });
}
