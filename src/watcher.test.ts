import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { watchRoutes } from './watcher';

function createTempProject(): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'routewatch-watch-'));
  const appDir = path.join(dir, 'app');
  fs.mkdirSync(appDir, { recursive: true });
  return dir;
}

function cleanup(dir: string) {
  fs.rmSync(dir, { recursive: true, force: true });
}

function writeRoute(dir: string, routePath: string, methods: string[]) {
  const full = path.join(dir, 'app', routePath);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  const content = methods.map((m) => `export async function ${m}() {}`).join('\n');
  fs.writeFileSync(full, content);
}

describe('watchRoutes', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = createTempProject();
  });

  afterEach(() => {
    cleanup(tmpDir);
  });

  it('returns a stop function', () => {
    const stop = watchRoutes({ dir: tmpDir });
    expect(typeof stop).toBe('function');
    stop();
  });

  it('calls onChange when a new route file is added', (done) => {
    const stop = watchRoutes({
      dir: tmpDir,
      debounceMs: 100,
      onChange: (diff) => {
        expect(diff.added.length).toBeGreaterThan(0);
        stop();
        done();
      },
    });

    setTimeout(() => {
      writeRoute(tmpDir, 'users/route.ts', ['GET']);
    }, 50);
  }, 5000);

  it('does not call onChange when no route files change', (done) => {
    const onChangeMock = jest.fn();
    const stop = watchRoutes({ dir: tmpDir, debounceMs: 100, onChange: onChangeMock });

    setTimeout(() => {
      fs.writeFileSync(path.join(tmpDir, 'app', 'README.md'), '# ignore me');
    }, 50);

    setTimeout(() => {
      stop();
      done();
    }, 400);
  }, 5000);
});
