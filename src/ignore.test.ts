import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { loadIgnoreFile, buildIgnoreList, isIgnored } from './ignore';

let tmpDir: string;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'routewatch-ignore-'));
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

describe('loadIgnoreFile', () => {
  it('returns empty array when no .routewatchignore exists', () => {
    expect(loadIgnoreFile(tmpDir)).toEqual([]);
  });

  it('parses patterns from .routewatchignore', () => {
    fs.writeFileSync(
      path.join(tmpDir, '.routewatchignore'),
      '# comment\n**/internal/**\n/api/secret\n'
    );
    expect(loadIgnoreFile(tmpDir)).toEqual(['**/internal/**', '/api/secret']);
  });

  it('ignores blank lines', () => {
    fs.writeFileSync(path.join(tmpDir, '.routewatchignore'), '\n/api/test\n\n');
    expect(loadIgnoreFile(tmpDir)).toEqual(['/api/test']);
  });
});

describe('buildIgnoreList', () => {
  it('includes defaults', () => {
    const list = buildIgnoreList(tmpDir);
    expect(list).toContain('**/node_modules/**');
    expect(list).toContain('**/.next/**');
  });

  it('merges extra patterns', () => {
    const list = buildIgnoreList(tmpDir, ['/api/internal']);
    expect(list).toContain('/api/internal');
  });
});

describe('isIgnored', () => {
  it('returns true for matching pattern', () => {
    expect(isIgnored('node_modules/foo/bar', ['**/node_modules/**'])).toBe(true);
  });

  it('returns false for non-matching', () => {
    expect(isIgnored('/api/users', ['**/internal/**'])).toBe(false);
  });
});
