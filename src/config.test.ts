import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { loadConfig, mergeConfig, validateConfig } from './config';

let tmpDir: string;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'routewatch-config-'));
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

describe('loadConfig', () => {
  it('returns defaults when no config file exists', () => {
    const config = loadConfig(tmpDir);
    expect(config.appDir).toBe('app');
    expect(config.output).toBe('text');
    expect(config.ignore).toContain('node_modules');
  });

  it('loads routewatch.config.json when present', () => {
    const cfg = { appDir: 'src/app', output: 'json' };
    fs.writeFileSync(path.join(tmpDir, 'routewatch.config.json'), JSON.stringify(cfg));
    const config = loadConfig(tmpDir);
    expect(config.appDir).toBe('src/app');
    expect(config.output).toBe('json');
  });

  it('loads .routewatchrc when present', () => {
    const cfg = { output: 'markdown' };
    fs.writeFileSync(path.join(tmpDir, '.routewatchrc'), JSON.stringify(cfg));
    const config = loadConfig(tmpDir);
    expect(config.output).toBe('markdown');
  });

  it('throws on malformed JSON', () => {
    fs.writeFileSync(path.join(tmpDir, 'routewatch.config.json'), '{ bad json }');
    expect(() => loadConfig(tmpDir)).toThrow('Failed to parse config file');
  });
});

describe('mergeConfig', () => {
  it('merges partial config with defaults', () => {
    const config = mergeConfig({ appDir: 'pages' });
    expect(config.appDir).toBe('pages');
    expect(config.output).toBe('text');
  });
});

describe('validateConfig', () => {
  it('returns no errors for valid config', () => {
    const errors = validateConfig({ output: 'json', appDir: 'app' });
    expect(errors).toHaveLength(0);
  });

  it('returns error for invalid output format', () => {
    const errors = validateConfig({ output: 'xml' as any });
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0]).toMatch(/Invalid output format/);
  });
});
