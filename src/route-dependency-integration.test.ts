import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { scanRoutes } from './scanner';
import { buildDependencyReport, formatDependencyReport } from './route-dependency';

function makeTempDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'rw-dep-int-'));
}

function writeRoute(dir: string, relPath: string, methods: string[]): void {
  const full = path.join(dir, relPath);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  const body = methods.map(m => `export async function ${m}() {}`).join('\n');
  fs.writeFileSync(full, body);
}

function cleanup(dir: string): void {
  fs.rmSync(dir, { recursive: true, force: true });
}

describe('route-dependency integration', () => {
  let dir: string;

  beforeEach(() => {
    dir = makeTempDir();
  });

  afterEach(() => cleanup(dir));

  it('detects dependencies in a realistic project structure', async () => {
    writeRoute(dir, 'app/api/users/route.ts', ['GET', 'POST']);
    writeRoute(dir, 'app/api/users/[id]/route.ts', ['GET', 'PUT', 'DELETE']);
    writeRoute(dir, 'app/api/users/[id]/posts/route.ts', ['GET', 'POST']);
    writeRoute(dir, 'app/api/products/route.ts', ['GET']);
    writeRoute(dir, 'app/health/route.ts', ['GET']);

    const routes = await scanRoutes(dir);
    const report = buildDependencyReport(routes);

    expect(report.dependencies.length).toBeGreaterThan(0);
    expect(report.isolated.length).toBeGreaterThan(0);
  });

  it('formats report without throwing', async () => {
    writeRoute(dir, 'app/api/orders/route.ts', ['GET', 'POST']);
    writeRoute(dir, 'app/api/orders/[id]/route.ts', ['GET', 'DELETE']);

    const routes = await scanRoutes(dir);
    const report = buildDependencyReport(routes);
    const output = formatDependencyReport(report);

    expect(typeof output).toBe('string');
    expect(output.length).toBeGreaterThan(0);
  });

  it('returns all routes as isolated when no shared structure', async () => {
    writeRoute(dir, 'app/alpha/route.ts', ['GET']);
    writeRoute(dir, 'app/beta/route.ts', ['POST']);
    writeRoute(dir, 'app/gamma/route.ts', ['DELETE']);

    const routes = await scanRoutes(dir);
    const report = buildDependencyReport(routes);

    expect(report.dependencies).toHaveLength(0);
    expect(report.isolated).toHaveLength(3);
    expect(report.hubs).toHaveLength(0);
  });
});
