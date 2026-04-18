import { RouteInfo } from './scanner';

export interface SearchOptions {
  method?: string;
  path?: string;
  tag?: string;
  exact?: boolean;
}

export function searchRoutes(
  routes: RouteInfo[],
  options: SearchOptions
): RouteInfo[] {
  return routes.filter((route) => {
    if (options.method) {
      const method = options.method.toUpperCase();
      if (!route.methods.includes(method)) return false;
    }

    if (options.path) {
      if (options.exact) {
        if (route.route !== options.path) return false;
      } else {
        if (!route.route.includes(options.path)) return false;
      }
    }

    return true;
  });
}

export function searchByRegex(
  routes: RouteInfo[],
  pattern: string
): RouteInfo[] {
  let regex: RegExp;
  try {
    regex = new RegExp(pattern);
  } catch {
    throw new Error(`Invalid regex pattern: ${pattern}`);
  }
  return routes.filter((r) => regex.test(r.route));
}

export function formatSearchResults(routes: RouteInfo[]): string {
  if (routes.length === 0) return 'No routes matched.';
  const lines = routes.map(
    (r) => `  ${r.route}  [${r.methods.join(', ')}]`
  );
  return `Found ${routes.length} route(s):\n${lines.join('\n')}`;
}
