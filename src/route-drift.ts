import { RouteChange } from './differ';
import { RouteInfo } from './scanner';

export interface DriftEntry {
  route: string;
  lastSeen: string;
  currentMethods: string[];
  expectedMethods: string[];
  driftedMethods: string[];
  missingMethods: string[];
}

export interface DriftReport {
  scannedAt: string;
  entries: DriftEntry[];
  totalDrifted: number;
}

export function detectDrift(
  baseline: RouteInfo[],
  current: RouteInfo[],
  lastSeen: string = new Date().toISOString()
): DriftEntry[] {
  const currentMap = new Map(current.map((r) => [r.route, r]));
  const entries: DriftEntry[] = [];

  for (const base of baseline) {
    const cur = currentMap.get(base.route);
    if (!cur) continue;

    const expectedMethods = base.methods.slice().sort();
    const currentMethods = cur.methods.slice().sort();

    const driftedMethods = currentMethods.filter((m) => !expectedMethods.includes(m));
    const missingMethods = expectedMethods.filter((m) => !currentMethods.includes(m));

    if (driftedMethods.length > 0 || missingMethods.length > 0) {
      entries.push({
        route: base.route,
        lastSeen,
        currentMethods,
        expectedMethods,
        driftedMethods,
        missingMethods,
      });
    }
  }

  return entries;
}

export function buildDriftReport(entries: DriftEntry[]): DriftReport {
  return {
    scannedAt: new Date().toISOString(),
    entries,
    totalDrifted: entries.length,
  };
}

export function formatDriftReport(report: DriftReport): string {
  if (report.entries.length === 0) {
    return 'No route drift detected.';
  }

  const lines: string[] = [`Route Drift Report (${report.scannedAt})`, ''];

  for (const entry of report.entries) {
    lines.push(`  ${entry.route}`);
    if (entry.driftedMethods.length > 0) {
      lines.push(`    + unexpected: ${entry.driftedMethods.join(', ')}`);
    }
    if (entry.missingMethods.length > 0) {
      lines.push(`    - missing:    ${entry.missingMethods.join(', ')}`);
    }
  }

  lines.push('');
  lines.push(`Total drifted routes: ${report.totalDrifted}`);
  return lines.join('\n');
}
