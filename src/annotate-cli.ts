import { Command } from 'commander';
import { buildAnnotationMap, annotateChanges, formatAnnotatedChange } from './annotate';
import { diffRoutes } from './differ';
import { scanRoutes } from './scanner';

export function registerAnnotateCommand(program: Command): void {
  program
    .command('annotate <before> <after>')
    .description('Diff routes and display with inline annotations')
    .option('--note <entries...>', 'Annotations in format status:route:message:author')
    .action(async (before: string, after: string, opts: { note?: string[] }) => {
      const beforeRoutes = await scanRoutes(before);
      const afterRoutes = await scanRoutes(after);
      const changes = diffRoutes(beforeRoutes, afterRoutes);

      const entries = (opts.note ?? []).map((raw) => {
        const [status, route, annotation, author] = raw.split(':');
        return { status, route, annotation, author };
      });

      const map = buildAnnotationMap(entries);
      const annotated = annotateChanges(changes, map);

      if (annotated.length === 0) {
        console.log('No route changes detected.');
        return;
      }

      for (const change of annotated) {
        console.log(formatAnnotatedChange(change));
      }
    });
}
