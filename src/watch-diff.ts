import { watchRoutes } from './watcher';
import { diffRoutes } from './differ';
import { RouteInfo } from './scanner';

export interface WatchDiffOptions {
  dir: string;
  interval?: number;
  onDiff: (diff: ReturnType<typeof diffRoutes>) => void;
  onError?: (err: Error) => void;
}

export function startWatchDiff(options: WatchDiffOptions): () => void {
  const { dir, interval = 1000, onDiff, onError } = options;
  let previous: RouteInfo[] = [];

  const stop = watchRoutes(
    dir,
    (current) => {
      try {
        const diff = diffRoutes(previous, current);
        const hasChanges =
          diff.added.length > 0 ||
          diff.removed.length > 0 ||
          diff.modified.length > 0;
        if (hasChanges) {
          onDiff(diff);
        }
        previous = current;
      } catch (err) {
        onError?.(err as Error);
      }
    },
    { interval }
  );

  return stop;
}
