import { detectDeadRoutes, formatDeadRouteReport } from './route-dead';
import type { RouteInfo } from './scanner';
import type { ChangeRecord } from './differ';

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

function makeChange(path: string, methods: string[], daysBack: number): ChangeRecord {
  return { type: 'removed', path, methods, timestamp: daysAgo(daysBack) } as ChangeRecord;
}

function makeRoute(path: string, methods: string[]): RouteInfo {
  return { path, methods } as RouteInfo;
}

describe('detectDeadRoutes', () => {
  it('returns empty report when no removed routes', () => {
    const report = detectDeadRoutes([], [makeRoute('/api/users', ['GET'])], [], 30);
    expect(report.total).toBe(0);
    expect(report.entries).toHaveLength(0);
  });

  it('detects routes removed beyond threshold', () => {
    const changes = [makeChange('/api/old', ['GET'], 45)];
    const report = detectDeadRoutes(changes, [], [], 30);
    expect(report.total).toBe(1);
    expect(report.entries[0].path).toBe('/api/old');
    expect(report.entries[0].reason).toBe('removed');
  });

  it('ignores routes removed within threshold', () => {
    const changes = [makeChange('/api/recent', ['POST'], 10)];
    const report = detectDeadRoutes(changes, [], [], 30);
    expect(report.total).toBe(0);
  });

  it('marks deprecated-and-removed routes correctly', () => {
    const changes = [makeChange('/api/legacy', ['GET'], 60)];
    const report = detectDeadRoutes(changes, [], ['/api/legacy'], 30);
    expect(report.entries[0].reason).toBe('deprecated-and-removed');
  });

  it('excludes routes still present in current routes', () => {
    const changes = [makeChange('/api/active', ['GET'], 60)];
    const current = [makeRoute('/api/active', ['GET'])];
    const report = detectDeadRoutes(changes, current, [], 30);
    expect(report.total).toBe(0);
  });

  it('includes daysSinceLastSeen in entries', () => {
    const changes = [makeChange('/api/gone', ['DELETE'], 50)];
    const report = detectDeadRoutes(changes, [], [], 30);
    expect(report.entries[0].daysSinceLastSeen).toBeGreaterThanOrEqual(50);
  });
});

describe('formatDeadRouteReport', () => {
  it('returns no-dead-routes message when empty', () => {
    const report = detectDeadRoutes([], [], [], 30);
    expect(formatDeadRouteReport(report)).toBe('No dead routes detected.');
  });

  it('formats report with entries', () => {
    const changes = [makeChange('/api/stale', ['GET', 'POST'], 40)];
    const report = detectDeadRoutes(changes, [], [], 30);
    const output = formatDeadRouteReport(report);
    expect(output).toContain('/api/stale');
    expect(output).toContain('GET, POST');
    expect(output).toContain('removed');
    expect(output).toContain('Dead Routes Report');
  });
});
