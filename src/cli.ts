#!/usr/bin/env node
import { program } from 'commander';
import path from 'path';
import { scanRoutes } from './scanner';
import { diffRoutes } from './differ';
import { formatDiff } from './formatter';

program
  .name('routewatch')
  .description('Diff API route changes between Next.js app versions')
  .version('0.1.0');

program
  .command('diff <before> <after>')
  .description('Compare routes between two Next.js project directories')
  .option('-j, --json', 'Output result as JSON')
  .action(async (beforeDir: string, afterDir: string, options: { json?: boolean }) => {
    const beforePath = path.resolve(beforeDir);
    const afterPath = path.resolve(afterDir);

    try {
      const beforeRoutes = await scanRoutes(beforePath);
      const afterRoutes = await scanRoutes(afterPath);
      const result = diffRoutes(beforeRoutes, afterRoutes);

      if (options.json) {
        console.log(JSON.stringify(result, null, 2));
      } else {
        console.log(formatDiff(result));
      }

      const hasChanges =
        result.added.length > 0 ||
        result.removed.length > 0 ||
        result.modified.length > 0;

      process.exit(hasChanges ? 1 : 0);
    } catch (err) {
      console.error('Error:', (err as Error).message);
      process.exit(2);
    }
  });

program.parse();
