import { detectOverlaps, formatOverlapReport, OverlapReport } from './route-overlap';
import { RouteInfo } from './scanner';

function makeRoute(route: string, methods: string[]): RouteInfo {
  return { route, methods, file: `app${route}/route.ts` };
}

describe('detectOverlaps', () => {
  it('returns empty report when no routes overlap', () => {
    const routes = [
      makeRoute('/api/users', ['GET']),
      makeRoute('/api/posts', ['GET', 'POST']),
    ];
    const report = detectOverlaps(routes);
    expect(report.total).toBe(0);
    expect(report.entries).toHaveLength(0);
  });

  it('detects overlap between static and dynamic segment routes', () => {
    const routes = [
      makeRoute('/api/users/[id]', ['GET', 'DELETE']),
      makeRoute('/api/users/[slug]', ['GET', 'PUT']),
    ];
    const report = detectOverlaps(routes);
    expect(report.total).toBe(1);
    expect(report.entries[0].sharedMethods).toContain('GET');
    expect(report.entries[0].sharedMethods).not.toContain('DELETE');
    expect(report.entries[0].sharedMethods).not.toContain('PUT');
  });

  it('ignores routes with same pattern but no shared methods', () => {
    const routes = [
      makeRoute('/api/items/[id]', ['GET']),
      makeRoute('/api/items/[slug]', ['POST']),
    ];
    const report = detectOverlaps(routes);
    expect(report.total).toBe(0);
  });

  it('skips identical route paths', () => {
    const routes = [
      makeRoute('/api/users', ['GET']),
      makeRoute('/api/users', ['GET']),
    ];
    const report = detectOverlaps(routes);
    expect(report.total).toBe(0);
  });

  it('does not flag routes with different segment counts', () => {
    const routes = [
      makeRoute('/api/users/[id]', ['GET']),
      makeRoute('/api/users/[id]/posts', ['GET']),
    ];
    const report = detectOverlaps(routes);
    expect(report.total).toBe(0);
  });
});

describe('formatOverlapReport', () => {
  it('returns no-conflict message when empty', () => {
    const report: OverlapReport = { entries: [], total: 0 };
    expect(formatOverlapReport(report)).toBe('No overlapping routes detected.');
  });

  it('formats entries correctly', () => {
    const report: OverlapReport = {
      total: 1,
      entries: [{
        pathA: '/api/users/[id]',
        pathB: '/api/users/[slug]',
        sharedMethods: ['GET'],
        reason: 'Both routes match the same URL pattern with methods: GET',
      }],
    };
    const output = formatOverlapReport(report);
    expect(output).toContain('/api/users/[id]');
    expect(output).toContain('/api/users/[slug]');
    expect(output).toContain('GET');
    expect(output).toContain('1 conflict(s)');
  });
});
