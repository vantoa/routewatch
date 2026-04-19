import { Command } from 'commander';
import { createDiffServer } from './diff-server';

export function registerDiffServerCommand(program: Command): void {
  program
    .command('diff-server <baseDir> <compareDir>')
    .description('Start an HTTP server exposing a /diff endpoint between two Next.js app directories')
    .option('-p, --port <number>', 'Port to listen on', '4000')
    .action((baseDir: string, compareDir: string, opts) => {
      const port = parseInt(opts.port, 10);
      const server = createDiffServer({ port, baseDir, compareDir });
      server.on('listening', () => {
        console.log(`RouteWatch diff server running at http://localhost:${port}/diff`);
      });
      process.on('SIGINT', () => {
        server.close();
        process.exit(0);
      });
    });
}
