import * as fs from 'fs';
import * as path from 'path';
import { RouteInfo } from './scanner';

export interface PinnedRoute {
  route: string;
  methods: string[];
  pinnedAt: string;
  note?: string;
}

export interface PinFile {
  pins: PinnedRoute[];
}

export function getPinPath(dir: string = process.cwd()): string {
  return path.join(dir, '.routewatch-pins.json');
}

export function loadPins(dir?: string): PinnedRoute[] {
  const pinPath = getPinPath(dir);
  if (!fs.existsSync(pinPath)) return [];
  const raw = fs.readFileSync(pinPath, 'utf-8');
  const data: PinFile = JSON.parse(raw);
  return data.pins ?? [];
}

export function savePins(pins: PinnedRoute[], dir?: string): void {
  const pinPath = getPinPath(dir);
  const data: PinFile = { pins };
  fs.writeFileSync(pinPath, JSON.stringify(data, null, 2));
}

export function pinRoute(route: RouteInfo, note?: string, dir?: string): PinnedRoute[] {
  const pins = loadPins(dir);
  const existing = pins.findIndex(p => p.route === route.route);
  const entry: PinnedRoute = {
    route: route.route,
    methods: route.methods,
    pinnedAt: new Date().toISOString(),
    ...(note ? { note } : {}),
  };
  if (existing >= 0) {
    pins[existing] = entry;
  } else {
    pins.push(entry);
  }
  savePins(pins, dir);
  return pins;
}

export function unpinRoute(route: string, dir?: string): PinnedRoute[] {
  const pins = loadPins(dir).filter(p => p.route !== route);
  savePins(pins, dir);
  return pins;
}

export function formatPins(pins: PinnedRoute[]): string {
  if (pins.length === 0) return 'No pinned routes.';
  return pins
    .map(p => `  ${p.route} [${p.methods.join(', ')}]${p.note ? ` — ${p.note}` : ''}`)
    .join('\n');
}
