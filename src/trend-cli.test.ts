import { Command } from 'commander';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { registerTrendCommand } from './trend-cli';

function makeProgram() {
  const program = new Command();
  program.exitOverride();
  registerTrendCommand(program);
  return program;
}

describe('registerTrendCommand', () => {
  let tmpFile: string;

  beforeEach(() => {
    tmpFile = path.join(os.tmpdir(), `trend-${Date.now()}.json`);
  });

  afterEach(() => {
    if (fs.existsSync(tmpFile)) fs.unlinkSync(tmpFile);
  });

  it('exits with error if trend file not found', () => {
    const program = makeProgram();
    const mockExit = jest.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });
    expect(() => program.parse(['node', 'rw', 'trend', '/no/such/file.json'])).toThrow();
    mockExit.mockRestore();
  });

  it('prints formatted trend report', () => {
    const entries = [
      { date: '2024-01-01', added: 2, removed: 0, modified: 1, total: 10 },
      { date: '2024-01-02', added: 0, removed: 1, modified: 0, total: 9 },
    ];
    fs.writeFileSync(tmpFile, JSON.stringify(entries));
    const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
    const program = makeProgram();
    program.parse(['node', 'rw', 'trend', tmpFile]);
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });

  it('prints JSON when --json flag is set', () => {
    const entries = [
      { date: '2024-01-01', added: 1, removed: 0, modified: 0, total: 5 },
    ];
    fs.writeFileSync(tmpFile, JSON.stringify(entries));
    const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
    const program = makeProgram();
    program.parse(['node', 'rw', 'trend', tmpFile, '--json']);
    const output = spy.mock.calls[0][0];
    expect(() => JSON.parse(output)).not.toThrow();
    spy.mockRestore();
  });
});
