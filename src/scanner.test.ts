import fs from 'fs';
import path from 'path';
import os from 'os';
import { scanRoutes, Route } from './scanner';

function createTempProject(structure: Record<string, string>): string {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'routewatch-'));
  for (const [filePath, content] of Object.entries(structure)) {
    const fullPath = path.join(tmpDir, filePath);
    fs.mkdirSync(path.dirname(fullPath), { recursive: true });
    fs.writeFileSync(fullPath, content, 'utf-8');
  }
  return tmpDir;
}

function cleanup(dir: string) {
  fs.rmSync(dir, { recursive: true, force: true });
}

describe('scanRoutes', () => {
  it('returns an empty array when app dir does not exist', () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'routewatch-'));
    const routes = scanRoutes(tmpDir);
    expect(routes).toEqual([]);
    cleanup(tmpDir);
  });

  it('detects GET and POST methods from a route file', () => {
    const tmpDir = createTempProject({
      'app/users/route.ts': `
        export async function GET(req: Request) {}
        export async function POST(req: Request) {}
      `
    });
    const routes = scanRoutes(tmpDir);
    const methods = routes.map((r: Route) => r.method).sort();
    expect(methods).toEqual(['GET', 'POST']);
    expect(routes[0].path).toBe('/users');
    cleanup(tmpDir);
  });

  it('converts dynamic segments to colon notation', () => {
    const tmpDir = createTempProject({
      'app/users/[id]/route.ts': `export function GET() {}`
    });
    const routes = scanRoutes(tmpDir);
    expect(routes[0].path).toBe('/users/:id');
    cleanup(tmpDir);
  });

  it('ignores route group segments in path', () => {
    const tmpDir = createTempProject({
      'app/(api)/products/route.ts': `export function GET() {}`
    });
    const routes = scanRoutes(tmpDir);
    expect(routes[0].path).toBe('/products');
    cleanup(tmpDir);
  });
});
