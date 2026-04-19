import { RouteChange } from './differ';
import { PinMap } from './pin';

export interface PinnedChange {
  change: RouteChange;
  pinned: boolean;
}

export function annotatePinnedChanges(
  changes: RouteChange[],
  pins: PinMap
): PinnedChange[] {
  return changes.map((change) => {
    const route = change.route;
    const pinnedMethods = pins[route];
    const pinned = pinnedMethods
      ? change.methods.some((m) => pinnedMethods.includes(m))
      : false;
    return { change, pinned };
  });
}

export function filterPinnedChanges(annotated: PinnedChange[]): PinnedChange[] {
  return annotated.filter((a) => a.pinned);
}

export function formatPinnedDiff(annotated: PinnedChange[]): string {
  if (annotated.length === 0) return 'No changes to pinned routes.';
  return annotated
    .map((a) => {
      const tag = a.pinned ? '[PINNED] ' : '';
      const methods = a.change.methods.join(', ');
      return `${tag}${a.change.status.toUpperCase()} ${a.change.route} [${methods}]`;
    })
    .join('\n');
}
