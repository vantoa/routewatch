import * as fs from 'fs';
import * as path from 'path';
import { RouteInfo } from './scanner';

export interface Snapshot {
  version: string;
  timestamp: string;
  routes: RouteInfo[];
}

export function createSnapshot(routes: RouteInfo[], version: string): Snapshot {
  return {
    version,
    timestamp: new Date().toISOString(),
    routes,
  };
}

export function getSnapshotPath(dir: string, version: string): string {
  return path.join(dir, `.routewatch-snapshot-${version}.json`);
}

export function saveSnapshot(snapshot: Snapshot, dir: string): string {
  const filePath = getSnapshotPath(dir, snapshot.version);
  fs.writeFileSync(filePath, JSON.stringify(snapshot, null, 2), 'utf-8');
  return filePath;
}

export function loadSnapshot(dir: string, version: string): Snapshot | null {
  const filePath = getSnapshotPath(dir, version);
  if (!fs.existsSync(filePath)) return null;
  try {
    const raw = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(raw) as Snapshot;
  } catch {
    return null;
  }
}

export function deleteSnapshot(dir: string, version: string): boolean {
  const filePath = getSnapshotPath(dir, version);
  if (!fs.existsSync(filePath)) return false;
  fs.unlinkSync(filePath);
  return true;
}

export function listSnapshots(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.startsWith('.routewatch-snapshot-') && f.endsWith('.json'))
    .map((f) => f.replace('.routewatch-snapshot-', '').replace('.json', ''));
}
