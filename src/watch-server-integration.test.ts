import { EventEmitter } from 'events';
import http from 'http';
import { createWatchServer } from './watch-server';
import { RouteChange } from './differ';

const PORT = 14243;

describe('watch-server integration', () => {
  let emitter: EventEmitter;
  let server: ReturnType<typeof createWatchServer>;

  beforeAll(async () => {
    emitter = new EventEmitter();
    server = createWatchServer(emitter, { port: PORT });
    await server.start();
  });

  afterAll(async () => {
    await server.stop();
  });

  it('broadcasts multiple events to connected client', (done) => {
    const received: string[] = [];
    const req = http.get(`http://localhost:${PORT}/events`, (res) => {
      res.on('data', (chunk: Buffer) => {
        const lines = chunk.toString().split('\n').filter((l) => l.startsWith('data:'));
        received.push(...lines);
        if (received.length >= 2) {
          req.destroy();
          expect(received).toHaveLength(2);
          done();
        }
      });

      const change1: RouteChange = { type: 'added', route: '/api/a', methods: ['GET'] };
      const change2: RouteChange = { type: 'removed', route: '/api/b', methods: ['POST'] };

      setTimeout(() => emitter.emit('change', [change1]), 30);
      setTimeout(() => emitter.emit('change', [change2]), 80);
    });
  });

  it('health endpoint reflects connected clients', (done) => {
    const req = http.get(`http://localhost:${PORT}/events`, () => {
      setTimeout(() => {
        http.get(`http://localhost:${PORT}/health`, (res) => {
          let body = '';
          res.on('data', (d) => (body += d));
          res.on('end', () => {
            const json = JSON.parse(body);
            expect(json.clients).toBeGreaterThanOrEqual(1);
            req.destroy();
            done();
          });
        });
      }, 30);
    });
  });
});
