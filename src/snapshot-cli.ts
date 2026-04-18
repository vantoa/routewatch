import { Command } from 'commander';
import { createSnapshot, saveSnapshot, loadSnapshot, deleteSnapshot, listSnapshots } from './snapshot';
import { scanRoutes } from './scanner';
import { diffRoutes } from './differ';
import { formatDiff } from './formatter';

export function registerSnapshotCommands(program: Command): void {
  const snap = program.command('snapshot').description('Manage route snapshots');

  snap
    .command('save <name> <dir>')
    .description('Save a named snapshot of routes in <dir>')
    .action(async (name: string, dir: string) => {
      const routes = await scanRoutes(dir);
      const snapshot = createSnapshot(name, routes);
      await saveSnapshot(snapshot);
      console.log(`Snapshot '${name}' saved (${routes.length} routes).`);
    });

  snap
    .command('diff <name> <dir>')
    .description('Diff a saved snapshot against current routes in <dir>')
    .action(async (name: string, dir: string) => {
      const snapshot = await loadSnapshot(name);
      if (!snapshot) {
        console.error(`Snapshot '${name}' not found.`);
        process.exit(1);
      }
      const current = await scanRoutes(dir);
      const changes = diffRoutes(snapshot.routes, current);
      if (changes.length === 0) {
        console.log('No changes since snapshot.');
      } else {
        console.log(formatDiff(changes));
      }
    });

  snap
    .command('delete <name>')
    .description('Delete a named snapshot')
    .action(async (name: string) => {
      await deleteSnapshot(name);
      console.log(`Snapshot '${name}' deleted.`);
    });

  snap
    .command('list')
    .description('List all saved snapshots')
    .action(async () => {
      const snapshots = await listSnapshots();
      if (snapshots.length === 0) {
        console.log('No snapshots found.');
      } else {
        snapshots.forEach(s => console.log(`  ${s.name}  (${new Date(s.createdAt).toLocaleString()}, ${s.routes.length} routes)`));
      }
    });
}
