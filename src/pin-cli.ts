import { Command } from 'commander';
import { loadPins, pinRoute, unpinRoute, listPins } from './pin';

export function registerPinCommands(program: Command): void {
  const pin = program.command('pin').description('Manage pinned routes');

  pin
    .command('add <route>')
    .description('Pin a route to track it explicitly')
    .option('--methods <methods>', 'Comma-separated methods to pin', 'GET')
    .action(async (route: string, opts: { methods: string }) => {
      const methods = opts.methods.split(',').map((m) => m.trim().toUpperCase());
      await pinRoute(route, methods);
      console.log(`Pinned ${route} [${methods.join(', ')}]`);
    });

  pin
    .command('remove <route>')
    .description('Unpin a route')
    .action(async (route: string) => {
      await unpinRoute(route);
      console.log(`Unpinned ${route}`);
    });

  pin
    .command('list')
    .description('List all pinned routes')
    .action(async () => {
      const pins = await loadPins();
      const lines = listPins(pins);
      if (lines.length === 0) {
        console.log('No pinned routes.');
      } else {
        lines.forEach((l) => console.log(l));
      }
    });
}
