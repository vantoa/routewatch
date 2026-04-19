import { Command } from 'commander';
import { EventEmitter } from 'events';
import { createWatchServer } from './watch-server';
import { watchRoutes } from './watcher';
import { diffRoutes } from './differ';
import { scanRoutes } from './scanner';

export function registerWatchServerCommand(program: Command): void {
  program
    .command('watch-server <dir>')
    .description('Watch a Next.js project and stream route changes via SSE')
    .option('-p, --port <number>', 'SSE server port', '4242')
    .option('--host <host>', 'SSE server host', 'localhost')
    .action(async (dir: string, opts: { port: string; host: string }) => {
      const port = parseInt(opts.port, 10);
      const emitter = new EventEmitter();

      const server = createWatchServer(emitter, { port, host: opts.host });
      await server.start();
      console.log(`SSE server listening on http://${opts.host}:${port}/events`);

      let previous = await scanRoutes(dir);

      watchRoutes(dir, async () => {
        const current = await scanRoutes(dir);
        const changes = diffRoutes(previous, current);
        if (changes.length > 0) {
          emitter.emit('change', changes);
          console.log(`[${new Date().toISOString()}] ${changes.length} change(s) detected`);
        }
        previous = current;
      });
    });
}
