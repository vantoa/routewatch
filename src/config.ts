import * as fs from 'fs';
import * as path from 'path';

export interface RouteWatchConfig {
  appDir?: string;
  ignore?: string[];
  output?: 'text' | 'json' | 'markdown';
  outputFile?: string;
  methods?: string[];
}

const DEFAULTS: RouteWatchConfig = {
  appDir: 'app',
  ignore: ['node_modules', '.next', 'dist'],
  output: 'text',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'],
};

const CONFIG_FILENAMES = [
  'routewatch.config.json',
  '.routewatchrc',
  '.routewatchrc.json',
];

export function loadConfig(cwd: string = process.cwd()): RouteWatchConfig {
  for (const filename of CONFIG_FILENAMES) {
    const filePath = path.join(cwd, filename);
    if (fs.existsSync(filePath)) {
      try {
        const raw = fs.readFileSync(filePath, 'utf-8');
        const parsed = JSON.parse(raw) as RouteWatchConfig;
        return mergeConfig(parsed);
      } catch {
        throw new Error(`Failed to parse config file: ${filePath}`);
      }
    }
  }
  return { ...DEFAULTS };
}

export function mergeConfig(partial: Partial<RouteWatchConfig>): RouteWatchConfig {
  return {
    ...DEFAULTS,
    ...partial,
    ignore: partial.ignore ?? DEFAULTS.ignore,
    methods: partial.methods ?? DEFAULTS.methods,
  };
}

export function validateConfig(config: RouteWatchConfig): string[] {
  const errors: string[] = [];
  const validOutputs = ['text', 'json', 'markdown'];
  if (config.output && !validOutputs.includes(config.output)) {
    errors.push(`Invalid output format: "${config.output}". Must be one of: ${validOutputs.join(', ')}`);
  }
  if (config.outputFile && typeof config.outputFile !== 'string') {
    errors.push('outputFile must be a string path');
  }
  return errors;
}
