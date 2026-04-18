import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import {
  createSnapshot,
  saveSnapshot,
  loadSnapshot,
  deleteSnapshot,
  listSnapshots,
} from './snapshot';
import { RouteInfo } from './scanner';

const sampleRoutes: RouteInfo[] = [
  { path: '/api/users', methods: ['GET', 'POST'] },
  { path: '/api/users/[id]', methods: ['GET', 'DELETE'] },
];

let tmpDir: string;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'snapshot-test-'));
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

test('createSnapshot returns correct shape', () => {
  const snap = createSnapshot(sampleRoutes, '1.0.0');
  expect(snap.version).toBe('1.0.0');
  expect(snap.routes).toEqual(sampleRoutes);
  expect(typeof snap.timestamp).toBe('string');
});

test('saveSnapshot writes file and loadSnapshot reads it back', () => {
  const snap = createSnapshot(sampleRoutes, '1.2.3');
  const filePath = saveSnapshot(snap, tmpDir);
  expect(fs.existsSync(filePath)).toBe(true);
  const loaded = loadSnapshot(tmpDir, '1.2.3');
  expect(loaded).not.toBeNull();
  expect(loaded!.version).toBe('1.2.3');
  expect(loaded!.routes).toEqual(sampleRoutes);
});

test('loadSnapshot returns null for missing version', () => {
  const result = loadSnapshot(tmpDir, 'nonexistent');
  expect(result).toBeNull();
});

test('deleteSnapshot removes the file', () => {
  const snap = createSnapshot(sampleRoutes, '2.0.0');
  saveSnapshot(snap, tmpDir);
  const deleted = deleteSnapshot(tmpDir, '2.0.0');
  expect(deleted).toBe(true);
  expect(loadSnapshot(tmpDir, '2.0.0')).toBeNull();
});

test('deleteSnapshot returns false if file does not exist', () => {
  expect(deleteSnapshot(tmpDir, 'ghost')).toBe(false);
});

test('listSnapshots returns all saved versions', () => {
  saveSnapshot(createSnapshot(sampleRoutes, 'v1'), tmpDir);
  saveSnapshot(createSnapshot(sampleRoutes, 'v2'), tmpDir);
  const versions = listSnapshots(tmpDir);
  expect(versions.sort()).toEqual(['v1', 'v2']);
});
