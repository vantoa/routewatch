import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { scanRoutes } from './scanner';
import { diffRoutes } from './differ';
import { buildBloomReport, formatBloomReport } from './route-bloom';

function makeTempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'bloom-int-'));
}

function writeRoute(dir: string, rel: string, content: string) {
  const full = path.join(dir, rel);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, content);
}

function cleanup(...dirs: string[]) {
  for (const d of dirs) fs.rmSync(d, { recursive: true, force: true });
}

describe('route-bloom integration', () => {
  let oldDir: string;
  let newDir: string;

  beforeEach(() => {
    oldDir = makeTempDir();
    newDir = makeTempDir();
  });

  afterEach(() => cleanup(oldDir, newDir));

  it('detects a newly added route end-to-end', async () => {
    writeRoute(oldDir, 'app/api/products/route.ts', 'export async function GET() {}');
    writeRoute(newDir, 'app/api/products/route.ts', 'export async function GET() {}');
    writeRoute(newDir, 'app/api/orders/route.ts', 'export async function POST() {}\nexport async function GET() {}');

    const oldRoutes = await scanRoutes(oldDir);
    const newRoutes = await scanRoutes(newDir);
    const changes = diffRoutes(oldRoutes, newRoutes);
    const report = buildBloomReport(changes);

    expect(report.entries).toHaveLength(1);
    expect(report.entries[0].path).toBe('/api/orders');
    expect(report.entries[0].addedMethods).toContain('POST');
    expect(report.entries[0].growthScore).toBeGreaterThan(0);
  });

  it('produces readable formatted output', async () => {
    writeRoute(newDir, 'app/api/search/route.ts', 'export async function GET() {}');

    const oldRoutes = await scanRoutes(oldDir);
    const newRoutes = await scanRoutes(newDir);
    const changes = diffRoutes(oldRoutes, newRoutes);
    const report = buildBloomReport(changes);
    const output = formatBloomReport(report);

    expect(output).toContain('/api/search');
    expect(output).toContain('Route Bloom Report');
    expect(output).toContain('Top Growing');
  });

  it('returns empty report when no routes were added', async () => {
    writeRoute(oldDir, 'app/api/users/route.ts', 'export async function GET() {}');
    writeRoute(newDir, 'app/api/users/route.ts', 'export async function GET() {}');

    const oldRoutes = await scanRoutes(oldDir);
    const newRoutes = await scanRoutes(newDir);
    const changes = diffRoutes(oldRoutes, newRoutes);
    const report = buildBloomReport(changes);

    expect(report.entries).toHaveLength(0);
    expect(formatBloomReport(report)).toContain('No new routes');
  });
});
