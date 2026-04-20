import {
  pathSimilarity,
  sharedMethods,
  computeSimilarity,
  formatSimilarityReport,
} from './route-similarity';
import type { RouteInfo } from './scanner';

function makeRoute(route: string, methods: string[]): RouteInfo {
  return { route, methods, filePath: `/app${route}/route.ts` };
}

describe('pathSimilarity', () => {
  it('returns 1 for identical paths', () => {
    expect(pathSimilarity('/api/users', '/api/users')).toBe(1);
  });

  it('returns 1 for two empty paths', () => {
    expect(pathSimilarity('', '')).toBe(1);
  });

  it('scores dynamic vs dynamic segments high', () => {
    const score = pathSimilarity('/api/[id]', '/api/[slug]');
    expect(score).toBeGreaterThan(0.7);
  });

  it('scores dynamic vs static lower than exact match', () => {
    const exact = pathSimilarity('/api/users', '/api/users');
    const mixed = pathSimilarity('/api/[id]', '/api/users');
    expect(mixed).toBeLessThan(exact);
  });

  it('penalizes different lengths', () => {
    const score = pathSimilarity('/api/users', '/api/users/profile');
    expect(score).toBeLessThan(1);
  });
});

describe('sharedMethods', () => {
  it('returns methods present in both routes', () => {
    const a = makeRoute('/a', ['GET', 'POST']);
    const b = makeRoute('/b', ['POST', 'DELETE']);
    expect(sharedMethods(a, b)).toEqual(['POST']);
  });

  it('returns empty array when no overlap', () => {
    const a = makeRoute('/a', ['GET']);
    const b = makeRoute('/b', ['POST']);
    expect(sharedMethods(a, b)).toEqual([]);
  });
});

describe('computeSimilarity', () => {
  it('finds similar dynamic routes', () => {
    const routes = [
      makeRoute('/api/users/[id]', ['GET']),
      makeRoute('/api/posts/[id]', ['GET']),
      makeRoute('/completely/different/path', ['POST']),
    ];
    const report = computeSimilarity(routes, 0.6);
    expect(report.pairs.length).toBeGreaterThan(0);
    expect(report.pairs[0].score).toBeGreaterThanOrEqual(0.6);
  });

  it('returns empty pairs when nothing meets threshold', () => {
    const routes = [
      makeRoute('/a/b/c', ['GET']),
      makeRoute('/x/y/z/w', ['POST']),
    ];
    const report = computeSimilarity(routes, 0.99);
    expect(report.pairs).toHaveLength(0);
  });

  it('sorts pairs by descending score', () => {
    const routes = [
      makeRoute('/api/[id]', ['GET']),
      makeRoute('/api/[slug]', ['GET']),
      makeRoute('/api/users', ['GET']),
    ];
    const report = computeSimilarity(routes, 0.5);
    for (let i = 1; i < report.pairs.length; i++) {
      expect(report.pairs[i - 1].score).toBeGreaterThanOrEqual(
        report.pairs[i].score
      );
    }
  });
});

describe('formatSimilarityReport', () => {
  it('shows no-results message when pairs is empty', () => {
    const out = formatSimilarityReport({ pairs: [], threshold: 0.7 });
    expect(out).toContain('No similar route pairs found');
  });

  it('lists pairs with scores', () => {
    const report = {
      threshold: 0.7,
      pairs: [
        { a: '/api/[id]', b: '/api/[slug]', score: 0.9, sharedMethods: ['GET'] },
      ],
    };
    const out = formatSimilarityReport(report);
    expect(out).toContain('/api/[id]');
    expect(out).toContain('0.9');
    expect(out).toContain('GET');
  });
});
