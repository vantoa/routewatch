import * as chokidar from 'chokidar';
import * as path from 'path';
import { scanRoutes, RouteMap } from './scanner';
import { diffRoutes } from './differ';
import { formatDiff } from './formatter';

export interface WatchOptions {
  dir: string;
  ignore?: string[];
  debounceMs?: number;
  onChange?: (diff: ReturnType<typeof diffRoutes>) => void;
}

export function watchRoutes(options: WatchOptions): () => void {
  const { dir, ignore = [], debounceMs = 300, onChange } = options;
  const appDir = path.join(dir, 'app');

  let previousRoutes: RouteMap = scanRoutes(dir);
  let debounceTimer: ReturnType<typeof setTimeout> | null = null;

  const watcher = chokidar.watch(appDir, {
    ignored: ['**/node_modules/**', '**/.git/**', ...ignore],
    persistent: true,
    ignoreInitial: true,
  });

  const handleChange = () => {
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      const currentRoutes = scanRoutes(dir);
      const diff = diffRoutes(previousRoutes, currentRoutes);
      const hasChanges =
        diff.added.length > 0 ||
        diff.removed.length > 0 ||
        diff.modified.length > 0;

      if (hasChanges) {
        console.log('\n[routewatch] Route changes detected:');
        console.log(formatDiff(diff));
        onChange?.(diff);
      }

      previousRoutes = currentRoutes;
    }, debounceMs);
  };

  watcher.on('add', handleChange);
  watcher.on('unlink', handleChange);
  watcher.on('change', handleChange);

  watcher.on('error', (err) => {
    console.error('[routewatch] Watcher error:', err);
  });

  console.log(`[routewatch] Watching for route changes in ${appDir}`);

  return () => {
    if (debounceTimer) clearTimeout(debounceTimer);
    watcher.close();
  };
}
