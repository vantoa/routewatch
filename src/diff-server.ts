import http from 'http';
import { scanRoutes } from './scanner';
import { diffRoutes } from './differ';
import { formatDiff } from './formatter';
import { RouteChange } from './differ';

export interface DiffServerOptions {
  port: number;
  baseDir: string;
  compareDir: string;
}

export function createDiffServer(options: DiffServerOptions): http.Server {
  const { port, baseDir, compareDir } = options;

  const server = http.createServer(async (req, res) => {
    if (req.method !== 'GET' || req.url !== '/diff') {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Not found' }));
      return;
    }

    try {
      const [before, after] = await Promise.all([
        scanRoutes(baseDir),
        scanRoutes(compareDir),
      ]);
      const changes: RouteChange[] = diffRoutes(before, after);
      const formatted = formatDiff(changes);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ changes, formatted }));
    } catch (err: any) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err.message }));
    }
  });

  server.listen(port);
  return server;
}
