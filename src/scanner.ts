import fs from 'fs';
import path from 'path';

export interface Route {
  method: string;
  path: string;
  filePath: string;
}

const HTTP_METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'];

function filePathToRoute(filePath: string, appDir: string): string {
  const relative = path.relative(appDir, filePath);
  const parts = relative.split(path.sep);

  // Remove 'route.ts' or 'route.js' filename
  parts.pop();

  const routeParts = parts
    .filter(p => !p.startsWith('(') || !p.endsWith(')'))
    .map(p => (p.startsWith('[') && p.endsWith(']') ? `:${p.slice(1, -1)}` : p));

  return '/' + routeParts.join('/');
}

function extractMethods(filePath: string): string[] {
  const content = fs.readFileSync(filePath, 'utf-8');
  return HTTP_METHODS.filter(method => {
    const regex = new RegExp(`export\\s+(async\\s+)?function\\s+${method}\\b`);
    return regex.test(content);
  });
}

function findRouteFiles(dir: string): string[] {
  const results: string[] = [];
  if (!fs.existsSync(dir)) return results;

  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...findRouteFiles(fullPath));
    } else if (entry.isFile() && /^route\.(ts|js)$/.test(entry.name)) {
      results.push(fullPath);
    }
  }
  return results;
}

export function scanRoutes(projectRoot: string): Route[] {
  const appDir = path.join(projectRoot, 'app');
  const routeFiles = findRouteFiles(appDir);
  const routes: Route[] = [];

  for (const filePath of routeFiles) {
    const routePath = filePathToRoute(filePath, appDir);
    const methods = extractMethods(filePath);
    for (const method of methods) {
      routes.push({ method, path: routePath, filePath });
    }
  }

  return routes;
}
