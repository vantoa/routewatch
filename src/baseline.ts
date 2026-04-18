import * as fs from 'fs';
import * as path from 'path';
import { RouteInfo } from './scanner';

export interface Baseline {
  version: string;
  timestamp: string;
  routes: RouteInfo[];
}

const DEFAULT_BASELINE_FILE = '.routewatch-baseline.json';

export function getBaselinePath(dir: string = process.cwd()): string {
  return path.join(dir, DEFAULT_BASELINE_FILE);
}

export function saveBaseline(routes: RouteInfo[], baselinePath?: string): void {
  const filePath = baselinePath ?? getBaselinePath();
  const baseline: Baseline = {
    version: '1',
    timestamp: new Date().toISOString(),
    routes,
  };
  fs.writeFileSync(filePath, JSON.stringify(baseline, null, 2), 'utf-8');
}

export function loadBaseline(baselinePath?: string): Baseline | null {
  const filePath = baselinePath ?? getBaselinePath();
  if (!fs.existsSync(filePath)) return null;
  try {
    const raw = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(raw) as Baseline;
  } catch {
    return null;
  }
}

export function deleteBaseline(baselinePath?: string): void {
  const filePath = baselinePath ?? getBaselinePath();
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
}
