/**
 * Route filtering utilities for routewatch.
 * Allows including/excluding routes by pattern.
 */

export interface FilterOptions {
  include?: string[];
  exclude?: string[];
}

function matchesPattern(route: string, pattern: string): boolean {
  const escaped = pattern
    .replace(/[.+^${}()|[\]\\]/g, '\\$&')
    .replace(/\*/g, '.*')
    .replace(/\?/g, '.');
  return new RegExp(`^${escaped}$`).test(route);
}

export function matchesAnyPattern(route: string, patterns: string[]): boolean {
  return patterns.some((p) => matchesPattern(route, p));
}

export function filterRoutes(
  routes: Record<string, string[]>,
  options: FilterOptions
): Record<string, string[]> {
  const { include, exclude } = options;

  return Object.fromEntries(
    Object.entries(routes).filter(([route]) => {
      if (include && include.length > 0) {
        if (!matchesAnyPattern(route, include)) return false;
      }
      if (exclude && exclude.length > 0) {
        if (matchesAnyPattern(route, exclude)) return false;
      }
      return true;
    })
  );
}
