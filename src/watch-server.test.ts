import { EventEmitter } from 'events';
import http from 'http';
import { createWatchServer } from './watch-server';
import { RouteChange } from './differ';

const TEST_PORT = 14242;

async function get(path: string): Promise<{ status: number; body: string }> {
  return new Promise((resolve, reject) => {
    http.get(`http://localhost:${TEST_PORT}${path}`, (res) => {
      let body = '';
      res.on('data', (d) => (body += d));
      res.on('end', () => resolve({ status: res.statusCode ?? 0, body }));
    }).on('error', reject);
  });
}

describe('createWatchServer', () => {
  let emitter: EventEmitter;
  let server: ReturnType<typeof createWatchServer>;

  beforeEach(async () => {
    emitter = new EventEmitter();
    server = createWatchServer(emitter, { port: TEST_PORT });
    await server.start();
  });

  afterEach(async () => {
    await server.stop();
  });

  it('returns 200 on /health', async () => {
    const { status, body } = await get('/health');
    expect(status).toBe(200);
    const json = JSON.parse(body);
    expect(json.status).toBe('ok');
  });

  it('returns 404 for unknown routes', async () => {
    const { status } = await get('/unknown');
    expect(status).toBe(404);
  });

  it('reports zero clients initially', () => {
    expect(server.clientCount).toBe(0);
  });

  it('streams events to SSE clients', (done) => {
    const req = http.get(`http://localhost:${TEST_PORT}/events`, (res) => {
      expect(res.statusCode).toBe(200);
      res.once('data', (chunk: Buffer) => {
        const text = chunk.toString();
        if (text.includes('data:')) {
          const line = text.split('\n').find((l) => l.startsWith('data:'))!;
          const event = JSON.parse(line.replace('data: ', ''));
          expect(event.changes).toHaveLength(1);
          req.destroy();
          done();
        }
      });
      setTimeout(() => {
        const change: RouteChange = { type: 'added', route: '/api/test', methods: ['GET'] };
        emitter.emit('change', [change]);
      }, 50);
    });
  });
});
