import { scanRoutes } from './scanner';
import { diffRoutes } from './differ';
import { RouteChange } from './differ';
import { RouteInfo } from './scanner';

export interface PluginOptions {
  baseDir: string;
  previousDir?: string;
  onRoutesScanned?: (routes: RouteInfo[]) => void;
  onDiffComputed?: (changes: RouteChange[]) => void;
}

export interface PluginResult {
  routes: RouteInfo[];
  changes: RouteChange[];
}

export async function runPlugin(options: PluginOptions): Promise<PluginResult> {
  const { baseDir, previousDir, onRoutesScanned, onDiffComputed } = options;

  const routes = await scanRoutes(baseDir);
  if (onRoutesScanned) onRoutesScanned(routes);

  let changes: RouteChange[] = [];
  if (previousDir) {
    const previousRoutes = await scanRoutes(previousDir);
    changes = diffRoutes(previousRoutes, routes);
    if (onDiffComputed) onDiffComputed(changes);
  }

  return { routes, changes };
}

export function createPlugin(defaults: Partial<PluginOptions> = {}) {
  return async (overrides: Partial<PluginOptions> = {}): Promise<PluginResult> => {
    const options = { ...defaults, ...overrides } as PluginOptions;
    if (!options.baseDir) throw new Error('baseDir is required');
    return runPlugin(options);
  };
}
