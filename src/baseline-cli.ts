import { Command } from 'commander';
import * as path from 'path';
import { scanRoutes } from './scanner';
import { diffRoutes } from './differ';
import { formatDiff } from './formatter';
import { saveBaseline, loadBaseline, deleteBaseline, getBaselinePath } from './baseline';

export function registerBaselineCommands(program: Command): void {
  const baseline = program.command('baseline').description('Manage route baselines');

  baseline
    .command('save')
    .description('Scan routes and save as baseline')
    .option('-d, --dir <dir>', 'Project root directory', process.cwd())
    .action(async (opts) => {
      const routes = await scanRoutes(path.resolve(opts.dir));
      saveBaseline(routes, getBaselinePath(opts.dir));
      console.log(`Baseline saved with ${routes.length} route(s).`);
    });

  baseline
    .command('diff')
    .description('Diff current routes against saved baseline')
    .option('-d, --dir <dir>', 'Project root directory', process.cwd())
    .action(async (opts) => {
      const baselinePath = getBaselinePath(opts.dir);
      const saved = loadBaseline(baselinePath);
      if (!saved) {
        console.error('No baseline found. Run `routewatch baseline save` first.');
        process.exit(1);
      }
      const current = await scanRoutes(path.resolve(opts.dir));
      const changes = diffRoutes(saved.routes, current);
      if (changes.length === 0) {
        console.log('No changes since baseline.');
      } else {
        console.log(formatDiff(changes));
      }
    });

  baseline
    .command('delete')
    .description('Delete the saved baseline')
    .option('-d, --dir <dir>', 'Project root directory', process.cwd())
    .action((opts) => {
      deleteBaseline(getBaselinePath(opts.dir));
      console.log('Baseline deleted.');
    });

  baseline
    .command('show')
    .description('Show the saved baseline routes')
    .option('-d, --dir <dir>', 'Project root directory', process.cwd())
    .action((opts) => {
      const saved = loadBaseline(getBaselinePath(opts.dir));
      if (!saved) {
        console.error('No baseline found.');
        process.exit(1);
      }
      console.log(`Baseline from ${saved.timestamp}:`);
      saved.routes.forEach((r) => console.log(`  ${r.route} [${r.methods.join(', ')}]`));
    });
}
