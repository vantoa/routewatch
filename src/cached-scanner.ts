import { scanRoutes, RouteInfo } from './scanner';
import {
  loadCache,
  saveCache,
  getCachedRoutes,
  setCachedRoutes,
  Cache,
} from './cache';

export interface CachedScanOptions {
  cacheFile?: string;
  forceRefresh?: boolean;
}

export async function scanRoutesWithCache(
  dir: string,
  options: CachedScanOptions = {}
): Promise<RouteInfo[]> {
  const { cacheFile, forceRefresh = false } = options;

  let cache: Cache = loadCache(cacheFile);

  if (!forceRefresh) {
    const cached = getCachedRoutes(dir, cache);
    if (cached) {
      return cached;
    }
  }

  const routes = await scanRoutes(dir);
  cache = setCachedRoutes(dir, routes, cache);
  saveCache(cache, cacheFile);

  return routes;
}

export function invalidateCache(dir: string, cacheFile?: string): void {
  const cache = loadCache(cacheFile);
  delete cache[dir];
  saveCache(cache, cacheFile);
}
