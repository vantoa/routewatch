import { RouteChange } from './differ';

export type GroupKey = 'method' | 'prefix' | 'status';

export interface GroupedChanges {
  key: string;
  changes: RouteChange[];
}

export function groupByMethod(changes: RouteChange[]): GroupedChanges[] {
  const map = new Map<string, RouteChange[]>();
  for (const change of changes) {
    const methods =
      change.type === 'added'
        ? change.methods
        : change.type === 'removed'
        ? change.methods
        : [...(change.added ?? []), ...(change.removed ?? [])];
    const key = methods.length > 0 ? [...new Set(methods)].sort().join(',') : 'NONE';
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(change);
  }
  return Array.from(map.entries()).map(([key, changes]) => ({ key, changes }));
}

export function groupByPrefix(changes: RouteChange[]): GroupedChanges[] {
  const map = new Map<string, RouteChange[]>();
  for (const change of changes) {
    const parts = change.route.split('/');
    const prefix = parts.length > 1 ? '/' + parts[1] : '/';
    if (!map.has(prefix)) map.set(prefix, []);
    map.get(prefix)!.push(change);
  }
  return Array.from(map.entries()).map(([key, changes]) => ({ key, changes }));
}

export function groupByStatus(changes: RouteChange[]): GroupedChanges[] {
  const map = new Map<string, RouteChange[]>();
  for (const change of changes) {
    const key = change.type;
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(change);
  }
  return Array.from(map.entries()).map(([key, changes]) => ({ key, changes }));
}

export function groupChanges(changes: RouteChange[], by: GroupKey): GroupedChanges[] {
  switch (by) {
    case 'method': return groupByMethod(changes);
    case 'prefix': return groupByPrefix(changes);
    case 'status': return groupByStatus(changes);
  }
}
