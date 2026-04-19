import http from 'http';
import { EventEmitter } from 'events';
import { RouteChange } from './differ';

export interface WatchServerOptions {
  port?: number;
  host?: string;
}

export interface ChangeEvent {
  timestamp: string;
  changes: RouteChange[];
}

export function createWatchServer(emitter: EventEmitter, options: WatchServerOptions = {}) {
  const { port = 4242, host = 'localhost' } = options;
  const clients = new Set<http.ServerResponse>();

  const server = http.createServer((req, res) => {
    if (req.url === '/events') {
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
      });
      res.write('retry: 1000\n\n');
      clients.add(res);
      req.on('close', () => clients.delete(res));
    } else if (req.url === '/health') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ status: 'ok', clients: clients.size }));
    } else {
      res.writeHead(404);
      res.end();
    }
  });

  emitter.on('change', (changes: RouteChange[]) => {
    const event: ChangeEvent = { timestamp: new Date().toISOString(), changes };
    const data = `data: ${JSON.stringify(event)}\n\n`;
    for (const client of clients) {
      client.write(data);
    }
  });

  return {
    start(): Promise<void> {
      return new Promise((resolve) => server.listen(port, host, () => resolve()));
    },
    stop(): Promise<void> {
      return new Promise((resolve, reject) =>
        server.close((err) => (err ? reject(err) : resolve()))
      );
    },
    get clientCount() {
      return clients.size;
    },
  };
}
