import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { saveBaseline, loadBaseline, getBaselinePath } from './baseline';
import { diffRoutes } from './differ';
import { RouteInfo } from './scanner';

const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'baseline-int-'));

afterAll(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

describe('baseline integration', () => {
  const v1Routes: RouteInfo[] = [
    { route: '/api/users', methods: ['GET'], filePath: 'app/api/users/route.ts' },
    { route: '/api/posts', methods: ['GET', 'POST'], filePath: 'app/api/posts/route.ts' },
  ];

  const v2Routes: RouteInfo[] = [
    { route: '/api/users', methods: ['GET', 'DELETE'], filePath: 'app/api/users/route.ts' },
    { route: '/api/comments', methods: ['GET'], filePath: 'app/api/comments/route.ts' },
  ];

  it('detects added, removed, and modified routes against baseline', () => {
    const bp = getBaselinePath(tmpDir);
    saveBaseline(v1Routes, bp);
    const saved = loadBaseline(bp);
    expect(saved).not.toBeNull();

    const changes = diffRoutes(saved!.routes, v2Routes);
    const types = changes.map((c) => c.type);

    expect(types).toContain('added');
    expect(types).toContain('removed');
    expect(types).toContain('modified');
  });

  it('reports no changes when routes are identical', () => {
    const bp = getBaselinePath(tmpDir);
    saveBaseline(v1Routes, bp);
    const saved = loadBaseline(bp);
    const changes = diffRoutes(saved!.routes, v1Routes);
    expect(changes).toHaveLength(0);
  });
});
