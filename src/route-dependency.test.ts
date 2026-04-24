import { buildDependencyReport, formatDependencyReport } from './route-dependency';
import { RouteInfo } from './scanner';

function makeRoute(path: string, methods: string[]): RouteInfo {
  return { path, methods };
}

describe('buildDependencyReport', () => {
  it('detects shared prefix dependency', () => {
    const routes = [
      makeRoute('/api/users', ['GET', 'POST']),
      makeRoute('/api/users/[id]', ['GET', 'PUT', 'DELETE']),
    ];
    const report = buildDependencyReport(routes);
    expect(report.dependencies).toHaveLength(1);
    expect(report.dependencies[0].from).toBe('/api/users');
    expect(report.dependencies[0].to).toBe('/api/users/[id]');
    expect(report.dependencies[0].reason.some(r => r.includes('shared prefix'))).toBe(true);
  });

  it('marks routes with no connections as isolated', () => {
    const routes = [
      makeRoute('/api/users', ['GET']),
      makeRoute('/health', ['GET']),
    ];
    const report = buildDependencyReport(routes);
    expect(report.isolated).toContain('/health');
  });

  it('identifies hubs for highly connected routes', () => {
    const routes = [
      makeRoute('/api/users', ['GET', 'POST']),
      makeRoute('/api/users/[id]', ['GET', 'PUT']),
      makeRoute('/api/users/[id]/posts', ['GET']),
      makeRoute('/api/users/[id]/settings', ['GET', 'PUT']),
      makeRoute('/api/users/[id]/profile', ['GET']),
    ];
    const report = buildDependencyReport(routes);
    expect(report.hubs.length).toBeGreaterThan(0);
  });

  it('returns empty dependencies for unrelated routes', () => {
    const routes = [
      makeRoute('/foo', ['GET']),
      makeRoute('/bar', ['POST']),
    ];
    const report = buildDependencyReport(routes);
    expect(report.dependencies).toHaveLength(0);
    expect(report.isolated).toContain('/foo');
    expect(report.isolated).toContain('/bar');
  });

  it('computes strength between 0 and 1', () => {
    const routes = [
      makeRoute('/api/products', ['GET', 'POST']),
      makeRoute('/api/products/[id]', ['GET', 'DELETE']),
    ];
    const report = buildDependencyReport(routes);
    report.dependencies.forEach(d => {
      expect(d.strength).toBeGreaterThanOrEqual(0);
      expect(d.strength).toBeLessThanOrEqual(1);
    });
  });
});

describe('formatDependencyReport', () => {
  it('includes section headers', () => {
    const report = buildDependencyReport([
      makeRoute('/api/users', ['GET']),
      makeRoute('/api/users/[id]', ['GET']),
    ]);
    const output = formatDependencyReport(report);
    expect(output).toContain('Route Dependency Report');
    expect(output).toContain('Dependencies');
  });

  it('lists isolated routes', () => {
    const report = buildDependencyReport([
      makeRoute('/ping', ['GET']),
    ]);
    const output = formatDependencyReport(report);
    expect(output).toContain('Isolated routes');
    expect(output).toContain('/ping');
  });
});
