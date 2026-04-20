import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { scanRoutes } from './scanner';
import { diffRoutes } from './differ';
import { assessImpact } from './route-impact';

function makeTempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'routewatch-impact-'));
}

function writeRoute(dir: string, relPath: string, content: string) {
  const full = path.join(dir, relPath);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, content);
}

function cleanup(dir: string) {
  fs.rmSync(dir, { recursive: true, force: true });
}

describe('route-impact integration', () => {
  let oldDir: string;
  let newDir: string;

  beforeEach(() => {
    oldDir = makeTempDir();
    newDir = makeTempDir();
  });

  afterEach(() => {
    cleanup(oldDir);
    cleanup(newDir);
  });

  it('detects breaking change when route is removed', async () => {
    writeRoute(oldDir, 'app/api/users/route.ts', 'export function GET() {}');
    const oldRoutes = await scanRoutes(oldDir);
    const newRoutes = await scanRoutes(newDir);
    const changes = diffRoutes(oldRoutes, newRoutes);
    const report = assessImpact(changes);
    expect(report.highestSeverity).toBe('breaking');
    expect(report.entries[0].route).toBe('/api/users');
  });

  it('detects additive change when route is added', async () => {
    writeRoute(newDir, 'app/api/products/route.ts', 'export function GET() {}');
    const oldRoutes = await scanRoutes(oldDir);
    const newRoutes = await scanRoutes(newDir);
    const changes = diffRoutes(oldRoutes, newRoutes);
    const report = assessImpact(changes);
    expect(report.highestSeverity).toBe('additive');
  });

  it('returns zero score when no changes', async () => {
    writeRoute(oldDir, 'app/api/ping/route.ts', 'export function GET() {}');
    writeRoute(newDir, 'app/api/ping/route.ts', 'export function GET() {}');
    const oldRoutes = await scanRoutes(oldDir);
    const newRoutes = await scanRoutes(newDir);
    const changes = diffRoutes(oldRoutes, newRoutes);
    const report = assessImpact(changes);
    expect(report.totalScore).toBe(0);
    expect(report.entries).toHaveLength(0);
  });
});
