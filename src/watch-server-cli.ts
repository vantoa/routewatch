import { Command } from 'commander';
import { createWatchServer } from './watch-server';

export function registerWatchServerCommand(program: Command): void {
  program
    .command('watch-server')
    .description('Start a WebSocket server that broadcasts route changes')
    .option('-d, --dir <path>', 'Next.js app directory', '.')
    .option('-p, --port <number>', 'Port to listen on', '3001')
    .action(async (opts) => {
      const port = parseInt(opts.port, 10);
      const server = createWatchServer(opts.dir, port);
      server.start();
      console.log(`RouteWatch server listening on ws://localhost:${port}`);
      process.on('SIGINT', () => {
        server.stop();
        process.exit(0);
      });
    });
}
