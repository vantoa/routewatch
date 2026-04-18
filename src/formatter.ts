import chalk from 'chalk';
import { DiffResult, RouteChange } from './differ';

function formatMethods(methods: string[]): string {
  return methods.map((m) => chalk.bold(m)).join(', ');
}

function formatChange(change: RouteChange): string {
  if (change.type === 'added') {
    return chalk.green(`  + ${change.route} [${formatMethods(change.after!.methods)}]`);
  }
  if (change.type === 'removed') {
    return chalk.red(`  - ${change.route} [${formatMethods(change.before!.methods)}]`);
  }
  // modified
  const before = formatMethods(change.before!.methods);
  const after = formatMethods(change.after!.methods);
  return chalk.yellow(`  ~ ${change.route}\n    before: [${before}]\n    after:  [${after}]`);
}

export function formatDiff(result: DiffResult): string {
  const lines: string[] = [];

  if (
    result.added.length === 0 &&
    result.removed.length === 0 &&
    result.modified.length === 0
  ) {
    return chalk.gray('No route changes detected.');
  }

  if (result.added.length > 0) {
    lines.push(chalk.green.bold(`Added (${result.added.length})`));
    result.added.forEach((c) => lines.push(formatChange(c)));
  }

  if (result.removed.length > 0) {
    lines.push(chalk.red.bold(`Removed (${result.removed.length})`));
    result.removed.forEach((c) => lines.push(formatChange(c)));
  }

  if (result.modified.length > 0) {
    lines.push(chalk.yellow.bold(`Modified (${result.modified.length})`));
    result.modified.forEach((c) => lines.push(formatChange(c)));
  }

  lines.push(
    chalk.gray(`\nSummary: ${result.added.length} added, ${result.removed.length} removed, ${result.modified.length} modified, ${result.unchanged.length} unchanged`)
  );

  return lines.join('\n');
}
