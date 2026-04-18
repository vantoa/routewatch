import { Command } from 'commander';
import { classifyChanges, hasBreakingChanges, Severity } from './severity';
import { diffRoutes } from './differ';
import { scanRoutes } from './scanner';

const SEVERITY_COLORS: Record<Severity, string> = {
  breaking: '\x1b[31m',
  warning: '\x1b[33m',
  info: '\x1b[32m',
};
const RESET = '\x1b[0m';

function colorize(severity: Severity, text: string): string {
  return `${SEVERITY_COLORS[severity]}${text}${RESET}`;
}

export function registerSeverityCommand(program: Command): void {
  program
    .command('severity <oldDir> <newDir>')
    .description('Show route changes annotated with severity levels')
    .option('--fail-on-breaking', 'Exit with code 1 if breaking changes are found')
    .action(async (oldDir: string, newDir: string, opts: { failOnBreaking?: boolean }) => {
      const oldRoutes = await scanRoutes(oldDir);
      const newRoutes = await scanRoutes(newDir);
      const diff = diffRoutes(oldRoutes, newRoutes);

      const rawChanges = [
        ...diff.removed.map((route) => ({ type: 'removed' as const, route })),
        ...diff.added.map((route) => ({ type: 'added' as const, route })),
        ...diff.modified.flatMap(({ route, removedMethods, addedMethods }) => [
          ...removedMethods.map(() => ({ type: 'method_removed' as const, route })),
          ...addedMethods.map(() => ({ type: 'method_added' as const, route })),
        ]),
      ];

      if (rawChanges.length === 0) {
        console.log('No route changes detected.');
        return;
      }

      const classified = classifyChanges(rawChanges);
      for (const { route, type, severity } of classified) {
        console.log(colorize(severity, `[${severity.toUpperCase()}] ${type}: ${route}`));
      }

      if (opts.failOnBreaking && hasBreakingChanges(classified)) {
        process.exit(1);
      }
    });
}
