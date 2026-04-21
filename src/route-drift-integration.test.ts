import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { scanRoutes } from './scanner';
import { saveBaseline, loadBaseline } from './baseline';
import { detectDrift, buildDriftReport, formatDriftReport } from './route-drift';

function makeTempDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'routewatch-drift-'));
}

function writeRoute(dir: string, route: string, methods: string[]): void {
  const filePath = path.join(dir, ...route.split('/').filter(Boolean), 'route.ts');
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  const body = methods.map((m) => `export function ${m}() {}`).join('\n');
  fs.writeFileSync(filePath, body);
}

function cleanup(dir: string): void {
  fs.rmSync(dir, { recursive: true, force: true });
}

describe('route-drift integration', () => {
  let dir: string;

  beforeEach(() => {
    dir = makeTempDir();
  });

  afterEach(() => {
    cleanup(dir);
  });

  it('detects no drift when routes match baseline', async () => {
    writeRoute(dir, '/api/users', ['GET', 'POST']);
    const routes = await scanRoutes(dir);
    const entries = detectDrift(routes, routes);
    expect(entries).toHaveLength(0);
  });

  it('detects drift after adding a method', async () => {
    writeRoute(dir, '/api/items', ['GET']);
    const baseline = await scanRoutes(dir);

    cleanup(dir);
    dir = makeTempDir();
    writeRoute(dir, '/api/items', ['GET', 'DELETE']);
    const current = await scanRoutes(dir);

    const entries = detectDrift(baseline, current);
    expect(entries).toHaveLength(1);
    expect(entries[0].driftedMethods).toContain('DELETE');
  });

  it('formats drift report correctly end-to-end', async () => {
    writeRoute(dir, '/api/orders', ['GET']);
    const baseline = await scanRoutes(dir);

    cleanup(dir);
    dir = makeTempDir();
    writeRoute(dir, '/api/orders', ['GET', 'PATCH']);
    const current = await scanRoutes(dir);

    const entries = detectDrift(baseline, current);
    const report = buildDriftReport(entries);
    const output = formatDriftReport(report);

    expect(output).toContain('/api/orders');
    expect(output).toContain('PATCH');
    expect(output).toContain('Total drifted routes: 1');
  });
});
