import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import {
  saveBaseline,
  loadBaseline,
  deleteBaseline,
  getBaselinePath,
} from './baseline';
import { RouteInfo } from './scanner';

const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'baseline-test-'));
const baselinePath = path.join(tmpDir, '.routewatch-baseline.json');

const sampleRoutes: RouteInfo[] = [
  { route: '/api/users', methods: ['GET', 'POST'], filePath: 'app/api/users/route.ts' },
  { route: '/api/posts', methods: ['GET'], filePath: 'app/api/posts/route.ts' },
];

afterAll(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

describe('baseline', () => {
  it('returns null when no baseline file exists', () => {
    expect(loadBaseline(baselinePath)).toBeNull();
  });

  it('saves and loads a baseline', () => {
    saveBaseline(sampleRoutes, baselinePath);
    const loaded = loadBaseline(baselinePath);
    expect(loaded).not.toBeNull();
    expect(loaded!.routes).toEqual(sampleRoutes);
    expect(loaded!.version).toBe('1');
    expect(loaded!.timestamp).toBeTruthy();
  });

  it('deletes the baseline file', () => {
    saveBaseline(sampleRoutes, baselinePath);
    deleteBaseline(baselinePath);
    expect(loadBaseline(baselinePath)).toBeNull();
  });

  it('getBaselinePath returns a path ending with the baseline filename', () => {
    const p = getBaselinePath('/some/dir');
    expect(p).toMatch(/\.routewatch-baseline\.json$/);
  });

  it('returns null for malformed baseline file', () => {
    fs.writeFileSync(baselinePath, 'not json', 'utf-8');
    expect(loadBaseline(baselinePath)).toBeNull();
    fs.unlinkSync(baselinePath);
  });
});
