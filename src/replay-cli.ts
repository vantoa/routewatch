import { Command } from 'commander';
import * as path from 'path';
import {
  loadReplayLog,
  appendReplayEntry,
  buildReplayReport,
  formatReplayReport,
} from './replay';
import { scanRoutes } from './scanner';
import { diffRoutes } from './differ';

const DEFAULT_LOG = '.routewatch/replay.json';

export function registerReplayCommand(program: Command): void {
  const replay = program.command('replay').description('Record and replay route change history');

  replay
    .command('record <oldDir> <newDir>')
    .description('Record a diff between two route directories')
    .option('--label <label>', 'Label for this entry', new Date().toISOString())
    .option('--log <file>', 'Path to replay log', DEFAULT_LOG)
    .action(async (oldDir: string, newDir: string, opts) => {
      const before = await scanRoutes(path.resolve(oldDir));
      const after = await scanRoutes(path.resolve(newDir));
      const changes = diffRoutes(before, after);
      const entry = {
        timestamp: new Date().toISOString(),
        label: opts.label,
        changes,
      };
      appendReplayEntry(opts.log, entry);
      console.log(`Recorded ${changes.length} change(s) under label "${opts.label}".`);
    });

  replay
    .command('show')
    .description('Display the replay log')
    .option('--log <file>', 'Path to replay log', DEFAULT_LOG)
    .action((opts) => {
      const entries = loadReplayLog(opts.log);
      const report = buildReplayReport(entries);
      console.log(formatReplayReport(report));
    });
}
