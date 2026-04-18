import { RouteChange } from './differ';

export interface AnnotatedChange extends RouteChange {
  annotation?: string;
  author?: string;
  timestamp?: string;
}

export interface AnnotationMap {
  [routeKey: string]: {
    annotation?: string;
    author?: string;
    timestamp?: string;
  };
}

function routeKey(change: RouteChange): string {
  const route = change.route ?? (change as any).before?.route ?? (change as any).after?.route;
  return `${change.status}:${route}`;
}

export function annotateChanges(
  changes: RouteChange[],
  annotations: AnnotationMap
): AnnotatedChange[] {
  return changes.map((change) => {
    const key = routeKey(change);
    const meta = annotations[key];
    if (!meta) return change;
    return {
      ...change,
      annotation: meta.annotation,
      author: meta.author,
      timestamp: meta.timestamp ?? new Date().toISOString(),
    };
  });
}

export function buildAnnotationMap(
  entries: { route: string; status: string; annotation: string; author?: string }[]
): AnnotationMap {
  const map: AnnotationMap = {};
  for (const entry of entries) {
    const key = `${entry.status}:${entry.route}`;
    map[key] = {
      annotation: entry.annotation,
      author: entry.author,
      timestamp: new Date().toISOString(),
    };
  }
  return map;
}

export function formatAnnotatedChange(change: AnnotatedChange): string {
  const base = `[${change.status.toUpperCase()}] ${(change as any).route ?? '(unknown)'}`;
  if (!change.annotation) return base;
  const meta = change.author ? ` — ${change.author}` : '';
  return `${base}\n  Note: ${change.annotation}${meta}`;
}
