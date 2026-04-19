import { Command } from 'commander';
import { scanRoutes } from './scanner';
import { diffRoutes } from './differ';
import { buildRouteGraph, formatGraph } from './graph';

export function registerGraphCommand(program: Command): void {
  program
    .command('graph <before> <after>')
    .description('Visualize route graph and relationships between versions')
    .option('--json', 'Output raw JSON graph')
    .action(async (before: string, after: string, opts: { json?: boolean }) => {
      try {
        const [routesBefore, routesAfter] = await Promise.all([
          scanRoutes(before),
          scanRoutes(after),
        ]);

        const changes = diffRoutes(routesBefore, routesAfter);
        const graph = buildRouteGraph(routesAfter, changes);

        if (opts.json) {
          console.log(JSON.stringify(graph, null, 2));
        } else {
          console.log(formatGraph(graph));
        }
      } catch (err) {
        console.error('graph error:', (err as Error).message);
        process.exit(1);
      }
    });
}
