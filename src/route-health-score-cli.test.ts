import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Command } from 'commander';
import { registerHealthScoreCommand } from './route-health-score-cli';

vi.mock('./scanner', () => ({
  scanRoutes: vi.fn().mockResolvedValue([
    { path: '/api/users', methods: ['GET', 'POST'] },
    { path: '/api/[id]/[sub]/[deep]', methods: ['GET'] },
  ]),
}));

vi.mock('./cache', () => ({
  loadCache: vi.fn().mockRejectedValue(new Error('no cache')),
}));

function makeProgram() {
  const program = new Command();
  program.exitOverride();
  registerHealthScoreCommand(program);
  return program;
}

describe('registerHealthScoreCommand', () => {
  let consoleSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  it('registers the health-score command', () => {
    const program = makeProgram();
    const cmd = program.commands.find(c => c.name() === 'health-score');
    expect(cmd).toBeDefined();
  });

  it('outputs formatted report by default', async () => {
    const program = makeProgram();
    await program.parseAsync(['node', 'cli', 'health-score', '.']);
    expect(consoleSpy).toHaveBeenCalled();
    const output = consoleSpy.mock.calls[0][0] as string;
    expect(output).toContain('Route Health Scores');
  });

  it('outputs JSON when --json flag is set', async () => {
    const program = makeProgram();
    await program.parseAsync(['node', 'cli', 'health-score', '.', '--json']);
    const output = consoleSpy.mock.calls[0][0] as string;
    const parsed = JSON.parse(output);
    expect(parsed).toHaveProperty('routes');
    expect(parsed).toHaveProperty('average');
    expect(parsed).toHaveProperty('distribution');
  });

  it('filters by --grade', async () => {
    const program = makeProgram();
    await program.parseAsync(['node', 'cli', 'health-score', '.', '--grade', 'F', '--json']);
    const output = consoleSpy.mock.calls[0][0] as string;
    const parsed = JSON.parse(output);
    for (const r of parsed.routes) {
      expect(r.grade).toBe('F');
    }
  });
});
