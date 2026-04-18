import { Command } from 'commander';
import { registerDeprecateCommand } from './deprecate-cli';
import * as scanner from './scanner';
import * as deprecate from './deprecate';
import * as config from './config';

function makeProgram() {
  const program = new Command();
  program.exitOverride();
  registerDeprecateCommand(program);
  return program;
}

describe('registerDeprecateCommand', () => {
  beforeEach(() => {
    jest.spyOn(config, 'loadConfig').mockResolvedValue({});
    jest.spyOn(config, 'mergeConfig').mockReturnValue({ deprecationRules: [{ pattern: '/v1/*' }] } as any);
    jest.spyOn(scanner, 'scanRoutes').mockResolvedValue([
      { route: '/v1/users', methods: ['GET'] },
      { route: '/v2/users', methods: ['GET'] },
    ] as any);
  });

  afterEach(() => jest.restoreAllMocks());

  it('prints deprecated routes in text format', async () => {
    jest.spyOn(deprecate, 'findDeprecatedRoutes').mockReturnValue([
      { route: '/v1/users', methods: ['GET'], rule: { pattern: '/v1/*' } } as any,
    ]);
    jest.spyOn(deprecate, 'formatDeprecated').mockReturnValue('DEPRECATED: /v1/users');
    const log = jest.spyOn(console, 'log').mockImplementation(() => {});
    const exit = jest.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });

    await expect(
      makeProgram().parseAsync(['node', 'test', 'deprecate', './app'])
    ).rejects.toThrow('exit');

    expect(log).toHaveBeenCalledWith('DEPRECATED: /v1/users');
    expect(exit).toHaveBeenCalledWith(1);
  });

  it('prints message when no deprecated routes found', async () => {
    jest.spyOn(deprecate, 'findDeprecatedRoutes').mockReturnValue([]);
    const log = jest.spyOn(console, 'log').mockImplementation(() => {});

    await makeProgram().parseAsync(['node', 'test', 'deprecate', './app']);
    expect(log).toHaveBeenCalledWith('No deprecated routes found.');
  });

  it('prints message when no rules configured', async () => {
    jest.spyOn(config, 'mergeConfig').mockReturnValue({} as any);
    const log = jest.spyOn(console, 'log').mockImplementation(() => {});

    await makeProgram().parseAsync(['node', 'test', 'deprecate', './app']);
    expect(log).toHaveBeenCalledWith('No deprecation rules configured.');
  });
});
