import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { pinRoute, unpinRoute, loadPins, listPins, getPinPath } from './pin';

let tmpDir: string;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'rw-pin-'));
  jest.spyOn(require('./pin'), 'getPinPath').mockReturnValue(path.join(tmpDir, 'pins.json'));
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
  jest.restoreAllMocks();
});

describe('pin integration', () => {
  it('pins and lists a route', async () => {
    await pinRoute('/api/users', ['GET', 'POST']);
    const pins = await loadPins();
    expect(pins['/api/users']).toEqual(['GET', 'POST']);
    const lines = listPins(pins);
    expect(lines.some((l) => l.includes('/api/users'))).toBe(true);
  });

  it('unpins a route', async () => {
    await pinRoute('/api/users', ['GET']);
    await unpinRoute('/api/users');
    const pins = await loadPins();
    expect(pins['/api/users']).toBeUndefined();
  });

  it('handles multiple pins independently', async () => {
    await pinRoute('/api/a', ['GET']);
    await pinRoute('/api/b', ['POST']);
    await unpinRoute('/api/a');
    const pins = await loadPins();
    expect(pins['/api/a']).toBeUndefined();
    expect(pins['/api/b']).toEqual(['POST']);
  });
});
