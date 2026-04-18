import { Command } from 'commander';
import fs from 'fs';
import { scanRoutes } from './scanner';
import { diffRoutes } from './differ';
import { loadBaseline } from './baseline';
import { buildChangelog, formatChangelog, appendChangelog } from './changelog';

export function registerChangelogCommand(program: Command): void {
  program
    .command('changelog <dir>')
    .description('Generate or update a CHANGELOG from route diffs')
    .option('-v, --version <version>', 'version label for this entry')
    .option('-o, --output <file>', 'append to changelog file', 'CHANGELOG.md')
    .option('--print', 'print to stdout instead of writing to file')
    .action(async (dir: string, opts) => {
      const baseline = await loadBaseline();
      if (!baseline) {
        console.error('No baseline found. Run `routewatch baseline save` first.');
        process.exit(1);
      }

      const current = await scanRoutes(dir);
      const changes = diffRoutes(baseline, current);

      if (changes.length === 0) {
        console.log('No route changes detected.');
        return;
      }

      const entry = buildChangelog(changes, opts.version);

      if (opts.print) {
        console.log(formatChangelog(entry));
        return;
      }

      const existing = fs.existsSync(opts.output)
        ? fs.readFileSync(opts.output, 'utf-8')
        : '';

      const updated = appendChangelog(existing, entry);
      fs.writeFileSync(opts.output, updated, 'utf-8');
      console.log(`Changelog updated: ${opts.output}`);
    });
}
