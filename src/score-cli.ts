import { Command } from 'commander';
import { scanRoutes } from './scanner';
import { diffRoutes } from './differ';
import { computeScore, formatScore } from './score';

export function registerScoreCommand(program: Command): void {
  program
    .command('score <oldDir> <newDir>')
    .description('Compute a change score and grade between two Next.js app versions')
    .option('--json', 'Output score as JSON')
    .action(async (oldDir: string, newDir: string, opts: { json?: boolean }) => {
      try {
        const oldRoutes = await scanRoutes(oldDir);
        const newRoutes = await scanRoutes(newDir);
        const changes = diffRoutes(oldRoutes, newRoutes);
        const score = computeScore(changes);

        if (opts.json) {
          console.log(JSON.stringify(score, null, 2));
        } else {
          console.log(formatScore(score));
        }

        if (score.grade === 'F' || score.grade === 'D') {
          process.exit(1);
        }
      } catch (err) {
        console.error('Error computing score:', (err as Error).message);
        process.exit(1);
      }
    });
}
