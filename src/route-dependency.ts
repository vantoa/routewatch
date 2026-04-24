import { RouteInfo } from './scanner';

export interface RouteDependency {
  from: string;
  to: string;
  strength: number; // 0-1
  reason: string[];
}

export interface DependencyReport {
  dependencies: RouteDependency[];
  isolated: string[];
  hubs: string[];
}

function sharedDynamicSegments(a: string, b: string): number {
  const segsA = a.split('/').filter(s => s.startsWith('['));
  const segsB = b.split('/').filter(s => s.startsWith('['));
  return segsA.filter(s => segsB.includes(s)).length;
}

function commonPrefix(a: string, b: string): number {
  const partsA = a.split('/');
  const partsB = b.split('/');
  let count = 0;
  for (let i = 0; i < Math.min(partsA.length, partsB.length); i++) {
    if (partsA[i] === partsB[i]) count++;
    else break;
  }
  return count;
}

export function buildDependencyReport(routes: RouteInfo[]): DependencyReport {
  const dependencies: RouteDependency[] = [];
  const connectionCount: Record<string, number> = {};

  for (let i = 0; i < routes.length; i++) {
    for (let j = i + 1; j < routes.length; j++) {
      const a = routes[i];
      const b = routes[j];
      const reasons: string[] = [];

      const prefix = commonPrefix(a.path, b.path);
      if (prefix >= 2) reasons.push(`shared prefix (${prefix} segments)`);

      const dynShared = sharedDynamicSegments(a.path, b.path);
      if (dynShared > 0) reasons.push(`shared dynamic params (${dynShared})`);

      const methodOverlap = a.methods.filter(m => b.methods.includes(m)).length;
      if (methodOverlap > 0 && prefix >= 1) reasons.push(`shared methods (${methodOverlap})`);

      if (reasons.length === 0) continue;

      const strength = Math.min(1, (prefix * 0.3 + dynShared * 0.4 + methodOverlap * 0.1));
      dependencies.push({ from: a.path, to: b.path, strength: parseFloat(strength.toFixed(2)), reason: reasons });

      connectionCount[a.path] = (connectionCount[a.path] ?? 0) + 1;
      connectionCount[b.path] = (connectionCount[b.path] ?? 0) + 1;
    }
  }

  const connected = new Set(Object.keys(connectionCount));
  const isolated = routes.map(r => r.path).filter(p => !connected.has(p));
  const avgConnections = Object.values(connectionCount).reduce((a, b) => a + b, 0) / (connected.size || 1);
  const hubs = Object.entries(connectionCount)
    .filter(([, c]) => c > avgConnections * 1.5)
    .map(([p]) => p);

  return { dependencies, isolated, hubs };
}

export function formatDependencyReport(report: DependencyReport): string {
  const lines: string[] = ['Route Dependency Report', '======================='];

  if (report.hubs.length > 0) {
    lines.push(`\nHubs (highly connected):`)
    report.hubs.forEach(h => lines.push(`  • ${h}`));
  }

  if (report.isolated.length > 0) {
    lines.push(`\nIsolated routes:`);
    report.isolated.forEach(r => lines.push(`  • ${r}`));
  }

  lines.push(`\nDependencies (${report.dependencies.length} total):`);
  const sorted = [...report.dependencies].sort((a, b) => b.strength - a.strength);
  sorted.slice(0, 20).forEach(d => {
    lines.push(`  ${d.from} ↔ ${d.to} [strength: ${d.strength}]`);
    lines.push(`    reasons: ${d.reason.join(', ')}`);
  });

  return lines.join('\n');
}
