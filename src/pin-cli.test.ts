import { Command } from 'commander';
import { registerPinCommands } from './pin-cli';
import * as pinModule from './pin';

function makeProgram() {
  const program = new Command();
  program.exitOverride();
  registerPinCommands(program);
  return program;
}

describe('pin-cli', () => {
  afterEach(() => jest.restoreAllMocks());

  it('pin add calls pinRoute', async () => {
    const spy = jest.spyOn(pinModule, 'pinRoute').mockResolvedValue(undefined);
    const program = makeProgram();
    await program.parseAsync(['pin', 'add', '/api/users', '--methods', 'GET,POST'], { from: 'user' });
    expect(spy).toHaveBeenCalledWith('/api/users', ['GET', 'POST']);
  });

  it('pin remove calls unpinRoute', async () => {
    const spy = jest.spyOn(pinModule, 'unpinRoute').mockResolvedValue(undefined);
    const program = makeProgram();
    await program.parseAsync(['pin', 'remove', '/api/users'], { from: 'user' });
    expect(spy).toHaveBeenCalledWith('/api/users');
  });

  it('pin list prints pinned routes', async () => {
    jest.spyOn(pinModule, 'loadPins').mockResolvedValue({ '/api/users': ['GET'] });
    jest.spyOn(pinModule, 'listPins').mockReturnValue(['GET /api/users']);
    const log = jest.spyOn(console, 'log').mockImplementation(() => {});
    const program = makeProgram();
    await program.parseAsync(['pin', 'list'], { from: 'user' });
    expect(log).toHaveBeenCalledWith('GET /api/users');
  });

  it('pin list prints empty message when no pins', async () => {
    jest.spyOn(pinModule, 'loadPins').mockResolvedValue({});
    jest.spyOn(pinModule, 'listPins').mockReturnValue([]);
    const log = jest.spyOn(console, 'log').mockImplementation(() => {});
    const program = makeProgram();
    await program.parseAsync(['pin', 'list'], { from: 'user' });
    expect(log).toHaveBeenCalledWith('No pinned routes.');
  });
});
