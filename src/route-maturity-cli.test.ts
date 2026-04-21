import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Command } from 'commander';
import { registerMaturityCommand } from './route-maturity-cli';

vi.mock('./scanner', () => ({
  scanRoutes: vi.fn().mockResolvedValue([
    { route: '/api/users', methods: ['GET', 'POST'] },
    { route: '/api/[...slug]', methods: ['GET'] },
  ]),
}));

vi.mock('./cache', () => ({
  loadCache: vi.fn().mockResolvedValue(null),
}));

vi.mock('./differ', () => ({
  diffRoutes: vi.fn().mockReturnValue([]),
}));

function makeProgram(): Command {
  const program = new Command();
  program.exitOverride();
  registerMaturityCommand(program);
  return program;
}

describe('registerMaturityCommand', () => {
  let consoleSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  it('registers the maturity command', () => {
    const program = makeProgram();
    const cmd = program.commands.find(c => c.name() === 'maturity');
    expect(cmd).toBeDefined();
  });

  it('outputs formatted report by default', async () => {
    const program = makeProgram();
    await program.parseAsync(['node', 'test', 'maturity', './src']);
    expect(consoleSpy).toHaveBeenCalled();
    const output = consoleSpy.mock.calls[0][0] as string;
    expect(output).toContain('Maturity');
  });

  it('outputs JSON when --json flag is provided', async () => {
    const program = makeProgram();
    await program.parseAsync(['node', 'test', 'maturity', './src', '--json']);
    const output = consoleSpy.mock.calls[0][0] as string;
    const parsed = JSON.parse(output);
    expect(parsed).toHaveProperty('routes');
    expect(parsed).toHaveProperty('summary');
  });

  it('filters by level when --filter is provided', async () => {
    const program = makeProgram();
    await program.parseAsync(['node', 'test', 'maturity', './src', '--filter', 'stable', '--json']);
    const output = consoleSpy.mock.calls[0][0] as string;
    const parsed = JSON.parse(output);
    expect(parsed.routes.every((r: { level: string }) => r.level === 'stable')).toBe(true);
  });
});
