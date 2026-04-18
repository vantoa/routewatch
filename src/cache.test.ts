import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import {
  computeDirHash,
  loadCache,
  saveCache,
  getCachedRoutes,
  setCachedRoutes,
} from './cache';

let tmpDir: string;
let cacheFile: string;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'routewatch-cache-'));
  cacheFile = path.join(tmpDir, '.routewatch-cache.json');
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

test('computeDirHash returns consistent hash for same files', () => {
  const appDir = path.join(tmpDir, 'app', 'api', 'users');
  fs.mkdirSync(appDir, { recursive: true });
  fs.writeFileSync(path.join(appDir, 'route.ts'), 'export function GET() {}');
  const h1 = computeDirHash(path.join(tmpDir, 'app'));
  const h2 = computeDirHash(path.join(tmpDir, 'app'));
  expect(h1).toBe(h2);
});

test('computeDirHash changes when file is modified', async () => {
  const appDir = path.join(tmpDir, 'app', 'api', 'posts');
  fs.mkdirSync(appDir, { recursive: true });
  const routeFile = path.join(appDir, 'route.ts');
  fs.writeFileSync(routeFile, 'export function GET() {}');
  const h1 = computeDirHash(path.join(tmpDir, 'app'));
  await new Promise(r => setTimeout(r, 10));
  fs.utimesSync(routeFile, new Date(), new Date());
  const h2 = computeDirHash(path.join(tmpDir, 'app'));
  expect(h1).not.toBe(h2);
});

test('loadCache returns empty object for missing file', () => {
  const cache = loadCache(path.join(tmpDir, 'nonexistent.json'));
  expect(cache).toEqual({});
});

test('saveCache and loadCache round-trip', () => {
  const cache = { '/some/dir': { hash: 'abc123', routes: [], timestamp: 1000 } };
  saveCache(cache, cacheFile);
  const loaded = loadCache(cacheFile);
  expect(loaded).toEqual(cache);
});

test('getCachedRoutes returns null when hash mismatch', () => {
  const cache = { [tmpDir]: { hash: 'stale-hash', routes: [], timestamp: 0 } };
  expect(getCachedRoutes(tmpDir, cache)).toBeNull();
});

test('setCachedRoutes stores routes with current hash', () => {
  const routes = [{ path: '/api/users', methods: ['GET'] }];
  let cache = {};
  cache = setCachedRoutes(tmpDir, routes, cache);
  const result = getCachedRoutes(tmpDir, cache);
  expect(result).toEqual(routes);
});
