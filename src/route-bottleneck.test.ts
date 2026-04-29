import { buildBottleneckReport, formatBottleneckReport } from './route-bottleneck';
import { RouteInfo } from './scanner';
import { RouteDiff } from './differ';

function makeRoute(path: string, methods: string[]): RouteInfo {
  return { path, methods };
}

function makeChange(path: string): RouteDiff {
  return { path, status: 'modified', before: ['GET'], after: ['GET', 'POST'] };
}

describe('buildBottleneckReport', () => {
  it('returns empty entries when no routes qualify', () => {
    const routes = [makeRoute('/api/users', ['GET'])];
    const report = buildBottleneckReport(routes, []);
    expect(report.entries).toHaveLength(0);
    expect(report.topBottleneck).toBeNull();
  });

  it('scores routes with many dynamic segments', () => {
    const routes = [makeRoute('/api/[org]/[repo]/[id]', ['GET', 'POST', 'PUT', 'DELETE'])];
    const report = buildBottleneckReport(routes, []);
    expect(report.entries).toHaveLength(1);
    expect(report.entries[0].score).toBeGreaterThan(0);
    expect(report.entries[0].reasons).toContain('3 dynamic segments');
  });

  it('scores routes with high change frequency', () => {
    const routes = [makeRoute('/api/orders', ['GET', 'POST', 'PUT', 'DELETE'])];
    const history: RouteDiff[][] = [
      [makeChange('/api/orders')],
      [makeChange('/api/orders')],
      [makeChange('/api/orders')],
    ];
    const report = buildBottleneckReport(routes, history);
    expect(report.entries[0].reasons.some(r => r.includes('changed'))).toBe(true);
  });

  it('sorts entries by score descending', () => {
    const routes = [
      makeRoute('/api/a', ['GET']),
      makeRoute('/api/[x]/[y]/[z]', ['GET', 'POST', 'PUT', 'DELETE', 'PATCH']),
    ];
    const report = buildBottleneckReport(routes, []);
    expect(report.entries[0].path).toBe('/api/[x]/[y]/[z]');
  });

  it('sets topBottleneck to highest scoring entry', () => {
    const routes = [makeRoute('/api/[a]/[b]/[c]', ['GET', 'POST', 'PUT', 'DELETE'])];
    const report = buildBottleneckReport(routes, []);
    expect(report.topBottleneck).not.toBeNull();
    expect(report.topBottleneck!.path).toBe('/api/[a]/[b]/[c]');
  });
});

describe('formatBottleneckReport', () => {
  it('returns message when no entries', () => {
    const result = formatBottleneckReport({ entries: [], topBottleneck: null });
    expect(result).toBe('No bottleneck routes detected.');
  });

  it('includes path, score, and reasons', () => {
    const report = buildBottleneckReport(
      [makeRoute('/api/[org]/[repo]/[id]', ['GET', 'POST', 'PUT', 'DELETE'])],
      []
    );
    const output = formatBottleneckReport(report);
    expect(output).toContain('/api/[org]/[repo]/[id]');
    expect(output).toContain('Score');
    expect(output).toContain('Reasons');
  });
});
