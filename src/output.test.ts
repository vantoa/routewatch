import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { renderOutput, writeOutput, handleOutput } from './output';
import { DiffResult } from './differ';

const sampleDiff: DiffResult = {
  added: [{ route: '/api/users', methods: ['GET', 'POST'] }],
  removed: [],
  modified: [],
};

let tmpDir: string;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'routewatch-output-'));
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

describe('renderOutput', () => {
  it('renders text format', () => {
    const out = renderOutput(sampleDiff, { format: 'text', color: false });
    expect(typeof out).toBe('string');
    expect(out.length).toBeGreaterThan(0);
  });

  it('renders json format', () => {
    const out = renderOutput(sampleDiff, { format: 'json' });
    const parsed = JSON.parse(out);
    expect(parsed).toHaveProperty('added');
  });

  it('renders markdown format', () => {
    const out = renderOutput(sampleDiff, { format: 'markdown' });
    expect(out).toContain('#');
  });
});

describe('writeOutput', () => {
  it('writes to file when outFile is provided', () => {
    const outFile = path.join(tmpDir, 'result.txt');
    writeOutput('hello', outFile);
    expect(fs.readFileSync(outFile, 'utf-8')).toBe('hello');
  });

  it('creates nested directories if needed', () => {
    const outFile = path.join(tmpDir, 'nested', 'dir', 'result.txt');
    writeOutput('data', outFile);
    expect(fs.existsSync(outFile)).toBe(true);
  });
});

describe('handleOutput', () => {
  it('writes json to file', () => {
    const outFile = path.join(tmpDir, 'diff.json');
    handleOutput(sampleDiff, { format: 'json', outFile });
    const content = fs.readFileSync(outFile, 'utf-8');
    expect(() => JSON.parse(content)).not.toThrow();
  });
});
