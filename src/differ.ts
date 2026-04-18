import { RouteInfo } from './scanner';

export interface RouteChange {
  type: 'added' | 'removed' | 'modified';
  route: string;
  before?: RouteInfo;
  after?: RouteInfo;
}

export interface DiffResult {
  added: RouteChange[];
  removed: RouteChange[];
  modified: RouteChange[];
  unchanged: RouteInfo[];
}

export function diffRoutes(
  before: RouteInfo[],
  after: RouteInfo[]
): DiffResult {
  const beforeMap = new Map(before.map((r) => [r.route, r]));
  const afterMap = new Map(after.map((r) => [r.route, r]));

  const added: RouteChange[] = [];
  const removed: RouteChange[] = [];
  const modified: RouteChange[] = [];
  const unchanged: RouteInfo[] = [];

  for (const [route, afterInfo] of afterMap) {
    if (!beforeMap.has(route)) {
      added.push({ type: 'added', route, after: afterInfo });
    } else {
      const beforeInfo = beforeMap.get(route)!;
      const methodsBefore = new Set(beforeInfo.methods);
      const methodsAfter = new Set(afterInfo.methods);
      const same =
        methodsBefore.size === methodsAfter.size &&
        [...methodsAfter].every((m) => methodsBefore.has(m));
      if (!same) {
        modified.push({ type: 'modified', route, before: beforeInfo, after: afterInfo });
      } else {
        unchanged.push(afterInfo);
      }
    }
  }

  for (const [route, beforeInfo] of beforeMap) {
    if (!afterMap.has(route)) {
      removed.push({ type: 'removed', route, before: beforeInfo });
    }
  }

  return { added, removed, modified, unchanged };
}
