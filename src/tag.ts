import { RouteInfo } from './scanner';

export interface TaggedRoute extends RouteInfo {
  tags: string[];
}

export function inferTags(route: RouteInfo): string[] {
  const tags: string[] = [];
  const path = route.route;

  if (path.includes('[') && path.includes(']')) {
    tags.push('dynamic');
  }

  if (path.includes('[...') || path.includes('[[...')) {
    tags.push('catch-all');
  }

  const segments = path.split('/').filter(Boolean);
  if (segments.length === 0) {
    tags.push('root');
  } else if (segments.length === 1) {
    tags.push('top-level');
  } else if (segments.length >= 3) {
    tags.push('nested');
  }

  if (route.methods.includes('GET') && route.methods.length === 1) {
    tags.push('read-only');
  }

  if (
    route.methods.includes('POST') ||
    route.methods.includes('PUT') ||
    route.methods.includes('PATCH') ||
    route.methods.includes('DELETE')
  ) {
    tags.push('mutating');
  }

  return tags;
}

export function tagRoutes(routes: RouteInfo[]): TaggedRoute[] {
  return routes.map((r) => ({
    ...r,
    tags: inferTags(r),
  }));
}

export function filterByTag(routes: TaggedRoute[], tag: string): TaggedRoute[] {
  return routes.filter((r) => r.tags.includes(tag));
}

export function groupByTag(
  routes: TaggedRoute[]
): Record<string, TaggedRoute[]> {
  const groups: Record<string, TaggedRoute[]> = {};
  for (const route of routes) {
    for (const tag of route.tags) {
      if (!groups[tag]) groups[tag] = [];
      groups[tag].push(route);
    }
  }
  return groups;
}
