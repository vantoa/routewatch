import http from 'http';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { createDiffServer } from './diff-server';

function makeTempDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'rw-diff-server-'));
}

function writeRoute(dir: string, rel: string, content: string) {
  const full = path.join(dir, rel);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, content);
}

function get(port: number, path: string): Promise<{ status: number; body: any }> {
  return new Promise((resolve, reject) => {
    http.get(`http://localhost:${port}${path}`, (res) => {
      let data = '';
      res.on('data', (c) => (data += c));
      res.on('end', () => resolve({ status: res.statusCode!, body: JSON.parse(data) }));
    }).on('error', reject);
  });
}

test('returns diff between two dirs', async () => {
  const base = makeTempDir();
  const compare = makeTempDir();
  writeRoute(base, 'app/api/users/route.ts', 'export function GET() {}');
  writeRoute(compare, 'app/api/users/route.ts', 'export function GET() {}');
  writeRoute(compare, 'app/api/posts/route.ts', 'export function POST() {}');

  const server = createDiffServer({ port: 0, baseDir: base, compareDir: compare });
  await new Promise((r) => server.on('listening', r));
  const port = (server.address() as any).port;

  const { status, body } = await get(port, '/diff');
  expect(status).toBe(200);
  expect(Array.isArray(body.changes)).toBe(true);
  expect(body.changes.some((c: any) => c.route === '/api/posts')).toBe(true);

  server.close();
  fs.rmSync(base, { recursive: true });
  fs.rmSync(compare, { recursive: true });
});

test('returns 404 for unknown routes', async () => {
  const dir = makeTempDir();
  const server = createDiffServer({ port: 0, baseDir: dir, compareDir: dir });
  await new Promise((r) => server.on('listening', r));
  const port = (server.address() as any).port;

  const { status } = await get(port, '/unknown');
  expect(status).toBe(404);

  server.close();
  fs.rmSync(dir, { recursive: true });
});
