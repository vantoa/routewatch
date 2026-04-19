import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { startWatchDiff } from './watch-diff';

function makeTempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'watch-diff-'));
}

function writeRoute(dir: string, name: string, content: string) {
  const full = path.join(dir, name);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, content);
}

function cleanup(dir: string) {
  fs.rmSync(dir, { recursive: true, force: true });
}

test('detects added route', (done) => {
  const dir = makeTempDir();
  const appDir = path.join(dir, 'app');
  fs.mkdirSync(appDir);

  const stop = startWatchDiff({
    dir,
    interval: 100,
    onDiff: (diff) => {
      expect(diff.added.length).toBeGreaterThan(0);
      stop();
      cleanup(dir);
      done();
    },
  });

  setTimeout(() => {
    writeRoute(dir, 'app/api/users/route.ts', 'export function GET() {}');
  }, 150);
}, 5000);

test('calls onError on handler failure', (done) => {
  const dir = makeTempDir();
  fs.mkdirSync(path.join(dir, 'app'));

  const stop = startWatchDiff({
    dir,
    interval: 100,
    onDiff: () => { throw new Error('forced'); },
    onError: (err) => {
      expect(err.message).toBe('forced');
      stop();
      cleanup(dir);
      done();
    },
  });

  setTimeout(() => {
    writeRoute(dir, 'app/api/items/route.ts', 'export function GET() {}');
  }, 150);
}, 5000);
