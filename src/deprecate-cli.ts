import { Command } from 'commander';
import { scanRoutes } from './scanner';
import { findDeprecatedRoutes, formatDeprecated } from './deprecate';
import { loadConfig, mergeConfig } from './config';

export function registerDeprecateCommand(program: Command): void {
  program
    .command('deprecate <dir>')
    .description('Find deprecated routes based on configured rules')
    .option('-c, --config <path>', 'path to config file')
    .option('--json', 'output as JSON')
    .action(async (dir: string, opts) => {
      const fileConfig = await loadConfig(opts.config);
      const config = mergeConfig(fileConfig);

      const rules = config.deprecationRules ?? [];
      if (rules.length === 0) {
        console.log('No deprecation rules configured.');
        return;
      }

      const routes = await scanRoutes(dir);
      const deprecated = findDeprecatedRoutes(routes, rules);

      if (deprecated.length === 0) {
        console.log('No deprecated routes found.');
        return;
      }

      if (opts.json) {
        console.log(JSON.stringify(deprecated, null, 2));
      } else {
        console.log(formatDeprecated(deprecated));
      }

      process.exit(deprecated.length > 0 ? 1 : 0);
    });
}
