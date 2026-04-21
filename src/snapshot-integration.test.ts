import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import { createSnapshot, saveSnapshot, loadSnapshot, listSnapshots, deleteSnapshot } from './snapshot';
import { scanRoutes } from './scanner';
import { diffRoutes } from './differ';

let tmpDir: string;

async function writeRoute(dir: string, rel: string, content: string) {
  const full = path.join(dir, rel);
  await fs.mkdir(path.dirname(full), { recursive: true });
  await fs.writeFile(full, content);
}

beforeEach(async () => {
  tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'routewatch-snap-'));
});

afterEach(async () => {
  await fs.rm(tmpDir, { recursive: true, force: true });
});

describe('snapshot integration', () => {
  it('saves and loads a snapshot round-trip', async () => {
    await writeRoute(tmpDir, 'app/api/users/route.ts', 'export async function GET() {}');
    const routes = await scanRoutes(tmpDir);
    const snap = createSnapshot('baseline', routes);
    await saveSnapshot(snap, tmpDir);

    const loaded = await loadSnapshot('baseline', tmpDir);
    expect(loaded).not.toBeNull();
    expect(loaded!.name).toBe('baseline');
    expect(loaded!.routes).toEqual(routes);
  });

  it('detects new route added after snapshot', async () => {
    await writeRoute(tmpDir, 'app/api/users/route.ts', 'export async function GET() {}');
    const before = await scanRoutes(tmpDir);
    const snap = createSnapshot('v1', before);
    await saveSnapshot(snap, tmpDir);

    await writeRoute(tmpDir, 'app/api/posts/route.ts', 'export async function GET() {} export async function POST() {}');
    const after = await scanRoutes(tmpDir);

    const loaded = await loadSnapshot('v1', tmpDir);
    const changes = diffRoutes(loaded!.routes, after);
    expect(changes.some(c => c.status === 'added')).toBe(true);
  });

  it('lists and deletes snapshots', async () => {
    const snap = createSnapshot('temp', []);
    await saveSnapshot(snap, tmpDir);

    const list = await listSnapshots(tmpDir);
    expect(list.map(s => s.name)).toContain('temp');

    await deleteSnapshot('temp', tmpDir);
    const after = await listSnapshots(tmpDir);
    expect(after.map(s => s.name)).not.toContain('temp');
  });

  it('returns null when loading a non-existent snapshot', async () => {
    const loaded = await loadSnapshot('does-not-exist', tmpDir);
    expect(loaded).toBeNull();
  });

  it('overwrites an existing snapshot when saved with the same name', async () => {
    await writeRoute(tmpDir, 'app/api/users/route.ts', 'export async function GET() {}');
    const routesV1 = await scanRoutes(tmpDir);
    await saveSnapshot(createSnapshot('overwrite-test', routesV1), tmpDir);

    await writeRoute(tmpDir, 'app/api/posts/route.ts', 'export async function POST() {}');
    const routesV2 = await scanRoutes(tmpDir);
    await saveSnapshot(createSnapshot('overwrite-test', routesV2), tmpDir);

    const loaded = await loadSnapshot('overwrite-test', tmpDir);
    expect(loaded).not.toBeNull();
    expect(loaded!.routes).toEqual(routesV2);

    // Ensure only one snapshot with this name exists
    const list = await listSnapshots(tmpDir);
    expect(list.filter(s => s.name === 'overwrite-test')).toHaveLength(1);
  });
});
