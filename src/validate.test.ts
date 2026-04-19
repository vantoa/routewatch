import { validateRoutes, formatValidationReport } from './validate';
import { RouteInfo } from './scanner';

function makeRoute(route: string, methods: string[]): RouteInfo {
  return { route, methods, filePath: `/app${route}/route.ts` };
}

describe('validateRoutes', () => {
  it('returns valid when all routes pass', () => {
    const routes = [makeRoute('/api/users', ['GET', 'POST'])];
    const report = validateRoutes(routes);
    expect(report.valid).toBe(true);
    expect(report.totalViolations).toBe(0);
  });

  it('detects uppercase in route', () => {
    const routes = [makeRoute('/api/Users', ['GET'])];
    const report = validateRoutes(routes);
    expect(report.valid).toBe(false);
    expect(report.results[0].violations[0]).toMatch(/uppercase/);
  });

  it('detects trailing slash', () => {
    const routes = [makeRoute('/api/users/', ['GET'])];
    const report = validateRoutes(routes);
    expect(report.valid).toBe(false);
    expect(report.results[0].violations[0]).toMatch(/trailing slash/);
  });

  it('detects missing methods', () => {
    const routes = [makeRoute('/api/empty', [])];
    const report = validateRoutes(routes);
    expect(report.valid).toBe(false);
    expect(report.results[0].violations[0]).toMatch(/no HTTP methods/);
  });

  it('detects double slashes', () => {
    const routes = [makeRoute('/api//bad', ['GET'])];
    const report = validateRoutes(routes);
    expect(report.valid).toBe(false);
    expect(report.results[0].violations[0]).toMatch(/consecutive slashes/);
  });

  it('accumulates multiple violations', () => {
    const routes = [makeRoute('/api//Bad/', [])];
    const report = validateRoutes(routes);
    expect(report.totalViolations).toBeGreaterThanOrEqual(3);
  });
});

describe('formatValidationReport', () => {
  it('formats passing report', () => {
    const routes = [makeRoute('/api/ok', ['GET'])];
    const report = validateRoutes(routes);
    expect(formatValidationReport(report)).toContain('passed');
  });

  it('formats failing report', () => {
    const routes = [makeRoute('/api/Bad/', [])];
    const report = validateRoutes(routes);
    const out = formatValidationReport(report);
    expect(out).toContain('/api/Bad/');
    expect(out).toContain('violation');
  });
});
