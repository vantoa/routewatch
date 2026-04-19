import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { pinRoute, unpinRoute, loadPins, savePins, formatPins, getPinPath } from './pin';

function makeTempDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'routewatch-pin-'));
}

function cleanup(dir: string) {
  fs.rmSync(dir, { recursive: true, force: true });
}

const fakeRoute = { route: '/api/users', methods: ['GET', 'POST'] };

test('loadPins returns empty array when no file', () => {
  const dir = makeTempDir();
  expect(loadPins(dir)).toEqual([]);
  cleanup(dir);
});

test('pinRoute adds a new pin', () => {
  const dir = makeTempDir();
  const pins = pinRoute(fakeRoute, 'important', dir);
  expect(pins).toHaveLength(1);
  expect(pins[0].route).toBe('/api/users');
  expect(pins[0].note).toBe('important');
  cleanup(dir);
});

test('pinRoute updates existing pin', () => {
  const dir = makeTempDir();
  pinRoute(fakeRoute, 'first', dir);
  const pins = pinRoute({ ...fakeRoute, methods: ['GET'] }, 'updated', dir);
  expect(pins).toHaveLength(1);
  expect(pins[0].methods).toEqual(['GET']);
  expect(pins[0].note).toBe('updated');
  cleanup(dir);
});

test('unpinRoute removes a pin', () => {
  const dir = makeTempDir();
  pinRoute(fakeRoute, undefined, dir);
  const pins = unpinRoute('/api/users', dir);
  expect(pins).toHaveLength(0);
  cleanup(dir);
});

test('formatPins returns message when empty', () => {
  expect(formatPins([])).toBe('No pinned routes.');
});

test('formatPins formats pins correctly', () => {
  const pins = [{ route: '/api/users', methods: ['GET'], pinnedAt: '', note: 'core' }];
  const out = formatPins(pins);
  expect(out).toContain('/api/users');
  expect(out).toContain('GET');
  expect(out).toContain('core');
});

test('getPinPath returns correct filename', () => {
  expect(getPinPath('/some/dir')).toBe('/some/dir/.routewatch-pins.json');
});
