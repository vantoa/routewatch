import { Command } from 'commander';
import { registerValidateCommand } from './validate-cli';
import * as validate from './validate';
import * as scanner from './scanner';
import * as config from './config';

function makeProgram() {
  const program = new Command();
  program.exitOverride();
  registerValidateCommand(program);
  return program;
}

describe('validate CLI', () => {
  beforeEach(() => {
    jest.spyOn(config, 'loadConfig').mockResolvedValue({});
    jest.spyOn(config, 'mergeConfig').mockReturnValue({} as any);
    jest.spyOn(scanner, 'scanRoutes').mockResolvedValue([
      { route: '/api/users', methods: ['GET'], filePath: '/app/api/users/route.ts' },
    ]);
  });

  afterEach(() => jest.restoreAllMocks());

  it('prints formatted report for valid routes', async () => {
    jest.spyOn(validate, 'validateRoutes').mockReturnValue({
      results: [],
      totalViolations: 0,
      valid: true,
    });
    jest.spyOn(validate, 'formatValidationReport').mockReturnValue('✅ All routes passed validation.');
    const spy = jest.spyOn(console, 'log').mockImplementation(() => {});

    await makeProgram().parseAsync(['node', 'cli', 'validate', '/some/dir']);
    expect(spy).toHaveBeenCalledWith(expect.stringContaining('passed'));
  });

  it('outputs JSON when --json flag is set', async () => {
    const report = { results: [], totalViolations: 0, valid: true };
    jest.spyOn(validate, 'validateRoutes').mockReturnValue(report);
    const spy = jest.spyOn(console, 'log').mockImplementation(() => {});

    await makeProgram().parseAsync(['node', 'cli', 'validate', '/some/dir', '--json']);
    const printed = spy.mock.calls[0][0];
    expect(() => JSON.parse(printed)).not.toThrow();
  });

  it('sets exitCode 1 when validation fails', async () => {
    jest.spyOn(validate, 'validateRoutes').mockReturnValue({
      results: [{ route: '/bad', violations: ['has issue'] }],
      totalViolations: 1,
      valid: false,
    });
    jest.spyOn(validate, 'formatValidationReport').mockReturnValue('❌ 1 violation(s) found');
    jest.spyOn(console, 'log').mockImplementation(() => {});

    await makeProgram().parseAsync(['node', 'cli', 'validate', '/some/dir']);
    expect(process.exitCode).toBe(1);
    process.exitCode = 0;
  });
});
