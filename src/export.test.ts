import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { exportToCsv, exportChanges, writeExport } from './export';
import { RouteChange } from './differ';

const changes: RouteChange[] = [
  { type: 'added', route: '/api/users', methodsAfter: ['GET', 'POST'] },
  { type: 'removed', route: '/api/legacy', methodsBefore: ['GET'] },
  { type: 'modified', route: '/api/items', methodsBefore: ['GET'], methodsAfter: ['GET', 'DELETE'] },
];

describe('exportToCsv', () => {
  it('includes header row', () => {
    const csv = exportToCsv(changes);
    expect(csv.startsWith('type,route,methods_before,methods_after')).toBe(true);
  });

  it('has correct number of rows', () => {
    const csv = exportToCsv(changes);
    const lines = csv.trim().split('\n');
    expect(lines).toHaveLength(changes.length + 1);
  });

  it('encodes methods with pipe separator', () => {
    const csv = exportToCsv(changes);
    expect(csv).toContain('GET|POST');
  });
});

describe('exportChanges', () => {
  it('returns valid JSON for json format', () => {
    const out = exportChanges(changes, { format: 'json', outputPath: 'out.json' });
    const parsed = JSON.parse(out);
    expect(parsed.changes).toHaveLength(3);
  });

  it('includes stats when requested', () => {
    const out = exportChanges(changes, { format: 'json', outputPath: 'out.json', includeStats: true });
    const parsed = JSON.parse(out);
    expect(parsed.stats).toBeDefined();
  });

  it('returns csv string for csv format', () => {
    const out = exportChanges(changes, { format: 'csv', outputPath: 'out.csv' });
    expect(out).toContain('type,route');
  });

  it('returns markdown string for markdown format', () => {
    const out = exportChanges(changes, { format: 'markdown', outputPath: 'out.md' });
    expect(typeof out).toBe('string');
    expect(out.length).toBeGreaterThan(0);
  });
});

describe('writeExport', () => {
  let tmpDir: string;

  beforeEach(() => { tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'export-test-')); });
  afterEach(() => { fs.rmSync(tmpDir, { recursive: true, force: true }); });

  it('writes file to disk', () => {
    const outPath = path.join(tmpDir, 'result.json');
    writeExport(changes, { format: 'json', outputPath: outPath });
    expect(fs.existsSync(outPath)).toBe(true);
  });

  it('creates nested directories if needed', () => {
    const outPath = path.join(tmpDir, 'nested', 'dir', 'result.csv');
    writeExport(changes, { format: 'csv', outputPath: outPath });
    expect(fs.existsSync(outPath)).toBe(true);
  });
});
