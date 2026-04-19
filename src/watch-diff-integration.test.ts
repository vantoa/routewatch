import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { startWatchDiff } from './watch-diff';

function makeTempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'wd-int-'));
}
function cleanup(dir: string) {
  fs.rmSync(dir, { recursive: true, force: true });
}
function writeRoute(dir: string, rel: string, content: string) {
  const full = path.join(dir, rel);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, content);
}

test('detects removed route', (done) => {
  const dir = makeTempDir();
  writeRoute(dir, 'app/api/orders/route.ts', 'export function GET() {}');

  let calls = 0;
  const stop = startWatchDiff({
    dir,
    interval: 100,
    onDiff: (diff) => {
      calls++;
      if (calls === 1) {
        expect(diff.removed.length).toBeGreaterThan(0);
        stop();
        cleanup(dir);
        done();
      }
    },
  });

  setTimeout(() => {
    fs.rmSync(path.join(dir, 'app/api/orders/route.ts'));
  }, 150);
}, 5000);

test('no diff emitted when nothing changes', (done) => {
  const dir = makeTempDir();
  writeRoute(dir, 'app/api/ping/route.ts', 'export function GET() {}');
  let called = false;

  const stop = startWatchDiff({
    dir,
    interval: 100,
    onDiff: () => { called = true; },
  });

  setTimeout(() => {
    stop();
    cleanup(dir);
    expect(called).toBe(false);
    done();
  }, 400);
}, 5000);
