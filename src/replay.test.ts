import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import {
  loadReplayLog,
  appendReplayEntry,
  buildReplayReport,
  formatReplayReport,
  ReplayEntry,
} from './replay';

let tmpDir: string;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'replay-test-'));
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

const sampleEntry: ReplayEntry = {
  timestamp: '2024-01-01T00:00:00.000Z',
  label: 'v1.0.0',
  changes: [{ type: 'added', route: '/api/users', methods: ['GET'] }],
};

test('loadReplayLog returns empty array for missing file', () => {
  expect(loadReplayLog(path.join(tmpDir, 'missing.json'))).toEqual([]);
});

test('appendReplayEntry writes and loads entries', () => {
  const file = path.join(tmpDir, 'replay.json');
  appendReplayEntry(file, sampleEntry);
  const entries = loadReplayLog(file);
  expect(entries).toHaveLength(1);
  expect(entries[0].label).toBe('v1.0.0');
});

test('appendReplayEntry accumulates entries', () => {
  const file = path.join(tmpDir, 'replay.json');
  appendReplayEntry(file, sampleEntry);
  appendReplayEntry(file, { ...sampleEntry, label: 'v1.1.0' });
  expect(loadReplayLog(file)).toHaveLength(2);
});

test('buildReplayReport totals entries', () => {
  const report = buildReplayReport([sampleEntry]);
  expect(report.total).toBe(1);
  expect(report.entries[0].label).toBe('v1.0.0');
});

test('formatReplayReport shows no entries message', () => {
  expect(formatReplayReport({ entries: [], total: 0 })).toBe('No replay entries found.');
});

test('formatReplayReport lists changes', () => {
  const report = buildReplayReport([sampleEntry]);
  const out = formatReplayReport(report);
  expect(out).toContain('v1.0.0');
  expect(out).toContain('/api/users');
  expect(out).toContain('ADDED');
});
