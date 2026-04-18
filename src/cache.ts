import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { RouteInfo } from './scanner';

export interface CacheEntry {
  hash: string;
  routes: RouteInfo[];
  timestamp: number;
}

export interface Cache {
  [dir: string]: CacheEntry;
}

const CACHE_FILE = '.routewatch-cache.json';

export function computeDirHash(dir: string): string {
  const hash = crypto.createHash('md5');
  function walk(current: string) {
    if (!fs.existsSync(current)) return;
    const entries = fs.readdirSync(current, { withFileTypes: true });
    for (const entry of entries) {
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) {
        walk(full);
      } else if (entry.isFile() && entry.name.match(/^route\.(ts|js)$/)) {
        const stat = fs.statSync(full);
        hash.update(full + stat.mtimeMs.toString());
      }
    }
  }
  walk(dir);
  return hash.digest('hex');
}

export function loadCache(cacheFile: string = CACHE_FILE): Cache {
  try {
    const raw = fs.readFileSync(cacheFile, 'utf-8');
    return JSON.parse(raw) as Cache;
  } catch {
    return {};
  }
}

export function saveCache(cache: Cache, cacheFile: string = CACHE_FILE): void {
  fs.writeFileSync(cacheFile, JSON.stringify(cache, null, 2), 'utf-8');
}

export function getCachedRoutes(dir: string, cache: Cache): RouteInfo[] | null {
  const entry = cache[dir];
  if (!entry) return null;
  const currentHash = computeDirHash(dir);
  if (entry.hash !== currentHash) return null;
  return entry.routes;
}

export function setCachedRoutes(dir: string, routes: RouteInfo[], cache: Cache): Cache {
  const hash = computeDirHash(dir);
  return {
    ...cache,
    [dir]: { hash, routes, timestamp: Date.now() },
  };
}
