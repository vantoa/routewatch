import { scanRoutes } from './scanner';
import { diffRoutes } from './differ';
import { loadConfig, mergeConfig } from './config';
import { filterRoutes } from './filter';
import { isIgnored, loadIgnoreFile, buildIgnoreList } from './ignore';
import type { RouteChange } from './differ';

export interface CompareOptions {
  baseDir: string;
  headDir: string;
  configPath?: string;
  ignoreFile?: string;
}

export interface CompareResult {
  changes: RouteChange[];
  baseCount: number;
  headCount: number;
}

export async function compareDirectories(
  options: CompareOptions
): Promise<CompareResult> {
  const rawConfig = await loadConfig(options.configPath);
  const config = mergeConfig(rawConfig);

  const ignorePatterns = buildIgnoreList(
    loadIgnoreFile(options.ignoreFile ?? '.routewatchignore')
  );

  let baseRoutes = await scanRoutes(options.baseDir);
  let headRoutes = await scanRoutes(options.headDir);

  baseRoutes = baseRoutes.filter(
    (r) => !isIgnored(r.route, ignorePatterns)
  );
  headRoutes = headRoutes.filter(
    (r) => !isIgnored(r.route, ignorePatterns)
  );

  if (config.include?.length || config.exclude?.length) {
    baseRoutes = filterRoutes(baseRoutes, {
      include: config.include,
      exclude: config.exclude,
    });
    headRoutes = filterRoutes(headRoutes, {
      include: config.include,
      exclude: config.exclude,
    });
  }

  const changes = diffRoutes(baseRoutes, headRoutes);

  return {
    changes,
    baseCount: baseRoutes.length,
    headCount: headRoutes.length,
  };
}
