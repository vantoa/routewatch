import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { runPlugin, createPlugin } from './plugin';

function makeTempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'routewatch-plugin-'));
}

function writeRoute(dir: string, rel: string, content: string) {
  const full = path.join(dir, rel);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, content);
}

function cleanup(dir: string) {
  fs.rmSync(dir, { recursive: true, force: true });
}

describe('runPlugin', () => {
  let dir: string;
  beforeEach(() => { dir = makeTempDir(); });
  afterEach(() => cleanup(dir));

  it('returns scanned routes for baseDir', async () => {
    writeRoute(dir, 'app/api/users/route.ts', 'export function GET() {}');
    const result = await runPlugin({ baseDir: dir });
    expect(result.routes.length).toBeGreaterThan(0);
    expect(result.changes).toHaveLength(0);
  });

  it('calls onRoutesScanned callback', async () => {
    writeRoute(dir, 'app/api/ping/route.ts', 'export function GET() {}');
    const cb = jest.fn();
    await runPlugin({ baseDir: dir, onRoutesScanned: cb });
    expect(cb).toHaveBeenCalledTimes(1);
  });

  it('computes diff when previousDir is provided', async () => {
    const prev = makeTempDir();
    try {
      writeRoute(prev, 'app/api/users/route.ts', 'export function GET() {}');
      writeRoute(dir, 'app/api/users/route.ts', 'export function GET() {}\nexport function POST() {}');
      const result = await runPlugin({ baseDir: dir, previousDir: prev });
      expect(result.changes.length).toBeGreaterThan(0);
    } finally {
      cleanup(prev);
    }
  });
});

describe('createPlugin', () => {
  let dir: string;
  beforeEach(() => { dir = makeTempDir(); });
  afterEach(() => cleanup(dir));

  it('creates a reusable plugin with defaults', async () => {
    writeRoute(dir, 'app/api/health/route.ts', 'export function GET() {}');
    const plugin = createPlugin({ baseDir: dir });
    const result = await plugin();
    expect(result.routes.length).toBeGreaterThan(0);
  });

  it('throws if baseDir missing', async () => {
    const plugin = createPlugin();
    await expect(plugin()).rejects.toThrow('baseDir is required');
  });
});
