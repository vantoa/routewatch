import { detectRenames, formatRenameReport } from './rename';
import { RouteInfo } from './scanner';

function makeRoute(route: string, methods: string[]): RouteInfo {
  return { route, methods, filePath: '' };
}

describe('detectRenames', () => {
  it('detects an obvious rename with same methods', () => {
    const removed = [makeRoute('/api/users', ['GET', 'POST'])];
    const added = [makeRoute('/api/members', ['GET', 'POST'])];
    const result = detectRenames(removed, added);
    expect(result).toHaveLength(1);
    expect(result[0].from).toBe('/api/users');
    expect(result[0].to).toBe('/api/members');
    expect(result[0].sharedMethods).toEqual(['GET', 'POST']);
  });

  it('returns empty when no method overlap', () => {
    const removed = [makeRoute('/api/users', ['GET'])];
    const added = [makeRoute('/api/members', ['POST'])];
    expect(detectRenames(removed, added)).toHaveLength(0);
  });

  it('filters below threshold', () => {
    const removed = [makeRoute('/a/b/c/d', ['GET'])];
    const added = [makeRoute('/x/y/z/w', ['GET'])];
    const result = detectRenames(removed, added, 0.9);
    expect(result).toHaveLength(0);
  });

  it('sorts by confidence descending', () => {
    const removed = [makeRoute('/api/users', ['GET'])];
    const added = [
      makeRoute('/api/people', ['GET']),
      makeRoute('/api/users/list', ['GET']),
    ];
    const result = detectRenames(removed, added);
    expect(result[0].confidence).toBeGreaterThanOrEqual(result[result.length - 1].confidence);
  });

  it('handles param segments as equivalent', () => {
    const removed = [makeRoute('/api/users/[id]', ['GET'])];
    const added = [makeRoute('/api/members/[id]', ['GET'])];
    const result = detectRenames(removed, added);
    expect(result.length).toBeGreaterThan(0);
  });
});

describe('formatRenameReport', () => {
  it('returns message when empty', () => {
    expect(formatRenameReport([])).toBe('No rename candidates detected.');
  });

  it('formats candidates', () => {
    const candidates = [{ from: '/a', to: '/b', confidence: 0.8, sharedMethods: ['GET'] }];
    const out = formatRenameReport(candidates);
    expect(out).toContain('/a → /b');
    expect(out).toContain('80%');
    expect(out).toContain('GET');
  });
});
